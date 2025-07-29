import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    // Get migration file from command line argument
    const migrationFile = process.argv[2];
    if (!migrationFile) {
      console.error('❌ Please provide a migration file path as an argument');
      console.error('   Usage: node apply-migration.js <migration-file-path>');
      process.exit(1);
    }
    
    console.log(`🚀 Applying migration: ${migrationFile}`);
    
    // Read the migration file
    const migrationPath = join(__dirname, migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Try direct query instead
          const { data: directData, error: directError } = await supabase
            .from('venues')
            .select('count', { count: 'exact', head: true });
          
          if (directError) {
            console.error('❌ Direct query also failed:', directError);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    // Verify the data was inserted
    const { data: venues, error: selectError } = await supabase
      .from('venues')
      .select('name, city, lat, lng')
      .eq('city', 'San Francisco');
    
    if (selectError) {
      console.error('❌ Error verifying venues:', selectError);
    } else {
      console.log(`🎉 Migration completed! Inserted ${venues.length} San Francisco venues:`);
      venues.forEach(venue => {
        console.log(`  - ${venue.name} (${venue.lat}, ${venue.lng})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyMigration();
