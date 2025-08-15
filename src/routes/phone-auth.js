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
      return c.json({ 
        exists: false,
        valid: false,
        message: 'Phone number is required' 
      }, 400);
    }
    
    console.log(`Checking if phone number exists: ${phone}`);
    
    // Normalize the phone number by removing non-digit characters except the leading +
    const normalizedPhone = phone.charAt(0) === '+' 
      ? '+' + phone.substring(1).replace(/\D/g, '') 
      : phone.replace(/\D/g, '');
      
    console.log(`Normalized phone for checking: ${normalizedPhone}`);
    
    try {
      // First, validate the phone number format (E.164 format: +[country code][number])
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        console.log(`Invalid phone number format: ${normalizedPhone}`);
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
          .eq('phone', normalizedPhone)
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
      
      // Check the users table for phone_number (our new direct users table approach)
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', normalizedPhone)
          .limit(1);
          
        if (!error) {
          const exists = users && users.length > 0;
          console.log(`Phone number ${phone} exists in users table: ${exists}`);
          return c.json({
            exists: exists,
            valid: true,
            message: exists ? 'Phone number exists' : 'Phone number does not exist'
          });
        }
      } catch (usersError) {
        console.log('Error checking users table:', usersError.message);
        // Continue to fallback method
      }

      
      // Check database for bypass_otp flag
      try {
        const { data: users } = await supabase.auth.admin.listUsers();
        // Normalize user phone numbers for comparison
        const existingUser = users?.users?.find(u => {
          if (!u.phone) return false;
          const normalizedUserPhone = u.phone.charAt(0) === '+' 
            ? '+' + u.phone.substring(1).replace(/\D/g, '') 
            : u.phone.replace(/\D/g, '');
          return normalizedUserPhone === normalizedPhone;
        });
        if (existingUser) {
          // Check if user has bypass_otp flag in profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('bypass_otp')
            .eq('id', existingUser.id)
            .single();
          
          if (profile?.bypass_otp) {
            console.log(`[BYPASS OTP] Phone ${phone} has bypass flag, skipping SMS`);
            return c.json({
              exists: true,
              valid: true,
              message: 'Phone number exists (bypass mode)'
            });
          }
          
          // If we found the user but no bypass flag, return that the phone exists
          return c.json({
            exists: true,
            valid: true,
            message: 'Phone number exists'
          });
        } else {
          // User not found in admin.listUsers()
          return c.json({
            exists: false,
            valid: true,
            message: 'Phone number does not exist'
          });
        }
      } catch (dbError) {
        console.log('Could not check bypass flag:', dbError.message);
        // Continue to fallback return
      }
      
      // Default fallback if all checks fail but no errors occurred
      return c.json({
        exists: false,
        valid: true,
        message: 'Phone number likely does not exist'
      });
      
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