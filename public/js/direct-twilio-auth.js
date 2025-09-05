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
    
    // Handle authentication response
    if (data.user) {
      // Store user data in local storage (primary authentication method)
      console.log('[DIRECT TWILIO CLIENT] Storing user data in local storage');
      localStorage.setItem('barcrush_user', JSON.stringify(data.user));
      
      // Still store JWT session as backup, but not required for auth
      if (data.session && data.session.token) {
        console.log('[DIRECT TWILIO CLIENT] Storing JWT session as backup');
        localStorage.setItem('barcrush_session_token', data.session.token);
        localStorage.setItem('barcrush_session_expires', data.session.expiresAt.toString());
      }
      
      // If Supabase session is also available, set it as backup
      if (data.supabaseSession) {
        console.log('[DIRECT TWILIO CLIENT] Setting Supabase session as backup');
        
        try {
          // Use the existing Supabase client from supabase-client.js
          const { supabaseClientPromise } = await import('./supabase-client.js');
          const supabase = await supabaseClientPromise;
          
          // Set the session in existing Supabase client
          await supabase.auth.setSession({
            access_token: data.supabaseSession.access_token,
            refresh_token: data.supabaseSession.refresh_token
          });
          
          console.log('[DIRECT TWILIO CLIENT] Backup Supabase session set successfully');
        } catch (error) {
          console.error('[DIRECT TWILIO CLIENT] Error setting backup Supabase session:', error);
          // Non-critical error, continue with JWT
        }
      }
    } else {
      // No JWT session found - this should not happen with updated backend
      console.error('[DIRECT TWILIO CLIENT] No JWT session in response:', data);
      throw new Error('Authentication response missing session data');
    }
    
    return data;
    
  } catch (error) {
    console.error('[DIRECT TWILIO CLIENT] Error verifying OTP:', error);
    throw error;
  }
}

/**
 * Refresh user info from Supabase and update localStorage
 */
async function refreshUserInfo(currentUser) {
  try {
    console.log('[DIRECT TWILIO CLIENT] Refreshing user info from Supabase...');
    
    if (!currentUser.id || !currentUser.phone) {
      console.log('[DIRECT TWILIO CLIENT] Invalid user data, skipping refresh');
      return;
    }
    
    // Import Supabase client
    const { default: supabaseClientPromise } = await import('./supabase-client.js');
    const supabase = await supabaseClientPromise;
    
    // Get current session user from Supabase auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    // If no current session or user ID doesn't match, fetch from profiles table directly
    let updatedUser;
    if (authError || !authUser || authUser.id !== currentUser.id) {
      console.log('[DIRECT TWILIO CLIENT] No matching auth session, fetching from profiles table');
      
      // First, let's check if the user exists without .single() to see all matching rows
      const { data: allProfileData, error: allProfileError } = await supabase
        .from('profiles')
        .select('id, phone, has_paid, created_at')
        .eq('id', currentUser.id);

      console.log('[DIRECT TWILIO CLIENT] Profile query for user ID:', currentUser.id);
      console.log('[DIRECT TWILIO CLIENT] All profile data:', allProfileData);
      console.log('[DIRECT TWILIO CLIENT] All profile error:', allProfileError);

      // Now try the single query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, phone, has_paid, created_at')
        .eq('id', currentUser.id)
        .single();

      console.log('[DIRECT TWILIO CLIENT] Single profile data:', profileData);
      console.log('[DIRECT TWILIO CLIENT] Single profile error:', profileError);
      
      if (profileError && profileError.code === 'PGRST116') {
        // User doesn't exist in profiles table, use localStorage data
        console.log('[DIRECT TWILIO CLIENT] User not found in profiles table, using localStorage data');
        updatedUser = {
          id: currentUser.id,
          phone: currentUser.phone,
          email: currentUser.email,
          name: currentUser.name,
          has_paid: false, // Default to false if not in profiles
          created_at: currentUser.created_at || new Date().toISOString()
        };
      } else if (profileError || !profileData) {
        console.error('[DIRECT TWILIO CLIENT] Error fetching user from profiles:', profileError);
        return;
      } else {
        updatedUser = {
          id: profileData.id,
          phone: profileData.phone || currentUser.phone,
          email: currentUser.email,
          name: currentUser.name,
          has_paid: profileData.has_paid || false,
          created_at: profileData.created_at
        };
      }
    } else {
      // User has active session, combine auth data with profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', currentUser.id)
        .single();
      
      // Handle case where user doesn't exist in profiles table
      let hasPaid = false;
      if (profileError && profileError.code === 'PGRST116') {
        console.log('[DIRECT TWILIO CLIENT] User not found in profiles table for auth session');
        hasPaid = false;
      } else if (profileData) {
        hasPaid = profileData.has_paid || false;
      }
      
      updatedUser = {
        id: authUser.id,
        phone: authUser.phone || currentUser.phone,
        email: authUser.email,
        name: authUser.user_metadata?.name || currentUser.name,
        has_paid: hasPaid,
        created_at: authUser.created_at
      };
    }
    
    // Update localStorage with fresh data from Supabase
    const refreshedUserData = {
      id: updatedUser.id,
      phone: updatedUser.phone,
      name: updatedUser.name,
      email: updatedUser.email,
      has_paid: updatedUser.has_paid,
      created_at: updatedUser.created_at
    };
    
    localStorage.setItem('barcrush_user', JSON.stringify(refreshedUserData));
    console.log('[DIRECT TWILIO CLIENT] User info refreshed successfully:', refreshedUserData);
  } catch (error) {
    console.error('[DIRECT TWILIO CLIENT] Error refreshing user info:', error);
    // Don't throw error - just log it and continue with existing localStorage data
  }
}

/**
 * Validate current session
 * @returns {Promise<Object>} Session validation result
 */
export async function validateDirectTwilioSession() {
  try {
    // First check for user data in local storage (primary authentication method)
    const userData = localStorage.getItem('barcrush_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.id) {
          console.log('[DIRECT TWILIO CLIENT] Valid user data found in local storage');
          
          // Refresh user info from Supabase
          await refreshUserInfo(user);
          
          return { valid: true, user };
        }
      } catch (e) {
        console.error('[DIRECT TWILIO CLIENT] Error parsing user data:', e);
        localStorage.removeItem('barcrush_user');
      }
    }
    
    // Fallback to JWT token validation
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
export async function signOutDirectTwilio() {
  console.log('[DIRECT TWILIO CLIENT] Signing out user');
  
  // Clear all auth-related data
  localStorage.removeItem('barcrush_session_token');
  localStorage.removeItem('barcrush_session_expires');
  localStorage.removeItem('barcrush_user');
  
  // Clear any other auth-related data
  localStorage.removeItem('demo_account');
  localStorage.removeItem('demo_user');
  
  // Use auth middleware's clearAuthSession if available
  try {
    const authMiddleware = window.authMiddleware || (await import('./auth-middleware.js')).default;
    if (authMiddleware && typeof authMiddleware.clearAuthSession === 'function') {
      authMiddleware.clearAuthSession();
    }
  } catch (e) {
    console.error('[DIRECT TWILIO CLIENT] Error using auth middleware clearAuthSession:', e);
  }
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
