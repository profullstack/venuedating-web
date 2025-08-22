/**
 * Direct Twilio Authentication Client
 * Handles phone authentication using direct Twilio integration
 */

/**
 * Send OTP via direct Twilio
 * @param {string} phone - Phone number in E.164 format
 * @param {boolean} isSignup - Whether this is a signup OTP (default: false)
 * @returns {Promise<Object>} Result of OTP send operation
 */
export async function sendDirectTwilioOtp(phone, isSignup = false) {
  console.log(`[DIRECT TWILIO CLIENT] Sending ${isSignup ? 'signup' : 'login'} OTP to:`, phone);
  
  try {
    const response = await fetch('/api/auth/twilio/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, isSignup })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    
    console.log('[DIRECT TWILIO CLIENT] OTP sent successfully:', data);
    return data;
    
  } catch (error) {
    console.error('[DIRECT TWILIO CLIENT] Error sending OTP:', error);
    throw error;
  }
}

/**
 * Verify OTP via direct Twilio
 * @param {string} phone - Phone number in E.164 format
 * @param {string} otp - OTP code
 * @param {boolean} isSignup - Whether this is a signup OTP (default: false)
 * @returns {Promise<Object>} Verification result with user and session data
 */
export async function verifyDirectTwilioOtp(phone, otp, isSignup = false) {
  console.log(`[DIRECT TWILIO CLIENT] Verifying ${isSignup ? 'signup' : 'login'} OTP for:`, phone);
  
  try {
    const response = await fetch('/api/auth/twilio/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp, isSignup })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'OTP verification failed');
    }
    
    console.log('[DIRECT TWILIO CLIENT] OTP verified successfully:', data);
    
    // Store session token in localStorage
    if (data.session && data.session.token) {
      localStorage.setItem('barcrush_session_token', data.session.token);
      localStorage.setItem('barcrush_session_expires', data.session.expiresAt.toString());
    }
    
    return data;
    
  } catch (error) {
    console.error('[DIRECT TWILIO CLIENT] Error verifying OTP:', error);
    throw error;
  }
}

/**
 * Validate current session
 * @returns {Promise<Object>} Session validation result
 */
export async function validateDirectTwilioSession() {
  try {
    const token = localStorage.getItem('barcrush_session_token');
    const expiresAt = localStorage.getItem('barcrush_session_expires');
    
    if (!token || !expiresAt) {
      return { valid: false, error: 'No session found' };
    }
    
    // Check if token is expired locally first
    if (Date.now() > parseInt(expiresAt)) {
      localStorage.removeItem('barcrush_session_token');
      localStorage.removeItem('barcrush_session_expires');
      return { valid: false, error: 'Session expired' };
    }
    
    console.log('[DIRECT TWILIO CLIENT] Validating session token');
    
    const response = await fetch('/api/auth/twilio/validate-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.valid) {
      // Clear invalid session
      localStorage.removeItem('barcrush_session_token');
      localStorage.removeItem('barcrush_session_expires');
      return { valid: false, error: data.error || 'Invalid session' };
    }
    
    console.log('[DIRECT TWILIO CLIENT] Session validated successfully:', data);
    return data;
    
  } catch (error) {
    console.error('[DIRECT TWILIO CLIENT] Error validating session:', error);
    // Clear session on error
    localStorage.removeItem('barcrush_session_token');
    localStorage.removeItem('barcrush_session_expires');
    return { valid: false, error: error.message };
  }
}

/**
 * Get current user from session
 * @returns {Promise<Object|null>} Current user or null
 */
export async function getCurrentDirectTwilioUser() {
  try {
    const sessionResult = await validateDirectTwilioSession();
    
    if (sessionResult.valid && sessionResult.user) {
      return sessionResult.user;
    }
    
    return null;
    
  } catch (error) {
    console.error('[DIRECT TWILIO CLIENT] Error getting current user:', error);
    return null;
  }
}

/**
 * Sign out user
 */
export function signOutDirectTwilio() {
  console.log('[DIRECT TWILIO CLIENT] Signing out user');
  localStorage.removeItem('barcrush_session_token');
  localStorage.removeItem('barcrush_session_expires');
  
  // Clear any other auth-related data
  localStorage.removeItem('demo_account');
  localStorage.removeItem('demo_user');
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
