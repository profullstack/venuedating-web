import { pptService } from '../services/ppt-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to PowerPoint presentation
 * @param {Object} c - Hono context
 * @returns {Response} - PowerPoint file response
 */
export async function htmlToPptHandler(c) {
  try {
    const { html, filename = 'presentation.pptx', title = 'Presentation' } = c.get('body');
    
    // Generate PowerPoint presentation from HTML
    const pptBuffer = await pptService.generatePpt(html, title);
    
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