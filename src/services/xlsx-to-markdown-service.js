import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Service for converting XLSX files to Markdown content
 * Note: Pandoc's support for XLSX is limited - it may not handle complex spreadsheets well
 */
export const xlsxToMarkdownService = {
  /**
   * Convert an XLSX file to Markdown content using pandoc
   * @param {Buffer} xlsxBuffer - The XLSX file buffer to convert
   * @returns {Promise<string>} - A string containing the Markdown content
   */
  async convertToMarkdown(xlsxBuffer) {
    try {
      // Create temporary files for input and output
      const tempDir = os.tmpdir();
      const inputId = uuidv4();
      const outputId = uuidv4();
      const inputPath = path.join(tempDir, `${inputId}.xlsx`);
      const outputPath = path.join(tempDir, `${outputId}.md`);
      
      // Write XLSX buffer to temporary file
      await fs.promises.writeFile(inputPath, xlsxBuffer);
      
      // Try to use pandoc to convert XLSX to Markdown
      // Note: This may fail as pandoc has limited XLSX support
      // We'll attempt it but provide a fallback error message
      try {
        const command = `pandoc -f xlsx -t markdown "${inputPath}" -o "${outputPath}"`;
        console.log(`Executing pandoc command: ${command}`);
        
        await execPromise(command);
        
        // Read the generated Markdown file
        const markdownContent = await fs.promises.readFile(outputPath, 'utf8');
        
        // Clean up temporary files
        try {
          await fs.promises.unlink(inputPath);
          await fs.promises.unlink(outputPath);
        } catch (cleanupError) {
          console.warn('Error cleaning up temporary files:', cleanupError);
        }
        
        return markdownContent;
      } catch (pandocError) {
        // If pandoc doesn't support XLSX directly, provide a helpful error
        console.warn('Pandoc XLSX conversion failed, this format may not be fully supported:', pandocError.message);
        
        // Clean up input file
        try {
          await fs.promises.unlink(inputPath);
        } catch (cleanupError) {
          console.warn('Error cleaning up input file:', cleanupError);
        }
        
        throw new Error('XLSX to Markdown conversion is not fully supported by pandoc. Consider converting the Excel file to CSV or another supported format first.');
      }
    } catch (error) {
      console.error('Error converting XLSX to Markdown:', error);
      
      throw new Error(`Failed to convert XLSX to Markdown: ${error.message}`);
    }
  }
};