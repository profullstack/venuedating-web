import { supabase } from '../src/utils/supabase.js';

async function checkTableStructure() {
  console.log('Checking database table structures...');
  
  // Function to get table columns
  async function getTableColumns(tableName) {
    console.log(`\nExamining table: ${tableName}`);
    try {
      // Try to get column information using system tables
      const { data, error } = await supabase.rpc('get_table_columns', { table_name: tableName });
      
      if (error) {
        console.log(`Error getting columns for ${tableName} using RPC:`, error);
        
        // Fallback: Try to select a single row to see columns
        console.log(`Attempting to get sample row from ${tableName}...`);
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sampleError) {
          console.log(`Error getting sample from ${tableName}:`, sampleError);
          
          // Last resort: Try to get table definition
          console.log(`Attempting to describe table ${tableName}...`);
          const { data: descData, error: descError } = await supabase
            .from('_meta')
            .select('*')
            .eq('table', tableName);
          
          if (descError) {
            console.log(`Could not get structure for ${tableName}:`, descError);
            return null;
          } else {
            console.log(`Table ${tableName} metadata:`, descData);
            return descData;
          }
        } else {
          if (sampleData && sampleData.length > 0) {
            console.log(`Columns in ${tableName}:`, Object.keys(sampleData[0]));
            return Object.keys(sampleData[0]);
          } else {
            console.log(`Table ${tableName} exists but is empty`);
            
            // Try to get table definition from information_schema
            const { data: infoData, error: infoError } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable')
              .eq('table_name', tableName);
            
            if (infoError) {
              console.log(`Could not access information_schema for ${tableName}:`, infoError);
              return [];
            } else {
              console.log(`Columns in ${tableName} from information_schema:`, infoData);
              return infoData.map(col => col.column_name);
            }
          }
        }
      } else {
        console.log(`Columns in ${tableName}:`, data);
        return data;
      }
    } catch (err) {
      console.error(`Error examining ${tableName}:`, err);
      return null;
    }
  }

  // Check structure of main tables
  await getTableColumns('users');
  await getTableColumns('venues');
  await getTableColumns('matches');
  await getTableColumns('conversations');
  await getTableColumns('messages');
  
  // Check if notifications table exists
  console.log('\nChecking if notifications table exists...');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Notifications table does not exist');
    } else if (error) {
      console.log('Error checking notifications table:', error);
    } else {
      console.log('Notifications table exists');
      if (data && data.length > 0) {
        console.log('Columns in notifications:', Object.keys(data[0]));
      } else {
        console.log('Notifications table is empty');
      }
    }
  } catch (err) {
    console.error('Error checking notifications table:', err);
  }
  
  // Alternative approach: List all tables
  console.log('\nListing all tables in the database...');
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.log('Error listing tables:', error);
    } else {
      console.log('Tables in database:', data.map(t => t.tablename));
    }
  } catch (err) {
    console.error('Error listing tables:', err);
  }
}

// Run the function and exit when done
checkTableStructure().then(() => {
  console.log('\nTable structure check completed');
  process.exit(0);
}).catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
