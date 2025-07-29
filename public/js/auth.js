import { supabaseClientPromise } from './supabase-client.js';
import { validatePhoneE164, checkPhoneExists } from './utils/phone-utils.js';

// Sign in with phone (OTP)
export async function signInWithPhone(phone) {
  // Validate phone number format first
  if (!validatePhoneE164(phone)) {
    throw new Error('Invalid phone number format. Please enter a valid phone number with country code.');
  }
  
  try {
    // Check if phone exists in the system and is valid
    const phoneCheckResult = await checkPhoneExists(phone);
    console.log('Phone check result:', phoneCheckResult);
    
    // Handle invalid phone numbers
    if (phoneCheckResult.valid === false) {
      throw new Error('Invalid phone number. Please enter a valid phone number.');
    }
    
    // Handle provider errors
    if (phoneCheckResult.providerError) {
      console.warn('Provider error during phone check:', phoneCheckResult.message);
      // We can still try to proceed with OTP, but log the warning
    }
    
    // Optional: Prevent OTP for non-existent numbers
    // Uncomment this block if you want to prevent OTPs for non-existent numbers
    /*
    if (!phoneCheckResult.exists) {
      throw new Error('This phone number is not registered. Please sign up first.');
    }
    */
    
    // If we get here, the phone is valid and we're allowing the OTP
    const supabase = await supabaseClientPromise;
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    
    if (error) {
      // Handle specific OTP sending errors
      if (error.message.includes('Invalid') && error.message.includes('phone') && !error.message.includes('From Number')) {
        throw new Error('Invalid phone number format. Please check and try again.');
      } else if (error.message.includes('From Number')) {
        console.error('Twilio From number configuration error:', error.message);
        throw new Error('SMS service configuration error. Please contact support.');
      } else if (error.message.includes('Twilio') || error.message.includes('provider')) {
        throw new Error('SMS provider error. Please try again later.');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in signInWithPhone:', error);
    throw error;
  }
}

// Verify OTP for phone login
export async function verifyPhoneOtp(phone, token) {
  const supabase = await supabaseClientPromise;
  
  // Special handling for demo phone number
  if (phone === '+15555555555') {
    console.log('[DEMO PHONE] Creating session for demo phone account:', phone);
    
    try {
      // For the demo account, we'll use a special endpoint that creates a session
      // without requiring a valid OTP token (this is just for the demo number)
      
      // Option 1: Use a known good OTP if Twilio verification is set up and working
      const DEMO_OTP = '123456'; // A pre-verified OTP for the demo account
      const { data, error } = await supabase.auth.verifyOtp({ 
        phone, 
        token: DEMO_OTP, 
        type: 'sms' 
      });
      
      if (!error) {
        console.log('[DEMO PHONE] Successfully created session for demo phone account');
        return data;
      }
      
      // Option 2: If that doesn't work, try sign in with email/password
      // for the same user (assuming the demo account has both phone and email)
      console.log('[DEMO PHONE] Falling back to email sign-in for demo account');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@barcrush.app',
        password: 'demo12345'
      });
      
      if (signInError) {
        // Last resort: Set the demo flag in localStorage for backwards compatibility
        console.log('[DEMO PHONE] Creating localStorage-based session for demo account');
        localStorage.setItem('demo_account', 'true');
        localStorage.setItem('demo_user', JSON.stringify({
          id: 'demo-user-id',
          name: 'Demo User',
          full_name: 'Demo User',
          avatar_url: '/images/avatar.jpg',
          phone_number: phone,
          phone_verified: true
        }));
        
        // Return a mock session structure similar to what Supabase would return
        return {
          session: {
            access_token: 'demo-token',
            user: {
              id: 'demo-user-id',
              phone: phone
            }
          },
          user: {
            id: 'demo-user-id',
            phone: phone
          }
        };
      }
      
      return signInData;
    } catch (err) {
      console.error('[DEMO PHONE] Error creating demo session:', err);
      throw new Error('Could not create demo session. Please try again.');
    }
  }
  
  // Normal verification for all other phone numbers
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
