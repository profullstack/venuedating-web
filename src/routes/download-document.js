import { storageService } from '../services/storage-service.js';
import { errorUtils } from '../utils/error-utils.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { supabase } from '../utils/supabase.js';

/**
 * Route handler for downloading documents from storage
 * @param {Object} c - Hono context
 * @returns {Response} - Document file response
 */
export async function downloadDocumentHandler(c) {
  try {
    // Get the document path from query parameters
    const path = c.req.query('path');
    
    if (!path) {
      return c.json({ error: 'Document path is required' }, 400);
    }
    
    console.log(`Downloading document from path: ${path}`);
    
    // Extract the filename from the path
    const filename = path.split('/').pop();
    
    // Get the file from Supabase storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(path);
    
    if (error) {
      console.error('Error downloading document:', error);
      return c.json({ error: 'Error downloading document', details: error.message }, 500);
    }
    
    if (!data) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    // Determine content type based on file extension
    const contentType = getContentTypeFromFilename(filename);
    
    // Set response headers
    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the file data
    return c.body(data);
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Get content type based on filename
 * @param {string} filename - Filename
 * @returns {string} - Content type
 */
function getContentTypeFromFilename(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  
  const contentTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'epub': 'application/epub+zip',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'html': 'text/html'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Route configuration for download document endpoint
 */
export const downloadDocumentRoute = {
  method: 'GET',
  path: '/api/1/download-document',
  middleware: [authMiddleware],
  handler: downloadDocumentHandler
};