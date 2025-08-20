import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';
import fs from 'fs/promises';
import { marked } from 'marked';
import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';
import PptxGenJS from 'pptxgenjs';
import TurndownService from 'turndown';

// Import the WebXR integration
import { integrateWebXR } from './webxr/hono-integration.js';

// Load environment variables
dotenvFlow.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// Import Supabase for database operations
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Integrate WebXR experience at /webxr path
integrateWebXR(app);

// SPA routing middleware - all routes without extensions go to index.html
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  
  // Skip API routes and WebXR routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/webxr/')) {
    return next();
  }
  
  // If the path has no extension, it's an SPA route
  if (pathname !== '/' && !pathname.includes('.')) {
    console.log(`SPA route detected: ${pathname}`);
    // Serve index.html for all SPA routes
    const indexPath = path.join(__dirname, 'public', 'index.html');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      return c.html(indexContent);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
      return c.text('Internal Server Error', 500);
    }
  }
  
  return next();
});

// Serve static files from the public directory
app.use('/*', serveStatic({ root: './public' }));

// Final fallback for any routes that weren't handled
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  
  console.log(`Fallback handler for: ${pathname}`);
  
  // If we got here and it's not an API route, WebXR route, or a file with extension, serve index.html
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/webxr/') && !pathname.includes('.')) {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      return c.html(indexContent);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
      return c.text('Internal Server Error', 500);
    }
  }
  
  // If we got here, it's a 404
  return c.text('Not Found', 404);
});

// Health check endpoint
app.get('/', (c) => {
  // If the request accepts HTML, the static file middleware will handle it
  if (c.req.header('accept')?.includes('text/html')) {
    return c.next();
  }
  // Otherwise, return a JSON response
  return c.json({ status: 'ok', message: 'Document generation service is running' });
});

// HTML to PDF endpoint
app.post('/api/1/html-to-pdf', async (c) => {
  try {
    // Get HTML content from request body
    const { html } = await c.req.json();
    
    if (!html) {
      return c.json({ error: 'HTML content is required' }, 400);
    }

    // Launch a new browser instance
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });
    
    // Close the browser
    await browser.close();
    
    // Set response headers
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', 'attachment; filename="document.pdf"');
    
    // Return the PDF buffer
    return c.body(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

// HTML to Word document endpoint
app.post('/api/1/html-to-doc', async (c) => {
  try {
    // Get HTML content and optional filename from request body
    const { html, filename = 'document.doc' } = await c.req.json();
    
    if (!html) {
      return c.json({ error: 'HTML content is required' }, 400);
    }

    // Create Word document from HTML
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head><body>`;
    const footer = `</body></html>`;
    const sourceHTML = header + html + footer;

    // Add BOM (Byte Order Mark) for proper encoding in Word
    const bomPrefix = Buffer.from([0xEF, 0xBB, 0xBF]);
    const htmlBuffer = Buffer.from(sourceHTML);
    const docBuffer = Buffer.concat([bomPrefix, htmlBuffer]);
    
    // Set response headers
    c.header('Content-Type', 'application/msword');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the document buffer
    return c.body(docBuffer);
  } catch (error) {
    console.error('Error generating Word document:', error);
    return c.json({ error: 'Failed to generate Word document' }, 500);
  }
});

// Markdown to HTML conversion endpoint
app.post('/api/1/markdown-to-html', async (c) => {
  try {
    // Get markdown content from request body
    const { markdown, options = {} } = await c.req.json();
    
    if (!markdown) {
      return c.json({ error: 'Markdown content is required' }, 400);
    }

    // Configure marked options
    const markedOptions = {
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      headerIds: true, // Add IDs to headers
      ...options
    };

    // Convert markdown to HTML
    const html = marked(markdown, markedOptions);
    
    // Return the HTML
    return c.json({ html });
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    return c.json({ error: 'Failed to convert markdown to HTML' }, 500);
  }
});

// HTML to Markdown conversion endpoint
app.post('/api/1/html-to-markdown', async (c) => {
  try {
    // Get HTML content from request body
    const { html, options = {} } = await c.req.json();
    
    if (!html) {
      return c.json({ error: 'HTML content is required' }, 400);
    }

    // Create a new TurndownService instance
    const turndownService = new TurndownService(options);
    
    // Configure turndown options
    turndownService.use([
      // Add any plugins or rules here
    ]);
    
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(html);
    
    // Return the Markdown
    return c.json({ markdown });
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return c.json({ error: 'Failed to convert HTML to Markdown' }, 500);
  }
});

// HTML to Excel conversion endpoint
app.post('/api/1/html-to-excel', async (c) => {
  try {
    // Get HTML content and optional filename from request body
    const { html, filename = 'document.xlsx', sheetName = 'Sheet1' } = await c.req.json();
    
    if (!html) {
      return c.json({ error: 'HTML content is required' }, 400);
    }

    // Create a DOM from the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Find all tables in the HTML
    const tables = document.querySelectorAll('table');
    
    if (tables.length === 0) {
      return c.json({ error: 'No tables found in the HTML content' }, 400);
    }
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Process each table and add it as a sheet
    tables.forEach((table, index) => {
      // Convert table to worksheet
      const worksheet = XLSX.utils.table_to_sheet(table);
      
      // Add the worksheet to the workbook
      const currentSheetName = tables.length === 1 ? sheetName : `${sheetName}${index + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, currentSheetName);
    });
    
    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the Excel buffer
    return c.body(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return c.json({ error: 'Failed to generate Excel file' }, 500);
  }
});

// HTML to PowerPoint conversion endpoint
app.post('/api/1/html-to-ppt', async (c) => {
  try {
    // Get HTML content and optional filename from request body
    const { html, filename = 'presentation.pptx', title = 'Presentation' } = await c.req.json();
    
    if (!html) {
      return c.json({ error: 'HTML content is required' }, 400);
    }

    // Create a DOM from the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Create a new PowerPoint presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Document Generation API';
    pptx.title = title;
    
    // Extract headings and content from HTML
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      // If no headings found, create a single slide with the HTML content
      const slide = pptx.addSlide();
      slide.addText(document.body.textContent || 'Empty content', { 
        x: 0.5, 
        y: 0.5, 
        w: '90%', 
        h: 1, 
        fontSize: 18,
        color: '363636'
      });
    } else {
      // Create slides based on headings
      headings.forEach((heading, index) => {
        const slide = pptx.addSlide();
        
        // Add heading as title
        slide.addText(heading.textContent || `Slide ${index + 1}`, { 
          x: 0.5, 
          y: 0.5, 
          w: '90%', 
          fontSize: 24,
          bold: true,
          color: '0000FF'
        });
        
        // Get content until next heading or end of document
        let content = '';
        let nextElement = heading.nextElementSibling;
        
        while (nextElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextElement.tagName)) {
          if (nextElement.textContent) {
            content += nextElement.textContent + '\n';
          }
          nextElement = nextElement.nextElementSibling;
        }
        
        // Add content if available
        if (content.trim()) {
          slide.addText(content, { 
            x: 0.5, 
            y: 1.5, 
            w: '90%', 
            fontSize: 14,
            color: '363636'
          });
        }
        
        // Look for images in the section
        const sectionStart = heading;
        const sectionEnd = nextElement;
        let currentElement = sectionStart;
        
        while (currentElement && currentElement !== sectionEnd) {
          if (currentElement.tagName === 'IMG' && currentElement.src) {
            try {
              // For base64 images
              if (currentElement.src.startsWith('data:image')) {
                slide.addImage({ 
                  data: currentElement.src, 
                  x: 1, 
                  y: 3, 
                  w: 4, 
                  h: 3 
                });
              }
              // Note: For external images, we would need to fetch them first
              // This is simplified for the example
            } catch (err) {
              console.error('Error adding image to slide:', err);
            }
          }
          currentElement = currentElement.nextElementSibling;
        }
      });
    }
    
    // Generate the PowerPoint file
    const pptBuffer = await pptx.writeFile({ outputType: 'nodebuffer' });
    
    // Set response headers
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return the PowerPoint buffer
    return c.body(pptBuffer);
  } catch (error) {
    console.error('Error generating PowerPoint file:', error);
    return c.json({ error: 'Failed to generate PowerPoint file' }, 500);
  }
});

// Middleware to verify JWT token
async function verifyToken(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization token required' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    // Store user in context for use in route handlers
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ error: 'Token verification failed' }, 401);
  }
}

// Square API Endpoints

// Get Square credentials
app.get('/api/square-credentials', verifyToken, async (c) => {
  try {
    // Return Square sandbox credentials for development
    // In production, these should come from environment variables
    const credentials = {
      applicationId: process.env.SQUARE_APPLICATION_ID || 'sandbox-sq0idb-your-app-id',
      locationId: process.env.SQUARE_LOCATION_ID || 'sandbox-location-id',
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
    };
    
    return c.json(credentials);
  } catch (error) {
    console.error('Error fetching Square credentials:', error);
    return c.json({ error: 'Failed to fetch Square credentials' }, 500);
  }
});

// Process Square payment
app.post('/api/process-payment', verifyToken, async (c) => {
  try {
    const { token, amount, currency = 'USD' } = await c.req.json();
    const user = c.get('user');
    
    if (!token || !amount) {
      return c.json({ error: 'Payment token and amount are required' }, 400);
    }
    
    // In a real implementation, you would process the payment with Square here
    // For now, we'll simulate a successful payment
    console.log(`Processing payment for user ${user.id}: $${amount/100} ${currency}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update user's payment status in the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ has_paid: true })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return c.json({ error: 'Failed to update payment status' }, 500);
    }
    
    return c.json({
      success: true,
      paymentId: `payment_${Date.now()}`,
      amount,
      currency,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return c.json({ error: 'Payment processing failed' }, 500);
  }
});

// Get user profile
app.get('/api/user-profile', verifyToken, async (c) => {
  try {
    const user = c.get('user');
    
    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return c.json({ error: 'Failed to fetch user profile' }, 500);
    }
    
    return c.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch user profile' }, 500);
  }
});

// Check payment status
app.get('/api/user/payment-status', verifyToken, async (c) => {
  try {
    const user = c.get('user');
    
    // Get payment status from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('has_paid')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching payment status:', error);
      return c.json({ error: 'Failed to fetch payment status' }, 500);
    }
    
    return c.json({ has_paid: profile.has_paid || false });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return c.json({ error: 'Failed to fetch payment status' }, 500);
  }
});

// Update payment status
app.post('/api/user/payment-status', verifyToken, async (c) => {
  try {
    const { has_paid } = await c.req.json();
    const user = c.get('user');
    
    if (typeof has_paid !== 'boolean') {
      return c.json({ error: 'has_paid must be a boolean value' }, 400);
    }
    
    // Update payment status in database
    const { error } = await supabase
      .from('profiles')
      .update({ has_paid })
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating payment status:', error);
      return c.json({ error: 'Failed to update payment status' }, 500);
    }
    
    return c.json({ success: true, has_paid });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return c.json({ error: 'Failed to update payment status' }, 500);
  }
});

// Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
  console.log(`- HTML to PDF endpoint: http://localhost:${info.port}/api/1/html-to-pdf`);
  console.log(`- HTML to DOC endpoint: http://localhost:${info.port}/api/1/html-to-doc`);
  console.log(`- HTML to Excel endpoint: http://localhost:${info.port}/api/1/html-to-excel`);
  console.log(`- HTML to PowerPoint endpoint: http://localhost:${info.port}/api/1/html-to-ppt`);
  console.log(`- HTML to Markdown endpoint: http://localhost:${info.port}/api/1/html-to-markdown`);
  console.log(`- Markdown to HTML endpoint: http://localhost:${info.port}/api/1/markdown-to-html`);
  console.log(`- WebXR Experience: http://localhost:${info.port}/webxr`);
  console.log(`- Web interface: http://localhost:${info.port}`);
});