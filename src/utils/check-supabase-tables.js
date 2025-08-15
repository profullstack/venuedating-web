/**
 * Script to check all Supabase tables and verify if specific tables exist
 * Run with: node src/utils/check-supabase-tables.js
 */

import dotenv from 'dotenv-flow';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Table to specifically check for existence
const TARGET_TABLE = 'verification_codes';

async function checkSupabaseTables() {
  console.log('Checking Supabase tables...');
  
  // Get environment variables for Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                     process.env.SUPABASE_KEY || 
                     process.env.SUPABASE_SERVICE_KEY || 
                     process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials in environment variables');
    console.log('Please ensure SUPABASE_URL and one of the following are set:');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    console.log('- SUPABASE_KEY');
    console.log('- SUPABASE_SERVICE_KEY');
    console.log('- SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  console.log(`✅ Found Supabase credentials: ${supabaseUrl}`);
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get list of all tables from Supabase
    console.log('Fetching table information from Supabase...');
    
    const { data: tables, error } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public');  // Only show public schema tables
    
    if (error) {
      throw new Error(`Failed to query tables: ${error.message}`);
    }
    
    if (!tables || tables.length === 0) {
      console.log('No tables found in the public schema.');
      return;
    }
    
    // Display all found tables
    console.log('\n📋 Tables in Supabase:');
    console.log('----------------------------');
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename} (Schema: ${table.schemaname})`);
    });
    
    // Check if our target table exists
    const targetTableExists = tables.some(t => t.tablename === TARGET_TABLE);
    
    console.log('\n🔍 Table Check Results:');
    console.log('----------------------------');
    console.log(`Table '${TARGET_TABLE}': ${targetTableExists ? '✅ EXISTS' : '❌ DOES NOT EXIST'}`);
    
    // If target table doesn't exist, provide SQL to create it
    if (!targetTableExists) {
      console.log('\n📝 SQL to create the verification_codes table:');
      console.log('----------------------------');
      console.log(`
CREATE TABLE public.verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_signup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index on phone number for faster lookups
CREATE INDEX verification_codes_phone_idx ON public.verification_codes (phone);

-- Add RLS policies
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to verification_codes"
  ON public.verification_codes
  USING (true)
  WITH CHECK (true);
`);
    }
    
  } catch (error) {
    console.error('❌ Error checking Supabase tables:', error.message);
    process.exit(1);
  }
}

// Run the check
checkSupabaseTables()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
