/**
 * Simple HTTP server for UI testing
 * Serves the public directory on port 8080
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// MIME types for common file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  try {
    // Get the file path
    let filePath = join(publicDir, req.url === '/' ? 'index.html' : req.url);
    
    // Handle SPA routing - serve index.html for paths that don't have a file extension
    if (!extname(filePath)) {
      filePath = join(publicDir, 'index.html');
    }
    
    // Get the file extension and content type
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Read the file
    const content = await readFile(filePath);
    
    // Send the response
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    
  } catch (error) {
    // Handle file not found
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    
    // Handle other errors
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 Internal Server Error</h1>');
  }
});

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`
=================================================
🚀 Server running at http://localhost:${PORT}
=================================================

Press Ctrl+C to stop the server
  `);
});
