import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Square credentials endpoint
export const handler = async (req, res) => {
  try {
    // Validate user authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid authentication token' 
      });
    }
    
    // Provide Square credentials from environment variables
    // Use sandbox values for non-production environments
    const isProduction = process.env.NODE_ENV === 'production';
    
    const credentials = {
      applicationId: isProduction 
        ? process.env.SQUARE_APP_ID 
        : process.env.SQUARE_SANDBOX_APP_ID || 'sandbox-sq0idb-lT3HhaTKMRYkJnZ-yJsltA',
      locationId: isProduction 
        ? process.env.SQUARE_LOCATION_ID 
        : process.env.SQUARE_SANDBOX_LOCATION_ID || 'LPVRBB3FZW566',
      environment: isProduction ? 'production' : 'sandbox'
    };
    
    return res.status(200).json(credentials);
    
  } catch (error) {
    console.error('Error fetching Square credentials:', error);
    return res.status(500).json({ 
      error: 'Server Error', 
      message: 'Failed to fetch Square credentials' 
    });
  }
};

export default handler;
