import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';

/**
 * About section component
 */
export class AboutSection extends BaseComponent {
  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return `
      ${commonStyles}
      
      :host {
        display: block;
        padding: 20px;
      }
      
      h2 {
        margin-top: 0;
        margin-bottom: 20px;
      }
      
      h3 {
        margin-top: 30px;
        margin-bottom: 10px;
      }
      
      p {
        margin-bottom: 15px;
      }
      
      code {
        background-color: #f5f5f5;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: monospace;
      }
      
      pre {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        font-family: monospace;
        line-height: 1.4;
      }
    `;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <h2>About the Document Generation API</h2>
      <p>This API provides endpoints to convert content into different document formats:</p>
      
      <h3>HTML to PDF</h3>
      <p>Endpoint: <code>/api/1/html-to-pdf</code></p>
      <p>Converts HTML to PDF using Puppeteer, which provides high-quality PDF rendering with full CSS support.</p>
      
      <h3>HTML to Word Document</h3>
      <p>Endpoint: <code>/api/1/html-to-doc</code></p>
      <p>Converts HTML to a Microsoft Word document (.doc) format.</p>
      
      <h3>HTML to Excel Spreadsheet</h3>
      <p>Endpoint: <code>/api/1/html-to-excel</code></p>
      <p>Converts HTML tables to Excel spreadsheets (.xlsx) format. Each table in the HTML becomes a separate worksheet.</p>
      
      <h3>HTML to PowerPoint</h3>
      <p>Endpoint: <code>/api/1/html-to-ppt</code></p>
      <p>Converts HTML with headings to PowerPoint presentations (.pptx) format. Each heading becomes a new slide.</p>
      
      <h3>HTML to EPUB</h3>
      <p>Endpoint: <code>/api/1/html-to-epub</code></p>
      <p>Converts HTML to EPUB e-book format using Pandoc. Supports metadata like title, author, and cover image.</p>
      
      <h3>HTML to Markdown</h3>
      <p>Endpoint: <code>/api/1/html-to-markdown</code></p>
      <p>Converts HTML to Markdown format, which is a lightweight markup language with plain text formatting syntax.</p>
      
      <h3>Markdown to HTML</h3>
      <p>Endpoint: <code>/api/1/markdown-to-html</code></p>
      <p>Converts Markdown to HTML using the marked library.</p>
      
      <h3>API Usage</h3>
      <pre>
// Example using fetch API
const response = await fetch('/api/1/html-to-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '&lt;html&gt;&lt;body&gt;&lt;h1&gt;Hello, World!&lt;/h1&gt;&lt;/body&gt;&lt;/html&gt;'
  }),
});

// Get the PDF as a blob
const pdfBlob = await response.blob();
      </pre>
    `;
  }
}

// Define the custom element
customElements.define('about-section', AboutSection);