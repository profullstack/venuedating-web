#!/usr/bin/env node

/**
 * Square Payment Endpoints Test Script
 * 
 * Tests all Square payment integration endpoints:
 * - GET /api/square-credentials
 * - POST /api/process-payment
 * - GET /api/user/payment-status
 * - POST /api/user/payment-status
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8097';
const TEST_EMAIL = process.env.TEST_EMAIL || 'demo@barcrush.app';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'demo123';

// Initialize Supabase client (for regular operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize Supabase admin client (for user creation without email confirmation)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test utilities
let authToken = null;
let testUser = null;

/**
 * Delete existing demo user if it exists
 */
async function deleteDemoUser() {
  try {
    // First, try to find the user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.log('⚠️  Could not list users:', listError.message);
      return false;
    }
    
    const existingUser = users.users.find(user => user.email === TEST_EMAIL);
    
    if (existingUser) {
      console.log(`🗑️  Deleting existing demo user: ${existingUser.id}`);
      
      // Delete from profiles table first
      await supabaseAdmin.from('profiles').delete().eq('id', existingUser.id);
      
      // Delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      
      if (deleteError) {
        console.log('⚠️  Could not delete existing user:', deleteError.message);
        return false;
      }
      
      console.log('✅ Existing demo user deleted');
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  Error deleting demo user:', error.message);
    return false;
  }
}

/**
 * Create demo user if it doesn't exist
 */
async function createDemoUser() {
  console.log('👤 Creating demo user...');
  
  try {
    // First delete any existing demo user
    await deleteDemoUser();
    
    // Wait a moment for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use admin client to create user without email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: 'Demo User',
        display_name: 'Demo'
      }
    });
    
    if (error) {
      console.error('❌ Failed to create demo user:', error.message);
      return false;
    }
    
    console.log('✅ Demo user created successfully');
    console.log(`   User ID: ${data.user.id}`);
    
    // Also create a profile entry for the user
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: 'Demo User',
          display_name: 'Demo',
          has_paid: false,
          payment_date: null,
          square_payment_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.log('⚠️  Warning: Could not create profile entry:', profileError.message);
        console.log('   This might be due to missing payment fields in profiles table');
        console.log('   Run the migration: 20250820140000_add_payment_fields_to_profiles.sql');
      } else {
        console.log('✅ Demo user profile created');
      }
    } catch (profileErr) {
      console.log('⚠️  Warning: Profile creation failed:', profileErr.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating demo user:', error.message);
    return false;
  }
}

/**
 * Authenticate test user and get auth token
 */
async function authenticate() {
  console.log('🔐 Authenticating test user...');
  
  try {
    // First try to sign in
    let { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      // If sign in fails, try to create/recreate the user
      if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
        console.log('ℹ️  User authentication failed, recreating demo user...');
        const created = await createDemoUser();
        
        if (!created) {
          console.error('❌ Failed to create demo user');
          return false;
        }
        
        // Wait a moment for user creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to sign in again
        const signInResult = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        });
        
        data = signInResult.data;
        error = signInResult.error;
        
        if (error) {
          console.error('❌ Authentication failed after user creation:', error.message);
          return false;
        }
      } else {
        console.error('❌ Authentication failed:', error.message);
        return false;
      }
    }
    
    authToken = data.session.access_token;
    testUser = data.user;
    
    console.log('✅ Authentication successful');
    console.log(`   User ID: ${data.session.user.id}`);
    console.log(`   Email: ${data.session.user.email}`);
    
    // Check if profile exists for this user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
    
    if (profileError || !profile) {
      console.log('⚠️  No profile found for user, creating one...');
      
      // Create profile using service role key
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.session.user.id,
          full_name: 'Demo User',
          display_name: 'Demo',
          has_paid: false,
          payment_date: null,
          square_payment_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.log('❌ Failed to create profile:', createError.message);
      } else {
        console.log('✅ Profile created for authenticated user');
      }
    } else {
      console.log('✅ Profile exists for authenticated user');
    }
    
    return { session: data.session, user: data.session.user };
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

/**
 * Make authenticated API request
 */
async function makeRequest(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    // Return response with helper methods
    return {
      status: response.status,
      ok: response.ok,
      json: () => response.json(),
      text: () => response.text()
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Test Square credentials endpoint
 */
async function testSquareCredentials() {
  console.log('\n📋 Testing Square Credentials Endpoint');
  console.log('GET /api/square-credentials');
  
  const result = await makeRequest('GET', '/api/square-credentials');
  
  console.log(`   Status: ${result.status}`);
  
  if (result.ok) {
    const data = await result.json();
    console.log('✅ Square credentials retrieved successfully');
    console.log(`   Application ID: ${data.applicationId}`);
    console.log(`   Location ID: ${data.locationId}`);
    console.log(`   Environment: ${data.environment}`);
    
    if (!data.applicationId || !data.locationId) {
      console.log('⚠️  Warning: Missing required Square credentials');
      return false;
    }
    
    return true;
  } else {
    const errorText = await result.text();
    console.log('❌ Failed to retrieve Square credentials');
    console.log(`   Error: ${errorText}`);
    return false;
  }
}

/**
 * Test payment status GET endpoint
 */
async function testGetPaymentStatus() {
  console.log(`💳 Testing Get Payment Status Endpoint`);
  console.log(`GET /api/user/payment-status`);
  const paymentStatusResponse = await makeRequest('GET', '/api/user/payment-status');
  console.log(`   Status: ${paymentStatusResponse.status}`);
  
  if (paymentStatusResponse.ok) {
    const paymentStatus = await paymentStatusResponse.json();
    console.log(`✅ Payment status retrieved successfully`);
    console.log(`   Has Paid: ${paymentStatus.has_paid}`);
    return true;
  } else {
    const errorText = await paymentStatusResponse.text();
    console.log(`❌ Failed to retrieve payment status`);
    console.log(`   Status Code: ${paymentStatusResponse.status}`);
    console.log(`   Response: ${errorText}`);
    
    // Try to get more details by checking the profile directly
    try {
      console.log(`   🔍 Debugging: Checking profile directly...`);
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('has_paid, id, created_at')
        .eq('id', testUser.id)
        .single();
      
      if (dbError) {
        console.log(`   🔍 Database Error: ${dbError.message}`);
        console.log(`   🔍 Error Code: ${dbError.code}`);
        console.log(`   🔍 Error Details: ${JSON.stringify(dbError, null, 2)}`);
      } else {
        console.log(`   🔍 Profile Found: ${JSON.stringify(profile, null, 2)}`);
      }
    } catch (debugError) {
      console.log(`   🔍 Debug Error: ${debugError.message}`);
    }
    
    return false;
  }
}

/**
 * Test payment status POST endpoint
 */
async function testUpdatePaymentStatus(hasPaid) {
  console.log('\n💳 Testing Update Payment Status Endpoint');
  console.log('POST /api/user/payment-status');
  
  const result = await makeRequest('POST', '/api/user/payment-status', {
    has_paid: hasPaid
  });
  
  console.log(`   Status: ${result.status}`);
  
  if (result.ok) {
    const data = await result.json();
    console.log('✅ Payment status updated successfully');
    console.log(`   Has Paid: ${data.has_paid}`);
    return data.has_paid;
  } else {
    const errorText = await result.text();
    console.log('❌ Failed to update payment status');
    console.log(`   Error: ${errorText}`);
    return false;
  }
}

/**
 * Test process payment endpoint with mock data
 */
async function testProcessPayment() {
  console.log('\n💰 Testing Process Payment Endpoint');
  console.log('POST /api/process-payment');
  
  const result = await makeRequest('POST', '/api/process-payment', {
    token: 'cnon:card-nonce-ok', // Square test token
    amount: 200 // $2.00 in cents
  });
  
  console.log(`   Status: ${result.status}`);
  
  if (result.ok) {
    const data = await result.json();
    console.log('✅ Payment processed successfully');
    console.log(`   Payment ID: ${data.paymentId}`);
    console.log(`   Amount: $${data.amount / 100}`);
    console.log(`   Status: ${data.status}`);
    return true;
  } else {
    const errorText = await result.text();
    console.log('❌ Payment processing failed');
    console.log(`   Error: ${errorText}`);
    return false;
  }
}

/**
 * Test authentication without token
 */
async function testUnauthenticatedAccess() {
  console.log('\n🔒 Testing Unauthenticated Access');
  
  const originalToken = authToken;
  authToken = null; // Remove auth token
  
  const result = await makeRequest('GET', '/api/square-credentials');
  
  console.log(`   Status: ${result.status}`);
  
  if (result.status === 401) {
    console.log('✅ Properly rejected unauthenticated request');
    authToken = originalToken; // Restore token
    return true;
  } else {
    const errorText = await result.text();
    console.log('❌ Failed to reject unauthenticated request');
    console.log(`   Error: ${errorText}`);
    authToken = originalToken; // Restore token
    return false;
  }
}

/**
 * Test user profile endpoint
 */
async function testUserProfile() {
  console.log('\n👤 Testing User Profile Endpoint');
  console.log('GET /api/user-profile');
  
  const result = await makeRequest('GET', '/api/user-profile');
  
  console.log(`   Status: ${result.status}`);
  
  if (result.ok) {
    const data = await result.json();
    console.log('✅ User profile retrieved successfully');
    console.log(`   User ID: ${data.id}`);
    console.log(`   Display Name: ${data.display_name || 'N/A'}`);
    console.log(`   Has Paid: ${data.has_paid || false}`);
    return true;
  } else {
    const errorText = await result.text();
    console.log('❌ Failed to retrieve user profile');
    console.log(`   Status Code: ${result.status}`);
    console.log(`   Response: ${errorText}`);
    
    // Try to get more details by checking the profile directly
    try {
      console.log(`   🔍 Debugging: Checking profile directly...`);
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();
      
      if (dbError) {
        console.log(`   🔍 Database Error: ${dbError.message}`);
        console.log(`   🔍 Error Code: ${dbError.code}`);
        console.log(`   🔍 Error Details: ${JSON.stringify(dbError, null, 2)}`);
      } else {
        console.log(`   🔍 Profile Found: ${JSON.stringify(profile, null, 2)}`);
      }
    } catch (debugError) {
      console.log(`   🔍 Debug Error: ${debugError.message}`);
    }
    
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Square Payment Endpoints Test Suite');
  console.log('='.repeat(50));
  
  // Check environment variables
  console.log('\n🔧 Environment Check');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Square Environment: ${process.env.SQUARE_ENV || 'sandbox'}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Square Sandbox App ID: ${process.env.SQUARE_SANDBOX_APP_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Square Sandbox Location ID: ${process.env.SQUARE_SANDBOX_LOCATION_ID ? '✅ Set' : '❌ Missing'}`);
  
  // Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Test suite aborted: Authentication failed');
    process.exit(1);
  }
  
  // Run tests
  const results = {
    squareCredentials: false,
    getPaymentStatus: false,
    updatePaymentStatus: false,
    processPayment: false,
    userProfile: false,
    unauthenticatedAccess: true
  };
  
  try {
    // Test Square credentials
    results.squareCredentials = await testSquareCredentials();
    
    // Test payment status endpoints
    const initialPaymentStatus = await testGetPaymentStatus();
    results.getPaymentStatus = initialPaymentStatus !== null;
    
    // Test updating payment status
    results.updatePaymentStatus = await testUpdatePaymentStatus(true);
    
    // Test process payment (mock)
    results.processPayment = await testProcessPayment();
    
    // Test user profile
    results.userProfile = await testUserProfile();
    
    // Test unauthenticated access
    await testUnauthenticatedAccess();
    
    // Reset payment status to original value
    if (results.getPaymentStatus && initialPaymentStatus !== null) {
      await testUpdatePaymentStatus(initialPaymentStatus);
      console.log(`\n🔄 Reset payment status to original value: ${initialPaymentStatus}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`   ${testName}: ${status}`);
  });
  
  console.log(`\nOverall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Payment integration is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration and try again.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the test suite
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
