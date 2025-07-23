import { supabase } from '../utils/supabase.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for checking if a phone number exists in Supabase
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with existence status
 */
export async function checkPhoneExistsHandler(c) {
  try {
    // Get phone number from request body
    const { phone } = await c.req.json();
    
    if (!phone) {
      return c.json({ error: 'Phone number is required' }, 400);
    }
    
    console.log(`Checking if phone number exists: ${phone}`);
    
    try {
      // First, validate the phone number format (E.164 format: +[country code][number])
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        console.log(`Invalid phone number format: ${phone}`);
        return c.json({
          exists: false,
          valid: false,
          message: 'Invalid phone number format'
        });
      }
      
      // Query the auth.users view directly if available (more reliable than OTP check)
      try {
        const { data, error } = await supabase
          .from('auth_users_view') // Using a view that might exist to access auth users
          .select('id')
          .eq('phone', phone)
          .limit(1);
          
        if (!error && data) {
          const exists = data.length > 0;
          console.log(`Phone number ${phone} exists in auth_users_view: ${exists}`);
          return c.json({
            exists: exists,
            valid: true,
            message: exists ? 'Phone number exists' : 'Phone number does not exist'
          });
        }
      } catch (viewError) {
        console.log('Auth users view not available:', viewError.message);
        // Continue to fallback method
      }
      
      // Fallback: Use the signInWithOtp method with the phone number
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          // Set a flag to indicate this is just a check
          data: { check_only: true }
        }
      });
      
      console.log('OTP check response:', error ? `Error: ${error.message}` : 'No error');
      
      // Properly interpret the error messages
      if (!error) {
        // No error means OTP was sent successfully - phone exists and is valid
        console.log(`Phone number ${phone} exists and is valid`);
        return c.json({
          exists: true,
          valid: true,
          message: 'Phone number exists'
        });
      } else if (error.message.includes('not registered')) {
        // Specific error about not being registered means phone is valid but doesn't exist
        console.log(`Phone number ${phone} is valid but does not exist`);
        return c.json({
          exists: false,
          valid: true,
          message: 'Phone number does not exist'
        });
      } else if (error.message.includes('Invalid') && !error.message.includes('From Number')) {
        // Invalid phone number errors (excluding Twilio From number configuration issues)
        console.log(`Phone number ${phone} is invalid: ${error.message}`);
        return c.json({
          exists: false,
          valid: false,
          message: 'Invalid phone number'
        });
      } else if (error.message.includes('Twilio') || error.message.includes('provider')) {
        // Twilio or provider errors - can't determine if phone exists
        console.log(`Provider error for ${phone}: ${error.message}`);
        return c.json({
          exists: false, // Default to false for safety
          valid: true,  // Phone format is valid
          providerError: true,
          message: 'Provider error, cannot determine if phone exists'
        });
      }
    } catch (supabaseError) {
      console.error('Error checking phone with Supabase:', supabaseError);
      
      // Fallback approach - assume the phone doesn't exist if we can't verify
      return c.json({
        exists: false,
        message: 'Unable to verify phone existence',
        error: supabaseError.message
      });
    }
  } catch (error) {
    console.error('Error in check phone exists handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for phone auth endpoints
 */
export const checkPhoneExistsRoute = {
  method: 'POST',
  path: '/api/1/auth/check-phone-exists',
  handler: checkPhoneExistsHandler
};

export const phoneAuthRoutes = [
  checkPhoneExistsRoute
];