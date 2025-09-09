#!/usr/bin/env node

/**
 * International Venue Generation Script
 * 
 * This script fetches nightclub data from ValueSERP API for cities across all 20 countries
 * and stores the results in the Supabase places table. It supports multiple pages per city
 * and uses Google geographical location queries for enhanced accuracy.
 * 
 * Usage:
 *   node bin/generate-venues-international.js [options]
 * 
 * Options:
 *   --country <code>     Country to process (us, china, india, brazil, japan, uk, etc. or all)
 *   --limit <number>     Limit the number of cities to process (default: all)
 *   --start <number>     Start from a specific city index (default: 0)
 *   --pages <number>     Number of pages to fetch per city (default: 3, max: 3)
 *   --delay <number>     Delay between API calls in milliseconds (default: 1500)
 *   --completed-only    Only process countries with completed status (default: false)
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
const MAX_PAGES = 3;

// Country configurations for all 20 countries
const COUNTRY_CONFIGS = {
  'us': {
    file: 'us-cities-top-200.json',
    name: 'United States',
    gl: 'us',
    hl: 'en',
    google_domain: 'google.com',
    search_query: 'night clubs',
    status: 'completed'
  },
  'china': {
    file: 'china-cities-top-200.json',
    name: 'China',
    gl: 'cn',
    hl: 'zh',
    google_domain: 'google.cn',
    search_query: 'night clubs',
    status: 'completed'
  },
  'india': {
    file: 'india-cities-top-200.json',
    name: 'India',
    gl: 'in',
    hl: 'en',
    google_domain: 'google.co.in',
    search_query: 'night clubs',
    status: 'completed'
  },
  'brazil': {
    file: 'brazil-cities-top-200.json',
    name: 'Brazil',
    gl: 'br',
    hl: 'pt',
    google_domain: 'google.com.br',
    search_query: 'casas noturnas',
    status: 'completed'
  },
  'japan': {
    file: 'japan-cities-top-200.json',
    name: 'Japan',
    gl: 'jp',
    hl: 'ja',
    google_domain: 'google.co.jp',
    search_query: 'ナイトクラブ',
    status: 'completed'
  },
  'uk': {
    file: 'uk-cities-top-200.json',
    name: 'United Kingdom',
    gl: 'gb',
    hl: 'en',
    google_domain: 'google.co.uk',
    search_query: 'night clubs',
    status: 'completed'
  },
  'indonesia': {
    file: 'indonesia-cities-top-200.json',
    name: 'Indonesia',
    gl: 'id',
    hl: 'id',
    google_domain: 'google.co.id',
    search_query: 'klub malam',
    status: 'pending'
  },
  'pakistan': {
    file: 'pakistan-cities-top-200.json',
    name: 'Pakistan',
    gl: 'pk',
    hl: 'ur',
    google_domain: 'google.com.pk',
    search_query: 'night clubs',
    status: 'pending'
  },
  'nigeria': {
    file: 'nigeria-cities-top-200.json',
    name: 'Nigeria',
    gl: 'ng',
    hl: 'en',
    google_domain: 'google.com.ng',
    search_query: 'night clubs',
    status: 'pending'
  },
  'bangladesh': {
    file: 'bangladesh-cities-top-200.json',
    name: 'Bangladesh',
    gl: 'bd',
    hl: 'bn',
    google_domain: 'google.com.bd',
    search_query: 'night clubs',
    status: 'pending'
  },
  'russia': {
    file: 'russia-cities-top-200.json',
    name: 'Russia',
    gl: 'ru',
    hl: 'ru',
    google_domain: 'google.ru',
    search_query: 'ночные клубы',
    status: 'pending'
  },
  'mexico': {
    file: 'mexico-cities-top-200.json',
    name: 'Mexico',
    gl: 'mx',
    hl: 'es',
    google_domain: 'google.com.mx',
    search_query: 'clubes nocturnos',
    status: 'pending'
  },
  'ethiopia': {
    file: 'ethiopia-cities-top-200.json',
    name: 'Ethiopia',
    gl: 'et',
    hl: 'am',
    google_domain: 'google.com.et',
    search_query: 'night clubs',
    status: 'pending'
  },
  'philippines': {
    file: 'philippines-cities-top-200.json',
    name: 'Philippines',
    gl: 'ph',
    hl: 'en',
    google_domain: 'google.com.ph',
    search_query: 'night clubs',
    status: 'pending'
  },
  'egypt': {
    file: 'egypt-cities-top-200.json',
    name: 'Egypt',
    gl: 'eg',
    hl: 'ar',
    google_domain: 'google.com.eg',
    search_query: 'نوادي ليلية',
    status: 'pending'
  },
  'vietnam': {
    file: 'vietnam-cities-top-200.json',
    name: 'Vietnam',
    gl: 'vn',
    hl: 'vi',
    google_domain: 'google.com.vn',
    search_query: 'hộp đêm',
    status: 'pending'
  },
  'turkey': {
    file: 'turkey-cities-top-200.json',
    name: 'Turkey',
    gl: 'tr',
    hl: 'tr',
    google_domain: 'google.com.tr',
    search_query: 'gece kulüpleri',
    status: 'pending'
  },
  'iran': {
    file: 'iran-cities-top-200.json',
    name: 'Iran',
    gl: 'ir',
    hl: 'fa',
    google_domain: 'google.com',
    search_query: 'کلوپ شبانه',
    status: 'pending'
  },
  'germany': {
    file: 'germany-cities-top-200.json',
    name: 'Germany',
    gl: 'de',
    hl: 'de',
    google_domain: 'google.de',
    search_query: 'nachtclubs',
    status: 'pending'
  },
  'thailand': {
    file: 'thailand-cities-top-200.json',
    name: 'Thailand',
    gl: 'th',
    hl: 'th',
    google_domain: 'google.co.th',
    search_query: 'ไนท์คลับ',
    status: 'pending'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  country: null,
  limit: null,
  start: 0,
  pages: 3,
  delay: 1500,
  completedOnly: false,
  dryRun: false,
  help: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--country':
      options.country = args[++i];
      break;
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
    case '--completed-only':
      options.completedOnly = true;
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
  const completedCountries = Object.keys(COUNTRY_CONFIGS).filter(k => COUNTRY_CONFIGS[k].status === 'completed');
  const pendingCountries = Object.keys(COUNTRY_CONFIGS).filter(k => COUNTRY_CONFIGS[k].status === 'pending');
  
  console.log(`
International Venue Generation Script

This script fetches nightclub data from ValueSERP API for cities across all 20 countries
and stores the results in the Supabase places table.

Usage:
  node bin/generate-venues-international.js [options]

Options:
  --country <code>     Country to process: ${Object.keys(COUNTRY_CONFIGS).join(', ')}, all (default: all)
  --limit <number>     Limit the number of cities to process (default: all)
  --start <number>     Start from a specific city index (default: 0)
  --pages <number>     Number of pages to fetch per city (default: 3, max: 3)
  --delay <number>     Delay between API calls in milliseconds (default: 1500)
  --completed-only    Only process countries with completed status (default: false)
  --dry-run           Show what would be done without making API calls
  --help              Show this help message

Countries Status:
  ✅ Completed (${completedCountries.length}): ${completedCountries.join(', ')}
  ⏳ Pending (${pendingCountries.length}): ${pendingCountries.join(', ')}

Examples:
  node bin/generate-venues-international.js --country us --limit 10
  node bin/generate-venues-international.js --completed-only
  node bin/generate-venues-international.js --country all --start 50 --limit 25
  node bin/generate-venues-international.js --dry-run
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
 * Load cities data from JSON file for a specific country
 */
async function loadCitiesForCountry(countryCode) {
  try {
    const config = COUNTRY_CONFIGS[countryCode];
    if (!config) {
      throw new Error(`Unknown country code: ${countryCode}`);
    }
    
    const citiesPath = path.join(rootDir, 'data', config.file);
    
    try {
      const citiesData = await fs.readFile(citiesPath, 'utf-8');
      const cities = JSON.parse(citiesData);
      
      console.log(`✅ Loaded ${cities.length} cities for ${config.name} (${config.status})`);
      return { cities, config };
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        console.log(`⚠️  File not found for ${config.name}: ${config.file} (${config.status})`);
        return { cities: [], config, fileNotFound: true };
      }
      throw fileError;
    }
  } catch (error) {
    console.error(`❌ Error loading cities data for ${countryCode}:`, error.message);
    return null;
  }
}

/**
 * Create location string for API call - enhanced cities get precise targeting,
 * basic cities get non-geo-specific searches
 */
function createLocationString(city, countryConfig) {
  // If city has enhanced location data, use it for precise targeting
  if (city.location) {
    return city.location;
  }
  
  // For basic city data, return null to skip geo-targeting
  // This lets Google's algorithm handle location naturally
  return null;
}

/**
 * Make API call to ValueSERP for a specific page
 */
async function fetchVenuesForCityPage(city, countryConfig, page = 1) {
  const url = new URL(VALUESERP_BASE_URL);
  const locationString = createLocationString(city, countryConfig);
  
  url.searchParams.set('api_key', VALUESERP_API_KEY);
  url.searchParams.set('search_type', 'places');
  url.searchParams.set('q', countryConfig.search_query);
  
  // Only set location parameter if we have enhanced location data
  if (locationString) {
    url.searchParams.set('location', locationString);
  }
  
  url.searchParams.set('google_domain', countryConfig.google_domain);
  url.searchParams.set('gl', countryConfig.gl);
  url.searchParams.set('hl', countryConfig.hl);
  url.searchParams.set('num', RESULTS_PER_PAGE.toString());
  
  if (page > 1) {
    url.searchParams.set('start', ((page - 1) * RESULTS_PER_PAGE).toString());
  }
  
  const pageInfo = page > 1 ? ` (page ${page})` : '';
  const cityName = city.city || city;
  const stateName = city.state || '';
  const geoType = locationString ? '📍 geo-targeted' : '🌐 non-geo';
  console.log(`🔍 Fetching venues for ${cityName}, ${stateName} (${geoType})${pageInfo}...`);
  
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
    const cityName = city.city || city;
    const stateName = city.state || '';
    console.error(`❌ Error fetching venues for ${cityName}, ${stateName}${pageInfo}:`, error.message);
    return null;
  }
}

/**
 * Fetch venues for all pages of a city
 */
async function fetchAllPagesForCity(city, countryConfig, maxPages) {
  const allPlaces = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const apiResponse = await fetchVenuesForCityPage(city, countryConfig, page);
    
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
 * Transform ValueSERP place data to our database schema
 */
function transformPlaceData(place, city, countryConfig) {
  const cityName = city.city || city;
  const stateName = city.state || '';
  
  return {
    title: place.title,
    data_cid: place.data_cid,
    knowledge_graph_id: place.knowledge_graph_id,
    address: place.address,
    category: place.category,
    latitude: place.gps_coordinates?.latitude,
    longitude: place.gps_coordinates?.longitude,
    city: cityName,
    state: stateName,
    country: countryConfig.name,
    rating: place.rating,
    reviews: place.reviews,
    phone: place.phone,
    sponsored: place.sponsored || false,
    extensions: place.extensions ? place.extensions : null,
    price: place.price,
    price_parsed: place.price_parsed,
    price_description: place.price_description,
    position: place.position,
    search_query: countryConfig.search_query,
    source: 'valueserp'
  };
}

/**
 * Save places to Supabase
 */
async function savePlacesToDatabase(places, city, countryConfig) {
  const cityName = city.city || city;
  const stateName = city.state || '';
  
  if (options.dryRun) {
    console.log(`   Would save ${places.length} places to database`);
    return { success: true, count: places.length };
  }
  
  if (places.length === 0) {
    console.log(`   No places to save for ${cityName}, ${stateName}`);
    return { success: true, count: 0 };
  }
  
  try {
    const transformedPlaces = places.map(place => transformPlaceData(place, city, countryConfig));
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
    console.log(`   ✅ Saved ${savedCount} places to database`);
    
    return { success: true, count: savedCount };
  } catch (error) {
    console.error(`❌ Error saving places for ${cityName}, ${stateName}:`, error.message);
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
 * Process a single country
 */
async function processCountry(countryCode, stats) {
  console.log(`\n🌍 Processing ${COUNTRY_CONFIGS[countryCode].name}...`);
  
  const countryData = await loadCitiesForCountry(countryCode);
  if (!countryData) {
    stats.failedCountries.push(countryCode);
    return;
  }
  
  const { cities, config, fileNotFound } = countryData;
  
  if (fileNotFound) {
    console.log(`   ⚠️  Skipping ${config.name} - data file not found`);
    stats.skippedCountries.push(countryCode);
    return;
  }
  
  if (cities.length === 0) {
    console.log(`   ⚠️  Skipping ${config.name} - no cities found`);
    stats.skippedCountries.push(countryCode);
    return;
  }
  
  // Apply start and limit options
  const startIndex = Math.max(0, options.start);
  const endIndex = options.limit 
    ? Math.min(startIndex + options.limit, cities.length)
    : cities.length;
  
  const citiesToProcess = cities.slice(startIndex, endIndex);
  
  console.log(`📍 Processing ${citiesToProcess.length} cities (${startIndex + 1}-${endIndex} of ${cities.length})`);
  
  // Process each city
  for (let i = 0; i < citiesToProcess.length; i++) {
    const city = citiesToProcess[i];
    const cityIndex = startIndex + i + 1;
    const cityName = city.city || city;
    const stateName = city.state || '';
    
    console.log(`[${cityIndex}/${cities.length}] Processing ${cityName}, ${stateName}`);
    
    try {
      // Fetch venues from all pages
      const allPlaces = await fetchAllPagesForCity(city, config, options.pages);
      
      if (allPlaces.length > 0) {
        // Save to database
        const saveResult = await savePlacesToDatabase(allPlaces, city, config);
        
        if (saveResult.success) {
          stats.successful++;
          stats.totalPlaces += saveResult.count;
        } else {
          stats.failed++;
          stats.errors.push(`${cityName}, ${stateName} (${config.name}): ${saveResult.error}`);
        }
      } else {
        stats.failed++;
        stats.errors.push(`${cityName}, ${stateName} (${config.name}): No data returned from API`);
      }
      
      stats.processed++;
      
      // Add delay between cities (except for the last one)
      if (i < citiesToProcess.length - 1) {
        await delay(options.delay);
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error processing ${cityName}, ${stateName}:`, error.message);
      stats.failed++;
      stats.errors.push(`${cityName}, ${stateName} (${config.name}): ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting international venue generation script...\n');
  
  // Validate environment
  validateEnvironment();
  
  // Determine which countries to process
  let countriesToProcess;
  
  if (options.country && options.country !== 'all') {
    countriesToProcess = [options.country];
  } else if (options.completedOnly) {
    countriesToProcess = Object.keys(COUNTRY_CONFIGS).filter(k => COUNTRY_CONFIGS[k].status === 'completed');
  } else {
    countriesToProcess = Object.keys(COUNTRY_CONFIGS);
  }
  
  // Validate country codes
  for (const countryCode of countriesToProcess) {
    if (!COUNTRY_CONFIGS[countryCode]) {
      console.error(`❌ Error: Unknown country code '${countryCode}'`);
      console.error(`Available countries: ${Object.keys(COUNTRY_CONFIGS).join(', ')}`);
      process.exit(1);
    }
  }
  
  const completedCount = countriesToProcess.filter(c => COUNTRY_CONFIGS[c].status === 'completed').length;
  const pendingCount = countriesToProcess.filter(c => COUNTRY_CONFIGS[c].status === 'pending').length;
  
  console.log(`🌍 Countries to process: ${countriesToProcess.length} total`);
  console.log(`   ✅ Completed: ${completedCount} countries`);
  console.log(`   ⏳ Pending: ${pendingCount} countries`);
  console.log(`📄 Pages per city: ${options.pages}`);
  console.log(`⏱️  Delay between requests: ${options.delay}ms`);
  console.log(`🔄 Dry run mode: ${options.dryRun ? 'ON' : 'OFF'}\n`);
  
  // Statistics
  const stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    totalPlaces: 0,
    failedCountries: [],
    skippedCountries: [],
    errors: []
  };
  
  // Process each country
  for (const countryCode of countriesToProcess) {
    await processCountry(countryCode, stats);
  }
  
  // Print final statistics
  console.log('\n📊 Final Statistics:');
  console.log(`   Countries attempted: ${countriesToProcess.length}`);
  console.log(`   Countries skipped: ${stats.skippedCountries.length}`);
  console.log(`   Cities processed: ${stats.processed}`);
  console.log(`   Successful: ${stats.successful}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Total places saved: ${stats.totalPlaces}`);
  
  if (stats.skippedCountries.length > 0) {
    console.log(`\n⚠️  Skipped countries: ${stats.skippedCountries.join(', ')}`);
  }
  
  if (stats.failedCountries.length > 0) {
    console.log(`\n❌ Failed countries: ${stats.failedCountries.join(', ')}`);
  }
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more errors`);
    }
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