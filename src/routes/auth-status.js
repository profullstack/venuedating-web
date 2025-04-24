import { supabase } from '../utils/supabase.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for checking auth status
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with auth status
 */
export async function authStatusHandler(c) {
  try {
    // Get JWT token from header
    const authHeader = c.req.header('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) {
      return c.json({ 
        authenticated: false,
        message: 'No JWT token provided'
      });
    }
    
    // Verify JWT token with Supabase
    const user = await supabase.auth.getUser(token);
    
    if (user.error) {
      return c.json({ 
        authenticated: false,
        message: 'Invalid JWT token',
        error: user.error.message
      });
    }
    
    // Check if user exists in public.users table
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('id', user.data.user.id)
      .single();
    
    return c.json({
      authenticated: true,
      auth_user: {
        id: user.data.user.id,
        email: user.data.user.email,
        created_at: user.data.user.created_at
      },
      public_user: publicUserError ? null : publicUser,
      public_user_error: publicUserError ? publicUserError.message : null,
      tables_in_sync: !publicUserError && publicUser && publicUser.id === user.data.user.id
    });
  } catch (error) {
    console.error('Error in auth status handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for auth status endpoint
 */
export const authStatusRoute = {
  method: 'GET',
  path: '/api/1/auth/status',
  handler: authStatusHandler
};