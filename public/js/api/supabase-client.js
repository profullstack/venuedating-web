/**
 * BarCrush Supabase Client
 * 
 * A singleton client for interacting with Supabase backend
 */

// Import the Supabase client from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

// Initialize the Supabase client
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_URL || 'https://whwodcfvmdhkzwjsxfju.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indod29kY2Z2bWRoa3p3anN4Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzIwNzEsImV4cCI6MjA2MzMwODA3MX0.EMZn8yaJF0gYuiZqLmx7Hw3S3GVelYDG5xvyXV9H4T8';

console.log('Supabase client initialization with:', {
  url: supabaseUrl ? 'URL exists' : 'URL missing',
  key: supabaseAnonKey ? 'Key exists' : 'Key missing',
  actualUrl: supabaseUrl,
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Make sure they are set in .env or window object.');
}

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} The current user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} The session data or error
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} The session data or error
 */
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
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
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    
    // Update the user's profile with the new location
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
    // Return null instead of throwing to prevent UI disruption
    return null;
  }
}

// Export the supabase client
export default supabase;
