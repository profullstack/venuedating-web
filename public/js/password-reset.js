import { supabaseClientPromise } from './supabase-client.js';

/**
 * Check if a phone number exists in Supabase
 * @param {string} phone - Phone number to check
 * @returns {Promise<boolean>} - True if the phone number exists, false otherwise
 */
export async function checkPhoneExists(phone) {
  console.log('Checking if phone number exists:', phone);
  
  try {
    // Call the server-side endpoint to check if the phone number exists
    const response = await fetch('/api/1/auth/check-phone-exists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error checking phone existence:', errorData);
      throw new Error(errorData.error || 'Failed to check if phone number exists');
    }
    
    const data = await response.json();
    console.log('Phone existence check result:', data);
    
    return data.exists;
  } catch (err) {
    console.error('Error in checkPhoneExists:', err);
    // In case of an error, we'll return true to allow the flow to continue
    // The actual OTP verification will fail if the phone doesn't exist
    console.warn('Defaulting to true due to error checking phone existence');
    return true;
  }
}

/**
 * Reset password for a user with a phone number
 * @param {string} phone - Phone number
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Result of the password reset
 */
export async function resetPasswordWithPhone(phone, newPassword) {
  try {
    const supabase = await supabaseClientPromise;
    
    // First, we need to get the user's session by verifying the OTP
    // This should have been done before calling this function
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw sessionError;
    }
    
    if (!sessionData || !sessionData.session) {
      console.error('No active session found');
      throw new Error('No active session found. Please verify your phone number first.');
    }
    
    // Now we can update the user's password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
    
    console.log('Password updated successfully');
    return { success: true };
  } catch (err) {
    console.error('Error in resetPasswordWithPhone:', err);
    throw err;
  }
}