import { supabaseClientPromise } from './supabase-client.js';

// Sign in with phone (OTP)
export async function signInWithPhone(phone) {
  const supabase = await supabaseClientPromise;
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return data;
}

// Verify OTP for phone login
export async function verifyPhoneOtp(phone, token) {
  const supabase = await supabaseClientPromise;
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return data;
}

// Save complete profile data to Supabase after phone verification
export async function saveCompleteProfileToSupabase() {
  const supabase = await supabaseClientPromise;
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error getting authenticated user:', userError);
    return { success: false, error: userError };
  }
  
  // Get stored profile data from localStorage
  const PROFILE_STORAGE_KEY = 'userProfile';
  const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
  
  if (!storedProfile) {
    console.log('No profile data found in localStorage');
    return { success: false, error: 'No profile data found' };
  }
  
  try {
    // Parse the stored profile data
    const profileData = JSON.parse(storedProfile);
    
    // Add user ID and timestamps
    const completeProfile = {
      ...profileData,
      id: user.id,
      phone_number: user.phone,
      phone_verified: true,
      updated_at: new Date().toISOString(),
      created_at: profileData.created_at || new Date().toISOString()
    };
    
    console.log('Saving complete profile to Supabase:', completeProfile);
    
    // Save to Supabase profiles table
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(completeProfile);
      
    if (upsertError) {
      console.error('Error saving profile to Supabase:', upsertError);
      return { success: false, error: upsertError };
    }
    
    console.log('Profile successfully saved to Supabase');
    return { success: true };
  } catch (err) {
    console.error('Error processing profile data:', err);
    return { success: false, error: err };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  const supabase = await supabaseClientPromise;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth-callback' } });
  if (error) throw error;
  window.location.href = data.url;
}

// Get current user
export async function getCurrentUser() {
  const supabase = await supabaseClientPromise;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Logout
export async function logout() {
  const supabase = await supabaseClientPromise;
  await supabase.auth.signOut();
  window.location.href = '/auth';
}
