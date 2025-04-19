import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';
import fs from 'fs';
import http from 'http';

import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

// Load environment variables
dotenvFlow.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.resolve(__dirname, '../public');

console.log('Starting server...');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Public directory:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));

if (fs.existsSync(publicPath)) {
  console.log('Files in public directory:');
  fs.readdirSync(publicPath).forEach(file => {
    console.log(`- ${file}`);
  });
}

// Create a simple HTTP server to serve static files
const staticServer = http.createServer((req, res) => {
  // Parse the URL to get the pathname
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;
  
  // Default to index.html for the root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Construct the file path
  const filePath = path.join(publicPath, pathname);
  
  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist
      console.error(`File not found: ${filePath}`);
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Determine the content type based on file extension
    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    
    switch (ext) {
      case '.html':
        contentType = 'text/html';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${filePath}`, err);
        res.writeHead(500);
        res.end('Internal server error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Start the static file server
const staticPort = 8099;
staticServer.listen(staticPort, () => {
  console.log(`Static file server running at http://localhost:${staticPort}`);
});

// Create Hono app for API endpoints
const app = new Hono();

// Global error handler middleware
app.use('*', errorHandler);

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'Document generation service is running',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Register all API routes
registerRoutes(app);

// Start the API server
const apiPort = 3000;
serve({
  fetch: app.fetch,
  port: apiPort
}, (info) => {
  console.log(`API server running at http://localhost:${info.port}`);
  console.log('Available endpoints:');
  console.log(`- HTML to PDF: http://localhost:${info.port}/api/1/html-to-pdf`);
  console.log(`- HTML to DOC: http://localhost:${info.port}/api/1/html-to-doc`);
  console.log(`- HTML to Excel: http://localhost:${info.port}/api/1/html-to-excel`);
  console.log(`- HTML to PowerPoint: http://localhost:${info.port}/api/1/html-to-ppt`);
  console.log(`- HTML to EPUB: http://localhost:${info.port}/api/1/html-to-epub`);
  console.log(`- HTML to Markdown: http://localhost:${info.port}/api/1/html-to-markdown`);
  console.log(`- Markdown to HTML: http://localhost:${info.port}/api/1/markdown-to-html`);
  console.log(`- Document History: http://localhost:${info.port}/api/1/document-history`);
  console.log(`- Subscription: http://localhost:${info.port}/api/1/subscription`);
  console.log(`- Subscription Status: http://localhost:${info.port}/api/1/subscription-status`);
  console.log(`- Payment Callback: http://localhost:${info.port}/api/1/payment-callback`);
});