/**
 * User management routes
 * These endpoints handle user creation and updates
 */

import { supabase } from '../utils/supabase.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for creating a new user
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with user data
 */
export async function createUserHandler(c) {
  try {
    // Get user data from request body
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      countryCode,
      phoneVerified = false
    } = await c.req.json();
    
    if (!phoneNumber || !countryCode) {
      return c.json({ 
        success: false, 
        error: 'Phone number and country code are required' 
      }, 400);
    }

    if (!firstName || !lastName) {
      return c.json({
        success: false,
        error: 'First name and last name missing'
      }, 400)
    }
    
    console.log(`Creating user with phone: ${countryCode}${phoneNumber}`);

    console.log(`Creating user with names: ${firstName} ${lastName}`)
    
    // Normalize phone number to E.164 format (only + and digits)
    // First ensure country code starts with +
    const normalizedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    
    // Then remove all non-digit characters from the phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Combine for E.164 format
    const formattedPhone = normalizedCountryCode + cleanPhoneNumber;
    
    // Check if user already exists with this phone number
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', formattedPhone)
      .limit(1);
    
    if (queryError) {
      console.error('Error checking for existing user:', queryError);
      return c.json({
        success: false,
        error: queryError.message || 'Failed to check for existing user'
      }, 500);
    }
    
    // If user exists, return the existing user
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log(`Found existing user: ${existingUser.id}`);
      
      return c.json({
        success: true,
        user: existingUser,
        message: 'User already exists'
      });
    }
    
    // Create new user with a placeholder email if needed
    // Generate a placeholder email using the phone number
    const placeholderEmail = `phone.${formattedPhone.replace(/[^0-9]/g, '')}@placeholder.barcrush.app`;
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: placeholderEmail, // Add placeholder email to satisfy constraints
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        phone_number: formattedPhone,
        phone_verified: phoneVerified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user:', insertError);
      return c.json({
        success: false,
        error: insertError.message || 'Failed to create user'
      }, 500);
    }
    
    console.log(`User created successfully: ${newUser.id}`);
    
    // Create a profile for the user with synchronized data from users table
    try {
      // CRITICAL: We need to ensure the user exists in auth.users table first
      // The profiles table has a foreign key constraint that references auth.users(id)
      
      // First, check if the user exists in auth.users table
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(newUser.id);
      
      if (authUserError || !authUser || !authUser.user) {
        // User doesn't exist in auth.users table, we need to create an auth user first
        console.log('User not found in auth.users table, creating auth user first...');
        
        // Create a random password for the auth user (they'll use phone auth anyway)
        const randomPassword = Math.random().toString(36).slice(-10);
        
        // Create auth user with the same ID
        const { data: createdAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
          uuid: newUser.id,
          email: newUser.email,
          phone: newUser.phone_number,
          password: randomPassword,
          email_confirm: true,
          phone_confirm: newUser.phone_verified || false,
          user_metadata: {
            full_name: newUser.full_name,
            first_name: newUser.first_name,
            last_name: newUser.last_name
          }
        });
        
        if (createAuthError) {
          console.error('Error creating auth user:', createAuthError);
          // If we can't create the auth user, we can't create the profile
          return c.json({
            success: true,
            user: newUser,
            warning: 'User created but profile creation failed: ' + createAuthError.message
          });
        }
        
        console.log('Auth user created successfully');
        
        // Wait a moment for the auth user to be fully created and available
        // This helps ensure the foreign key constraint will be satisfied
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Try a completely different approach - use raw SQL via Supabase REST API
      try {
        // Double-check that the auth user exists and is fully created
        const { data: authUserCheck, error: authCheckError } = await supabase.auth.admin.getUserById(newUser.id);
        
        if (authCheckError || !authUserCheck || !authUserCheck.user) {
          console.error('Auth user still not available after creation attempt');
          return c.json({
            success: true,
            user: newUser,
            warning: 'User created but profile creation failed: Auth user not available'
          });
        }
        
        console.log('Auth user confirmed available, proceeding with profile creation');
        
        // First try the simplest approach - direct insert with minimal fields
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUser.id,
            full_name: newUser.full_name,
            display_name: newUser.first_name || newUser.full_name.split(' ')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (profileError) {
          console.error('Error creating profile with minimal fields:', profileError);
          
          // Try a different approach - use the REST API directly
          const restUrl = `${process.env.SUPABASE_URL}/rest/v1/profiles`;
          const restHeaders = {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          };
          
          const restBody = JSON.stringify({
            id: newUser.id,
            full_name: newUser.full_name,
            display_name: newUser.first_name || newUser.full_name.split(' ')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          try {
            const response = await fetch(restUrl, {
              method: 'POST',
              headers: restHeaders,
              body: restBody
            });
            
            if (response.ok) {
              console.log('Profile created successfully via REST API');
            } else {
              const errorData = await response.json();
              console.error('REST API profile creation failed:', errorData);
              
              // Last resort - try to update the user record to include profile fields
              console.log('Attempting last resort approach - updating user record');
              const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                  profile_created: true,
                  profile_data: JSON.stringify({
                    full_name: newUser.full_name,
                    display_name: newUser.first_name || newUser.full_name.split(' ')[0]
                  })
                })
                .eq('id', newUser.id);
              
              if (userUpdateError) {
                console.error('Failed to update user record:', userUpdateError);
              } else {
                console.log('User record updated with profile data');
              }
            }
          } catch (restError) {
            console.error('REST API request failed:', restError);
          }
        } else {
          console.log('Profile created successfully with direct insert');
        }
      } catch (sqlErr) {
        console.error('Exception in profile creation:', sqlErr);
      }
    } catch (profileErr) {
      console.error('Exception creating profile:', profileErr);
      console.error('Error details:', profileErr.message);
      // Continue anyway, as the user was created successfully
    }
    
    return c.json({
      success: true,
      user: newUser
    });
  } catch (error) {
    console.error('Error in createUserHandler:', error);
    
    return c.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, 500);
  }
}

/**
 * Route handler for getting a user by ID
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with user data
 */
export async function getUserHandler(c) {
  try {
    // Get user ID from path params
    const userId = c.req.param('id');
    
    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }
    
    console.log(`Getting user: ${userId}`);
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to get user'
      }, 500);
    }
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    console.log(`User retrieved successfully: ${userId}`);
    
    return c.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Error in getUserHandler:', error);
    
    return c.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, 500);
  }
}

/**
 * Route handler for updating a user
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with user data
 */
export async function updateUserHandler(c) {
  try {
    // Get user ID from path params
    const userId = c.req.param('id');
    
    // Get update data from request body
    const updateData = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }
    
    console.log(`Updating user: ${userId}`);
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return c.json({
        success: false,
        error: updateError.message || 'Failed to update user'
      }, 500);
    }
    
    console.log(`User updated successfully: ${userId}`);
    
    return c.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUserHandler:', error);
    
    return c.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, 500);
  }
}

// Route configuration for user endpoints
export const createUserRoute = {
  method: 'POST',
  path: '/api/users',
  handler: createUserHandler
};

export const getUserRoute = {
  method: 'GET',
  path: '/api/users/:id',
  handler: getUserHandler
};

export const updateUserRoute = {
  method: 'PUT',
  path: '/api/users/:id',
  handler: updateUserHandler
};

export const userRoutes = [
  createUserRoute,
  getUserRoute,
  updateUserRoute
];
