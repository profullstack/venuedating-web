import { supabase } from './src/utils/supabase.js';

async function fixRpcFunction() {
  try {
    console.log('🔧 Fixing get_nearby_venues RPC function to include lat/lng...');
    
    // Drop the existing function first
    const dropResult = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS get_nearby_venues(double precision, double precision, double precision);'
    });
    
    console.log('🗑️ Dropped existing function:', dropResult);
    
    // Create the updated function that includes lat/lng
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_nearby_venues(
        user_lat double precision,
        user_lng double precision,
        radius_km double precision DEFAULT 5
      )
      RETURNS TABLE (
        id uuid,
        name text,
        description text,
        address text,
        city text,
        state text,
        postal_code text,
        country text,
        lat double precision,
        lng double precision,
        category text,
        rating double precision,
        price_level integer,
        phone text,
        website text,
        is_verified boolean,
        is_active boolean,
        opening_hours jsonb,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        distance_km double precision
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          v.id,
          v.name,
          v.description,
          v.address,
          v.city,
          v.state,
          v.postal_code,
          v.country,
          v.lat,
          v.lng,
          v.category,
          v.rating,
          v.price_level,
          v.phone,
          v.website,
          v.is_verified,
          v.is_active,
          v.opening_hours,
          v.created_at,
          v.updated_at,
          ST_Distance(
            ST_Point(user_lng, user_lat)::geography,
            ST_Point(v.lng, v.lat)::geography
          ) / 1000 as distance_km
        FROM venues v
        WHERE v.is_active = true
          AND ST_DWithin(
            ST_Point(user_lng, user_lat)::geography,
            ST_Point(v.lng, v.lat)::geography,
            radius_km * 1000
          )
        ORDER BY distance_km;
      END;
      $$;
    `;
    
    const createResult = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });
    
    console.log('✅ Created updated function:', createResult);
    
    // Test the updated function
    console.log('🧪 Testing updated function...');
    const testResult = await supabase.rpc('get_nearby_venues', {
      user_lat: 37.7749,
      user_lng: -122.4194,
      radius_km: 10
    });
    
    if (testResult.error) {
      console.error('❌ Test failed:', testResult.error);
    } else {
      console.log('✅ Test successful! Sample venue:', testResult.data[0]);
      console.log('📊 Total venues returned:', testResult.data.length);
      console.log('🗺️ First venue has coordinates:', {
        lat: testResult.data[0]?.lat,
        lng: testResult.data[0]?.lng
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing RPC function:', error);
    
    // Fallback: Try creating the function directly without exec_sql
    console.log('🔄 Trying direct SQL execution...');
    
    try {
      // Create the function using a direct query
      const { error: directError } = await supabase
        .from('venues')  // Just to establish connection
        .select('count')
        .limit(0);
      
      if (directError) {
        console.log('Connection test result:', directError);
      }
      
      console.log('⚠️ Cannot update RPC function directly. Please run this SQL manually in Supabase dashboard:');
      console.log(`
CREATE OR REPLACE FUNCTION get_nearby_venues(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  lat double precision,
  lng double precision,
  category text,
  rating double precision,
  price_level integer,
  phone text,
  website text,
  is_verified boolean,
  is_active boolean,
  opening_hours jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  distance_km double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.description,
    v.address,
    v.city,
    v.state,
    v.postal_code,
    v.country,
    v.lat,
    v.lng,
    v.category,
    v.rating,
    v.price_level,
    v.phone,
    v.website,
    v.is_verified,
    v.is_active,
    v.opening_hours,
    v.created_at,
    v.updated_at,
    ST_Distance(
      ST_Point(user_lng, user_lat)::geography,
      ST_Point(v.lng, v.lat)::geography
    ) / 1000 as distance_km
  FROM venues v
  WHERE v.is_active = true
    AND ST_DWithin(
      ST_Point(user_lng, user_lat)::geography,
      ST_Point(v.lng, v.lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$;
      `);
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
  }
}

fixRpcFunction();
