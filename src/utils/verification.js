/**
 * Phone verification utility
 * Handles generating, storing, and verifying OTP codes
 */

import { sendOTP } from './twilio.js';

// In-memory store for verification codes (in production, use Redis or similar)
// Format: { [phoneNumber]: { code, expiresAt, attempts } }
const verificationStore = new Map();

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

// Test phone numbers that bypass actual SMS sending
const TEST_PHONE_NUMBERS = [
  '+15551234567', // Alex Johnson
  '+15551234568', // Sarah Chen
  '+15551234569', // Mike Rodriguez
  '+15555555555'  // Original demo number
];

/**
 * Generate a random numeric OTP code
 * @param {number} length - Length of the OTP code
 * @returns {string} - The generated OTP code
 */
function generateOTP(length = OTP_LENGTH) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Format phone number to E.164 format
 * @param {string} phoneNumber - Raw phone number
 * @param {string} countryCode - Country code (with or without +)
 * @returns {string} - E.164 formatted phone number
 */
export function formatPhoneNumber(phoneNumber, countryCode) {
  // If the phone number already includes a country code (starts with +), return it as is
  if (phoneNumber && phoneNumber.startsWith('+')) {
    console.log(`[DEBUG] Phone already in E.164 format: ${phoneNumber}`);
    return phoneNumber;
  }
  
  // Remove all non-digit characters from the phone number
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  
  // Ensure country code starts with + and has no other non-digit characters
  let cleanCountryCode = countryCode.replace(/\D/g, '');
  if (!cleanCountryCode.startsWith('+')) {
    cleanCountryCode = `+${cleanCountryCode}`;
  }
  
  // Format in E.164 format: +[country code][number] with no spaces or other characters
  return `${cleanCountryCode}${cleanPhoneNumber}`;
}

/**
 * Send verification code to phone number
 * @param {string} phoneNumber - Raw phone number
 * @param {string} countryCode - Country code
 * @returns {Promise<{success: boolean, status: string, message?: string, error?: string}>}
 */
export async function sendVerificationCode(phoneNumber, countryCode) {
  try {
    if (!phoneNumber || !countryCode) {
      return { 
        success: false, 
        status: 'failed',
        error: 'Phone number and country code are required' 
      };
    }
    
    // Format phone number to E.164
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);
    
    // DEBUG: Log the phone number formats
    console.log(`[DEBUG] Raw phoneNumber: '${phoneNumber}'`);
    console.log(`[DEBUG] Raw countryCode: '${countryCode}'`);
    console.log(`[DEBUG] Formatted phone: '${formattedPhoneNumber}'`);
    
    // Generate OTP code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Store verification code
    verificationStore.set(formattedPhoneNumber, {
      code,
      expiresAt,
      attempts: 0
    });
    
    // Check if this is a test/demo account
    const isTestAccount = TEST_PHONE_NUMBERS.includes(formattedPhoneNumber) || 
                         phoneNumber === '5555555555' || 
                         phoneNumber === '555-555-5555';
    
    if (isTestAccount) {
      console.log(`[TEST ACCOUNT] Bypassing SMS for test account: ${formattedPhoneNumber}`);
      console.log(`[TEST ACCOUNT] Test verification code: 123456`);
      
      // For test accounts, always use 123456 as the code
      verificationStore.set(formattedPhoneNumber, {
        code: '123456',
        expiresAt,
        attempts: 0
      });
      
      return {
        success: true,
        status: 'pending',
        message: 'Test account: SMS bypassed. Use code 123456 to verify.'
      };
    }
    
    // Send OTP via Twilio
    console.log(`[TWILIO] Attempting to send OTP to ${formattedPhoneNumber}`);
    
    await sendOTP({
      otp: code,
      to: formattedPhoneNumber
    });
    
    console.log(`[TWILIO] OTP successfully sent to ${formattedPhoneNumber}`);
    
    return {
      success: true,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error sending verification code:', error);
    
    return {
      success: false,
      status: 'failed',
      error: error.message || 'Failed to send verification code'
    };
  }
}

/**
 * Verify OTP code for phone number
 * @param {string} phoneNumber - Raw phone number
 * @param {string} countryCode - Country code
 * @param {string} code - OTP code to verify
 * @returns {Promise<{success: boolean, status: string, user?: object, error?: string}>}
 */
export async function verifyCode(phoneNumber, countryCode, code) {
  try {
    if (!phoneNumber || !countryCode || !code) {
      return { 
        success: false, 
        status: 'failed',
        error: 'Phone number, country code, and verification code are required' 
      };
    }
    
    // Format phone number to E.164
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);
    
    // DEBUG: Log the phone number formats
    console.log(`[DEBUG] Raw phoneNumber: '${phoneNumber}'`);
    console.log(`[DEBUG] Raw countryCode: '${countryCode}'`);
    console.log(`[DEBUG] Formatted phone: '${formattedPhoneNumber}'`);
    
    // Check if this is a test/demo account
    const isTestAccount = TEST_PHONE_NUMBERS.includes(formattedPhoneNumber) || 
                         phoneNumber === '5555555555' || 
                         phoneNumber === '555-555-5555';
    
    // For test accounts, only accept code 123456
    if (isTestAccount) {
      console.log(`[TEST ACCOUNT] Verifying code for test account: ${formattedPhoneNumber}`);
      
      if (code !== '123456') {
        console.log(`[TEST ACCOUNT] Invalid code: ${code}, expected 123456`);
        return { 
          success: false, 
          status: 'failed',
          error: 'Invalid verification code. Use 123456 for test accounts.'
        };
      }
      
      // Create test user data
      const userData = {
        id: formattedPhoneNumber.replace(/\D/g, ''), // Use digits as fallback ID
        phone: formattedPhoneNumber,
        created_at: new Date().toISOString()
      };
      
      console.log(`[TEST ACCOUNT] Verification successful for ${formattedPhoneNumber}`);
      
      return {
        success: true,
        status: 'approved',
        user: userData
      };
    }
    
    // Get stored verification data
    const verification = verificationStore.get(formattedPhoneNumber);
    
    // Check if verification exists
    if (!verification) {
      return {
        success: false,
        status: 'failed',
        error: 'No verification code found. Please request a new code.'
      };
    }
    
    // Check if code has expired
    if (verification.expiresAt < new Date()) {
      verificationStore.delete(formattedPhoneNumber);
      return {
        success: false,
        status: 'failed',
        error: 'Verification code has expired. Please request a new code.'
      };
    }
    
    // Increment attempts
    verification.attempts += 1;
    
    // Check if max attempts reached
    if (verification.attempts > MAX_ATTEMPTS) {
      verificationStore.delete(formattedPhoneNumber);
      return {
        success: false,
        status: 'failed',
        error: 'Too many failed attempts. Please request a new code.'
      };
    }
    
    // Check if code matches
    if (verification.code !== code) {
      return {
        success: false,
        status: 'failed',
        error: 'Invalid verification code.'
      };
    }
    
    // Code is valid, remove from store
    verificationStore.delete(formattedPhoneNumber);
    
    // Create user data
    const userData = {
      id: formattedPhoneNumber.replace(/\D/g, ''), // Use digits as fallback ID
      phone: formattedPhoneNumber,
      created_at: new Date().toISOString()
    };
    
    console.log(`Verification successful for ${formattedPhoneNumber}`);
    
    return {
      success: true,
      status: 'approved',
      user: userData
    };
  } catch (error) {
    console.error('Error checking verification code:', error);
    
    return {
      success: false,
      status: 'failed',
      error: error.message || 'Failed to verify code'
    };
  }
}
