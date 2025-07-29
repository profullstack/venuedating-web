// Test script to check if we have users in the database for matching
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = 'https://whwodcfvmdhkzwjsxfju.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indod29kY2Z2bWRoa3p3anN4Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY3MjUxNDEsImV4cCI6MTk5MjMwMTE0MX0.qKtfNHhL8Eglfxs_mJJGL-IU4IPd9orXGwzG7SsNIQQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Query functions
async function checkForUsers() {
  console.log('Checking for users in the profiles table...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_verified')
    .limit(10);
  
  if (error) {
    console.error('Error checking for profiles:', error);
    return false;
  }
  
  console.log(`Found ${profiles.length} profiles in the database`);
  
  if (profiles.length > 0) {
    console.log('Sample profiles:');
    profiles.forEach(profile => {
      console.log(`- ${profile.full_name || 'Unnamed'} (${profile.id}) - Verified: ${profile.is_verified ? 'Yes' : 'No'}`);
    });
    return true;
  }
  
  return false;
}

// Main function
async function main() {
  // Check if we have users
  const hasUsers = await checkForUsers();
  
  if (hasUsers) {
    console.log('✅ Users exist in the database. Ready for matching and chat testing!');
  } else {
    console.log('❌ No users found in database. Need to seed users for matching and chat testing.');
  }
}

main().catch(console.error);
