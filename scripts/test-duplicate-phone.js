/**
 * Test script for handling duplicate phone numbers in user creation API
 * This script tests:
 * 1. Creating a user with a phone number
 * 2. Attempting to create another user with the same phone number
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API base URL
const API_BASE_URL = 'http://localhost:8097/api';

// Test user data
const TEST_USER = {
  firstName: 'Duplicate',
  lastName: 'Test',
  phoneNumber: '5559876543',
  countryCode: '+1'
};

async function runTests() {
  console.log('Starting duplicate phone number handling test...');
  
  try {
    // Step 1: Create a user
    console.log('\n1. Creating initial user...');
    const createResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        phoneNumber: TEST_USER.phoneNumber,
        countryCode: TEST_USER.countryCode,
        phoneVerified: false
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create user: ${createResponse.status} ${createResponse.statusText}`);
    }
    
    const createResult = await createResponse.json();
    
    if (!createResult.success) {
      throw new Error(`API returned error: ${createResult.error}`);
    }
    
    console.log('User created successfully!');
    console.log(`User ID: ${createResult.user.id}`);
    console.log(`Full name: ${createResult.user.full_name}`);
    console.log(`Phone: ${createResult.user.phone_number}`);
    
    const userId = createResult.user.id;
    
    // Step 2: Try to create another user with the same phone number
    console.log('\n2. Attempting to create duplicate user with same phone number...');
    const duplicateResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Another',
        lastName: 'User',
        phoneNumber: TEST_USER.phoneNumber,
        countryCode: TEST_USER.countryCode,
        phoneVerified: false
      })
    });
    
    if (!duplicateResponse.ok) {
      throw new Error(`API request failed: ${duplicateResponse.status} ${duplicateResponse.statusText}`);
    }
    
    const duplicateResult = await duplicateResponse.json();
    
    console.log('API Response:', duplicateResult);
    
    if (duplicateResult.success && duplicateResult.message === 'User already exists') {
      console.log('\n✅ TEST PASSED: Duplicate phone number was correctly identified!');
      console.log(`Returned existing user ID: ${duplicateResult.user.id}`);
      
      if (duplicateResult.user.id === userId) {
        console.log('✅ Returned the correct existing user ID!');
      } else {
        console.log('❌ Returned a different user ID than expected!');
      }
    } else {
      console.log('\n❌ TEST FAILED: Duplicate phone number was not correctly handled!');
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
