import { storageService } from '../services/storage-service.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for getting document generation history
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with document history
 */
export async function documentHistoryHandler(c) {
  try {
    // Get pagination parameters from query
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    
    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return c.json({ error: 'Invalid limit parameter. Must be between 1 and 100.' }, 400);
    }
    
    if (isNaN(offset) || offset < 0) {
      return c.json({ error: 'Invalid offset parameter. Must be a non-negative integer.' }, 400);
    }
    
    // Get user email from auth context
    const userEmail = c.get('userEmail');
    
    // Get document history from storage service, filtered by user
    const history = await storageService.getDocumentHistory(limit, offset, userEmail);
    
    // Return the document history
    return c.json({
      data: history,
      pagination: {
        limit,
        offset,
        total: history.length // Note: This is not the total count, just the count of returned items
      }
    });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for document history endpoint
 */
export const documentHistoryRoute = {
  method: 'GET',
  path: '/api/1/document-history',
  middleware: [],
  handler: documentHistoryHandler
};