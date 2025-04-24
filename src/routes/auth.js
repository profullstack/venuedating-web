import { supabase } from '../utils/supabase.js';
import { errorUtils } from '../utils/error-utils.js';
import { apiKeyService } from '../services/api-key-service.js';
import crypto from 'crypto';

/**
 * Route handler for user registration
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with session data
 */
export async function registerHandler(c) {
  try {
    // Get registration data from request body
    const { email, password, plan, payment_method } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    console.log(`Registering user: ${email}`);
    
    // Register user with Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        plan,
        payment_method
      }
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return c.json({ error: 'Registration failed: ' + authError.message }, 400);
    }
    
    if (!authData || !authData.user) {
      return c.json({ error: 'Registration failed: No user data returned' }, 500);
    }
    
    console.log(`User registered successfully: ${email}`);
    
    // Create a session for the user by signing in with the credentials
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }
    
    // Create user in our database if not exists
    await apiKeyService._createUserIfNotExists(email);
    
    return c.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      session: sessionData.session
    });
  } catch (error) {
    console.error('Error in register handler:', error);
    return errorUtils.handleError(error, c);
  }
}

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
    // We need to use a different approach since admin.createSession is not available
    // We'll use a password reset and then sign in with the new password
    
    // Generate a temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    
    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { password: tempPassword }
    );
    
    if (updateError) {
      console.error('Error updating user password:', updateError);
      return c.json({ error: 'Failed to refresh token' }, 500);
    }
    
    // Sign in with the new password to get a session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: tempPassword
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

export const registerRoute = {
  method: 'POST',
  path: '/api/1/auth/register',
  handler: registerHandler
};
