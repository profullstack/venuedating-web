import { apiKeyService } from '../services/api-key-service.js';
import { errorUtils } from '../utils/error-utils.js';
import { supabase, supabaseUtils } from '../utils/supabase.js';

/**
 * Constants for authentication
 */
const AUTH_CONSTANTS = {
  PUBLIC_ENDPOINTS: [
    '/api/1/payments/cryptapi/callback',
    '/api/1/subscription',
    '/api/1/subscription-status'
  ],
  API_KEY_PREFIX: 'pfs_',
  TOKEN_MIN_LENGTH: 100
};

/**
 * Authentication middleware
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
    
    // Get auth headers
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('X-API-Key');
    
    let user = null;
    
    // Check Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      user = await authenticateWithToken(token, c.req.path);
    }
    // Check X-API-Key header (for backward compatibility)
    else if (apiKeyHeader) {
      user = await authenticateWithApiKeyHeader(apiKeyHeader);
    }
    
    // Handle unauthorized access
    if (!user) {
      return createUnauthorizedResponse(c);
    }
    
    // Ensure is_admin is always present in user object
    if (typeof user.is_admin === 'undefined') {
      user.is_admin = false;
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
 * Authenticate with token from Authorization header
 * @param {string} token - Token from Authorization header
 * @param {string} path - Request path for logging
 * @returns {Promise<Object|null>} - User object or null if authentication fails
 */
async function authenticateWithToken(token, path) {
  console.log(`Auth middleware: Processing request for path ${path}`);
  console.log(`Auth middleware: Found Bearer token of length ${token.length}`);
  
  // Handle invalid token cases including literal "null" string
  if (!token || token === 'null' || token.length < AUTH_CONSTANTS.TOKEN_MIN_LENGTH) {
    console.error('Auth middleware: Token appears to be malformed or truncated:', token);
    console.error('Auth middleware: Skipping JWT verification for invalid token');
    // Try as API key
    return await authenticateWithApiKey(token);
  }
  
  // First, try to validate as JWT token
  const user = await authenticateWithJwt(token);
  
  // If JWT validation failed, try as API key
  if (!user) {
    return await authenticateWithApiKey(token);
  }
  
  return user;
}

/**
 * Authenticate with JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} - User object or null if authentication fails
 */
async function authenticateWithJwt(token) {
  try {
    console.log('Auth middleware: Attempting to verify JWT token');
    // Verify JWT token with Supabase
    const supabaseUser = await supabaseUtils.verifyJwtToken(token);
    
    if (!supabaseUser) {
      console.log('Auth middleware: JWT token verification failed, no user returned');
      return null;
    }
    
    console.log(`Auth middleware: JWT token verified for user ${supabaseUser.email}`);
    
    // Get user from database using email
    let user = await apiKeyService._getUserByEmail(supabaseUser.email);
    
    if (!user) {
      console.log(`Auth middleware: Creating new user for ${supabaseUser.email}`);
      // Create user if not exists
      user = await apiKeyService._createUserIfNotExists(supabaseUser.email);
    }
    
    return user;
  } catch (jwtError) {
    console.error('Auth middleware: JWT validation error:', jwtError);
    console.log('Auth middleware: JWT validation failed, trying as API key');
    return null;
  }
}

/**
 * Authenticate with API key
 * @param {string} apiKey - API key
 * @returns {Promise<Object|null>} - User object or null if authentication fails
 */
async function authenticateWithApiKey(apiKey) {
  console.log('Auth middleware: Attempting to validate as API key');
  const user = await apiKeyService.validateApiKey(apiKey);
  
  if (user) {
    console.log('Auth middleware: API key validation successful');
  } else {
    console.log('Auth middleware: API key validation failed');
  }
  
  return user;
}

/**
 * Authenticate with API key header
 * @param {string} apiKeyHeader - API key header value
 * @returns {Promise<Object|null>} - User object or null if authentication fails
 */
async function authenticateWithApiKeyHeader(apiKeyHeader) {
  // If it looks like an API key (starts with pfs_), validate it
  if (apiKeyHeader.startsWith(AUTH_CONSTANTS.API_KEY_PREFIX)) {
    return await apiKeyService.validateApiKey(apiKeyHeader);
  }
  // Otherwise, treat it as an email address (legacy behavior)
  else {
    const email = apiKeyHeader;
    const hasAccess = await apiKeyService.hasAccess(email);
    
    if (hasAccess) {
      return { email, is_admin: false };
    }
  }
  
  return null;
}

/**
 * Create unauthorized response
 * @param {Object} c - Hono context
 * @returns {Response} - Unauthorized response
 */
function createUnauthorizedResponse(c) {
  return c.json({
    error: 'Unauthorized. Valid API key or JWT token required.',
    subscription_required: true,
    subscription_url: `${process.env.API_BASE_URL || 'https://convert2doc.com'}/subscription`
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
  
  // Also set user email for easier access
  c.set('userEmail', user.email);
}
