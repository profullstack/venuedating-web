import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

// Convert callback-based exec to Promise-based
const exec = util.promisify(execCallback);

/**
 * Service for generating EPUB documents from HTML content
 */
export const epubService = {
  /**
   * Generate an EPUB from HTML content using pandoc
   * @param {string} html - The HTML content to convert to EPUB
   * @param {Object} options - EPUB generation options
   * @returns {Promise<Buffer>} - A buffer containing the EPUB data
   */
  async generateEpub(html, options = {}) {
    // Create a temporary directory
    const tempDir = path.join(os.tmpdir(), `epub-${uuidv4()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Create a temporary HTML file
      const htmlPath = path.join(tempDir, 'input.html');
      const epubPath = path.join(tempDir, 'output.epub');
      
      // Write the HTML content to the file
      fs.writeFileSync(htmlPath, html);
      
      // Build the pandoc command with options
      let command = `pandoc "${htmlPath}" -o "${epubPath}"`;
      
      // Add title if provided
      if (options.title) {
        command += ` --metadata title="${options.title}"`;
      }
      
      // Add author if provided
      if (options.author) {
        command += ` --metadata author="${options.author}"`;
      }
      
      // Add cover image if provided
      if (options.cover) {
        command += ` --epub-cover-image="${options.cover}"`;
      }
      
      // Execute pandoc command
      const { stdout, stderr } = await exec(command);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`Pandoc error: ${stderr}`);
      }
      
      // Read the generated EPUB file
      const epubBuffer = fs.readFileSync(epubPath);
      
      return epubBuffer;
    } finally {
      // Clean up temporary files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error cleaning up temporary files:', error);
      }
    }
  }
};