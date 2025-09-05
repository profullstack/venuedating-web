import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Get user profile by ID
 */
export async function getUserProfile(c) {
  try {
    const userId = c.req.param('id');
    const user = c.get('user');
    
    // Security check: users can only access their own profile
    // unless they have admin role (which we could add later)
    if (userId !== user.id) {
      return c.json({ error: 'Unauthorized access to user profile' }, 403);
    }
    
    // Get user profile from database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return c.json({ error: 'Failed to fetch user profile' }, 500);
    }
    
    if (!data) {
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    // Return user profile data
    return c.json(data);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Update user profile by ID
 */
export async function updateUserProfile(c) {
  try {
    const userId = c.req.param('id');
    const user = c.get('user');
    
    // Security check: users can only update their own profile
    if (userId !== user.id) {
      return c.json({ error: 'Unauthorized access to update user profile' }, 403);
    }
    
    // Get request body
    const body = await c.req.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }
    
    // Prepare update data
    const updateData = {
      first_name: body.firstName,
      last_name: body.lastName,
      updated_at: new Date().toISOString()
    };
    
    // Add optional fields if provided
    if (body.phoneNumber) updateData.phone_number = body.phoneNumber;
    if (body.countryCode) updateData.country_code = body.countryCode;
    if (body.birthday) updateData.birthday = body.birthday;
    if (body.location) updateData.location = body.location;
    if (body.profileImage) updateData.profile_image = body.profileImage;
    
    // Update user profile in database
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return c.json({ error: 'Failed to update user profile' }, 500);
    }
    
    // Return updated user profile
    return c.json(data);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

// Export user routes
// Get user data by ID (no auth required for debugging)
async function getUserById(c) {
  try {
    const userId = c.req.param('id');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    console.log('Fetching user data for ID:', userId);
    
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // First try to get user from Supabase auth
    let userData = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authData?.user) {
        userData = {
          id: authData.user.id,
          email: authData.user.email,
          phone: authData.user.phone,
          name: authData.user.user_metadata?.name,
          created_at: authData.user.created_at,
          source: 'auth'
        };
      }
    } catch (authError) {
      console.log('Auth lookup failed, trying profiles table:', authError.message);
    }
    
    // Get additional data from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone, name, email, has_paid, created_at')
      .eq('id', userId)
      .single();
    
    if (profileData) {
      // Merge auth data with profile data
      userData = {
        id: profileData.id,
        email: profileData.email || userData?.email,
        phone: profileData.phone || userData?.phone,
        name: profileData.name || userData?.name,
        has_paid: profileData.has_paid || false,
        created_at: profileData.created_at || userData?.created_at,
        source: userData ? 'auth+profiles' : 'profiles'
      };
    }
    
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    console.log('User data found:', userData);
    return c.json({ success: true, user: userData });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return c.json({ error: 'Failed to fetch user data' }, 500);
  }
}

export const userRoutes = [
  {
    method: 'GET',
    path: '/api/user/:id',
    handler: getUserById
    // No auth middleware for debugging
  },
  {
    method: 'GET',
    path: '/api/users/:id',
    handler: getUserProfile,
    middleware: [authMiddleware]
  },
  {
    method: 'PUT',
    path: '/api/users/:id',
    handler: updateUserProfile,
    middleware: [authMiddleware]
  }
];
