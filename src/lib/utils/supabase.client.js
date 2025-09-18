import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Lazy initialization to avoid SSR issues
let _supabase = null;

/**
 * Get or create the client-side Supabase client
 * Uses lazy initialization to avoid SSR issues
 */
function getSupabaseClient() {
  if (!_supabase) {
    if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables. Please check your .env file.');
    }
    
    _supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return _supabase;
}

/**
 * Client-side Supabase client for browser operations
 * Uses the anon key for client-side operations
 */
export const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabaseClient()[prop];
  }
});

/**
 * Auth helper functions for client-side use
 */
export const auth = {
  /**
   * Sign in with phone number
   * @param {string} phone 
   * @returns {Promise<any>}
   */
  async signInWithPhone(phone) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms'
      }
    });
    
    return { data, error };
  },

  /**
   * Verify OTP
   * @param {string} phone 
   * @param {string} token 
   * @returns {Promise<any>}
   */
  async verifyOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    return { data, error };
  },

  /**
   * Sign out
   * @returns {Promise<any>}
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   * @returns {Promise<any>}
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
};