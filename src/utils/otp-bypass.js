// OTP Bypass Utility for Test Accounts
// This utility helps check if a phone number should bypass SMS OTP verification

import { createClient } from '@supabase/supabase-js';

/**
 * Check if a phone number belongs to a test account that should bypass OTP
 * @param {string} phoneNumber - The phone number to check (e.g., "+15551234567")
 * @returns {Promise<boolean>} - True if OTP should be bypassed
 */
export async function shouldBypassOTP(phoneNumber) {
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    );

    // Check if user exists with this phone number and has bypass_otp flag
    const { data: user } = await supabase.auth.admin.listUsers();
    const phoneUser = user?.users?.find(u => u.phone === phoneNumber);
    
    if (!phoneUser) {
      return false;
    }

    // Check profile for bypass_otp flag
    const { data: profile } = await supabase
      .from('profiles')
      .select('bypass_otp')
      .eq('id', phoneUser.id)
      .single();

    return profile?.bypass_otp === true;
  } catch (error) {
    console.error('Error checking OTP bypass:', error);
    return false;
  }
}

/**
 * Test phone numbers that should bypass OTP (for reference)
 */
export const TEST_PHONE_NUMBERS = [
  '+15551234567', // Alex Johnson
  '+15551234568', // Sarah Chen  
  '+15551234569'  // Mike Rodriguez
];

/**
 * Check if phone number is a known test number
 * @param {string} phoneNumber - The phone number to check
 * @returns {boolean} - True if it's a test number
 */
export function isTestPhoneNumber(phoneNumber) {
  return TEST_PHONE_NUMBERS.includes(phoneNumber);
}

/**
 * Get the bypass OTP code for test accounts
 * @returns {string} - The universal bypass code
 */
export function getBypassOTPCode() {
  return '123456'; // This matches your existing dev mode code
}
