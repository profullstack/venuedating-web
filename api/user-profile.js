/**
 * User Profile API Endpoint
 * 
 * Retrieves the user's profile information including payment status
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session/auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization required' 
      });
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid authentication' 
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      
      // If profile doesn't exist, return basic user info
      if (profileError.code === 'PGRST116') {
        return res.status(200).json({
          id: user.id,
          email: user.email,
          phone: user.phone,
          has_paid: false,
          created_at: user.created_at,
          updated_at: user.updated_at
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user profile' 
      });
    }

    // Return user profile with payment status
    return res.status(200).json({
      ...profile,
      email: user.email,
      phone: user.phone
    });

  } catch (error) {
    console.error('Error in user profile API:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
}

// Configuration for API route
export const config = {
  api: {
    bodyParser: true
  }
};
