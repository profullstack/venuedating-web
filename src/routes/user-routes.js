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
    
    console.log(`Creating user with phone: ${countryCode}${phoneNumber}`);
    
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
