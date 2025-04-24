import { supabase } from '../utils/supabase.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for refreshing JWT token
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with token
 */
export async function refreshTokenHandler(c) {
  try {
    // Get email from request body
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    console.log(`Refreshing JWT token for ${email}`);
    
    // Check if user exists in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Create a new session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userData.id,
      email: userData.email
    });
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }
    
    return c.json({
      success: true,
      message: 'JWT token refreshed successfully',
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at
      }
    });
  } catch (error) {
    console.error('Error in refresh token handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for auth endpoints
 */
export const refreshTokenRoute = {
  method: 'POST',
  path: '/api/1/auth/refresh-token',
  handler: refreshTokenHandler
};
