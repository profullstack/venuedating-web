import { createClient } from '@supabase/supabase-js';
import { errorUtils } from '../utils/error-utils.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Constants for authentication
 */
const AUTH_CONSTANTS = {
  PUBLIC_ENDPOINTS: [
    '/api/create-checkout-session',
    '/api/user/payment-status',
    '/api/square-credentials',
    '/api/process-payment',
    '/api/user-profile'
  ]
};

/**
 * Authentication middleware for phone-based authentication
 * @param {Object} c - Hono context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} - Response object
 */
export async function authMiddleware(c, next) {
  try {
    // Skip authentication for public endpoints
    if (isPublicEndpoint(c.req.path)) {
      console.log(`Auth middleware: Skipping authentication for public endpoint: ${c.req.path}`);
      return next();
    }
    
    // Get user data from request body (phone-based auth)
    const body = await c.req.json().catch(() => ({}));
    const { userId, phone } = body;
    
    let user = null;
    
    // Phone-based authentication
    if (userId && phone) {
      user = await authenticateWithPhone(userId, phone);
    }
    
    // Handle unauthorized access
    if (!user) {
      return createUnauthorizedResponse(c);
    }
    
    // Set user in context for later use
    setUserInContext(c, user);
    
    // Continue to the next middleware or route handler
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Check if the endpoint is public (no auth required)
 * @param {string} path - Request path
 * @returns {boolean} - True if public endpoint
 */
function isPublicEndpoint(path) {
  return AUTH_CONSTANTS.PUBLIC_ENDPOINTS.includes(path);
}

/**
 * Authenticate with phone number and user ID
 * @param {string} userId - User ID from localStorage
 * @param {string} phone - Phone number from localStorage
 * @returns {Promise<Object|null>} - User object or null if authentication fails
 */
async function authenticateWithPhone(userId, phone) {
  try {
    console.log(`Auth middleware: Authenticating user ${userId} with phone ${phone}`);
    
    // Verify user exists in database by phone and ID
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, phone, name, email, has_paid')
      .eq('id', userId)
      .eq('phone', phone)
      .single();
    
    if (userError || !userRecord) {
      console.log('Auth middleware: User not found or phone mismatch');
      return null;
    }
    
    console.log(`Auth middleware: Phone authentication successful for user ${userRecord.name || userRecord.id}`);
    
    return {
      id: userRecord.id,
      phone: userRecord.phone,
      name: userRecord.name,
      email: userRecord.email,
      has_paid: userRecord.has_paid || false,
      is_admin: false
    };
  } catch (error) {
    console.error('Auth middleware: Phone authentication error:', error);
    return null;
  }
}

/**
 * Create unauthorized response
 * @param {Object} c - Hono context
 * @returns {Response} - Unauthorized response
 */
function createUnauthorizedResponse(c) {
  return c.json({
    error: 'Unauthorized. User ID and phone number required.',
    authentication_required: true
  }, 401);
}

/**
 * Set user in context
 * @param {Object} c - Hono context
 * @param {Object} user - User object
 */
function setUserInContext(c, user) {
  // Set user in context for later use
  c.set('user', user);
  
  // Also set user phone for easier access
  c.set('userPhone', user.phone);
  c.set('userId', user.id);
}
