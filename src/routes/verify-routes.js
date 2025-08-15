/**
 * Phone verification routes
 * New implementation that separates Supabase and Twilio
 * - For login: Check Supabase for phone, use Twilio to send OTP, store OTP in Supabase
 * - For signup: Use Twilio to send OTP, store number and OTP in Supabase
 */

import { supabase } from '../utils/supabase.js';
import { 
  sendVerificationSMS, 
  generateVerificationCode, 
  isTestPhoneNumber,
  formatE164PhoneNumber 
} from '../utils/twilio-client.js';
import { saveOTP, verifyOTP, phoneNumberExists } from '../models/otp.js';

/**
 * Send verification code route
 * - Handles both login and signup flows
 * - For login, validates phone exists in Supabase first
 * - For signup, directly sends verification code
 */
export const sendCodeRoute = {
  method: 'POST',
  path: '/api/verify/send-code',
  handler: async (c) => {
    try {
      const { phoneNumber, countryCode, isSignup = false } = await c.req.json();
      
      // Validate request
      if (!phoneNumber || !countryCode) {
        return c.json({ 
          success: false, 
          error: 'Phone number and country code are required' 
        }, 400);
      }
      
      // Format phone number to E.164 format for Twilio
      const formattedPhoneNumber = formatE164PhoneNumber(countryCode, phoneNumber);
      
      // Log for debugging
      console.log('=== PHONE NUMBER DEBUG INFORMATION ===');
      console.log(`Original phone: '${phoneNumber}', country code: '${countryCode}'`);
      console.log(`Flow type: ${isSignup ? 'SIGNUP' : 'LOGIN'}`);
      console.log(`E.164 formatted phone for Twilio: '${formattedPhoneNumber}'`);
      console.log('===================================');
      
      // Check if this is a test account
      if (isTestPhoneNumber(formattedPhoneNumber)) {
        console.log(`[TEST ACCOUNT] Bypassing SMS for test account: ${formattedPhoneNumber}`);
        
        // For test accounts, save the standard test code
        const testCode = '123456';
        await saveOTP(formattedPhoneNumber, testCode, 60, isSignup);
        
        return c.json({
          success: true,
          status: 'pending',
          message: 'Test account: SMS bypassed. Use code 123456 to verify.'
        });
      }
      
      // If login flow, verify phone exists in Supabase first
      if (!isSignup) {
        const { success, exists, error } = await phoneNumberExists(formattedPhoneNumber);
        
        if (!success) {
          return c.json({ 
            success: false, 
            error: error || 'Failed to check phone number' 
          }, 500);
        }
        
        if (!exists) {
          return c.json({ 
            success: false, 
            error: 'Phone number not found. Please sign up first.' 
          }, 404);
        }
        
        console.log(`[LOGIN] Phone ${formattedPhoneNumber} exists, sending verification code`);
      } else {
        // For signup, check if phone already exists
        const { success, exists, error } = await phoneNumberExists(formattedPhoneNumber);
        
        if (success && exists) {
          return c.json({ 
            success: false, 
            error: 'Phone number already registered. Please login instead.' 
          }, 409);
        }
        
        console.log(`[SIGNUP] New phone ${formattedPhoneNumber}, sending verification code`);
      }
      
      // Generate verification code
      const verificationCode = generateVerificationCode(6);
      
      // Send SMS via Twilio
      const { success, message, sid, error } = await sendVerificationSMS(
        formattedPhoneNumber, 
        verificationCode
      );
      
      if (!success) {
        console.error(`[TWILIO ERROR] Failed to send SMS: ${error}`);
        return c.json({ 
          success: false, 
          error: error || 'Failed to send verification code' 
        }, 500);
      }
      
      // Save OTP to database
      const otpResult = await saveOTP(formattedPhoneNumber, verificationCode, 10, isSignup);
      
      if (!otpResult.success) {
        console.error(`[OTP ERROR] Failed to save OTP: ${otpResult.error}`);
        return c.json({ 
          success: false, 
          error: 'Failed to save verification code' 
        }, 500);
      }
      
      console.log(`[SUCCESS] Verification code sent to ${formattedPhoneNumber}`);
      
      // Return success response
      return c.json({
        success: true,
        status: 'pending',
        message: 'Verification code sent successfully',
        expiresAt: otpResult.expiresAt
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      return c.json({ 
        success: false, 
        error: error.message || 'Failed to send verification code' 
      }, 500);
    }
  }
};

/**
 * Verify code route
 * - Verifies OTP code from database
 * - For login, returns user information
 * - For signup, updates user profile with verified status
 */
export const verifyCodeRoute = {
  method: 'POST',
  path: '/api/verify/check-code',
  handler: async (c) => {
    try {
      const { phoneNumber, countryCode, code } = await c.req.json();
      
      // Validate request
      if (!phoneNumber || !countryCode || !code) {
        return c.json({ 
          success: false, 
          error: 'Phone number, country code, and verification code are required' 
        }, 400);
      }
      
      // Format phone number to E.164 format
      const formattedPhoneNumber = formatE164PhoneNumber(countryCode, phoneNumber);
      
      // For test accounts, always validate with test code
      if (isTestPhoneNumber(formattedPhoneNumber) && code === '123456') {
        console.log(`[TEST ACCOUNT] Bypassing verification for test account: ${formattedPhoneNumber}`);
        return c.json({
          success: true,
          verified: true,
          message: 'Test account: Verification bypassed.'
        });
      }
      
      // Verify OTP against database
      const { success, verified, error, isSignup } = await verifyOTP(formattedPhoneNumber, code);
      
      if (!success || !verified) {
        return c.json({ 
          success: false, 
          error: error || 'Invalid verification code' 
        }, 400);
      }
      
      // Handle successful verification
      console.log(`[VERIFIED] Phone ${formattedPhoneNumber} verified successfully`);
      
      // If this was for signup, we're done
      if (isSignup) {
        return c.json({
          success: true,
          verified: true,
          message: 'Phone number verified successfully',
          isSignup: true
        });
      } else {
        // For login, get user info
        const { success: userSuccess, exists, userId } = await phoneNumberExists(formattedPhoneNumber);
        
        if (!userSuccess || !exists) {
          return c.json({ 
            success: false, 
            error: 'User not found' 
          }, 404);
        }
        
        // Return user ID for authentication
        return c.json({
          success: true,
          verified: true,
          message: 'Phone number verified successfully',
          userId,
          isSignup: false
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return c.json({ 
        success: false, 
        error: error.message || 'Failed to verify code' 
      }, 500);
    }
  }
};

// Export all routes
export const verifyRoutes = [
  sendCodeRoute,
  verifyCodeRoute
];
