/**
 * Phone signup routes
 * These endpoints handle user registration via phone number using direct Twilio integration
 */

import { supabase } from '../utils/supabase.js';
import { errorUtils } from '../utils/error-utils.js';
import { sendVerificationCode, verifyCode } from '../utils/verification.js';

/**
 * Route handler for initiating phone signup
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with verification status
 */
export async function initiatePhoneSignupHandler(c) {
  try {
    // Get phone number from request body
    const { phoneNumber, countryCode } = await c.req.json();
    
    if (!phoneNumber || !countryCode) {
      return c.json({ 
        success: false, 
        error: 'Phone number and country code are required' 
      }, 400);
    }
    
    console.log(`Initiating phone signup for: ${countryCode}${phoneNumber}`);
    
    // Send verification code via Twilio direct integration
    const result = await sendVerificationCode(phoneNumber, countryCode);
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Error initiating phone signup:', error);
    
    return c.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, 500);
  }
}

/**
 * Route handler for completing phone signup
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with user data
 */
export async function completePhoneSignupHandler(c) {
  try {
    // Get verification data from request body
    const { phoneNumber, countryCode, code, userData = {} } = await c.req.json();
    
    if (!phoneNumber || !countryCode || !code) {
      return c.json({ 
        success: false, 
        error: 'Phone number, country code, and verification code are required' 
      }, 400);
    }
    
    console.log(`Completing phone signup for: ${countryCode}${phoneNumber}`);
    
    // Verify the code using our direct Twilio integration
    const verificationResult = await verifyCode(phoneNumber, countryCode, code);
    
    if (!verificationResult.success) {
      return c.json(verificationResult, 400);
    }
    
    // Format phone number to E.164 format for consistency
    const formattedPhone = verificationResult.user.phone;
    
    // Check if user already exists in Supabase
    let existingUser;
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (!error && data && data.users) {
        existingUser = data.users.find(user => user.phone === formattedPhone);
      }
    } catch (listError) {
      console.warn(`Could not check user list: ${listError.message}`);
    }
    
    // If user already exists, return success with existing user data
    if (existingUser) {
      console.log(`User already exists with phone: ${formattedPhone}`);
      
      // Sign in the existing user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: code // Use the verification code as a one-time password
      });
      
      if (signInError) {
        console.error('Error signing in existing user:', signInError);
        
        // Fall back to creating a session manually
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
          user_id: existingUser.id
        });
        
        if (sessionError) {
          console.error('Error creating session:', sessionError);
          return c.json({
            success: false,
            error: 'Failed to authenticate user'
          }, 500);
        }
        
        return c.json({
          success: true,
          user: existingUser,
          session: sessionData,
          message: 'User authenticated successfully'
        });
      }
      
      return c.json({
        success: true,
        user: signInData.user,
        session: signInData.session,
        message: 'User authenticated successfully'
      });
    }
    
    // Create a new user with Supabase
    const password = Math.random().toString(36).slice(2, 10); // Generate random password
    
    const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
      phone: formattedPhone,
      password,
      phone_confirm: true, // Auto-confirm phone to avoid verification step
      user_metadata: {
        ...userData,
        phone_verified: true,
        signup_method: 'phone'
      }
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return c.json({
        success: false,
        error: createError.message || 'Failed to create user'
      }, 500);
    }
    
    console.log(`User created successfully with phone: ${formattedPhone}`);
    
    // Create user profile in public.profiles table
    try {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: newUserData.user.id,
          phone: formattedPhone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...userData
        }]);
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
    }
    
    return c.json({
      success: true,
      user: newUserData.user,
      session: newUserData.session,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error completing phone signup:', error);
    
    return c.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, 500);
  }
}

// Route configuration for phone signup endpoints
export const initiatePhoneSignupRoute = {
  method: 'POST',
  path: '/api/auth/phone/initiate-signup',
  handler: initiatePhoneSignupHandler
};

export const completePhoneSignupRoute = {
  method: 'POST',
  path: '/api/auth/phone/complete-signup',
  handler: completePhoneSignupHandler
};

// Export all routes
export const phoneSignupRoutes = [
  initiatePhoneSignupRoute,
  completePhoneSignupRoute
];
