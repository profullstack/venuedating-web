import { supabase } from './src/utils/supabase.js';

async function checkVenues() {
  try {
    console.log('🔍 Checking existing venues in database...');
    
    // Get all venues with their geolocation data
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, city, lat, lng, category, address')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching venues:', error);
      return;
    }
    
    console.log(`\n📊 Found ${venues.length} venues in database:`);
    console.log('=' .repeat(80));
    
    let validGeoCount = 0;
    let invalidGeoCount = 0;
    
    venues.forEach((venue, index) => {
      const hasValidGeo = venue.lat && venue.lng;
      if (hasValidGeo) {
        validGeoCount++;
      } else {
        invalidGeoCount++;
      }
      
      console.log(`${index + 1}. ${venue.name}`);
      console.log(`   📍 ${venue.address || 'No address'}`);
      console.log(`   🏙️ ${venue.city || 'No city'}`);
      console.log(`   📂 ${venue.category || 'No category'}`);
      console.log(`   🗺️ Coordinates: ${venue.lat || 'N/A'}, ${venue.lng || 'N/A'} ${hasValidGeo ? '✅' : '❌'}`);
      console.log('');
    });
    
    console.log('=' .repeat(80));
    console.log(`📈 Summary:`);
    console.log(`   ✅ Venues with valid geolocation: ${validGeoCount}`);
    console.log(`   ❌ Venues missing geolocation: ${invalidGeoCount}`);
    console.log(`   📊 Total venues: ${venues.length}`);
    
    if (invalidGeoCount > 0) {
      console.log('\n⚠️ Some venues are missing geolocation data. These will not appear on the map.');
    } else {
      console.log('\n🎉 All venues have valid geolocation data!');
    }
    
    // Test the nearby venues function
    console.log('\n🧪 Testing nearby venues query (San Francisco coordinates)...');
    const testLat = 37.7749;
    const testLng = -122.4194;
    
    const { data: nearbyVenues, error: nearbyError } = await supabase
      .rpc('get_nearby_venues', {
        user_lat: testLat,
        user_lng: testLng,
        radius_km: 10
      });
    
    if (nearbyError) {
      console.log('⚠️ RPC function failed, trying regular query...');
      
      // Fallback to regular query
      const { data: fallbackVenues, error: fallbackError } = await supabase
        .from('venues')
        .select('*')
        .eq('city', 'San Francisco')
        .eq('is_active', true);
      
      if (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
      } else {
        console.log(`✅ Fallback query found ${fallbackVenues.length} San Francisco venues`);
      }
    } else {
      console.log(`✅ RPC query found ${nearbyVenues.length} nearby venues`);
    }
    
  } catch (error) {
    console.error('❌ Error checking venues:', error);
  }
}

checkVenues();
