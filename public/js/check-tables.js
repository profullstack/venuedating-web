import { supabaseClientPromise } from './supabase-client.js';

/**
 * Check available tables in Supabase
 * This function will list all tables in the public schema
 */
async function checkAvailableTables() {
  try {
    const supabase = await supabaseClientPromise;
    
    // Query the information_schema.tables to get a list of all tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('Error fetching tables:', error);
      return { success: false, error };
    }
    
    console.log('Available tables in public schema:', data);
    return { success: true, tables: data };
  } catch (err) {
    console.error('Error in checkAvailableTables:', err);
    return { success: false, error: err };
  }
}

/**
 * Alternative method to check tables using RPC
 * This function will use a custom RPC function if available
 */
async function checkTablesViaRPC() {
  try {
    const supabase = await supabaseClientPromise;
    
    // Call a custom RPC function that lists tables
    // Note: This requires a function to be defined in Supabase
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Error fetching tables via RPC:', error);
      return { success: false, error };
    }
    
    console.log('Available tables via RPC:', data);
    return { success: true, tables: data };
  } catch (err) {
    console.error('Error in checkTablesViaRPC:', err);
    return { success: false, error: err };
  }
}

/**
 * Check if a specific table exists and get its columns
 * @param {string} tableName - Name of the table to check
 */
async function checkTableColumns(tableName) {
  try {
    const supabase = await supabaseClientPromise;
    
    // Query the information_schema.columns to get columns for a specific table
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`Error fetching columns for table ${tableName}:`, error);
      return { success: false, error };
    }
    
    console.log(`Columns for table ${tableName}:`, data);
    return { success: true, columns: data };
  } catch (err) {
    console.error(`Error in checkTableColumns for ${tableName}:`, err);
    return { success: false, error: err };
  }
}

/**
 * Check if users table exists and get its structure
 * This is a specific check for the auth.users table which is part of Supabase Auth
 */
async function checkUsersTable() {
  try {
    const supabase = await supabaseClientPromise;
    
    // Try to query the auth.users table (this is a special table in Supabase)
    // Note: This might require special permissions
    const { data, error } = await supabase
      .from('auth.users')
      .select('id, phone')
      .limit(1);
    
    if (error) {
      console.error('Error accessing auth.users table:', error);
      
      // Try an alternative approach using the auth API
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        return { success: false, error: userError };
      }
      
      console.log('Current user data structure:', userData);
      return { success: true, userStructure: userData };
    }
    
    console.log('Users table data:', data);
    return { success: true, users: data };
  } catch (err) {
    console.error('Error in checkUsersTable:', err);
    return { success: false, error: err };
  }
}

// Execute all checks
async function runAllChecks() {
  console.log('Running database structure checks...');
  
  // Check all available tables
  const tablesResult = await checkAvailableTables();
  
  // Try RPC method as fallback
  if (!tablesResult.success) {
    console.log('Trying RPC method...');
    await checkTablesViaRPC();
  }
  
  // Check users table specifically
  await checkUsersTable();
  
  // If we found tables, check columns for each
  if (tablesResult.success && tablesResult.tables) {
    for (const table of tablesResult.tables) {
      await checkTableColumns(table.table_name);
    }
  }
  
  console.log('Database structure checks completed');
}

// Export functions for use in other files
export {
  checkAvailableTables,
  checkTablesViaRPC,
  checkTableColumns,
  checkUsersTable,
  runAllChecks
};

// Auto-run checks if this script is loaded directly
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('Running table checks...');
    runAllChecks()
      .then(() => console.log('Table checks completed'))
      .catch(err => console.error('Error running table checks:', err));
  });
}