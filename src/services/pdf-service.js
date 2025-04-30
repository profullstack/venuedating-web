import puppeteer from 'puppeteer';
import { getPuppeteerConfig } from '../utils/puppeteer-config.js';

/**
 * Service for generating PDF documents from HTML content
 */
export const pdfService = {
  /**
   * Generate a PDF from HTML content
   * @param {string} html - The HTML content to convert to PDF
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} - A buffer containing the PDF data
   */
  async generatePdf(html, options = {}) {
    // Default options
    const defaultOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    };

    // Merge default options with provided options
    const pdfOptions = { ...defaultOptions, ...options };

    // Get Puppeteer configuration with the appropriate Chrome path
    const launchOptions = getPuppeteerConfig();
    
    // Launch a new browser instance
    const browser = await puppeteer.launch(launchOptions);
    
    try {
      // Create a new page
      const page = await browser.newPage();
      
      // Set the HTML content
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return pdfBuffer;
    } finally {
      // Ensure browser is closed even if an error occurs
      await browser.close();
    }
  }
};