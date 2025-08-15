/**
 * Test script for phone signup and login flow with user API endpoints
 * This script tests the full flow of:
 * 1. Creating a user via API
 * 2. Getting a user by ID
 * 3. Updating a user's verification status
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// API base URL
const API_BASE_URL = 'http://localhost:8097/api';

// Test user data
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '5551234567',
  countryCode: '+1'
};

async function runTests() {
  console.log('Starting phone signup and login flow tests with user API endpoints...');
  
  try {
    // Step 1: Create a user
    console.log('\n1. Creating a user via API...');
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
    console.log(`Verified: ${createResult.user.phone_verified}`);
    
    const userId = createResult.user.id;
    
    // Step 2: Get the user by ID
    console.log('\n2. Getting user by ID...');
    const getResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get user: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const getResult = await getResponse.json();
    
    if (!getResult.success) {
      throw new Error(`API returned error: ${getResult.error}`);
    }
    
    console.log('User retrieved successfully!');
    console.log(`User ID: ${getResult.user.id}`);
    console.log(`Full name: ${getResult.user.full_name}`);
    console.log(`Phone: ${getResult.user.phone_number}`);
    console.log(`Verified: ${getResult.user.phone_verified}`);
    
    // Step 3: Update the user's verification status
    console.log('\n3. Updating user verification status...');
    const updateResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update user: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updateResult = await updateResponse.json();
    
    if (!updateResult.success) {
      throw new Error(`API returned error: ${updateResult.error}`);
    }
    
    console.log('User updated successfully!');
    console.log(`User ID: ${updateResult.user.id}`);
    console.log(`Full name: ${updateResult.user.full_name}`);
    console.log(`Phone: ${updateResult.user.phone_number}`);
    console.log(`Verified: ${updateResult.user.phone_verified}`);
    
    // Step 4: Get the user again to verify the update
    console.log('\n4. Getting user again to verify update...');
    const getAgainResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!getAgainResponse.ok) {
      throw new Error(`Failed to get user: ${getAgainResponse.status} ${getAgainResponse.statusText}`);
    }
    
    const getAgainResult = await getAgainResponse.json();
    
    if (!getAgainResult.success) {
      throw new Error(`API returned error: ${getAgainResult.error}`);
    }
    
    console.log('User retrieved successfully!');
    console.log(`User ID: ${getAgainResult.user.id}`);
    console.log(`Full name: ${getAgainResult.user.full_name}`);
    console.log(`Phone: ${getAgainResult.user.phone_number}`);
    console.log(`Verified: ${getAgainResult.user.phone_verified}`);
    
    if (getAgainResult.user.phone_verified) {
      console.log('\n✅ TEST PASSED: User verification status was updated successfully!');
    } else {
      console.log('\n❌ TEST FAILED: User verification status was not updated!');
    }
    
    console.log('\nAll tests completed successfully!');
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
