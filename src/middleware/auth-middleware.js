import { apiKeyService } from '../services/api-key-service.js';
import { errorUtils } from '../utils/error-utils.js';

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
      '/api/1/payment-callback',
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
      const apiKey = authHeader.substring(7);
      user = await apiKeyService.validateApiKey(apiKey);
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
        error: 'Unauthorized. Valid API key required.', 
        subscription_required: true,
        subscription_url: `${process.env.API_BASE_URL || 'https://pdf.profullstack.com'}/subscription`
      }, 401);
    }
    
    // Set user in context for later use
    c.set('user', user);
    
    // Continue to the next middleware or route handler
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorUtils.handleError(error, c);
  }
}