/**
 * Test script for phone number format handling in the phone existence check API
 * This script tests:
 * 1. Checking a phone number with standard E.164 format
 * 2. Checking the same phone number with parentheses and other non-digit characters
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API base URL
const API_BASE_URL = 'http://localhost:8097/api';

// Test phone numbers (same number in different formats)
const TEST_PHONE_NUMBERS = [
  '+2349042401681', // Standard E.164 format
  '+234(904)2401681', // With parentheses
  '+234 904 240 1681', // With spaces
  '+234-904-240-1681' // With dashes
];

async function runTests() {
  console.log('Starting phone number format handling test...');
  
  try {
    // First, ensure the phone number exists in the database
    console.log('\n1. Creating a user with the test phone number if it doesn\'t exist...');
    const createResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Format',
        lastName: 'Test',
        phoneNumber: '9042401681',
        countryCode: '+234',
        phoneVerified: false
      })
    });
    
    const createResult = await createResponse.json();
    console.log('User creation result:', createResult);
    
    // Now test each phone number format
    console.log('\n2. Testing different phone number formats...');
    
    for (const phoneNumber of TEST_PHONE_NUMBERS) {
      console.log(`\nTesting format: ${phoneNumber}`);
      
      const checkResponse = await fetch(`${API_BASE_URL}/1/auth/check-phone-exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phoneNumber
        })
      });
      
      if (!checkResponse.ok) {
        console.log(`❌ API request failed: ${checkResponse.status} ${checkResponse.statusText}`);
        continue;
      }
      
      const checkResult = await checkResponse.json();
      console.log('Check result:', checkResult);
      
      if (checkResult.exists) {
        console.log(`✅ SUCCESS: Phone number ${phoneNumber} was correctly identified as existing`);
      } else {
        console.log(`❌ FAILURE: Phone number ${phoneNumber} was not identified as existing`);
      }
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
