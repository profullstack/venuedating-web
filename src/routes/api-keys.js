import { apiKeyService } from '../services/api-key-service.js';
import { errorUtils } from '../utils/error-utils.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Route handler for creating an API key
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with API key details
 */
export async function createApiKeyHandler(c) {
  try {
    const { name } = await c.req.json();
    const user = c.get('user');
    
    if (!name) {
      return c.json({ error: 'API key name is required' }, 400);
    }
    
    const apiKey = await apiKeyService.createApiKey(user.email, name);
    
    return c.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      created_at: apiKey.created_at
    });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for listing API keys
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with API keys
 */
export async function listApiKeysHandler(c) {
  try {
    const user = c.get('user');
    const apiKeys = await apiKeyService.getApiKeys(user.email);
    
    // Don't return the actual key values for security
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      created_at: key.created_at
    }));
    
    return c.json({ api_keys: sanitizedKeys });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for updating an API key
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with updated API key
 */
export async function updateApiKeyHandler(c) {
  try {
    const { id } = c.req.param();
    const { name, is_active } = await c.req.json();
    const user = c.get('user');
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const apiKey = await apiKeyService.updateApiKey(user.email, id, updates);
    
    return c.json({
      id: apiKey.id,
      name: apiKey.name,
      is_active: apiKey.is_active,
      last_used_at: apiKey.last_used_at,
      created_at: apiKey.created_at
    });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for deleting an API key
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with success status
 */
export async function deleteApiKeyHandler(c) {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    
    await apiKeyService.deleteApiKey(user.email, id);
    
    return c.json({ success: true });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for API key endpoints
 */
export const apiKeyRoutes = [
  {
    method: 'GET',
    path: '/api/1/api-keys',
    middleware: [authMiddleware],
    handler: listApiKeysHandler
  },
  {
    method: 'POST',
    path: '/api/1/api-keys',
    middleware: [authMiddleware],
    handler: createApiKeyHandler
  },
  {
    method: 'PUT',
    path: '/api/1/api-keys/:id',
    middleware: [authMiddleware],
    handler: updateApiKeyHandler
  },
  {
    method: 'DELETE',
    path: '/api/1/api-keys/:id',
    middleware: [authMiddleware],
    handler: deleteApiKeyHandler
  }
];