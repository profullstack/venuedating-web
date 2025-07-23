import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying SF venues migration...');
    
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase/migrations/20250723215400_seed_sf_venues.sql');
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
