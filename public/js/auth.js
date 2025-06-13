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
