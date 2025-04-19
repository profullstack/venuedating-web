import { docService } from '../services/doc-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to Word document
 * @param {Object} c - Hono context
 * @returns {Response} - Word document file response
 */
export async function htmlToDocHandler(c) {
  try {
    const { html, filename = 'document.doc' } = c.get('body');
    
    // Generate Word document from HTML
    const docBuffer = docService.generateDoc(html);
    
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