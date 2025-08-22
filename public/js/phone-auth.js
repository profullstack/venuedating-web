/**
 * Unified phone authentication module for BarCrush
 * Handles both login and signup flows with OTP verification
 */

import { supabaseClientPromise, signInWithPhone, verifyPhoneOtp } from './supabase-client.js';
import { sendDirectTwilioOtp, verifyDirectTwilioOtp, getCurrentDirectTwilioUser } from './direct-twilio-auth.js';
import authMiddleware from './auth-middleware.js';

/**
 * Send OTP to phone number
 * @param {string} phone - Phone number in E.164 format
 * @param {string} countryCode - Country code (default: +1)
 * @param {boolean} isSignup - Whether this is a signup flow (default: false)
 * @returns {Promise<Object>} Result of OTP send operation
 */
export async function sendPhoneOtp(phone, countryCode, isSignup = false) {
  console.log(`[PHONE AUTH] Sending ${isSignup ? 'signup' : 'login'} OTP to:`, phone, 'with country code:', countryCode);
  
  const fullPhone = formatPhoneNumber(phone, countryCode);
  
  if (!validatePhoneNumber(fullPhone)) {
    throw new Error('Invalid phone number format');
  }
  
  console.log('[PHONE AUTH] Formatted phone:', fullPhone, '- Using Direct Twilio');
  
  try {
    const result = await sendDirectTwilioOtp(fullPhone, isSignup);
    console.log(`[PHONE AUTH] ${isSignup ? 'Signup' : 'Login'} OTP sent successfully via Direct Twilio`);
    return result;
  } catch (error) {
    console.error('[PHONE AUTH] Error sending OTP:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Invalid phone number')) {
      throw new Error('Please enter a valid phone number with country code (e.g., +1234567890)');
    } else if (error.message?.includes('rate limit')) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else {
      throw new Error(error.message || 'Failed to send verification code. Please try again.');
    }
  }
}

/**
 * Verify OTP code
 * @param {string} phone - Phone number in E.164 format
 * @param {string} code - OTP verification code
 * @returns {Promise<Object>} Verification result with session data
 */
export async function verifyOtp(phone, code, isSignup = false) {
  try {
    console.log(`[PHONE AUTH] Verifying ${isSignup ? 'signup' : 'login'} OTP for:`, phone, '- Using Direct Twilio');
    
    // Use direct Twilio integration instead of Supabase
    const result = await verifyDirectTwilioOtp(phone, code, isSignup);
    
    console.log('[PHONE AUTH] Direct Twilio verification result:', result);
    
    if (result.success && result.user) {
      return result;
    } else {
      throw new Error(result.error || 'Verification failed');
    }
  } catch (error) {
    console.error('[PHONE AUTH] Error verifying OTP:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Invalid verification code')) {
      throw new Error('Invalid verification code. Please check and try again.');
    } else if (error.message?.includes('expired')) {
      throw new Error('Verification code has expired. Please request a new code.');
    } else if (error.message?.includes('attempts')) {
      throw new Error('Too many failed attempts. Please request a new verification code.');
    } else {
      throw new Error(error.message || 'Verification failed. Please try again.');
    }
  }
}

/**
 * Handle post-authentication redirect
 * @returns {string} Redirect URL
 */
export function handlePostLoginRedirect() {
  // Check for stored redirect URL
  const redirectUrl = localStorage.getItem('barcrush_redirect_after_login');
  if (redirectUrl) {
    localStorage.removeItem('barcrush_redirect_after_login');
    console.log('Redirecting to stored URL:', redirectUrl);
    return redirectUrl;
  }
  return '/discover';
}

/**
 * Get post-authentication redirect URL (alias for handlePostLoginRedirect)
 * @returns {string} Redirect URL
 */
export function getPostAuthRedirect() {
  return handlePostLoginRedirect();
}

/**
 * Format phone number to E.164 format
 * @param {string} phone - Raw phone number
 * @param {string} countryCode - Country code (default: +1)
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone, countryCode = '+1') {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If it already starts with country code, return as is
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }
  
  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  // Otherwise, add the provided country code
  return countryCode + cleaned;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function validatePhoneNumber(phone) {
  // Basic E.164 validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}
