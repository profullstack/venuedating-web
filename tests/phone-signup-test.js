/**
 * Phone Signup Test Script
 * 
 * This script tests the phone signup flow using direct Twilio integration by:
 * 1. Initiating a signup with a test phone number
 * 2. Completing the signup with the test verification code
 * 3. Testing error cases and edge cases
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PHONE_NUMBERS = [
  { phoneNumber: '5555555555', countryCode: '+1', description: 'Original demo number' },
  { phoneNumber: '5551234567', countryCode: '+1', description: 'Test account: Alex Johnson' }
];
const TEST_VERIFICATION_CODE = '123456'; // Test bypass code
const INVALID_CODE = '000000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Initiate phone signup
 */
async function initiatePhoneSignup(phoneNumber, countryCode) {
  console.log(`${colors.blue}Initiating phone signup for ${countryCode}${phoneNumber}...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/initiate-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        countryCode
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Successfully initiated phone signup${colors.reset}`);
      console.log(`  Status: ${data.status}`);
      if (data.message) console.log(`  Message: ${data.message}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to initiate phone signup${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Exception initiating phone signup: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Complete phone signup
 */
async function completePhoneSignup(phoneNumber, countryCode, code, userData = {}) {
  console.log(`${colors.blue}Completing phone signup with code ${code} for ${countryCode}${phoneNumber}...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/complete-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        countryCode,
        code,
        userData: {
          name: `Test User ${phoneNumber.slice(-4)}`,
          ...userData
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Successfully completed phone signup${colors.reset}`);
      console.log(`  Message: ${data.message}`);
      if (data.user) console.log(`  User ID: ${data.user.id}`);
      return { success: true, data };
    } else {
      console.log(`${colors.red}✗ Failed to complete phone signup${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error: ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`${colors.red}✗ Exception completing phone signup: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test missing parameters
 */
async function testMissingParameters() {
  console.log(`\n${colors.magenta}Testing Missing Parameters${colors.reset}`);
  
  // Test missing phone number
  console.log(`\n${colors.cyan}Test: Missing phone number${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/initiate-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: '+1' })
    });
    
    const data = await response.json();
    const success = !data.success && response.status === 400;
    console.log(success 
      ? `${colors.green}✓ Correctly rejected missing phone number${colors.reset}` 
      : `${colors.red}✗ Failed to reject missing phone number${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Exception: ${error.message}${colors.reset}`);
  }
  
  // Test missing country code
  console.log(`\n${colors.cyan}Test: Missing country code${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/initiate-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '5555555555' })
    });
    
    const data = await response.json();
    const success = !data.success && response.status === 400;
    console.log(success 
      ? `${colors.green}✓ Correctly rejected missing country code${colors.reset}` 
      : `${colors.red}✗ Failed to reject missing country code${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Exception: ${error.message}${colors.reset}`);
  }
  
  // Test missing verification code
  console.log(`\n${colors.cyan}Test: Missing verification code${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/complete-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '5555555555', countryCode: '+1' })
    });
    
    const data = await response.json();
    const success = !data.success && response.status === 400;
    console.log(success 
      ? `${colors.green}✓ Correctly rejected missing verification code${colors.reset}` 
      : `${colors.red}✗ Failed to reject missing verification code${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Exception: ${error.message}${colors.reset}`);
  }
}

/**
 * Test invalid verification code
 */
async function testInvalidCode() {
  console.log(`\n${colors.magenta}Testing Invalid Verification Code${colors.reset}`);
  
  const testPhone = TEST_PHONE_NUMBERS[0];
  
  // First initiate a signup
  const initiateSuccess = await initiatePhoneSignup(testPhone.phoneNumber, testPhone.countryCode);
  
  if (initiateSuccess) {
    // Try to complete with an invalid code
    console.log(`\n${colors.cyan}Test: Invalid verification code${colors.reset}`);
    const { success } = await completePhoneSignup(testPhone.phoneNumber, testPhone.countryCode, INVALID_CODE);
    
    console.log(success === false
      ? `${colors.green}✓ Correctly rejected invalid code${colors.reset}`
      : `${colors.red}✗ Failed to reject invalid code${colors.reset}`);
  }
}

/**
 * Test full signup flow
 */
async function testFullSignupFlow() {
  console.log(`\n${colors.magenta}Testing Full Signup Flow${colors.reset}`);
  
  const testPhone = TEST_PHONE_NUMBERS[1]; // Use a different test number
  const userData = {
    name: 'Alex Johnson',
    favorite_drink: 'Margarita',
    bio: 'Test user created via phone signup flow'
  };
  
  // Step 1: Initiate signup
  const initiateSuccess = await initiatePhoneSignup(testPhone.phoneNumber, testPhone.countryCode);
  
  if (initiateSuccess) {
    // Step 2: Complete signup with valid code and user data
    console.log(`\n${colors.cyan}Test: Complete signup with user data${colors.reset}`);
    const { success, data } = await completePhoneSignup(
      testPhone.phoneNumber, 
      testPhone.countryCode, 
      TEST_VERIFICATION_CODE,
      userData
    );
    
    if (success) {
      console.log(`${colors.green}✓ Full signup flow completed successfully${colors.reset}`);
      console.log(`  User ID: ${data.user.id}`);
      console.log(`  Session: ${data.session ? 'Created' : 'Not created'}`);
      
      // Verify the session works by making an authenticated request
      if (data.session) {
        try {
          console.log(`\n${colors.cyan}Test: Authenticated request with new session${colors.reset}`);
          const authResponse = await fetch(`${API_BASE_URL}/api/auth/status`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          });
          
          const authData = await authResponse.json();
          
          if (authResponse.ok && authData.authenticated) {
            console.log(`${colors.green}✓ Authentication successful with new session${colors.reset}`);
          } else {
            console.log(`${colors.red}✗ Authentication failed with new session${colors.reset}`);
          }
        } catch (error) {
          console.log(`${colors.red}✗ Exception testing authentication: ${error.message}${colors.reset}`);
        }
      }
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${colors.magenta}=== PHONE SIGNUP TEST ===\n${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  // Test basic flow
  const testPhone = TEST_PHONE_NUMBERS[0];
  console.log(`\n${colors.yellow}Testing basic flow with: ${testPhone.countryCode}${testPhone.phoneNumber} (${testPhone.description})${colors.reset}`);
  
  // Initiate signup
  const initiateSuccess = await initiatePhoneSignup(testPhone.phoneNumber, testPhone.countryCode);
  
  // Complete signup if initiation was successful
  if (initiateSuccess) {
    await completePhoneSignup(testPhone.phoneNumber, testPhone.countryCode, TEST_VERIFICATION_CODE);
  }
  
  // Test edge cases
  await testMissingParameters();
  await testInvalidCode();
  await testFullSignupFlow();
  
  console.log(`\n${colors.magenta}=== TEST COMPLETED ===\n${colors.reset}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});
