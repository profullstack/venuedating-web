/**
 * Test script to check and seed users for matching/chat testing
 * This script uses the existing Supabase client from the app
 * Run this in the browser console after the app has loaded
 */
import { supabaseClientPromise } from './supabase-client.js';

// Sample users for seeding if needed
const sampleUsers = [
  {
    full_name: 'Emma Wilson',
    gender: 'female',
    age: 28,
    bio: 'Coffee enthusiast, hiking lover, and tech professional. Looking to meet new people in the city!',
    avatar_url: 'https://randomuser.me/api/portraits/women/33.jpg',
    location: 'San Francisco, CA',
    is_verified: true,
    venue_id: null // Will be set randomly from available venues
  },
  {
    full_name: 'James Miller',
    gender: 'male',
    age: 31,
    bio: 'Startup founder, craft beer connoisseur, and weekend cyclist. Let\'s grab a drink!',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    location: 'San Francisco, CA',
    is_verified: true,
    venue_id: null
  },
  {
    full_name: 'Sophia Chen',
    gender: 'female',
    age: 26,
    bio: 'Art curator by day, foodie by night. Always on the lookout for the best dim sum in town!',
    avatar_url: 'https://randomuser.me/api/portraits/women/79.jpg',
    location: 'San Francisco, CA',
    is_verified: true,
    venue_id: null
  },
  {
    full_name: 'Ethan Jackson',
    gender: 'male',
    age: 29,
    bio: 'Software engineer, amateur photographer, and dog lover. Looking for company at local breweries.',
    avatar_url: 'https://randomuser.me/api/portraits/men/52.jpg',
    location: 'San Francisco, CA',
    is_verified: true,
    venue_id: null
  },
  {
    full_name: 'Olivia Rodriguez',
    gender: 'female',
    age: 27,
    bio: 'Yoga instructor with a passion for sustainable living. Interested in meeting mindful people.',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'San Francisco, CA',
    is_verified: true,
    venue_id: null
  }
];

/**
 * Check if we have users for matching
 */
async function checkForUsers() {
  console.log('🔍 Checking for users in the profiles table...');
  
  const supabase = await supabaseClientPromise;
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_verified')
    .eq('is_verified', true)
    .limit(10);
  
  if (error) {
    console.error('❌ Error checking for profiles:', error);
    return false;
  }
  
  console.log(`✅ Found ${profiles.length} verified profiles in the database`);
  
  if (profiles.length > 0) {
    console.log('📋 Sample profiles:');
    profiles.forEach(profile => {
      console.log(`- ${profile.full_name || 'Unnamed'} (${profile.id}) - Verified: ${profile.is_verified ? 'Yes' : 'No'}`);
    });
    return profiles.length >= 5; // Consider sufficient if we have 5+ profiles
  }
  
  return false;
}

/**
 * Get venues to assign users to
 */
async function getVenues() {
  console.log('🏢 Fetching venues to assign users to...');
  
  const supabase = await supabaseClientPromise;
  
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name')
    .limit(20);
  
  if (error) {
    console.error('❌ Error fetching venues:', error);
    return [];
  }
  
  console.log(`✅ Found ${venues.length} venues`);
  return venues;
}

/**
 * Seed users for matching testing
 */
async function seedMatchingUsers() {
  console.log('🌱 Seeding users for matching testing...');
  
  const supabase = await supabaseClientPromise;
  
  // Get venues to assign users to
  const venues = await getVenues();
  if (!venues || venues.length === 0) {
    console.error('❌ No venues found to assign users to');
    return false;
  }
  
  // Create users
  for (const user of sampleUsers) {
    // Assign a random venue
    const randomVenue = venues[Math.floor(Math.random() * venues.length)];
    user.venue_id = randomVenue.id;
    
    // Add additional required fields
    user.interests = JSON.stringify(['Music', 'Food', 'Travel', 'Tech', 'Fitness'].slice(0, Math.floor(Math.random() * 3) + 2));
    user.photos = JSON.stringify([user.avatar_url]);
    
    console.log(`🧑‍🤝‍🧑 Creating user: ${user.full_name} at venue: ${randomVenue.name}`);
    
    // Insert the user profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([user])
      .select();
    
    if (error) {
      console.error(`❌ Error creating user ${user.full_name}:`, error);
    } else {
      console.log(`✅ Created user: ${user.full_name} with ID: ${data[0].id}`);
    }
  }
  
  return true;
}

/**
 * Main function to run tests and seed if needed
 */
async function main() {
  // Check if we have users
  const hasUsers = await checkForUsers();
  
  if (hasUsers) {
    console.log('✅ Sufficient users exist in the database. Ready for matching and chat testing!');
    return true;
  } else {
    console.log('❌ Not enough verified users found. Seeding users for matching and chat testing...');
    const seeded = await seedMatchingUsers();
    if (seeded) {
      console.log('✅ Successfully seeded users for matching and chat testing!');
      return true;
    } else {
      console.error('❌ Failed to seed users');
      return false;
    }
  }
}

// Export functions
export {
  main as testMatchingUsers,
  checkForUsers,
  seedMatchingUsers
};

// Log usage instructions
console.log(`
🚀 Matching Users Test Utility Loaded!
Run the following commands in the console:

1. To check for existing users:
   await import('/js/test-matching-users.js').then(m => m.checkForUsers());

2. To seed users if needed:
   await import('/js/test-matching-users.js').then(m => m.seedMatchingUsers());

3. To do both (check and seed if needed):
   await import('/js/test-matching-users.js').then(m => m.testMatchingUsers());
`);
