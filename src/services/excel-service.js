import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for generating Excel spreadsheets from HTML content
 */
export const excelService = {
  /**
   * Generate an Excel spreadsheet from HTML content using pandoc
   * @param {string} html - The HTML content containing tables
   * @param {string} sheetName - The name for the worksheet (default: 'Sheet1')
   * @returns {Promise<Buffer>} - A buffer containing the Excel file data
   * @throws {Error} - If pandoc conversion fails
   */
  async generateExcel(html, sheetName = 'Sheet1') {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.html`);
      const outputPath = path.join(tempDir, `${outputId}.xlsx`);
      
      // Write HTML to temporary file
      await fs.promises.writeFile(inputPath, html, 'utf8');
      
      // Use pandoc to convert HTML to XLSX
      const command = `pandoc -f html -t xlsx "${inputPath}" -o "${outputPath}"`;
      console.log(`Executing pandoc command: ${command}`);
      
      await execPromise(command);
      
      // Read the generated XLSX file
      const excelBuffer = await fs.promises.readFile(outputPath);
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary files:', cleanupError);
      }
      
      return excelBuffer;
    } catch (error) {
      console.error('Error generating Excel document with pandoc:', error);
      
      // If pandoc fails, provide a detailed error message
      if (error.stderr) {
        console.error('Pandoc error output:', error.stderr);
      }
      
      throw new Error(`Failed to generate Excel document: ${error.message}`);
    }
  }
};