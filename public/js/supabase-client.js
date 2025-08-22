// Supabase client initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { initSessionRecovery } from './session-recovery.js';
import { getCurrentDirectTwilioUser } from './direct-twilio-auth.js';

// Initialize session recovery before creating client
initSessionRecovery();

// Dynamically fetch config from backend
export const supabaseClientPromise = fetch('/api/1/config/supabase')
  .then(async (res) => {
    if (!res.ok) throw new Error('Failed to load Supabase config');
    const { supabaseUrl, supabaseAnonKey } = await res.json();
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase config missing');
    
    console.log('Supabase client initialized with dynamic config');
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce'
      }
    });
  });

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} The current user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    // Try direct Twilio auth first
    const directTwilioUser = await getCurrentDirectTwilioUser();
    if (directTwilioUser) {
      console.log('[SUPABASE CLIENT] Using Direct Twilio user:', directTwilioUser);
      return directTwilioUser;
    }
    
    // Fallback to Supabase auth
    const supabase = await supabaseClientPromise;
    
    // First try to get session to check if we have a valid token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('Session error:', sessionError);
      // Clear invalid session data
      await supabase.auth.signOut();
      return null;
    }
    
    if (!session) {
      console.log('No active session found');
      return null;
    }
    
    // If we have a session, get the user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('User fetch error:', error);
      // Clear invalid session on user fetch error
      await supabase.auth.signOut();
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    // Clear any corrupted session data
    try {
      const supabase = await supabaseClientPromise;
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Error clearing session:', signOutError);
    }
    return null;
  }
}

/**
 * Get current session
 * @returns {Promise<Object>} The current session or null
 */
export async function getCurrentSession() {
  try {
    const supabase = await supabaseClientPromise;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Sign in with phone number using OTP
 * @param {string} phone - User's phone number
 * @returns {Promise<Object>} The result data
 */
export async function signInWithPhone(phone) {
  try {
    console.log('[SUPABASE CLIENT] Sending OTP to phone:', phone);
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
        data: {
          phone_number: phone
        }
      }
    });
    
    if (error) {
      console.error('[SUPABASE CLIENT] OTP send error:', error);
      throw error;
    }
    
    console.log('[SUPABASE CLIENT] OTP sent successfully:', data);
    return data;
  } catch (error) {
    console.error('[SUPABASE CLIENT] Error signing in with phone:', error);
    throw error;
  }
}

/**
 * Verify phone OTP
 * @param {string} phone - User's phone number
 * @param {string} token - OTP token
 * @returns {Promise<Object>} The session data
 */
export async function verifyPhoneOtp(phone, token) {
  try {
    console.log('[SUPABASE CLIENT] Verifying OTP for phone:', phone, 'token:', token);
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    if (error) {
      console.error('[SUPABASE CLIENT] OTP verification error:', error);
      throw error;
    }
    
    console.log('[SUPABASE CLIENT] OTP verified successfully:', data);
    return data;
  } catch (error) {
    console.error('[SUPABASE CLIENT] Error verifying phone OTP:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    const supabase = await supabaseClientPromise;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Update user's location in the database
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUserLocation(lat, lng) {
  try {
    const supabase = await supabaseClientPromise;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        location_lat: lat,
        location_lng: lng,
        location_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user location:', error);
    return null;
  }
}

// Export default supabase client promise for backward compatibility
export default supabaseClientPromise;
