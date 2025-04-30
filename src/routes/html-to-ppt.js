import { pptService } from '../services/ppt-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to PowerPoint presentation
 * @param {Object} c - Hono context
 * @returns {Response} - PowerPoint file response
 */
export async function htmlToPptHandler(c) {
  try {
    const { html, filename = 'presentation.pptx', title = 'Presentation', store = false } = c.get('body');
    
    // Generate PowerPoint presentation from HTML
    const pptBuffer = await pptService.generatePpt(html, title);
    
    // Store the PowerPoint in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          title,
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString()
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the PowerPoint with user association and original HTML content
        const result = await storageService.storePpt(pptBuffer, filename, metadata, userEmail, html);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing PowerPoint in Supabase:', storageError);
      }
    }
    
    // Set response headers
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the PowerPoint buffer
    return c.body(pptBuffer);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to PowerPoint endpoint
 */
export const htmlToPptRoute = {
  method: 'POST',
  path: '/api/1/html-to-ppt',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToPptHandler
};