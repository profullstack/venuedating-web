import { supabase } from './src/utils/supabase.js';

async function debugVenuesQuery() {
  try {
    console.log('🔍 Debugging venues query...');
    
    // Test 1: Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('venues')
      .select('count')
      .limit(0);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    console.log('✅ Supabase connection working');
    
    // Test 2: Try to get all venues without any filters
    console.log('\n2. Getting ALL venues (no filters)...');
    const { data: allVenues, error: allError } = await supabase
      .from('venues')
      .select('*');
    
    console.log('All venues query result:', {
      venuesCount: allVenues ? allVenues.length : 0,
      error: allError ? allError.message : 'No error'
    });
    
    if (allError) {
      console.error('❌ All venues query failed:', allError);
      return;
    }
    
    if (!allVenues || allVenues.length === 0) {
      console.log('⚠️ No venues found in database at all');
      
      // Test 3: Check if the venues table exists
      console.log('\n3. Checking if venues table exists...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'venues');
      
      if (tablesError) {
        console.error('❌ Could not check table existence:', tablesError);
      } else {
        console.log('Table existence check:', tables);
      }
      
      return;
    }
    
    console.log(`✅ Found ${allVenues.length} venues in database`);
    
    // Test 4: Check the structure of the first venue
    console.log('\n4. First venue structure:');
    console.log(JSON.stringify(allVenues[0], null, 2));
    
    // Test 5: Check which venues have coordinates
    console.log('\n5. Venues with coordinates:');
    const venuesWithCoords = allVenues.filter(venue => venue.lat && venue.lng);
    console.log(`Venues with lat/lng: ${venuesWithCoords.length}/${allVenues.length}`);
    
    venuesWithCoords.forEach((venue, index) => {
      console.log(`${index + 1}. ${venue.name}: lat=${venue.lat}, lng=${venue.lng}`);
    });
    
    // Test 6: Try the exact same query as the frontend
    console.log('\n6. Testing exact frontend query...');
    const { data: frontendQuery, error: frontendError } = await supabase
      .from('venues')
      .select('*');
    
    console.log('Frontend query result:', {
      venuesCount: frontendQuery ? frontendQuery.length : 0,
      error: frontendError ? frontendError.message : 'No error'
    });
    
    if (frontendQuery && frontendQuery.length > 0) {
      console.log('✅ Frontend query works - issue might be in the frontend code');
    } else {
      console.log('❌ Frontend query also returns 0 venues');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugVenuesQuery();
