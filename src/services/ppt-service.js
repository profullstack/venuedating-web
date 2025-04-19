import PptxGenJS from 'pptxgenjs';
import { JSDOM } from 'jsdom';

/**
 * Service for generating PowerPoint presentations from HTML content
 */
export const pptService = {
  /**
   * Generate a PowerPoint presentation from HTML content
   * @param {string} html - The HTML content to convert to PowerPoint
   * @param {string} title - The title for the presentation
   * @returns {Promise<Buffer>} - A buffer containing the PowerPoint file data
   */
  async generatePpt(html, title = 'Presentation') {
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
    
    return pptBuffer;
  }
};