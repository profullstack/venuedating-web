import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';
import fs from 'fs';

import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { enableHttpDebugging } from './utils/http-debug.js';

// Enable HTTP debugging for detailed request/response logging
console.log('Enabling HTTP debugging for detailed request/response logging');
enableHttpDebugging();

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

// Create Hono app for both static files and API endpoints
const app = new Hono();

// Log when requests are received and add cache control headers
app.use('*', async (c, next) => {
  console.log(`Request for: ${c.req.path}`);
  
  // Add cache control headers to prevent caching for SPA routes
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  c.header('Surrogate-Control', 'no-store');
  
  // Handle SPA routes (paths without extensions)
  const reqPath = c.req.path;
  if (reqPath !== '/' && !reqPath.includes('.') && !reqPath.startsWith('/api/')) {
    console.log(`SPA route detected: ${reqPath}`);
    try {
      const indexPath = path.resolve(__dirname, '../public/index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      return c.html(content);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
    }
  }
  
  await next();
});

// Global error handler middleware
app.use('*', errorHandler);

// Serve static files from the public directory
app.use('*', serveStatic({
  root: './public',
  rewriteRequestPath: (path) => {
    console.log(`Static file request for: ${path}`);
    return path;
  }
}));

// SPA fallback for routes that don't match any static files
app.get('*', async (c) => {
  const reqPath = c.req.path;
  
  // Skip API routes and files with extensions
  if (reqPath.startsWith('/api/') || reqPath.includes('.')) {
    return c.notFound();
  }
  
  console.log(`SPA fallback for: ${reqPath}`);
  
  // Serve index.html for client-side routes
  try {
    const indexPath = path.resolve(__dirname, '../public/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    return c.html(content);
  } catch (error) {
    console.error(`Error serving index.html: ${error.message}`);
    return c.text('Internal Server Error', 500);
  }
});

// Health check endpoint
app.get('/', (c) => {
  // If the request accepts HTML, let the static middleware handle it
  if (c.req.header('accept')?.includes('text/html')) {
    return c.next();
  }
  
  // Otherwise, return a JSON response
  return c.json({
    status: 'ok',
    message: 'Document generation service is running',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Register all API routes
registerRoutes(app);

// Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
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
  console.log(`- Web interface: http://localhost:${info.port}`);
});