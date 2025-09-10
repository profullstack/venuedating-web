#!/usr/bin/env node

/**
 * Venue Generation Script
 * 
 * This script fetches nightclub data from ScaleSerp API for the top 200 US cities
 * and stores the results in the Supabase places table. Now supports multiple pages,
 * uses Google geographical location queries for enhanced accuracy, and fetches
 * place photos using ScaleSerp's place_photos API.
 *
 * Usage:
 *   node bin/generate-venues.js [options]
 *
 * Options:
 *   --limit <number>     Limit the number of cities to process (default: all)
 *   --start <number>     Start from a specific city index (default: 0)
 *   --pages <number>     Number of pages to fetch per city (default: 3, max: 3)
 *   --delay <number>     Delay between API calls in milliseconds (default: 1500)
 *   --mvp               Use MVP cities list (6 cities) instead of full list (200 cities)
 *   --custom            Use custom venues list from /data/us-custom.json
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
const SCALESERP_API_KEY = process.env.SCALESERP_API_KEY;
const SCALESERP_BASE_URL = 'https://api.scaleserp.com/search';
const SEARCH_QUERY = 'night clubs';
const RESULTS_PER_PAGE = 20;
const MAX_PAGES = 3;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: null,
  start: 0,
  pages: 3,
  delay: 1500,
  mvp: false,
  custom: false,
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
    case '--pages':
      options.pages = Math.min(parseInt(args[++i]), MAX_PAGES);
      break;
    case '--delay':
      options.delay = parseInt(args[++i]);
      break;
    case '--mvp':
      options.mvp = true;
      break;
    case '--custom':
      options.custom = true;
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

This script fetches nightclub data from ScaleSerp API for the top 200 US cities
and stores the results in the Supabase places table.

Usage:
  node bin/generate-venues.js [options]

Options:
  --limit <number>     Limit the number of cities to process (default: all)
  --start <number>     Start from a specific city index (default: 0)
  --pages <number>     Number of pages to fetch per city (default: 3, max: 3)
  --delay <number>     Delay between API calls in milliseconds (default: 1500)
  --mvp               Use MVP cities list (6 cities) instead of full list (200 cities)
  --custom            Use custom venues list from /data/us-custom.json
  --dry-run           Show what would be done without making API calls
  --help              Show this help message

Examples:
  node bin/generate-venues.js                    # Process all cities
  node bin/generate-venues.js --limit 10         # Process first 10 cities
  node bin/generate-venues.js --start 50 --limit 25  # Process cities 50-74
  node bin/generate-venues.js --custom           # Process custom venues from us-custom.json
  node bin/generate-venues.js --dry-run          # Show what would be done
  `);
  process.exit(0);
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  if (!SCALESERP_API_KEY) {
    console.error('❌ Error: SCALESERP_API_KEY environment variable is required');
    console.error('Please add SCALESERP_API_KEY to your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`ScaleSerp API Key: ${SCALESERP_API_KEY.substring(0, 8)}...`);
}

/**
 * Load cities data from JSON file
 */
async function loadCities() {
  try {
    let citiesFileName, cityType;
    
    if (options.custom) {
      citiesFileName = 'us-custom.json';
      cityType = 'custom venues';
    } else if (options.mvp) {
      citiesFileName = 'us-cities-mvp.json';
      cityType = 'MVP';
    } else {
      citiesFileName = 'us-cities-top-200.json';
      cityType = 'full';
    }
    
    const citiesPath = path.join(rootDir, 'data', citiesFileName);
    const citiesData = await fs.readFile(citiesPath, 'utf-8');
    const cities = JSON.parse(citiesData);
    
    console.log(`✅ Loaded ${cities.length} ${options.custom ? 'custom venues' : 'cities'} from ${cityType} data file (${citiesFileName})`);
    return cities;
  } catch (error) {
    console.error('❌ Error loading cities data:', error.message);
    process.exit(1);
  }
}

/**
 * Make API call to ScaleSerp for a specific page
 */
async function fetchVenuesForCityPage(city, page = 1) {
  // Use the enhanced location field if available, fallback to constructed location
  const location = city.location || `${city.city},${city.state},United States`;
  const url = new URL(SCALESERP_BASE_URL);
  
  url.searchParams.set('api_key', SCALESERP_API_KEY);
  url.searchParams.set('search_type', 'places');
  
  // For custom venues, use the specific venue name as the search query
  const searchQuery = options.custom ? city.name : SEARCH_QUERY;
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('location', location);
  url.searchParams.set('google_domain', 'google.com');
  url.searchParams.set('gl', 'us');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('num', RESULTS_PER_PAGE.toString());
  
  if (page > 1) {
    url.searchParams.set('start', ((page - 1) * RESULTS_PER_PAGE).toString());
  }
  
  const pageInfo = page > 1 ? ` (page ${page})` : '';
  const displayName = options.custom ? city.name : `${city.city || city}, ${city.state || ''}`;
  console.log(`🔍 Fetching venues for ${displayName}${pageInfo}...`);
  
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
    console.log(`   Found ${placesCount} venues${pageInfo}`);
    
    // Log API credits usage if available
    if (data.request_info && data.request_info.credits_used_this_request) {
      console.log(`   Credits used: ${data.request_info.credits_used_this_request}`);
      console.log(`   Credits remaining: ${data.request_info.topup_credits_remaining || 'N/A'}`);
    }
    
    return data;
  } catch (error) {
    const displayName = options.custom ? city.name : `${city.city || city}, ${city.state || ''}`;
    console.error(`❌ Error fetching venues for ${displayName}${pageInfo}:`, error.message);
    return null;
  }
}

/**
 * Fetch venues for all pages of a city
 */
async function fetchAllPagesForCity(city, maxPages) {
  const allPlaces = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const apiResponse = await fetchVenuesForCityPage(city, page);
    
    if (apiResponse && apiResponse.places_results) {
      // Add page information to each place
      const placesWithPage = apiResponse.places_results.map(place => ({
        ...place,
        page_number: page
      }));
      allPlaces.push(...placesWithPage);
      
      // If we got fewer results than expected, we've reached the end
      if (apiResponse.places_results.length < RESULTS_PER_PAGE) {
        console.log(`   Reached end of results at page ${page}`);
        break;
      }
    } else {
      console.log(`   No results for page ${page}, stopping`);
      break;
    }
    
    // Add delay between pages (except for the last page)
    if (page < maxPages) {
      await delay(options.delay);
    }
  }
  
  return allPlaces;
}

/**
 * Fetch place photos using ScaleSerp place_photos API
 * Converts numeric data_cid to hex-encoded data_id format required by the API
 */
async function fetchPlacePhotos(place) {
  // Import the conversion utility
  const { convertDataCidToDataId } = await import('../src/utils/data-id-converter.js');
  
  // Check if we have a data_cid to work with
  const dataCid = place.data_cid || place.data_id || place.place_id;
  if (!dataCid) {
    console.log(`   📷 No data_cid available for ${place.title || 'Unknown'}`);
    return [];
  }
  
  // Convert data_cid to the required hex format
  const dataId = convertDataCidToDataId(dataCid);
  if (!dataId) {
    console.log(`   📷 Failed to convert data_cid to data_id for ${place.title || 'Unknown'}`);
    return [];
  }
  
  console.log(`   📷 Fetching photos for ${place.title || 'Unknown'} (data_id: ${dataId})`);
  
  if (options.dryRun) {
    console.log(`   Would fetch photos using data_id: ${dataId}`);
    return [];
  }
  
  try {
    const url = new URL(SCALESERP_BASE_URL);
    url.searchParams.set('api_key', SCALESERP_API_KEY);
    url.searchParams.set('search_type', 'place_photos');
    url.searchParams.set('data_id', dataId);
    url.searchParams.set('max_results', '5'); // Limit to 5 photos per place
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.request_info && !data.request_info.success) {
      throw new Error(`API Error: ${JSON.stringify(data.request_info)}`);
    }
    
    const photos = data.place_photos || [];
    console.log(`   📷 Found ${photos.length} photos`);
    
    // Log API credits usage if available
    if (data.request_info && data.request_info.credits_used_this_request) {
      console.log(`   Credits used: ${data.request_info.credits_used_this_request}`);
    }
    
    // Transform photos to our expected format
    return photos.map(photo => ({
      url: photo.image,
      thumbnail: photo.thumbnail,
      title: photo.title || '',
      source: 'scaleserp'
    }));
    
  } catch (error) {
    console.error(`   ❌ Error fetching photos for ${place.title || 'Unknown'}:`, error.message);
    return [];
  }
}

/**
 * Transform ScaleSerp place data to our database schema
 */
function transformPlaceData(place, city) {
  // For custom venues, extract city/state from location string
  let cityName, stateName;
  
  if (options.custom) {
    // Parse location like "Lakewood, OH, United States" or "Cleveland, OH, United States"
    const locationParts = city.location.split(',').map(part => part.trim());
    cityName = locationParts[0] || '';
    stateName = locationParts[1] || '';
  } else {
    cityName = city.city || city;
    stateName = city.state || '';
  }
  
  const searchQuery = options.custom ? city.name : SEARCH_QUERY;
  
  return {
    p_title: place.title,
    p_data_cid: place.data_cid,
    p_knowledge_graph_id: place.knowledge_graph_id,
    p_address: place.address,
    p_category: place.category,
    p_longitude: place.gps_coordinates?.longitude,
    p_latitude: place.gps_coordinates?.latitude,
    p_city: cityName,
    p_state: stateName,
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
    p_search_query: searchQuery,
    p_source: 'scaleserp'
  };
}

/**
 * Save places to Supabase without photos (using general metadata only)
 */
async function savePlacesToDatabase(places, city) {
  const displayName = options.custom ? city.name : `${city.city || city}, ${city.state || ''}`;
  
  if (options.dryRun) {
    console.log(`   Would save ${places.length} places to database`);
    return { success: true, count: places.length };
  }
  
  if (places.length === 0) {
    console.log(`   No places to save for ${displayName}`);
    return { success: true, count: 0 };
  }
  
  try {
    // Transform the places data for direct insertion
    const transformedPlaces = [];
    
    for (const place of places) {
      const transformed = transformPlaceData(place, city);
      
      // Convert from function parameters to table columns (no photos)
      transformedPlaces.push({
        title: transformed.p_title,
        data_cid: transformed.p_data_cid,
        knowledge_graph_id: transformed.p_knowledge_graph_id,
        address: transformed.p_address,
        category: transformed.p_category,
        latitude: transformed.p_latitude,
        longitude: transformed.p_longitude,
        city: transformed.p_city,
        state: transformed.p_state,
        country: transformed.p_country,
        rating: transformed.p_rating,
        reviews: transformed.p_reviews,
        phone: transformed.p_phone,
        sponsored: transformed.p_sponsored,
        extensions: transformed.p_extensions,
        price: transformed.p_price,
        price_parsed: transformed.p_price_parsed,
        price_description: transformed.p_price_description,
        position: transformed.p_position,
        search_query: transformed.p_search_query,
        source: transformed.p_source,
        photos: [] // Empty photos array since API doesn't provide them
      });
    }
    
    // Use direct table insertion (the trigger will handle PostGIS coordinates)
    const savedPlaces = [];
    
    for (const place of transformedPlaces) {
      try {
        const { data, error } = await supabase
          .from('places')
          .insert(place)
          .select('id');
        
        if (error) {
          console.warn(`   Warning: Could not save place ${place.title}:`, error.message);
        } else if (data && data[0]) {
          savedPlaces.push(data[0]);
        }
      } catch (placeError) {
        console.warn(`   Warning: Could not save place ${place.title}:`, placeError.message);
      }
    }
    
    const savedCount = savedPlaces.length;
    console.log(`   ✅ Saved ${savedCount} places to database (metadata only, no photos)`);
    
    return { success: true, count: savedCount };
  } catch (error) {
    const displayName = options.custom ? city.name : `${city.city || city}, ${city.state || ''}`;
    console.error(`❌ Error saving places for ${displayName}:`, error.message);
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
  
  let cityType;
  if (options.custom) {
    cityType = 'custom venues';
  } else if (options.mvp) {
    cityType = 'MVP';
  } else {
    cityType = 'full';
  }
  
  const itemType = options.custom ? 'venues' : 'cities';
  console.log(`📍 Processing ${citiesToProcess.length} ${itemType} (${startIndex + 1}-${endIndex} of ${allCities.length}) from ${cityType} list`);
  console.log(`📄 Pages per ${options.custom ? 'venue' : 'city'}: ${options.pages}`);
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
    const city = citiesToProcess[i];
    const cityIndex = startIndex + i + 1;
    const displayName = options.custom ? city.name : `${city.city || city}, ${city.state || ''}`;
    
    console.log(`[${cityIndex}/${allCities.length}] Processing ${displayName}`);
    
    try {
      // Fetch venues from all pages
      const allPlaces = await fetchAllPagesForCity(city, options.pages);
      
      if (allPlaces.length > 0) {
        // Save to database
        const saveResult = await savePlacesToDatabase(allPlaces, city);
        
        if (saveResult.success) {
          stats.successful++;
          stats.totalPlaces += saveResult.count;
        } else {
          stats.failed++;
          stats.errors.push(`${displayName}: ${saveResult.error}`);
        }
      } else {
        stats.failed++;
        stats.errors.push(`${displayName}: No data returned from API`);
      }
      
      stats.processed++;
      
      // Add delay between cities (except for the last one)
      if (i < citiesToProcess.length - 1) {
        await delay(options.delay);
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error processing ${displayName}:`, error.message);
      stats.failed++;
      stats.errors.push(`${displayName}: ${error.message}`);
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