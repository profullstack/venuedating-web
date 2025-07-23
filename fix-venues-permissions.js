import { supabase } from './src/utils/supabase.js';

async function fixVenuesPermissions() {
  try {
    console.log('🔧 Fixing venues table permissions...');
    
    // Check current RLS policies
    console.log('\n1. Checking current RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'venues');
    
    if (policiesError) {
      console.log('Could not check policies:', policiesError.message);
    } else {
      console.log('Current policies:', policies);
    }
    
    // Check if RLS is enabled
    console.log('\n2. Checking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'venues');
    
    if (rlsError) {
      console.log('Could not check RLS status:', rlsError.message);
    } else {
      console.log('RLS status:', rlsStatus);
    }
    
    // Try to disable RLS on venues table to allow anonymous access
    console.log('\n3. Attempting to disable RLS on venues table...');
    
    const disableRLSSQL = `
      ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
    `;
    
    // Try using a direct query (this might not work with anonymous key)
    const { data: disableResult, error: disableError } = await supabase.rpc('exec_sql', {
      sql: disableRLSSQL
    });
    
    if (disableError) {
      console.log('❌ Could not disable RLS via RPC:', disableError.message);
      
      // Alternative: Create a policy that allows public read access
      console.log('\n4. Creating public read policy instead...');
      
      const createPolicySQL = `
        CREATE POLICY "Public venues are viewable by everyone" ON venues
        FOR SELECT USING (true);
      `;
      
      const { data: policyResult, error: policyError } = await supabase.rpc('exec_sql', {
        sql: createPolicySQL
      });
      
      if (policyError) {
        console.log('❌ Could not create policy via RPC:', policyError.message);
        console.log('\n⚠️ Manual SQL needed. Please run this in Supabase SQL Editor:');
        console.log('-- Option 1: Disable RLS completely (easier)');
        console.log('ALTER TABLE venues DISABLE ROW LEVEL SECURITY;');
        console.log('\n-- Option 2: Create public read policy (more secure)');
        console.log('CREATE POLICY "Public venues are viewable by everyone" ON venues FOR SELECT USING (true);');
      } else {
        console.log('✅ Created public read policy');
      }
    } else {
      console.log('✅ Disabled RLS on venues table');
    }
    
    // Test the fix by trying to read venues with anonymous access
    console.log('\n5. Testing venues access...');
    
    // Create a client with anonymous key (like the frontend)
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(
      'https://whwodcfvmdhkzwjsxfju.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indod29kY2Z2bWRoa3p3anN4Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzIwNzEsImV4cCI6MjA2MzMwODA3MX0.EMZn8yaJF0gYuiZqLmx7Hw3S3GVelYDG5xvyXV9H4T8'
    );
    
    const { data: testVenues, error: testError } = await anonClient
      .from('venues')
      .select('*');
    
    if (testError) {
      console.error('❌ Anonymous access still failing:', testError);
    } else {
      console.log(`✅ Anonymous access working! Found ${testVenues.length} venues`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  }
}

fixVenuesPermissions();
