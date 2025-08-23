/**
 * Test script for refactored auth middleware
 * Tests both client-side and server-side auth middleware
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Test user credentials
const TEST_PHONE = process.env.TEST_PHONE || '+15555555555';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Test JWT token authentication
 */
async function testJwtAuth() {
  console.log('\n=== Testing JWT Authentication ===');
  
  try {
    // Create a test JWT token
    console.log('Creating test JWT token...');
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now
    
    const jwtToken = Buffer.from(JSON.stringify({
      user_id: 'test-user-id',
      email: TEST_EMAIL,
      phone: TEST_PHONE,
      exp: Math.floor(expiresAt / 1000)
    })).toString('base64');
    
    console.log(`JWT Token: ${jwtToken}`);
    
    // Test server-side auth middleware with JWT token
    console.log('\nTesting server-side auth with JWT token...');
    const serverResponse = await fetch(`${API_URL}/api/auth-status`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    const serverResult = await serverResponse.json();
    console.log('Server response:', serverResult);
    console.log('Server auth test result:', serverResponse.ok ? 'PASSED' : 'FAILED');
    
    return serverResponse.ok;
  } catch (error) {
    console.error('JWT auth test error:', error);
    return false;
  }
}

/**
 * Test API key authentication
 */
async function testApiKeyAuth() {
  console.log('\n=== Testing API Key Authentication ===');
  
  try {
    // Use a test API key
    const apiKey = 'pfs_test_key_12345';
    
    // Test server-side auth middleware with API key
    console.log('\nTesting server-side auth with API key...');
    const serverResponse = await fetch(`${API_URL}/api/auth-status`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    const serverResult = await serverResponse.json();
    console.log('Server response:', serverResult);
    console.log('Server API key auth test result:', serverResponse.ok ? 'PASSED' : 'FAILED');
    
    return serverResponse.ok;
  } catch (error) {
    console.error('API key auth test error:', error);
    return false;
  }
}

/**
 * Test Supabase session authentication
 */
async function testSupabaseAuth() {
  console.log('\n=== Testing Supabase Authentication ===');
  
  try {
    // Sign in with phone (this would normally be done with OTP)
    // For testing, we're just checking if the endpoint works
    console.log('\nTesting Supabase auth endpoint...');
    const serverResponse = await fetch(`${API_URL}/api/auth/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: TEST_PHONE
      })
    });
    
    const serverResult = await serverResponse.json();
    console.log('Server response:', serverResult);
    console.log('Supabase auth endpoint test result:', serverResponse.ok ? 'PASSED' : 'FAILED');
    
    return serverResponse.ok;
  } catch (error) {
    console.error('Supabase auth test error:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting auth middleware tests...');
  
  const jwtResult = await testJwtAuth();
  const apiKeyResult = await testApiKeyAuth();
  const supabaseResult = await testSupabaseAuth();
  
  console.log('\n=== Test Results Summary ===');
  console.log('JWT Authentication:', jwtResult ? 'PASSED' : 'FAILED');
  console.log('API Key Authentication:', apiKeyResult ? 'PASSED' : 'FAILED');
  console.log('Supabase Authentication:', supabaseResult ? 'PASSED' : 'FAILED');
  
  const allPassed = jwtResult && apiKeyResult && supabaseResult;
  console.log('\nOverall Test Result:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests();
