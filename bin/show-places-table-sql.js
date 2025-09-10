#!/usr/bin/env node

import fs from 'fs';

console.log('🚀 Extracting SQL for places table creation...');

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

console.log('\n' + '='.repeat(80));
console.log('📋 COPY AND PASTE THIS SQL INTO YOUR SUPABASE DASHBOARD:');
console.log('='.repeat(80));
console.log('\n' + sqlCommands + '\n');
console.log('='.repeat(80));
console.log('\n💡 Instructions:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to the SQL Editor');
console.log('3. Paste the SQL above');
console.log('4. Click "Run" to execute');
console.log('5. Then test with: node bin/generate-venues.js --limit 1');
console.log('\n🎯 This will create the places table with PostGIS support!');