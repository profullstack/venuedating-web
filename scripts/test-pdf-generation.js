import { pdfService } from '../src/services/pdf-service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple test script to verify PDF generation with the correct Chrome path
 */
async function testPdfGeneration() {
  console.log('Testing PDF generation with dynamic Chrome path detection...');
  
  try {
    // Simple HTML content for testing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PDF Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .info { color: #666; }
            .timestamp { margin-top: 50px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>PDF Generation Test</h1>
          <p class="info">This PDF was generated to test the dynamic Chrome path detection.</p>
          <p>If you can see this PDF, the Chrome executable path was correctly detected and used.</p>
          <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await pdfService.generatePdf(html);
    
    // Save the PDF to a file
    const outputPath = path.join(__dirname, '../test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`PDF successfully generated and saved to: ${outputPath}`);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

// Run the test
testPdfGeneration();