#!/usr/bin/env node

/**
 * Simple profile seeding script for BarCrush
 * This creates real profiles in the database for matching QA
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample user data for seeding (will create auth users first, then profiles)
const sampleUsers = [
  {
    email: 'alex@example.com',
    password: 'password123',
    display_name: 'Alex',
    full_name: 'Alex Johnson',
    bio: 'Love hiking and coffee. Looking for adventure partners!',
    birth_date: '1995-03-15',
    gender: 'non-binary',
    interested_in: ['everyone'],
    location_lat: 37.7749,
    location_lng: -122.4194,
    avatar_url: 'https://randomuser.me/api/portraits/lego/1.jpg'
  },
  {
    email: 'sarah@example.com',
    password: 'password123',
    display_name: 'Sarah',
    full_name: 'Sarah Chen',
    bio: 'Artist and yoga instructor. Seeking meaningful connections.',
    birth_date: '1992-07-22',
    gender: 'female',
    interested_in: ['male'],
    location_lat: 37.7849,
    location_lng: -122.4094,
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    email: 'michael@example.com',
    password: 'password123',
    display_name: 'Michael',
    full_name: 'Michael Rodriguez',
    bio: 'Tech enthusiast and foodie. Let\'s explore the city together!',
    birth_date: '1990-11-08',
    gender: 'male',
    interested_in: ['female'],
    location_lat: 37.7649,
    location_lng: -122.4294,
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    email: 'emma@example.com',
    password: 'password123',
    display_name: 'Emma',
    full_name: 'Emma Thompson',
    bio: 'Book lover and wine enthusiast. Looking for deep conversations.',
    birth_date: '1993-05-12',
    gender: 'female',
    interested_in: ['everyone'],
    location_lat: 37.7549,
    location_lng: -122.4394,
    avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    email: 'jordan@example.com',
    password: 'password123',
    display_name: 'Jordan',
    full_name: 'Jordan Kim',
    bio: 'Musician and traveler. Always up for spontaneous adventures!',
    birth_date: '1994-09-30',
    gender: 'non-binary',
    interested_in: ['everyone'],
    location_lat: 37.7449,
    location_lng: -122.4494,
    avatar_url: 'https://randomuser.me/api/portraits/lego/5.jpg'
  }
];

async function seedProfiles() {
  try {
    console.log('🌱 Starting to seed profiles...');
    
    const createdProfiles = [];
    
    for (const userData of sampleUsers) {
      try {
        console.log(`👤 Processing user: ${userData.display_name}...`);
        
        // Check if user already exists
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error(`❌ Error listing users for ${userData.display_name}:`, listError);
          continue;
        }
        
        let user = existingUsers.users?.find(u => u.email === userData.email);
        
        if (!user) {
          console.log(`   🎆 Creating auth user for ${userData.display_name}...`);
          
          // Create auth user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              full_name: userData.full_name,
              display_name: userData.display_name
            }
          });
          
          if (createError) {
            console.error(`   ❌ Error creating user ${userData.display_name}:`, createError);
            continue;
          }
          
          user = newUser.user;
          console.log(`   ✅ Created auth user for ${userData.display_name}`);
        } else {
          console.log(`   ✅ User ${userData.display_name} already exists`);
        }
        
        // Check if profile already exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (existingProfile) {
          console.log(`   ✅ Profile for ${userData.display_name} already exists`);
          continue;
        }
        
        // Create profile with the real user ID
        const profileData = {
          id: user.id,
          display_name: userData.display_name,
          full_name: userData.full_name,
          bio: userData.bio,
          birth_date: userData.birth_date,
          gender: userData.gender,
          interested_in: userData.interested_in,
          location_lat: userData.location_lat,
          location_lng: userData.location_lng,
          avatar_url: userData.avatar_url,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`   📝 Creating profile for ${userData.display_name}...`);
        
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();
        
        if (insertError) {
          console.error(`   ❌ Error creating profile for ${userData.display_name}:`, insertError);
          continue;
        }
        
        console.log(`   ✅ Created profile for ${userData.display_name}`);
        createdProfiles.push(insertedProfile);
        
      } catch (error) {
        console.error(`❌ Error processing ${userData.display_name}:`, error);
      }
    }
    
    console.log(`✅ Successfully created ${createdProfiles.length} profiles`);
    
    // Verify the profiles are accessible
    const { data: verifyProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, display_name, is_verified')
      .eq('is_verified', true);
    
    if (verifyError) {
      console.error('❌ Error verifying profiles:', verifyError);
    } else {
      console.log(`🔍 Verification: Found ${verifyProfiles?.length || 0} verified profiles in database`);
      verifyProfiles?.forEach(profile => {
        console.log(`   - ${profile.display_name} (verified: ${profile.is_verified})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in seedProfiles:', error);
  }
}

// Also create a demo user account
async function createDemoUser() {
  try {
    console.log('👤 Checking demo user account...');
    
    // Try to get existing demo user by email
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }
    
    const demoUser = existingUsers.users?.find(user => user.email === 'demo@barcrush.app');
    
    if (demoUser) {
      console.log('✅ Demo user already exists:', demoUser.email);
      
      // Ensure the demo user is confirmed
      if (!demoUser.email_confirmed_at) {
        console.log('🔧 Confirming demo user email...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(demoUser.id, {
          email_confirm: true
        });
        
        if (updateError) {
          console.error('❌ Error confirming demo user:', updateError);
        } else {
          console.log('✅ Demo user email confirmed');
        }
      }
      
      return demoUser;
    }
    
    console.log('👤 Creating new demo user...');
    
    // Create demo user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'demo@barcrush.app',
      password: 'demo12345',
      phone: '+15555555555',
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: 'Demo User',
        display_name: 'Demo'
      }
    });
    
    if (createError) {
      console.error('❌ Error creating demo user:', createError);
      return;
    }
    
    console.log('✅ Demo user created successfully');
    
    // Create demo user profile
    const demoProfile = {
      id: newUser.user.id,
      display_name: 'Demo',
      full_name: 'Demo User',
      bio: 'Demo account for testing BarCrush features',
      birth_date: '1990-01-01',
      gender: 'non-binary',
      interested_in: ['everyone'],
      location_lat: 37.7749,
      location_lng: -122.4194,
      avatar_url: 'https://randomuser.me/api/portraits/lego/0.jpg',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(demoProfile, { onConflict: 'id' });
    
    if (profileError) {
      console.error('❌ Error creating demo profile:', profileError);
    } else {
      console.log('✅ Demo profile created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error in createDemoUser:', error);
  }
}

async function main() {
  console.log('🚀 Starting BarCrush profile seeding...');
  
  await createDemoUser();
  await seedProfiles();
  
  console.log('🎉 Seeding completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
