#!/usr/bin/env node

/**
 * Create Test Accounts for Matching/Chat Testing
 * 
 * This script creates test user accounts that can be used to test
 * matching functionality and chat between different users.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service key for user creation

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testAccounts = [
  {
    email: 'alice@test.com',
    password: 'test123',
    profile: {
      display_name: 'Alice Johnson',
      full_name: 'Alice Johnson',
      birth_date: '1999-01-15',
      bio: 'Love hiking and coffee ☕',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      gender: 'female',
      interested_in: ['male'],
      location_lat: 37.7749,
      location_lng: -122.4194,
      preferred_radius_km: 20,
      is_verified: true
    }
  },
  {
    email: 'bob@test.com',
    password: 'test123',
    profile: {
      display_name: 'Bob Smith',
      full_name: 'Bob Smith',
      birth_date: '1996-03-22',
      bio: 'Tech enthusiast and foodie 🍕',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      gender: 'male',
      interested_in: ['female'],
      location_lat: 37.7749,
      location_lng: -122.4194,
      preferred_radius_km: 25,
      is_verified: true
    }
  },
  {
    email: 'charlie@test.com',
    password: 'test123',
    profile: {
      display_name: 'Charlie Davis',
      full_name: 'Charlie Davis',
      birth_date: '2000-07-10',
      bio: 'Artist and music lover 🎨🎵',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      gender: 'male',
      interested_in: ['female', 'non-binary'],
      location_lat: 37.7749,
      location_lng: -122.4194,
      preferred_radius_km: 15,
      is_verified: true
    }
  },
  {
    email: 'diana@test.com',
    password: 'test123',
    profile: {
      display_name: 'Diana Wilson',
      full_name: 'Diana Wilson',
      birth_date: '1998-11-05',
      bio: 'Yoga instructor and nature lover 🧘‍♀️🌿',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      gender: 'female',
      interested_in: ['male', 'female'],
      location_lat: 37.7749,
      location_lng: -122.4194,
      preferred_radius_km: 18,
      is_verified: true
    }
  }
];

async function createTestAccount(account) {
  try {
    console.log(`Creating account for ${account.email}...`);
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true // Auto-confirm email
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  Account ${account.email} already exists, updating profile...`);
        
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === account.email);
        
        if (existingUser) {
          // Update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.id,
              ...account.profile,
              updated_at: new Date().toISOString()
            });
          
          if (profileError) {
            console.error(`❌ Error updating profile for ${account.email}:`, profileError);
          } else {
            console.log(`✅ Updated profile for ${account.email}`);
          }
        }
        return;
      }
      throw authError;
    }
    
    const user = authData.user;
    console.log(`✅ Created auth user: ${user.email}`);
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        ...account.profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error(`❌ Error creating profile for ${account.email}:`, profileError);
    } else {
      console.log(`✅ Created profile for ${account.email}`);
    }
    
  } catch (error) {
    console.error(`❌ Error creating account ${account.email}:`, error);
  }
}

async function main() {
  console.log('🚀 Creating test accounts for matching/chat testing...\n');
  
  for (const account of testAccounts) {
    await createTestAccount(account);
    console.log(''); // Empty line for readability
  }
  
  console.log('✅ Test account creation complete!');
  console.log('\n📋 Test Accounts Created:');
  testAccounts.forEach(account => {
    console.log(`   • ${account.email} (password: ${account.password}) - ${account.profile.display_name}`);
  });
  
  console.log('\n🎯 You can now use these accounts to:');
  console.log('   1. Login with different accounts in different browser tabs/windows');
  console.log('   2. Test matching between users');
  console.log('   3. Test chat functionality when users match');
  console.log('\n💡 All accounts are set as verified and located in San Francisco for testing.');
}

main().catch(console.error);
