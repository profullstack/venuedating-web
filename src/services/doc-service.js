/**
 * Service for generating Word documents from HTML content
 */
export const docService = {
  /**
   * Generate a Word document from HTML content
   * @param {string} html - The HTML content to convert to Word format
   * @returns {Buffer} - A buffer containing the Word document data
   */
  generateDoc(html) {
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
    
    return docBuffer;
  }
};