import { markdownService } from '../services/markdown-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to Markdown
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with Markdown content
 */
export async function htmlToMarkdownHandler(c) {
  try {
    const { html, options = {} } = c.get('body');
    
    // Convert HTML to Markdown
    const markdown = markdownService.htmlToMarkdown(html, options);
    
    // Return the Markdown as JSON
    return c.json({ markdown });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to Markdown endpoint
 */
export const htmlToMarkdownRoute = {
  method: 'POST',
  path: '/api/1/html-to-markdown',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToMarkdownHandler
};