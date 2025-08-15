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
    
    // Use our server-side bypass route instead of direct Supabase call
    // Parse phone number to get country code and number
    const countryCode = phone.startsWith('+1') ? '+1' : '+1'; // Default to +1 for now
    const phoneNumber = phone.replace(countryCode, '');
    
    const response = await fetch('/api/verify/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        isSignup: false // This is a login flow
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send verification code');
    }
    
    // Return data in expected format
    const data = { user: null };
    const error = null;
    
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
  try {
    console.log('[VERIFY OTP] Starting verification process for phone:', phone);
    
    // Use our server-side bypass route instead of direct Supabase call
    // Parse phone number to get country code and number
    let countryCode, phoneNumber;
    
    // Improved phone number parsing
    if (phone.startsWith('+')) {
      // For international numbers, extract the country code properly
      const match = phone.match(/^\+(\d+)/);
      if (match && match[1]) {
        // Get the first 1-3 digits as country code
        const ccLength = Math.min(match[1].length, 3);
        countryCode = '+' + match[1].substring(0, ccLength);
        phoneNumber = phone.substring(countryCode.length);
        console.log(`[VERIFY OTP] Parsed international number: countryCode=${countryCode}, phoneNumber=${phoneNumber}`);
      } else {
        // Fallback
        countryCode = '+1';
        phoneNumber = phone.replace(countryCode, '');
        console.log(`[VERIFY OTP] Fallback parsing: countryCode=${countryCode}, phoneNumber=${phoneNumber}`);
      }
    } else {
      // For numbers without +, assume US/Canada
      countryCode = '+1';
      phoneNumber = phone;
      console.log(`[VERIFY OTP] Assumed US number: countryCode=${countryCode}, phoneNumber=${phoneNumber}`);
    }
    
    console.log(`[VERIFY OTP] Sending verification request with code: ${token.substring(0, 2)}****`);
    
    const response = await fetch('/api/verify/check-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        code: token
      })
    });
    
    const result = await response.json();
    console.log('[VERIFY OTP] Verification response:', result);
    
    if (!result.success) {
      console.error('[VERIFY OTP] Verification failed:', result.error);
      throw new Error(result.error || 'Invalid verification code');
    }
    
    // Format phone for lookup
    const formattedPhone = phone.startsWith('+') ? phone : countryCode + phoneNumber;
    console.log('[VERIFY OTP] Looking up user with phone number:', formattedPhone);
    
    // Get user data from verification result
    const user = result.user;
    
    if (user && user.id) {
      console.log('[VERIFY OTP] User found/verified with ID:', user.id);
      
      // Update user as verified via API
      try {
        const updateResponse = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_verified: true,
            updated_at: new Date().toISOString()
          })
        });
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('[VERIFY OTP] API error updating user:', errorData);
        } else {
          const updateResult = await updateResponse.json();
          
          if (updateResult.success) {
            console.log('[VERIFY OTP] User verification status updated successfully');
          } else {
            console.error('[VERIFY OTP] API returned error:', updateResult.error);
          }
        }
      } catch (updateErr) {
        console.error('[VERIFY OTP] Error updating user verification status:', updateErr);
      }
      
      // Store user ID in localStorage for session management
      localStorage.setItem('userId', user.id);
      console.log('[VERIFY OTP] User ID stored in localStorage:', user.id);
    } else {
      console.error('[VERIFY OTP] No valid user found after verification');
    }
    
    // Return the user data from our server response
    return {
      session: sessionData?.session || result.session,
      user: result.user
    };
  } catch (error) {
    console.error('Error in verifyPhoneOtp:', error);
    throw error;
  }
}

// Save complete profile data to Supabase after phone verification
export async function saveCompleteProfileToSupabase() {
  console.log('[PROFILE] Starting profile save process');
  const supabase = await supabaseClientPromise;
  
  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('[PROFILE] Error getting authenticated user:', userError);
    return { success: false, error: userError };
  }
  
  if (!user) {
    console.error('[PROFILE] No authenticated user found');
    // Try to get session and refresh it
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('[PROFILE] No active session found:', sessionError);
      return { success: false, error: 'No authenticated user or session found' };
    }
    
    // Try refreshing the session
    console.log('[PROFILE] Attempting to refresh session');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.user) {
      console.error('[PROFILE] Failed to refresh session:', refreshError);
      return { success: false, error: 'Failed to refresh authentication session' };
    }
    
    console.log('[PROFILE] Session refreshed successfully');
  }
  
  // Get stored profile data from localStorage
  const PROFILE_STORAGE_KEY = 'userProfile';
  const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
  
  if (!storedProfile) {
    console.log('[PROFILE] No profile data found in localStorage');
    return { success: false, error: 'No profile data found' };
  }
  
  try {
    // Parse the stored profile data
    const profileData = JSON.parse(storedProfile);
    console.log('[PROFILE] Retrieved profile data from localStorage:', profileData);
    
    // Get the current user again in case we refreshed the session
    const { data: { user: currentUser }, error: currentUserError } = await supabase.auth.getUser();
    
    if (currentUserError || !currentUser) {
      console.error('[PROFILE] Failed to get current user after refresh:', currentUserError);
      return { success: false, error: currentUserError || 'User not found after session refresh' };
    }
    
    // Add user ID and timestamps
    const completeProfile = {
      ...profileData,
      id: currentUser.id,
      phone_number: profileData.phone_number || currentUser.phone,
      phone_verified: true,
      updated_at: new Date().toISOString(),
      created_at: profileData.created_at || new Date().toISOString()
    };
    
    console.log('[PROFILE] Saving complete profile to Supabase:', completeProfile);
    
    // Save to Supabase profiles table
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(completeProfile);
      
    if (upsertError) {
      console.error('[PROFILE] Error saving profile to Supabase:', upsertError);
      return { success: false, error: upsertError };
    }
    
    console.log('[PROFILE] Profile successfully saved to Supabase');
    
    // Handle profile photo if available
    const profilePhoto = localStorage.getItem('profilePhoto');
    if (profilePhoto) {
      console.log('[PROFILE] Found profile photo in localStorage, processing...');
      try {
        // Convert base64 to blob
        const response = await fetch(profilePhoto);
        const blob = await response.blob();
        const fileName = `${currentUser.id}/profile.${blob.type.split('/')[1]}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob, { upsert: true });
        
        if (uploadError) {
          console.error('[PROFILE] Error uploading profile photo:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(fileName);
          
          // Update profile with photo URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', currentUser.id);
          
          if (updateError) {
            console.error('[PROFILE] Error updating profile with photo URL:', updateError);
          } else {
            console.log('[PROFILE] Profile photo uploaded and linked successfully');
            // Clear the stored photo data
            localStorage.removeItem('profilePhoto');
          }
        }
      } catch (photoError) {
        console.error('[PROFILE] Error processing profile photo:', photoError);
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('[PROFILE] Error processing profile data:', err);
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

// Get current user from users table
export async function getCurrentUser() {
  try {
    const supabase = await supabaseClientPromise;
    
    // First try to get from session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData?.session?.user) {
      console.log('[USER] Found user in session:', sessionData.session.user.id);
      return sessionData.session.user;
    }
    
    // If no session, check localStorage for user ID
    const userId = localStorage.getItem('userId');
    
    if (userId) {
      console.log('[USER] Found user ID in localStorage:', userId);
      
      try {
        // Get user from API
        const response = await fetch(`/api/users/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('[USER] Error fetching user from API:', response.status);
          localStorage.removeItem('userId'); // Clear invalid ID
          return null;
        }
        
        const result = await response.json();
        
        if (!result.success || !result.user) {
          console.error('[USER] API returned error or no user:', result.error || 'No user data');
          localStorage.removeItem('userId'); // Clear invalid ID
          return null;
        }
        
        console.log('[USER] Found user via API:', result.user.id);
        return result.user;
      } catch (fetchError) {
        console.error('[USER] Error fetching user from API:', fetchError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[USER] Error in getCurrentUser:', error);
    return null;
  }
}

// Logout
export async function logout() {
  const supabase = await supabaseClientPromise;
  await supabase.auth.signOut();
  window.location.href = '/auth';
}
