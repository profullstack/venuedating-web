import { markdownService } from '../services/markdown-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting Markdown to HTML
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with HTML content
 */
export async function markdownToHtmlHandler(c) {
  try {
    const { markdown, options = {} } = c.get('body');
    
    // Convert Markdown to HTML
    const html = markdownService.markdownToHtml(markdown, options);
    
    // Return the HTML as JSON
    return c.json({ html });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for Markdown to HTML endpoint
 */
export const markdownToHtmlRoute = {
  method: 'POST',
  path: '/api/1/markdown-to-html',
  middleware: [validateBody(validators.markdownContent)],
  handler: markdownToHtmlHandler
};