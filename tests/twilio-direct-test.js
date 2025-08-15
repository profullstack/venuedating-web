/**
 * Twilio Direct Integration Test Script
 * 
 * This script tests the direct Twilio integration for phone verification by:
 * 1. Sending a verification code to a test phone number
 * 2. Verifying the code (using the test bypass code)
 * 3. Testing error cases and edge cases
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8097';
const TEST_PHONE_NUMBERS = [
  { phoneNumber: '9042401681', countryCode: '+234', description: 'Original demo number' },
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
 * Send a verification code to a phone number
 */
async function sendVerificationCode(phoneNumber, countryCode) {
  console.log(`${colors.blue}Sending verification code to ${countryCode}${phoneNumber}...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify/send-code`, {
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
      console.log(`${colors.green}✓ Successfully sent verification code${colors.reset}`);
      console.log(`  Status: ${data.status}`);
      if (data.message) console.log(`  Message: ${data.message}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to send verification code${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Exception sending verification code: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Verify a code for a phone number
 */
async function verifyCode(phoneNumber, countryCode, code) {
  console.log(`${colors.blue}Verifying code ${code} for ${countryCode}${phoneNumber}...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify/check-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        countryCode,
        code
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Successfully verified code${colors.reset}`);
      console.log(`  Status: ${data.status}`);
      if (data.user) console.log(`  User ID: ${data.user.id}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to verify code${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Exception verifying code: ${error.message}${colors.reset}`);
    return false;
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
    const response = await fetch(`${API_BASE_URL}/api/verify/send-code`, {
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
    const response = await fetch(`${API_BASE_URL}/api/verify/send-code`, {
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
    const response = await fetch(`${API_BASE_URL}/api/verify/check-code`, {
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
 * Test phone number formatting
 */
async function testPhoneNumberFormatting() {
  console.log(`\n${colors.magenta}Testing Phone Number Formatting${colors.reset}`);
  
  const testCases = [
    { phoneNumber: '(555) 555-5555', countryCode: '+1', description: 'Formatted with parentheses and dashes' },
    { phoneNumber: '555.555.5555', countryCode: '+1', description: 'Formatted with periods' },
    { phoneNumber: '555 555 5555', countryCode: '+1', description: 'Formatted with spaces' },
    { phoneNumber: '5555555555', countryCode: '1', description: 'Country code without plus' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${colors.cyan}Test: ${testCase.description}${colors.reset}`);
    const sendSuccess = await sendVerificationCode(testCase.phoneNumber, testCase.countryCode);
    
    if (sendSuccess) {
      await verifyCode(testCase.phoneNumber, testCase.countryCode, TEST_VERIFICATION_CODE);
    }
  }
}

/**
 * Test invalid verification code
 */
async function testInvalidCode() {
  console.log(`\n${colors.magenta}Testing Invalid Verification Code${colors.reset}`);
  
  const testPhone = TEST_PHONE_NUMBERS[0];
  
  // First send a verification code
  const sendSuccess = await sendVerificationCode(testPhone.phoneNumber, testPhone.countryCode);
  
  if (sendSuccess) {
    // Try to verify with an invalid code
    console.log(`\n${colors.cyan}Test: Invalid verification code${colors.reset}`);
    const verifySuccess = await verifyCode(testPhone.phoneNumber, testPhone.countryCode, INVALID_CODE);
    
    console.log(verifySuccess === false
      ? `${colors.green}✓ Correctly rejected invalid code${colors.reset}`
      : `${colors.red}✗ Failed to reject invalid code${colors.reset}`);
  }
}

/**
 * Test code expiration
 */
async function testCodeExpiration() {
  console.log(`\n${colors.magenta}Testing Code Expiration${colors.reset}`);
  console.log(`${colors.yellow}Note: This test is simulated since we can't wait for actual expiration${colors.reset}`);
  
  const testPhone = TEST_PHONE_NUMBERS[0];
  
  // First send a verification code
  const sendSuccess = await sendVerificationCode(testPhone.phoneNumber, testPhone.countryCode);
  
  if (sendSuccess) {
    // Send another verification code to simulate expiration of the first one
    await sendVerificationCode(testPhone.phoneNumber, testPhone.countryCode);
    
    // Try to verify with the first code (which should be "expired" since we sent a new one)
    console.log(`\n${colors.cyan}Test: Expired verification code${colors.reset}`);
    console.log(`${colors.yellow}Note: This test may pass or fail depending on implementation${colors.reset}`);
    await verifyCode(testPhone.phoneNumber, testPhone.countryCode, TEST_VERIFICATION_CODE);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${colors.magenta}=== TWILIO DIRECT INTEGRATION TEST ===\n${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  // Test each test phone number
  for (const testPhone of TEST_PHONE_NUMBERS) {
    console.log(`\n${colors.yellow}Testing phone number: ${testPhone.countryCode}${testPhone.phoneNumber} (${testPhone.description})${colors.reset}`);
    
    // Send verification code
    const sendSuccess = await sendVerificationCode(testPhone.phoneNumber, testPhone.countryCode);
    
    // Verify code if sending was successful
    if (sendSuccess) {
      await verifyCode(testPhone.phoneNumber, testPhone.countryCode, TEST_VERIFICATION_CODE);
    }
  }
  
  // Test edge cases
  await testMissingParameters();
  await testPhoneNumberFormatting();
  await testInvalidCode();
  await testCodeExpiration();
  
  console.log(`\n${colors.magenta}=== TEST COMPLETED ===\n${colors.reset}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});
