import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';

import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

// Load environment variables
dotenvFlow.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// Global error handler middleware
app.use('*', errorHandler);

// Health check endpoint for API requests
app.get('/', (c) => {
  // If the request doesn't accept HTML or explicitly wants JSON, return a JSON response
  const acceptHeader = c.req.header('accept') || '';
  if (!acceptHeader.includes('text/html') || acceptHeader.includes('application/json')) {
    return c.json({ 
      status: 'ok', 
      message: 'Document generation service is running',
      version: process.env.npm_package_version || '1.0.0'
    });
  }
  
  // For HTML requests, continue to the next middleware
  return c.body(null);
});

// Serve static files from the public directory
// This needs to be after the health check endpoint to handle HTML requests
app.use('/*', serveStatic({ root: '../public' }));

// Register all API routes
registerRoutes(app);

// Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
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
  console.log(`- Subscription page: http://localhost:${info.port}/subscription.html`);
});