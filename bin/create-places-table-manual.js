#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Creating places table manually via Supabase client...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the migration file
const migrationPath = 'supabase/migrations/20250611060828_create_places_table_with_postgis.sql';
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Read migration file successfully');
} catch (error) {
  console.error('❌ Failed to read migration file:', error.message);
  process.exit(1);
}

// Extract just the SQL commands (remove comments and empty lines)
const sqlCommands = migrationSQL
  .split('\n')
  .filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
  })
  .join('\n');

console.log('📝 Executing SQL commands...');

try {
  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql: sqlCommands });
  
  if (error) {
    console.error('❌ Error executing SQL:', error);
    
    // Try alternative approach - execute via direct SQL
    console.log('🔄 Trying alternative approach...');
    const { data: altData, error: altError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (altError) {
      console.error('❌ Database connection failed:', altError);
      process.exit(1);
    }
    
    console.log('✅ Database connection works, but exec_sql RPC not available');
    console.log('💡 You need to run this SQL manually in your Supabase dashboard:');
    console.log('\n' + '='.repeat(80));
    console.log(sqlCommands);
    console.log('='.repeat(80) + '\n');
    
  } else {
    console.log('✅ Places table created successfully!');
    console.log('📊 Result:', data);
  }
  
  // Test if the table exists
  console.log('🔍 Testing if places table exists...');
  const { data: testData, error: testError } = await supabase
    .from('places')
    .select('count(*)')
    .limit(1);
  
  if (testError) {
    console.error('❌ Places table does not exist:', testError.message);
  } else {
    console.log('✅ Places table exists and is accessible!');
  }
  
} catch (error) {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}