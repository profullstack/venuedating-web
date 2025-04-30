import { docService } from '../services/doc-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to Word document
 * @param {Object} c - Hono context
 * @returns {Response} - Word document file response
 */
export async function htmlToDocHandler(c) {
  try {
    const { html, filename = 'document.doc', store = false } = c.get('body');
    
    // Generate Word document from HTML
    const docBuffer = docService.generateDoc(html);
    
    // Store the document in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'application/msword',
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString()
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the document with user association and original HTML content
        const result = await storageService.storeDoc(docBuffer, filename, metadata, userEmail, html);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing Word document in Supabase:', storageError);
      }
    }
    
    // Set response headers
    c.header('Content-Type', 'application/msword');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the document buffer
    return c.body(docBuffer);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to Word document endpoint
 */
export const htmlToDocRoute = {
  method: 'POST',
  path: '/api/1/html-to-doc',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToDocHandler
};