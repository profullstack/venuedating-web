/**
 * OTP model for phone verification
 * Used to store and validate OTP codes sent via SMS
 */

import { supabase } from '../utils/supabase.js';

// OTP table name
const OTP_TABLE = 'verification_codes';

/**
 * Save a new OTP code to the database
 * @param {string} phoneNumber - E.164 formatted phone number
 * @param {string} code - Generated OTP code
 * @param {number} expiresInMinutes - Expiration time in minutes
 * @param {boolean} isSignup - Whether this is for signup (true) or login (false)
 * @returns {Promise<Object>} - Result with success status
 */
export async function saveOTP(phoneNumber, code, expiresInMinutes = 10, isSignup = false) {
  try {
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Check for existing codes for this phone number and delete them
    await supabase
      .from(OTP_TABLE)
      .delete()
      .eq('phone', phoneNumber);
    
    // Insert new code
    const { data, error } = await supabase
      .from(OTP_TABLE)
      .insert([
        {
          phone: phoneNumber,
          code: code,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          is_signup: isSignup
        }
      ]);
    
    if (error) {
      console.error('Error saving OTP to database:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      message: 'OTP saved successfully',
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    console.error('Exception saving OTP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify an OTP code against the stored value
 * @param {string} phoneNumber - E.164 formatted phone number
 * @param {string} code - OTP code to verify
 * @returns {Promise<Object>} - Result with verification status
 */
export async function verifyOTP(phoneNumber, code) {
  try {
    // Get the OTP record
    const { data, error } = await supabase
      .from(OTP_TABLE)
      .select('*')
      .eq('phone', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.error('Error retrieving OTP from database:', error);
      return { 
        success: false, 
        verified: false, 
        error: 'No verification code found for this number' 
      };
    }
    
    // Check if code is expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      // Delete expired code
      await supabase
        .from(OTP_TABLE)
        .delete()
        .eq('id', data.id);
      
      return { 
        success: false, 
        verified: false, 
        error: 'Verification code has expired' 
      };
    }
    
    // Increment attempt counter
    await supabase
      .from(OTP_TABLE)
      .update({ attempts: data.attempts + 1 })
      .eq('id', data.id);
    
    // Check if max attempts reached (5 attempts)
    if (data.attempts >= 4) { // This will be the 5th attempt
      // Delete the code after max attempts
      await supabase
        .from(OTP_TABLE)
        .delete()
        .eq('id', data.id);
      
      return { 
        success: false, 
        verified: false, 
        error: 'Too many verification attempts. Please request a new code.' 
      };
    }
    
    // Check if code matches
    if (data.code !== code) {
      return { 
        success: false, 
        verified: false, 
        error: 'Invalid verification code',
        attemptsLeft: 5 - (data.attempts + 1)
      };
    }
    
    // Code is valid - delete it to prevent reuse
    await supabase
      .from(OTP_TABLE)
      .delete()
      .eq('id', data.id);
    
    return { 
      success: true, 
      verified: true, 
      message: 'Phone number verified successfully',
      isSignup: data.is_signup
    };
  } catch (error) {
    console.error('Exception verifying OTP:', error);
    return { success: false, verified: false, error: error.message };
  }
}

/**
 * Check if a phone number exists in the database
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {Promise<Object>} - Result with existence status
 */
export async function phoneNumberExists(phoneNumber) {
  try {
    // Try to find the user by phone number
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking if phone exists:', userError);
      return { success: false, error: userError.message };
    }
    
    // Find user with this phone number
    const existingUser = users?.users?.find(u => u.phone === phoneNumber);
    
    return { 
      success: true, 
      exists: !!existingUser,
      userId: existingUser?.id || null
    };
  } catch (error) {
    console.error('Exception checking if phone exists:', error);
    return { success: false, error: error.message };
  }
}
