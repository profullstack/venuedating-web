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
    
    // Query the auth.users table directly to check if the phone number exists
    // This uses the service role key which has access to auth schema
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .eq('phone', phone)
      .limit(1);
    
    if (error) {
      console.error('Error checking phone number:', error);
      
      // If there's an error with the auth.users table access, try an alternative approach
      // This is a fallback in case the service role doesn't have access to auth schema
      try {
        console.log('Trying alternative approach to check phone existence...');
        
        // Try to get user by phone from the auth API
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
          filters: {
            phone: phone
          }
        });
        
        if (authError) {
          console.error('Error in alternative phone check:', authError);
          throw authError;
        }
        
        // Check if any users were found with this phone number
        const exists = authData && authData.users && authData.users.length > 0;
        console.log(`Phone number ${phone} exists: ${exists}`);
        
        return c.json({
          exists: exists,
          message: exists ? 'Phone number exists' : 'Phone number does not exist'
        });
      } catch (altError) {
        console.error('Alternative phone check failed:', altError);
        throw error; // Throw the original error
      }
    }
    
    // Check if any users were found with this phone number
    const exists = data && data.length > 0;
    console.log(`Phone number ${phone} exists: ${exists}`);
    
    return c.json({
      exists: exists,
      message: exists ? 'Phone number exists' : 'Phone number does not exist'
    });
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