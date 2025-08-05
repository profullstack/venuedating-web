/**
 * Unlock Matching API Endpoint
 * 
 * Updates user's payment status to unlock matching features
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
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

    // Update user's payment status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        has_paid: true,
        payment_date: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to unlock matching for user:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to unlock matching features'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Matching features unlocked successfully'
    });

  } catch (error) {
    console.error('Unlock matching error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Configuration for API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
