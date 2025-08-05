#!/usr/bin/env node

/**
 * Run SQL Migration Script
 * 
 * Executes the payment fields migration directly via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Running SQL migration for payment fields...\n');

async function runMigration() {
  try {
    // First, let's try to add the columns one by one using individual queries
    console.log('📊 Adding has_paid column...');
    
    // We'll use a workaround by trying to select from the column first
    // If it fails, we know the column doesn't exist
    let needsHasPaid = false;
    let needsPaymentDate = false;
    let needsSquarePaymentId = false;
    
    try {
      await supabase.from('profiles').select('has_paid').limit(1);
      console.log('✅ has_paid column already exists');
    } catch (error) {
      needsHasPaid = true;
    }
    
    try {
      await supabase.from('profiles').select('payment_date').limit(1);
      console.log('✅ payment_date column already exists');
    } catch (error) {
      needsPaymentDate = true;
    }
    
    try {
      await supabase.from('profiles').select('square_payment_id').limit(1);
      console.log('✅ square_payment_id column already exists');
    } catch (error) {
      needsSquarePaymentId = true;
    }
    
    if (!needsHasPaid && !needsPaymentDate && !needsSquarePaymentId) {
      console.log('✅ All payment columns already exist!');
      return true;
    }
    
    console.log('\n⚠️  Some columns are missing. Please run this SQL in your Supabase SQL Editor:');
    console.log('\n----------------------------------------');
    console.log('-- Add payment fields to profiles table');
    console.log('ALTER TABLE profiles');
    
    const alterStatements = [];
    if (needsHasPaid) alterStatements.push('ADD COLUMN has_paid BOOLEAN DEFAULT FALSE');
    if (needsPaymentDate) alterStatements.push('ADD COLUMN payment_date TIMESTAMPTZ');
    if (needsSquarePaymentId) alterStatements.push('ADD COLUMN square_payment_id TEXT');
    
    console.log(alterStatements.join(',\n') + ';');
    console.log('');
    console.log('-- Create indexes for performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_profiles_has_paid ON profiles(has_paid);');
    console.log('CREATE INDEX IF NOT EXISTS idx_profiles_payment_date ON profiles(payment_date);');
    console.log('----------------------------------------\n');
    
    return false;
    
  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
    return false;
  }
}

async function setDemoAccountPaid() {
  console.log('💳 Setting demo account as paid...');
  
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

    // Update payment status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        has_paid: true,
        payment_date: new Date().toISOString(),
        square_payment_id: 'DEMO_PAYMENT_' + Date.now()
      })
      .eq('id', demoUser.id);

    if (updateError) {
      throw new Error(`Failed to update payment status: ${updateError.message}`);
    }

    console.log('✅ Demo account payment status updated successfully');
    
    // Verify the update
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('has_paid, payment_date, square_payment_id')
      .eq('id', demoUser.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify update: ${verifyError.message}`);
    }

    console.log('✅ Verification successful:');
    console.log(`   - Has Paid: ${profile.has_paid}`);
    console.log(`   - Payment Date: ${profile.payment_date}`);
    console.log(`   - Payment ID: ${profile.square_payment_id}`);
    
    return true;

  } catch (error) {
    console.error('❌ Failed to set demo account as paid:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection successful\n');

    // Check and run migration
    const migrationComplete = await runMigration();
    
    if (migrationComplete) {
      console.log('🎯 Migration complete! Setting demo account as paid...\n');
      
      const demoUpdated = await setDemoAccountPaid();
      
      if (demoUpdated) {
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Payment columns exist in database');
        console.log('   ✅ Demo account (demo@barcrush.app) set as paid');
        console.log('   ✅ Ready to test payment gate');
        console.log('\n🚀 You can now test the matching page!');
        console.log('   - Demo account will bypass payment gate');
        console.log('   - Other accounts will see payment modal');
      }
    } else {
      console.log('⚠️  Please run the SQL migration shown above, then run this script again.');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
main();
