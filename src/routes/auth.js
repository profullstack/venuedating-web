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
    // Use signUp instead of admin.createUser to avoid permission issues
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          plan,
          payment_method
        }
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
    
    // The session should be included in the authData response
    // No need to sign in separately
    const sessionData = authData;
    
    // No need to manually create a user in the database
    // The database trigger will handle this automatically
    
    return c.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      session: authData.session
    });
    
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
    
    // Use the admin API to create a new session
    // This is the most direct way to create a session without magic links or password resets
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userData.id
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
 * Route handler for requesting a password reset
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with status
 */
export async function resetPasswordHandler(c) {
  try {
    // Get email from request body
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    console.log(`Requesting password reset for ${email}`);
    
    // Request password reset from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${c.req.header('origin') || 'http://localhost:3000'}/reset-password-confirm`
    });
    
    if (error) {
      console.error('Error requesting password reset:', error);
      return c.json({ error: 'Failed to request password reset: ' + error.message }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Error in reset password handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for confirming a password reset
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with status
 */
export async function resetPasswordConfirmHandler(c) {
  try {
    // Get token and new password from request body
    const { token, password } = await c.req.json();
    
    if (!token || !password) {
      return c.json({ error: 'Token and password are required' }, 400);
    }
    
    console.log('Confirming password reset');
    
    // Update user's password using the token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
      new_password: password
    });
    
    if (error) {
      console.error('Error confirming password reset:', error);
      return c.json({ error: 'Failed to reset password: ' + error.message }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error in reset password confirm handler:', error);
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

export const resetPasswordRoute = {
  method: 'POST',
  path: '/api/1/auth/reset-password',
  handler: resetPasswordHandler
};

export const resetPasswordConfirmRoute = {
  method: 'POST',
  path: '/api/1/auth/reset-password-confirm',
  handler: resetPasswordConfirmHandler
};
