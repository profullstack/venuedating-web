#!/usr/bin/env node
/**
 * CLI script to test and seed users for matching/chat testing
 * Usage: node test-and-seed-matching-users.js [--force-seed]
 * 
 * Options:
 *  --force-seed: Force seed users even if sufficient users already exist
 *  --help: Show help
 */

// Import required libraries
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('force-seed', {
    alias: 'f',
    type: 'boolean',
    description: 'Force seed users even if sufficient users already exist'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Load Supabase credentials from .env or use hardcoded values for demo
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://whwodcfvmdhkzwjsxfju.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for service key
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_KEY not found in .env file');
  console.log('');
  console.log('Please create or update your .env file with the following:');
  console.log('SUPABASE_URL=https://whwodcfvmdhkzwjsxfju.supabase.co');
  console.log('SUPABASE_SERVICE_KEY=your_service_key_here');
  console.log('');
  console.log('You can find your service key in the Supabase dashboard:');
  console.log('Project Settings > API > service_role secret');
  process.exit(1);
}

// Initialize Supabase client with service key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
  },
  {
    full_name: 'Marcus Johnson',
    gender: 'male',
    age: 32,
    bio: 'Jazz musician and coffee shop owner. Looking to expand my social circle in SF.',
    avatar_url: 'https://randomuser.me/api/portraits/men/83.jpg',
    location: 'San Francisco, CA',
    is_verified: true,
    venue_id: null
  },
  {
    full_name: 'Zoe Thompson',
    gender: 'female',
    age: 29,
    bio: 'Book editor, plant enthusiast, and amateur baker. Would love to meet fellow literature lovers!',
    avatar_url: 'https://randomuser.me/api/portraits/women/60.jpg',
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
  
  try {
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
  } catch (error) {
    console.error('❌ Unexpected error checking profiles:', error);
    return false;
  }
}

/**
 * Get venues to assign users to
 */
async function getVenues() {
  console.log('🏢 Fetching venues to assign users to...');
  
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, lat, lng')
      .limit(20);
    
    if (error) {
      console.error('❌ Error fetching venues:', error);
      return [];
    }
    
    if (!venues || venues.length === 0) {
      console.log('⚠️ No venues found. Creating seed users without venue assignment.');
      return [];
    }
    
    console.log(`✅ Found ${venues.length} venues`);
    venues.forEach((venue, index) => {
      if (index < 5) { // Just show the first 5 to avoid clutter
        console.log(`- ${venue.name} (${venue.id})`);
      }
    });
    
    return venues;
  } catch (error) {
    console.error('❌ Unexpected error fetching venues:', error);
    return [];
  }
}

/**
 * Create a Supabase auth user
 */
async function createAuthUser(email, password) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (error) {
      console.error(`❌ Error creating auth user ${email}:`, error);
      return null;
    }
    
    console.log(`✅ Created auth user: ${email} with ID: ${data.user.id}`);
    return data.user;
  } catch (error) {
    console.error(`❌ Unexpected error creating auth user ${email}:`, error);
    return null;
  }
}

/**
 * Create a demo auth user and link profile
 */
async function createUserWithProfile(userData, index) {
  try {
    // Create a unique email for the user based on the index
    const email = `demo${index+1}@barcrush.app`;
    const password = 'demo123';
    
    // Create the auth user
    const authUser = await createAuthUser(email, password);
    if (!authUser) {
      console.error(`❌ Failed to create auth user for ${userData.full_name}`);
      return null;
    }
    
    // Add the auth user ID to the profile data
    const profileData = {
      ...userData,
      id: authUser.id,
      email: email
    };
    
    // Insert the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select();
    
    if (profileError) {
      console.error(`❌ Error creating profile for ${userData.full_name}:`, profileError);
      return null;
    }
    
    console.log(`✅ Created profile for: ${userData.full_name} with ID: ${profile[0].id}`);
    return profile[0];
  } catch (error) {
    console.error(`❌ Unexpected error creating user and profile:`, error);
    return null;
  }
}

/**
 * Seed users for matching testing
 */
async function seedMatchingUsers() {
  console.log('🌱 Seeding users for matching testing...');
  
  try {
    // Get venues to assign users to
    const venues = await getVenues();
    
    // Create profiles for each sample user
    const createdProfiles = [];
    
    for (let i = 0; i < sampleUsers.length; i++) {
      const user = sampleUsers[i];
      
      // Assign a random venue if available
      if (venues && venues.length > 0) {
        const randomVenue = venues[Math.floor(Math.random() * venues.length)];
        user.venue_id = randomVenue.id;
        
        // Set user location to venue location if available
        if (randomVenue.lat && randomVenue.lng) {
          user.location_lat = randomVenue.lat;
          user.location_lng = randomVenue.lng;
        }
        
        console.log(`🧑‍🤝‍🧑 Creating user: ${user.full_name} at venue: ${randomVenue.name}`);
      } else {
        console.log(`🧑‍🤝‍🧑 Creating user: ${user.full_name} (no venue assigned)`);
      }
      
      // Add additional required fields
      user.interests = JSON.stringify(['Music', 'Food', 'Travel', 'Tech', 'Fitness'].slice(0, Math.floor(Math.random() * 3) + 2));
      user.photos = JSON.stringify([user.avatar_url]);
      
      // Create the user with auth and profile
      const profile = await createUserWithProfile(user, i);
      if (profile) {
        createdProfiles.push(profile);
      }
    }
    
    console.log(`✅ Successfully created ${createdProfiles.length} users for matching testing`);
    return createdProfiles.length > 0;
  } catch (error) {
    console.error('❌ Unexpected error seeding users:', error);
    return false;
  }
}

/**
 * Create some matches between users
 */
async function createSampleMatches(profiles) {
  if (!profiles || profiles.length < 2) {
    console.log('⚠️ Not enough profiles to create matches');
    return false;
  }
  
  console.log('💕 Creating sample matches between users...');
  
  try {
    // Create some sample matches (likes between users)
    const matches = [];
    
    // Create a few mutual likes (matches)
    for (let i = 0; i < profiles.length - 1; i++) {
      // Each user likes the next user
      const { error: like1Error } = await supabase
        .from('likes')
        .insert([{
          user_id: profiles[i].id,
          liked_user_id: profiles[i+1].id
        }]);
      
      if (like1Error) {
        console.error(`❌ Error creating like from ${profiles[i].full_name} to ${profiles[i+1].full_name}:`, like1Error);
        continue;
      }
      
      // And the next user likes them back
      const { error: like2Error } = await supabase
        .from('likes')
        .insert([{
          user_id: profiles[i+1].id,
          liked_user_id: profiles[i].id
        }]);
      
      if (like2Error) {
        console.error(`❌ Error creating like from ${profiles[i+1].full_name} to ${profiles[i].full_name}:`, like2Error);
        continue;
      }
      
      console.log(`✅ Created mutual match between ${profiles[i].full_name} and ${profiles[i+1].full_name}`);
      matches.push({
        user1: profiles[i].full_name,
        user2: profiles[i+1].full_name
      });
    }
    
    console.log(`✅ Created ${matches.length} mutual matches between users`);
    return matches.length > 0;
  } catch (error) {
    console.error('❌ Unexpected error creating matches:', error);
    return false;
  }
}

/**
 * Check if demo account exists, create if not
 */
async function ensureDemoAccount() {
  console.log('🔑 Checking for demo account (demo@barcrush.app)...');
  
  // Demo phone number for testing - use this for phone login
  const DEMO_PHONE = '+12223334444'; // Use this specific test phone number
  
  try {
    // Check if the demo account exists
    const { data: demoAuth, error: findError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.demo@barcrush.app`,
      perPage: 1
    });
    
    if (findError) {
      console.error('❌ Error checking for demo account:', findError);
      return false;
    }
    
    // If user exists, verify it
    if (demoAuth && demoAuth.users && demoAuth.users.length > 0) {
      console.log('✅ Demo account exists (demo@barcrush.app)');
      
      // Check if phone number is associated with the account
      const user = demoAuth.users[0];
      if (!user.phone) {
        console.log('📱 Adding phone verification to demo account...');
        
        // Add phone number to the demo account
        const { error: phoneError } = await supabase.auth.admin.updateUserById(
          user.id,
          { phone: DEMO_PHONE, phone_confirmed: true }
        );
        
        if (phoneError) {
          console.error('❌ Error adding phone to demo account:', phoneError);
        } else {
          console.log('✅ Added verified phone number to demo account: ' + DEMO_PHONE);
        }
      } else {
        console.log('✅ Demo account already has verified phone number: ' + user.phone);
      }
      
      // Get profile to verify it exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Error checking for demo profile:', profileError);
      } else if (!profile) {
        console.log('⚠️ Demo account exists but profile is missing. Creating profile...');
        await createDemoProfile(user.id, DEMO_PHONE);
      } else {
        // Update profile with phone if needed
        if (!profile.phone) {
          await supabase
            .from('profiles')
            .update({ phone: DEMO_PHONE })
            .eq('id', user.id);
          console.log('✅ Added phone number to demo profile: ' + DEMO_PHONE);
        }
        console.log('✅ Demo account profile exists and is verified');
      }
      
      return true;
    }
    
    // Create demo account if it doesn't exist
    console.log('🌱 Creating demo account: demo@barcrush.app');
    
    // Create the auth user with both email and phone
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'demo@barcrush.app',
      password: 'demo123',
      phone: DEMO_PHONE,
      email_confirm: true,
      phone_confirm: true
    });
    
    if (error) {
      console.error('❌ Error creating demo account:', error);
      return false;
    }
    
    console.log('✅ Created demo account with:');
    console.log('   - Email: demo@barcrush.app');
    console.log('   - Phone: ' + DEMO_PHONE);
    
    // Create the profile
    await createDemoProfile(data.user.id, DEMO_PHONE);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error ensuring demo account:', error);
    return false;
  }
}

/**
 * Create demo profile
 */
async function createDemoProfile(userId, phone = null, name = 'Demo User') {
  try {
    // Create demo profile data
    const demoProfile = {
      id: userId,
      full_name: name,
      avatar_url: 'https://randomuser.me/api/portraits/lego/1.jpg',
      email: 'demo@barcrush.app',
      phone: phone,
      gender: 'other',
      age: 30,
      birth_date: '1995-01-01',
      bio: 'This is a demo account for testing purposes.',
      is_verified: true,
      interests: JSON.stringify(['Food', 'Drinks', 'Meeting People']),
      photos: JSON.stringify(['https://randomuser.me/api/portraits/lego/1.jpg']),
      display_name: 'Demo',
      occupation: 'Software Tester',
      location_lat: 37.7749,
      location_lng: -122.4194
    };
    
    const { error } = await supabase
      .from('profiles')
      .upsert([demoProfile]);
      
    if (error) {
      console.error('❌ Error creating demo profile:', error);
      return false;
    }
    
    console.log('✅ Created demo profile for demo@barcrush.app');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error creating demo profile:', error);
    return false;
  }
}

/**
 * Ensure phone login demo account exists
 * This creates a dedicated account for phone number login testing
 */
async function ensurePhoneLoginDemoAccount() {
  console.log('📞 Creating dedicated phone login demo account...');
  
  // Test phone number as used in the phone-login.html
  const DEMO_PHONE = '+15555555555';
  
  try {
    // First check if a user with this phone already exists
    const { data: usersWithPhone, error: phoneCheckError } = await supabase.auth.admin.listUsers({
      filter: `phone.eq.${DEMO_PHONE}`,
      perPage: 1
    });
    
    if (phoneCheckError) {
      console.error('❌ Error checking for phone demo account:', phoneCheckError);
      return false;
    }
    
    // If user exists, verify its profile
    if (usersWithPhone && usersWithPhone.users && usersWithPhone.users.length > 0) {
      console.log('✅ Phone demo account exists with number:', DEMO_PHONE);
      
      const user = usersWithPhone.users[0];
      
      // Get profile to verify it exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Error checking for phone demo profile:', profileError);
      } else if (!profile) {
        console.log('⚠️ Phone demo account exists but profile is missing. Creating profile...');
        await createDemoProfile(user.id, DEMO_PHONE, 'Phone Demo User');
      } else {
        console.log('✅ Phone demo account profile exists');
      }
      
      return true;
    }
    
    // Create phone demo account if it doesn't exist
    console.log('🌱 Creating phone demo account with number:', DEMO_PHONE);
    
    // Create random email for this phone account
    const phoneEmail = `phone-demo-${Date.now()}@barcrush.app`;
    
    // Create the auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: phoneEmail,
      password: 'demo123',
      phone: DEMO_PHONE,
      email_confirm: true,
      phone_confirm: true
    });
    
    if (error) {
      console.error('❌ Error creating phone demo account:', error);
      return false;
    }
    
    console.log('✅ Created phone demo account:');
    console.log('   - Phone: ' + DEMO_PHONE);
    console.log('   - Email: ' + phoneEmail + ' (for internal use only)');
    
    // Create the profile
    await createDemoProfile(data.user.id, DEMO_PHONE, 'Phone Demo User');
    
    console.log('✅ Phone demo login test account is ready!');
    console.log('💡 To test phone login, use the number: ' + DEMO_PHONE);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error ensuring phone demo account:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Barcrush Matching User Test & Seed Tool');
  console.log('=========================================');
  
  // Ensure demo accounts exist
  await ensureDemoAccount();
  await ensurePhoneLoginDemoAccount();
  
  // Check if we should force seed
  const forceSeed = argv['force-seed'];
  
  // Check if we have users
  const hasUsers = await checkForUsers();
  
  if (hasUsers && !forceSeed) {
    console.log('✅ Sufficient users exist in the database. Ready for matching and chat testing!');
    console.log('');
    console.log('If you want to force seed more users, run with --force-seed flag:');
    console.log('node test-and-seed-matching-users.js --force-seed');
    return true;
  } else {
    if (forceSeed) {
      console.log('🔄 Force seeding users for matching and chat testing...');
    } else {
      console.log('❌ Not enough verified users found. Seeding users for matching and chat testing...');
    }
    
    const seededUsers = await seedMatchingUsers();
    
    if (seededUsers) {
      // Get the freshly created profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_verified', true)
        .limit(10);
      
      // Create some matches between users
      if (profiles && profiles.length >= 2) {
        await createSampleMatches(profiles);
      }
      
      console.log('');
      console.log('✅ Successfully seeded users for matching and chat testing!');
      console.log('');
      console.log('You can now test the matching functionality with these users.');
      console.log('To login as one of them, use credentials like:');
      console.log('Email: demo1@barcrush.app');
      console.log('Password: demo123');
      return true;
    } else {
      console.error('❌ Failed to seed users');
      return false;
    }
  }
}

// Run the script
main()
  .catch(error => {
    console.error('❌ Uncaught error:', error);
    process.exit(1);
  })
  .finally(() => {
    // Complete the script execution
    setTimeout(() => process.exit(0), 1000);
  });
