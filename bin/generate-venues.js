#!/usr/bin/env node

/**
 * Venue Generation Script
 * 
 * This script fetches nightclub data from ValueSERP API for the top 200 US cities
 * and stores the results in the Supabase places table.
 * 
 * Usage:
 *   node bin/generate-venues.js [options]
 * 
 * Options:
 *   --limit <number>     Limit the number of cities to process (default: all)
 *   --start <number>     Start from a specific city index (default: 0)
 *   --delay <number>     Delay between API calls in milliseconds (default: 1000)
 *   --dry-run           Show what would be done without making API calls
 *   --help              Show this help message
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';
import { supabase } from '../src/utils/supabase.js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
dotenvFlow.config({ path: rootDir });

// Configuration
const VALUESERP_API_KEY = process.env.VALUESERP_API_KEY;
const VALUESERP_BASE_URL = 'https://api.valueserp.com/search';
const SEARCH_QUERY = 'night clubs';
const RESULTS_PER_PAGE = 20;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: null,
  start: 0,
  delay: 1000,
  dryRun: false,
  help: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--limit':
      options.limit = parseInt(args[++i]);
      break;
    case '--start':
      options.start = parseInt(args[++i]);
      break;
    case '--delay':
      options.delay = parseInt(args[++i]);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--help':
      options.help = true;
      break;
    default:
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
  }
}

if (options.help) {
  console.log(`
Venue Generation Script

This script fetches nightclub data from ValueSERP API for the top 200 US cities
and stores the results in the Supabase places table.

Usage:
  node bin/generate-venues.js [options]

Options:
  --limit <number>     Limit the number of cities to process (default: all)
  --start <number>     Start from a specific city index (default: 0)
  --delay <number>     Delay between API calls in milliseconds (default: 1000)
  --dry-run           Show what would be done without making API calls
  --help              Show this help message

Examples:
  node bin/generate-venues.js                    # Process all cities
  node bin/generate-venues.js --limit 10         # Process first 10 cities
  node bin/generate-venues.js --start 50 --limit 25  # Process cities 50-74
  node bin/generate-venues.js --dry-run          # Show what would be done
  `);
  process.exit(0);
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  if (!VALUESERP_API_KEY) {
    console.error('❌ Error: VALUESERP_API_KEY environment variable is required');
    console.error('Please add VALUESERP_API_KEY to your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`ValueSERP API Key: ${VALUESERP_API_KEY.substring(0, 8)}...`);
}

/**
 * Load cities data from JSON file
 */
async function loadCities() {
  try {
    const citiesPath = path.join(rootDir, 'data', 'us-cities-top-200.json');
    const citiesData = await fs.readFile(citiesPath, 'utf-8');
    const cities = JSON.parse(citiesData);
    
    console.log(`✅ Loaded ${cities.length} cities from data file`);
    return cities;
  } catch (error) {
    console.error('❌ Error loading cities data:', error.message);
    process.exit(1);
  }
}

/**
 * Make API call to ValueSERP
 */
async function fetchVenuesForCity(city, state) {
  const location = `${city},${state},United States`;
  const url = new URL(VALUESERP_BASE_URL);
  
  url.searchParams.set('api_key', VALUESERP_API_KEY);
  url.searchParams.set('search_type', 'places');
  url.searchParams.set('q', SEARCH_QUERY);
  url.searchParams.set('location', location);
  url.searchParams.set('google_domain', 'google.com');
  url.searchParams.set('gl', 'us');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('num', RESULTS_PER_PAGE.toString());
  
  console.log(`🔍 Fetching venues for ${city}, ${state}...`);
  
  if (options.dryRun) {
    console.log(`   Would call: ${url.toString()}`);
    return { places_results: [] };
  }
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.request_info && !data.request_info.success) {
      throw new Error(`API Error: ${JSON.stringify(data.request_info)}`);
    }
    
    const placesCount = data.places_results ? data.places_results.length : 0;
    console.log(`   Found ${placesCount} venues`);
    
    // Log API credits usage if available
    if (data.request_info && data.request_info.credits_used_this_request) {
      console.log(`   Credits used: ${data.request_info.credits_used_this_request}`);
      console.log(`   Credits remaining: ${data.request_info.topup_credits_remaining || 'N/A'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error fetching venues for ${city}, ${state}:`, error.message);
    return null;
  }
}

/**
 * Transform ValueSERP place data to our database schema
 */
function transformPlaceData(place, city, state) {
  return {
    p_title: place.title,
    p_data_cid: place.data_cid,
    p_knowledge_graph_id: place.knowledge_graph_id,
    p_address: place.address,
    p_category: place.category,
    p_longitude: place.gps_coordinates?.longitude,
    p_latitude: place.gps_coordinates?.latitude,
    p_city: city,
    p_state: state,
    p_country: 'United States',
    p_rating: place.rating,
    p_reviews: place.reviews,
    p_phone: place.phone,
    p_sponsored: place.sponsored || false,
    p_extensions: place.extensions ? place.extensions : null,
    p_price: place.price,
    p_price_parsed: place.price_parsed,
    p_price_description: place.price_description,
    p_position: place.position,
    p_search_query: SEARCH_QUERY,
    p_source: 'valueserp'
  };
}

/**
 * Save places to Supabase
 */
async function savePlacesToDatabase(places, city, state) {
  if (options.dryRun) {
    console.log(`   Would save ${places.length} places to database`);
    return { success: true, count: places.length };
  }
  
  if (places.length === 0) {
    console.log(`   No places to save for ${city}, ${state}`);
    return { success: true, count: 0 };
  }
  
  try {
    // Transform the places data
    const transformedPlaces = places.map(place => transformPlaceData(place, city, state));
    
    // Use the database function to insert places with PostGIS coordinates
    const savedPlaces = [];
    
    for (const place of transformedPlaces) {
      try {
        const { data, error } = await supabase.rpc('insert_place_with_coordinates', place);
        
        if (error) {
          console.warn(`   Warning: Could not save place ${place.p_title}:`, error.message);
        } else if (data) {
          savedPlaces.push(data);
        }
      } catch (placeError) {
        console.warn(`   Warning: Could not save place ${place.p_title}:`, placeError.message);
      }
    }
    
    const savedCount = savedPlaces.length;
    console.log(`   ✅ Saved ${savedCount} places to database`);
    
    return { success: true, count: savedCount };
  } catch (error) {
    console.error(`❌ Error saving places for ${city}, ${state}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Add delay between API calls
 */
async function delay(ms) {
  if (ms > 0) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting venue generation script...\n');
  
  // Validate environment
  validateEnvironment();
  
  // Load cities
  const allCities = await loadCities();
  
  // Apply start and limit options
  const startIndex = Math.max(0, options.start);
  const endIndex = options.limit 
    ? Math.min(startIndex + options.limit, allCities.length)
    : allCities.length;
  
  const citiesToProcess = allCities.slice(startIndex, endIndex);
  
  console.log(`📍 Processing ${citiesToProcess.length} cities (${startIndex + 1}-${endIndex} of ${allCities.length})`);
  console.log(`⏱️  Delay between requests: ${options.delay}ms`);
  console.log(`🔄 Dry run mode: ${options.dryRun ? 'ON' : 'OFF'}\n`);
  
  // Statistics
  const stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    totalPlaces: 0,
    errors: []
  };
  
  // Process each city
  for (let i = 0; i < citiesToProcess.length; i++) {
    const { city, state } = citiesToProcess[i];
    const cityIndex = startIndex + i + 1;
    
    console.log(`[${cityIndex}/${allCities.length}] Processing ${city}, ${state}`);
    
    try {
      // Fetch venues from ValueSERP API
      const apiResponse = await fetchVenuesForCity(city, state);
      
      if (apiResponse && apiResponse.places_results) {
        // Save to database
        const saveResult = await savePlacesToDatabase(apiResponse.places_results, city, state);
        
        if (saveResult.success) {
          stats.successful++;
          stats.totalPlaces += saveResult.count;
        } else {
          stats.failed++;
          stats.errors.push(`${city}, ${state}: ${saveResult.error}`);
        }
      } else {
        stats.failed++;
        stats.errors.push(`${city}, ${state}: No data returned from API`);
      }
      
      stats.processed++;
      
      // Add delay between requests (except for the last one)
      if (i < citiesToProcess.length - 1) {
        await delay(options.delay);
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error processing ${city}, ${state}:`, error.message);
      stats.failed++;
      stats.errors.push(`${city}, ${state}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Print final statistics
  console.log('📊 Final Statistics:');
  console.log(`   Cities processed: ${stats.processed}`);
  console.log(`   Successful: ${stats.successful}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Total places saved: ${stats.totalPlaces}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (stats.successful === stats.processed) {
    console.log('\n🎉 All cities processed successfully!');
  } else {
    console.log(`\n⚠️  ${stats.failed} cities failed to process. Check errors above.`);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});