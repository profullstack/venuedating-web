import { apiKeyService } from '../services/api-key-service.js';
import { errorUtils } from '../utils/error-utils.js';
import { supabase, supabaseUtils } from '../utils/supabase.js';

/**
 * Authentication middleware
 * @param {Object} c - Hono context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} - Response object
 */
export async function authMiddleware(c, next) {
  try {
    // Skip authentication for public endpoints
    const publicEndpoints = [
      '/api/1/payments/cryptapi/callback',
      '/api/1/subscription',
      '/api/1/subscription-status'
    ];
    
    if (publicEndpoints.includes(c.req.path)) {
      return next();
    }
    
    // Get API key from header
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('X-API-Key');
    
    let user = null;
    
    // Check Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // First, try to validate as JWT token
      try {
        // Verify JWT token with Supabase
        const supabaseUser = await supabaseUtils.verifyJwtToken(token);
        
        if (supabaseUser) {
          // Get user from database using email
          user = await apiKeyService._getUserByEmail(supabaseUser.email);
          
          if (!user) {
            // Create user if not exists
            user = await apiKeyService._createUserIfNotExists(supabaseUser.email);
          }
        }
      } catch (jwtError) {
        console.log('JWT validation failed, trying as API key:', jwtError.message);
      }
      
      // If JWT validation failed, try as API key
      if (!user) {
        // Try to validate as API key
        user = await apiKeyService.validateApiKey(token);
      }
    }
    // Check X-API-Key header (for backward compatibility)
    else if (apiKeyHeader) {
      // If it looks like an API key (starts with pfs_), validate it
      if (apiKeyHeader.startsWith('pfs_')) {
        user = await apiKeyService.validateApiKey(apiKeyHeader);
      }
      // Otherwise, treat it as an email address (legacy behavior)
      else {
        const email = apiKeyHeader;
        const hasAccess = await apiKeyService.hasAccess(email);
        
        if (hasAccess) {
          user = { email, is_admin: false };
        }
      }
    }
    
    if (!user) {
      return c.json({
        error: 'Unauthorized. Valid API key or JWT token required.',
        subscription_required: true,
        subscription_url: `${process.env.API_BASE_URL || 'https://pdf.profullstack.com'}/subscription`
      }, 401);
    }
    
    // Set user in context for later use
    c.set('user', user);
    
    // Also set user email for easier access
    c.set('userEmail', user.email);
    
    // Continue to the next middleware or route handler
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorUtils.handleError(error, c);
  }
}