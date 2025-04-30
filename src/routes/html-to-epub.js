import { epubService } from '../services/epub-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for converting HTML to EPUB
 * @param {Object} c - Hono context
 * @returns {Response} - EPUB file response
 */
export async function htmlToEpubHandler(c) {
  try {
    const { html, filename = 'document.epub', title, author, cover, store = false } = c.get('body');
    
    // Generate EPUB from HTML
    const epubBuffer = await epubService.generateEpub(html, { title, author, cover });
    
    // Store the EPUB in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'application/epub+zip',
          title,
          author,
          hasCover: !!cover,
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString()
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the EPUB with user association and original HTML content
        const result = await storageService.storeEpub(epubBuffer, filename, metadata, userEmail, html);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing EPUB in Supabase:', storageError);
      }
    }
    
    // Set response headers
    c.header('Content-Type', 'application/epub+zip');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the EPUB buffer
    return c.body(epubBuffer);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to EPUB endpoint
 */
export const htmlToEpubRoute = {
  method: 'POST',
  path: '/api/1/html-to-epub',
  middleware: [validateBody(validators.htmlContent)],
  handler: htmlToEpubHandler
};