#!/usr/bin/env node

/**
 * Simple BarCrush Payment System Setup Script
 * 
 * This script sets up the demo account as paid and provides migration SQL
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 Starting BarCrush Payment System Setup...\n');

/**
 * Display migration SQL
 */
function displayMigrationSQL() {
  console.log('📊 Database Migration Required:');
  console.log('');
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log('');
  console.log('----------------------------------------');
  console.log('-- Add payment fields to profiles table');
  console.log('ALTER TABLE profiles ');
  console.log('ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE,');
  console.log('ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,');
  console.log('ADD COLUMN IF NOT EXISTS square_payment_id TEXT;');
  console.log('');
  console.log('-- Create indexes for performance');
  console.log('CREATE INDEX IF NOT EXISTS idx_profiles_has_paid ON profiles(has_paid);');
  console.log('CREATE INDEX IF NOT EXISTS idx_profiles_payment_date ON profiles(payment_date);');
  console.log('----------------------------------------');
  console.log('');
}

/**
 * Set demo account as paid (without using new columns)
 */
async function setDemoAccountPaid() {
  console.log('👤 Setting up demo account...');
  
  try {
    // Find demo account by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    let demoUser = users.users.find(user => user.email === 'demo@barcrush.app');
    
    if (!demoUser) {
      console.log('⚠️  Demo user not found, creating demo@barcrush.app...');
      
      // Create demo user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'demo@barcrush.app',
        password: 'demo123456',
        email_confirm: true,
        user_metadata: {
          display_name: 'Demo User',
          full_name: 'Demo User'
        }
      });

      if (createError) {
        throw new Error(`Failed to create demo user: ${createError.message}`);
      }

      console.log('✅ Demo user created successfully');
      demoUser = newUser.user;
    } else {
      console.log('✅ Demo user found:', demoUser.email);
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', demoUser.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('🔧 Creating profile for demo user...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: demoUser.id,
          display_name: 'Demo User',
          full_name: 'Demo User',
          bio: 'Demo account for testing BarCrush features',
          birth_date: '1990-01-01',
          gender: 'male',
          interested_in: ['female'],
          location_lat: 37.7749,
          location_lng: -122.4194,
          is_verified: true
        });

      if (insertError) {
        throw new Error(`Failed to create demo profile: ${insertError.message}`);
      }

      console.log('✅ Demo profile created');
      
    } else if (profileError) {
      throw new Error(`Failed to check demo profile: ${profileError.message}`);
    } else {
      console.log('✅ Demo profile already exists');
    }

    console.log('');
    console.log('⚠️  IMPORTANT: After running the SQL migration above, run this script again');
    console.log('   to set the demo account payment status.');

  } catch (error) {
    console.error('❌ Failed to set up demo account:', error.message);
    throw error;
  }
}

/**
 * Update demo payment status (only if columns exist)
 */
async function updateDemoPaymentStatus() {
  console.log('💳 Updating demo account payment status...');
  
  try {
    // Find demo user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    const demoUser = users.users.find(user => user.email === 'demo@barcrush.app');
    
    if (!demoUser) {
      throw new Error('Demo user not found');
    }

    // Try to update payment status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        has_paid: true,
        payment_date: new Date().toISOString(),
        square_payment_id: 'DEMO_PAYMENT_' + Date.now()
      })
      .eq('id', demoUser.id);

    if (updateError) {
      if (updateError.message.includes('has_paid')) {
        console.log('⚠️  Payment columns not found. Please run the SQL migration first.');
        return false;
      } else {
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }
    }

    console.log('✅ Demo account payment status updated successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to update demo payment status:', error.message);
    return false;
  }
}

/**
 * Verify environment variables
 */
function verifyEnvironment() {
  console.log('🔧 Checking environment variables...');
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:', missingVars.join(', '));
    return false;
  } else {
    console.log('✅ All required environment variables are set');
    return true;
  }
}

/**
 * Main setup function
 */
async function main() {
  try {
    // Check Supabase connection
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection successful\n');

    // Verify environment
    const envOk = verifyEnvironment();
    console.log('');

    // Display migration SQL
    displayMigrationSQL();

    // Set up demo account
    await setDemoAccountPaid();
    console.log('');

    // Try to update payment status
    const paymentUpdated = await updateDemoPaymentStatus();
    console.log('');

    if (paymentUpdated) {
      console.log('🎉 Payment system setup completed successfully!');
      console.log('');
      console.log('📋 Summary:');
      console.log('   ✅ Demo account (demo@barcrush.app) created/verified');
      console.log('   ✅ Demo account payment status set');
      console.log('   ✅ Environment variables verified');
      console.log('');
      console.log('🚀 You can now test the payment gate on the matching page!');
    } else {
      console.log('⚠️  Setup partially completed:');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Run the SQL migration shown above in Supabase SQL Editor');
      console.log('   2. Run this script again to set demo payment status');
      console.log('   3. Test the payment gate on the matching page');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Please check your environment variables and Supabase connection.');
    process.exit(1);
  }
}

// Run the setup
main();
