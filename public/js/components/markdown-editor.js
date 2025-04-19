import { DocumentEditor } from './document-editor.js';
import { ApiClient } from '../api-client.js';

/**
 * Markdown editor component
 */
export class MarkdownEditor extends DocumentEditor {
  /**
   * Create a new Markdown editor
   */
  constructor() {
    super();
    this._content = `# Markdown Test

This is a **bold text** and this is *italic text*.

## Lists

### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Code

Inline \`code\` example.

\`\`\`javascript
// Code block
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Table

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

## Link and Image

[Example Link](https://example.com)

Current date and time: ${new Date().toLocaleString()}`;
  }

  /**
   * Get the editor title
   * @returns {string} - Editor title
   */
  getEditorTitle() {
    return 'Markdown Editor';
  }

  /**
   * Get the action buttons
   * @returns {string} - HTML for action buttons
   */
  getActionButtons() {
    return `
      <button id="convert-to-html" class="md-button">Convert to HTML</button>
      <button id="generate-pdf" class="pdf-button">Generate PDF</button>
      <button id="generate-doc" class="doc-button">Generate Word Doc</button>
    `;
  }

  /**
   * Initialize action buttons
   */
  initActionButtons() {
    const convertToHtmlBtn = this.$('#convert-to-html');
    const generatePdfBtn = this.$('#generate-pdf');
    const generateDocBtn = this.$('#generate-doc');

    convertToHtmlBtn.addEventListener('click', () => this.convertToHtml());
    generatePdfBtn.addEventListener('click', () => this.generatePdf());
    generateDocBtn.addEventListener('click', () => this.generateDoc());
  }

  /**
   * Update the preview
   */
  async updatePreview() {
    try {
      const previewContainer = this.$('#preview-container');
      const markdown = this.getContent();
      
      // Convert markdown to HTML for preview
      const html = await ApiClient.markdownToHtml(markdown);
      
      // Create a div for the preview
      const previewDiv = document.createElement('div');
      previewDiv.className = 'preview-html';
      previewDiv.innerHTML = html;
      
      // Replace the preview container content
      previewContainer.innerHTML = '';
      previewContainer.appendChild(previewDiv);
    } catch (error) {
      this.handleError(error, 'updating preview');
    }
  }

  /**
   * Convert the Markdown content to HTML
   */
  async convertToHtml() {
    try {
      this.showStatus('Converting to HTML...');
      
      const markdown = this.getContent();
      const html = await ApiClient.markdownToHtml(markdown);
      
      // Create a download link for the HTML
      const blob = new Blob([html], { type: 'text/html' });
      ApiClient.downloadBlob(blob, 'document.html');
      
      this.showStatus('HTML generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'converting to HTML');
    }
  }

  /**
   * Generate a PDF from the Markdown content
   */
  async generatePdf() {
    try {
      this.showStatus('Converting Markdown to PDF...');
      
      const markdown = this.getContent();
      
      // First convert markdown to HTML
      const html = await ApiClient.markdownToHtml(markdown);
      
      // Then generate PDF from the HTML
      const pdfBlob = await ApiClient.htmlToPdf(html);
      
      ApiClient.downloadBlob(pdfBlob, 'document.pdf');
      
      this.showStatus('PDF generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating PDF');
    }
  }

  /**
   * Generate a Word document from the Markdown content
   */
  async generateDoc() {
    try {
      this.showStatus('Converting Markdown to Word document...');
      
      const markdown = this.getContent();
      
      // First convert markdown to HTML
      const html = await ApiClient.markdownToHtml(markdown);
      
      // Then generate DOC from the HTML
      const docBlob = await ApiClient.htmlToDoc(html);
      
      ApiClient.downloadBlob(docBlob, 'document.doc');
      
      this.showStatus('Word document generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating Word document');
    }
  }
}

// Define the custom element
customElements.define('markdown-editor', MarkdownEditor);