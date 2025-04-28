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
    
    // First check if user already exists in the auth system
    try {
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();
        
      if (existingUser) {
        console.log(`User with email ${email} already exists`);
        return c.json({ error: 'A user with this email already exists' }, 409);
      }
    } catch (checkError) {
      console.log(`Error checking for existing user: ${checkError.message}`);
      // Continue with registration attempt even if check fails
    }
    
    // Register user with Supabase using the admin API for better reliability
    try {
      const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email to avoid verification step
        user_metadata: {
          plan,
          payment_method
        }
      });
      
      if (adminAuthError) {
        console.error('Admin user creation error:', adminAuthError);
        throw adminAuthError;
      }
      
      if (!adminAuthData || !adminAuthData.user) {
        throw new Error('No user data returned from admin create user');
      }
      
      console.log(`User created with admin API: ${email}, ID: ${adminAuthData.user.id}`);
      
      // Manually create user in public.users table since we're bypassing triggers
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: adminAuthData.user.id,
            email: email,
            is_admin: false
          }]);
          
        if (insertError) {
          console.warn(`Warning: Could not insert user into public.users table: ${insertError.message}`);
          // Continue anyway as the auth part succeeded
        } else {
          console.log(`User added to public.users table: ${email}`);
        }
      } catch (insertError) {
        console.warn(`Warning: Error inserting user into public.users table: ${insertError.message}`);
        // Continue anyway as the auth part succeeded
      }
      
      // Create a session for the new user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: adminAuthData.user.id
      });
      
      if (sessionError) {
        console.error('Error creating session for new user:', sessionError);
        // Return success but without session data
        return c.json({
          success: true,
          message: 'User registered successfully, but session could not be created. Please login.',
          user: {
            id: adminAuthData.user.id,
            email: adminAuthData.user.email
          }
        });
      }
      
      return c.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: adminAuthData.user.id,
          email: adminAuthData.user.email
        },
        session: sessionData.session
      });
      
    } catch (adminError) {
      // Fallback to regular signup if admin API fails
      console.log(`Admin API failed, falling back to regular signup: ${adminError.message}`);
      
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
        console.error('Supabase auth error in fallback:', authError);
        return c.json({ error: 'Registration failed: ' + authError.message }, 400);
      }
      
      if (!authData || !authData.user) {
        return c.json({ error: 'Registration failed: No user data returned from fallback' }, 500);
      }
      
      console.log(`User registered successfully with fallback: ${email}`);
      
      return c.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email
        },
        session: authData.session
      });
    }
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
    
    // Check if the user exists in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return c.json({ error: 'Email address not found. Please check your email and try again.' }, 404);
    }
    
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
    
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }
    
    console.log('Confirming password reset');
    
    try {
      // Update user's password using the token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
        new_password: password
      });
      
      if (error) {
        console.error('Error confirming password reset:', error);
        
        // Check for specific error types
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          return c.json({ error: 'Invalid or expired password reset token. Please request a new password reset link.' }, 400);
        }
        
        return c.json({ error: 'Failed to reset password: ' + error.message }, 500);
      }
      
      return c.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return c.json({ error: 'Invalid password reset token format' }, 400);
    }
  } catch (error) {
    console.error('Error in reset password confirm handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for user login
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with session data
 */
export async function loginHandler(c) {
  try {
    // Get login data from request body
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    console.log(`Attempting login for user: ${email}`);
    
    // Login user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Supabase login error:', error);
      
      // Check for specific error types
      if (error.message.includes('Invalid login credentials')) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }
      
      return c.json({ error: 'Login failed: ' + error.message }, 400);
    }
    
    if (!data || !data.user || !data.session) {
      console.error('Login failed: No user or session data returned');
      return c.json({ error: 'Login failed: No session data returned' }, 500);
    }
    
    console.log(`User logged in successfully: ${email}`);
    
    // Check if user exists in public.users table, create if not
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError && userError.code !== 'PGRST116') { // Error other than 'not found'
      console.error('Error checking user in public.users table:', userError);
    }
    
    // If user doesn't exist in public.users table, create it
    if (userError && userError.code === 'PGRST116') {
      console.log(`User ${email} not found in public.users table, creating...`);
      
      try {
        // Create user in public.users table
        await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            is_admin: false
          }]);
          
        console.log(`User ${email} created in public.users table`);
      } catch (insertError) {
        console.error('Error creating user in public.users table:', insertError);
        // Continue anyway, as the login was successful
      }
    }
    
    return c.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Error in login handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for auth endpoints
 */
export const loginRoute = {
  method: 'POST',
  path: '/api/1/auth/login',
  handler: loginHandler
};

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
