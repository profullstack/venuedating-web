#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing places table and function...');

async function testPlacesTable() {
  // Test 1: Check if places table exists
  console.log('\n1️⃣ Testing if places table exists...');
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Places table does not exist:', error.message);
      return false;
    } else {
      console.log('✅ Places table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing places table:', error.message);
    return false;
  }

  // Test 2: Check if insert_place_with_coordinates function exists
  console.log('\n2️⃣ Testing if insert_place_with_coordinates function exists...');
  try {
    const { data, error } = await supabase.rpc('insert_place_with_coordinates', {
      p_title: 'Test Venue',
      p_latitude: 40.7128,
      p_longitude: -74.0060,
      p_city: 'New York',
      p_state: 'New York'
    });
    
    if (error) {
      console.error('❌ Function error:', error.message);
      if (error.message.includes('could not find function')) {
        console.log('💡 The insert_place_with_coordinates function was not created properly');
        return false;
      }
    } else {
      console.log('✅ Function exists and returned:', data);
      
      // Clean up the test record
      if (data) {
        await supabase.from('places').delete().eq('id', data);
        console.log('🧹 Cleaned up test record');
      }
    }
  } catch (error) {
    console.error('❌ Error testing function:', error.message);
    return false;
  }

  // Test 3: Try direct insert to see what columns exist
  console.log('\n3️⃣ Testing direct insert to see table structure...');
  try {
    const { data, error } = await supabase
      .from('places')
      .insert({
        title: 'Test Direct Insert',
        city: 'Test City',
        state: 'Test State',
        latitude: 40.7128,
        longitude: -74.0060
      })
      .select();
    
    if (error) {
      console.error('❌ Direct insert error:', error.message);
    } else {
      console.log('✅ Direct insert successful:', data);
      
      // Clean up
      if (data && data[0]) {
        await supabase.from('places').delete().eq('id', data[0].id);
        console.log('🧹 Cleaned up test record');
      }
    }
  } catch (error) {
    console.error('❌ Error with direct insert:', error.message);
  }

  return true;
}

testPlacesTable().then(() => {
  console.log('\n🎯 Test completed!');
}).catch(error => {
  console.error('💥 Test failed:', error);
});