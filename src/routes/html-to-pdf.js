import { pdfService } from '../services/pdf-service.js';
import { storageService } from '../services/storage-service.js';
import { validateBody, validators } from '../middleware/error-handler.js';
import { errorUtils } from '../utils/error-utils.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Route handler for converting HTML to PDF
 * @param {Object} c - Hono context
 * @returns {Response} - PDF file response
 */
export async function htmlToPdfHandler(c) {
  try {
    const { html, options, filename = 'document.pdf', store = false } = c.get('body');
    
    // Generate PDF from HTML
    const pdfBuffer = await pdfService.generatePdf(html, options);
    
    // Store the PDF in Supabase if requested
    if (store) {
      try {
        // Extract metadata from the request
        const metadata = {
          contentType: 'application/pdf',
          options,
          userAgent: c.req.header('user-agent'),
          timestamp: new Date().toISOString()
        };
        
        // Get user email from context
        const userEmail = c.get('userEmail');
        
        // Store the PDF with user association
        const result = await storageService.storePdf(pdfBuffer, filename, metadata, userEmail);
        
        // Add storage information to the response headers
        c.header('X-Storage-Path', result.path);
      } catch (storageError) {
        // Log the error but don't fail the request
        console.error('Error storing PDF in Supabase:', storageError);
      }
    }
    
    // Set response headers
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the PDF buffer
    return c.body(pdfBuffer);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for HTML to PDF endpoint
 */
export const htmlToPdfRoute = {
  method: 'POST',
  path: '/api/1/html-to-pdf',
  middleware: [authMiddleware, validateBody(validators.htmlContent)],
  handler: htmlToPdfHandler
};