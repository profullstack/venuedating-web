import { DocumentEditor } from './document-editor.js';
import { ApiClient } from '../api-client.js';

/**
 * HTML editor component
 */
export class HtmlEditor extends DocumentEditor {
  /**
   * Create a new HTML editor
   */
  constructor() {
    super();
    this._content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Document</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #333;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    p {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <h1>Document Generation Test</h1>
  <p>This is a test document to verify that the document generation API is working correctly.</p>
  <p>The API should convert this HTML content into the requested format.</p>
  <p>Current date and time: <script>document.write(new Date().toLocaleString())</script></p>
</body>
</html>`;
  }

  /**
   * Get the editor title
   * @returns {string} - Editor title
   */
  getEditorTitle() {
    return 'HTML Editor';
  }

  /**
   * Get the action buttons
   * @returns {string} - HTML for action buttons
   */
  getActionButtons() {
    return `
      <button id="generate-pdf" class="pdf-button">Generate PDF</button>
      <button id="generate-doc" class="doc-button">Generate Word Doc</button>
      <button id="generate-epub" class="md-button">Generate EPUB</button>
      <button id="convert-to-markdown" class="md-button">Convert to Markdown</button>
    `;
  }

  /**
   * Initialize action buttons
   */
  initActionButtons() {
    const generatePdfBtn = this.$('#generate-pdf');
    const generateDocBtn = this.$('#generate-doc');
    const generateEpubBtn = this.$('#generate-epub');
    const convertToMarkdownBtn = this.$('#convert-to-markdown');

    generatePdfBtn.addEventListener('click', () => this.generatePdf());
    generateDocBtn.addEventListener('click', () => this.generateDoc());
    generateEpubBtn.addEventListener('click', () => this.generateEpub());
    convertToMarkdownBtn.addEventListener('click', () => this.convertToMarkdown());
  }

  /**
   * Update the preview
   */
  updatePreview() {
    const previewContainer = this.$('#preview-container');
    const html = this.getContent();
    
    // Create an iframe for the preview
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = '1px solid #ddd';
    iframe.style.borderRadius = '4px';
    
    // Replace the preview container content
    previewContainer.innerHTML = '';
    previewContainer.appendChild(iframe);
    
    // Set the iframe content
    const blob = new Blob([html], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
  }

  /**
   * Generate a PDF from the HTML content
   */
  async generatePdf() {
    try {
      this.showStatus('Generating PDF...');
      
      const html = this.getContent();
      const pdfBlob = await ApiClient.htmlToPdf(html);
      
      ApiClient.downloadBlob(pdfBlob, 'document.pdf');
      
      this.showStatus('PDF generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating PDF');
    }
  }

  /**
   * Generate a Word document from the HTML content
   */
  async generateDoc() {
    try {
      this.showStatus('Generating Word document...');
      
      const html = this.getContent();
      const docBlob = await ApiClient.htmlToDoc(html);
      
      ApiClient.downloadBlob(docBlob, 'document.doc');
      
      this.showStatus('Word document generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating Word document');
    }
  }

  /**
   * Generate an EPUB from the HTML content
   */
  async generateEpub() {
    try {
      this.showStatus('Generating EPUB...');
      
      const html = this.getContent();
      // Extract title from HTML if available
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Document';
      
      const epubBlob = await ApiClient.htmlToEpub(html, 'document.epub', title);
      
      ApiClient.downloadBlob(epubBlob, 'document.epub');
      
      this.showStatus('EPUB generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating EPUB');
    }
  }

  /**
   * Convert the HTML content to Markdown
   */
  async convertToMarkdown() {
    try {
      this.showStatus('Converting to Markdown...');
      
      const html = this.getContent();
      const markdown = await ApiClient.htmlToMarkdown(html);
      
      // Create a download link for the Markdown
      const blob = new Blob([markdown], { type: 'text/markdown' });
      ApiClient.downloadBlob(blob, 'document.md');
      
      this.showStatus('Markdown generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'converting to Markdown');
    }
  }
}

// Define the custom element
customElements.define('html-editor', HtmlEditor);