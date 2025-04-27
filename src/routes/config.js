import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for Supabase configuration
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with Supabase configuration
 */
export async function supabaseConfigHandler(c) {
  try {
    // Get Supabase URL and anon key from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        error: 'Supabase configuration not available' 
      }, 500);
    }
    
    // Return the configuration
    return c.json({
      supabaseUrl,
      supabaseAnonKey
    });
  } catch (error) {
    console.error('Error in Supabase config handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for Supabase config endpoint
 */
export const supabaseConfigRoute = {
  method: 'GET',
  path: '/api/1/config/supabase',
  handler: supabaseConfigHandler
};