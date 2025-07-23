import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// San Francisco venues data
const venues = [
  // Mission District Venues
  {
    name: 'The Chapel',
    description: 'Historic venue with craft cocktails and live music in a converted chapel',
    address: '777 Valencia St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94110',
    country: 'USA',
    lat: 37.7599,
    lng: -122.4204,
    category: 'Bar',
    rating: 4.2,
    price_level: 3,
    phone: '(415) 551-5157',
    website: 'https://thechapelsf.com',
    is_verified: true,
    is_active: true
  },
  {
    name: 'Zeitgeist',
    description: 'Iconic beer garden with outdoor seating and punk rock atmosphere',
    address: '199 Valencia St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94103',
    country: 'USA',
    lat: 37.7695,
    lng: -122.4210,
    category: 'Bar',
    rating: 4.1,
    price_level: 2,
    phone: '(415) 255-7505',
    website: null,
    is_verified: true,
    is_active: true
  },
  {
    name: 'El Rio',
    description: 'Outdoor patio bar with tropical drinks and weekend BBQ',
    address: '3158 Mission St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94110',
    country: 'USA',
    lat: 37.7479,
    lng: -122.4194,
    category: 'Bar',
    rating: 4.0,
    price_level: 2,
    phone: '(415) 282-3325',
    website: 'https://elriosf.com',
    is_verified: true,
    is_active: true
  },
  {
    name: 'The Make-Out Room',
    description: 'Dive bar with live music, DJs, and vintage decor',
    address: '3225 22nd St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94110',
    country: 'USA',
    lat: 37.7556,
    lng: -122.4184,
    category: 'Bar',
    rating: 4.3,
    price_level: 2,
    phone: '(415) 647-2888',
    website: null,
    is_verified: true,
    is_active: true
  },
  // Castro District Venues
  {
    name: 'The Castro Theatre Bar',
    description: 'Historic theater with adjacent cocktail lounge',
    address: '429 Castro St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94114',
    country: 'USA',
    lat: 37.7609,
    lng: -122.4350,
    category: 'Lounge',
    rating: 4.4,
    price_level: 3,
    phone: '(415) 621-6120',
    website: null,
    is_verified: true,
    is_active: true
  },
  {
    name: 'Moby Dick',
    description: 'Neighborhood dive bar with friendly atmosphere',
    address: '4049 18th St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94114',
    country: 'USA',
    lat: 37.7609,
    lng: -122.4354,
    category: 'Bar',
    rating: 4.0,
    price_level: 2,
    phone: '(415) 861-1199',
    website: null,
    is_verified: true,
    is_active: true
  },
  // SOMA Venues
  {
    name: 'The View Lounge',
    description: 'Rooftop cocktail lounge with panoramic city views',
    address: '55 4th St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94103',
    country: 'USA',
    lat: 37.7849,
    lng: -122.4058,
    category: 'Lounge',
    rating: 4.5,
    price_level: 4,
    phone: '(415) 896-1600',
    website: null,
    is_verified: true,
    is_active: true
  },
  {
    name: '21st Amendment Brewery',
    description: 'Craft brewery near AT&T Park with house-made beers',
    address: '563 2nd St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94107',
    country: 'USA',
    lat: 37.7820,
    lng: -122.3928,
    category: 'Brewery',
    rating: 4.2,
    price_level: 2,
    phone: '(415) 369-0900',
    website: 'https://21st-amendment.com',
    is_verified: true,
    is_active: true
  },
  // North Beach Venues
  {
    name: 'Vesuvio Cafe',
    description: 'Historic Beat Generation hangout with literary atmosphere',
    address: '255 Columbus Ave',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94133',
    country: 'USA',
    lat: 37.7976,
    lng: -122.4077,
    category: 'Bar',
    rating: 4.3,
    price_level: 2,
    phone: '(415) 362-3370',
    website: 'https://vesuvio.com',
    is_verified: true,
    is_active: true
  },
  {
    name: 'The Saloon',
    description: 'Historic blues bar, oldest bar in San Francisco',
    address: '1232 Grant Ave',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94133',
    country: 'USA',
    lat: 37.7979,
    lng: -122.4070,
    category: 'Bar',
    rating: 4.0,
    price_level: 2,
    phone: '(415) 989-7666',
    website: null,
    is_verified: true,
    is_active: true
  },
  // Hayes Valley Venues
  {
    name: 'Smugglers Cove',
    description: 'Tiki bar with extensive rum collection and tropical cocktails',
    address: '650 Gough St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'USA',
    lat: 37.7765,
    lng: -122.4234,
    category: 'Tiki Bar',
    rating: 4.6,
    price_level: 3,
    phone: '(415) 869-1900',
    website: 'https://smugglerscovesf.com',
    is_verified: true,
    is_active: true
  },
  {
    name: 'Bourbon & Branch',
    description: 'Prohibition-era speakeasy with password entry',
    address: '501 Jones St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'USA',
    lat: 37.7857,
    lng: -122.4134,
    category: 'Speakeasy',
    rating: 4.4,
    price_level: 4,
    phone: '(415) 346-1735',
    website: 'https://bourbonandbranch.com',
    is_verified: true,
    is_active: true
  }
];

async function seedVenues() {
  try {
    console.log('🚀 Starting to seed San Francisco venues...');
    
    // Clear existing venues (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing venues...');
    const { error: deleteError } = await supabase
      .from('venues')
      .delete()
      .eq('city', 'San Francisco');
    
    if (deleteError) {
      console.warn('⚠️ Warning clearing existing venues:', deleteError.message);
    }
    
    // Insert new venues
    console.log(`📝 Inserting ${venues.length} venues...`);
    const { data, error } = await supabase
      .from('venues')
      .insert(venues)
      .select();
    
    if (error) {
      console.error('❌ Error inserting venues:', error);
      return;
    }
    
    console.log(`🎉 Successfully inserted ${data.length} venues!`);
    
    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('venues')
      .select('name, lat, lng, category')
      .eq('city', 'San Francisco')
      .order('name');
    
    if (verifyError) {
      console.error('❌ Error verifying venues:', verifyError);
    } else {
      console.log('\n✅ Verified venues in database:');
      verifyData.forEach(venue => {
        console.log(`  - ${venue.name} (${venue.category}) - ${venue.lat}, ${venue.lng}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Instructions for running this script
console.log(`
🔧 To run this script:

1. Update the supabaseUrl and supabaseKey variables at the top of this file with your actual Supabase credentials
2. Run: node seed-venues.js

Your Supabase URL and key can be found in your Supabase dashboard under Settings > API.
`);

// Uncomment the line below to run the seeding (after updating credentials)
// seedVenues();
