import { DocumentEditor } from './document-editor.js';
import { ApiClient } from '../api-client.js';

/**
 * Slides editor component for PowerPoint generation
 */
export class SlidesEditor extends DocumentEditor {
  /**
   * Create a new slides editor
   */
  constructor() {
    super();
    this._content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PowerPoint Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #333;
      margin-top: 30px;
    }
    p {
      line-height: 1.6;
    }
    ul {
      margin-left: 20px;
    }
  </style>
</head>
<body>
  <h1>PowerPoint Generation Test</h1>
  <p>This is the introduction slide content.</p>
  
  <h2>Second Slide</h2>
  <p>This is the content for the second slide.</p>
  <p>It has multiple paragraphs of information.</p>
  
  <h2>Third Slide</h2>
  <p>This is the content for the third slide.</p>
  <ul>
    <li>Bullet point 1</li>
    <li>Bullet point 2</li>
    <li>Bullet point 3</li>
  </ul>
  
  <h2>Conclusion</h2>
  <p>This is the final slide with a conclusion.</p>
  <p>Thank you for your attention!</p>
</body>
</html>`;
  }

  /**
   * Get the editor title
   * @returns {string} - Editor title
   */
  getEditorTitle() {
    return 'HTML Slides Editor';
  }

  /**
   * Get the action buttons
   * @returns {string} - HTML for action buttons
   */
  getActionButtons() {
    return `
      <button id="generate-ppt" class="ppt-button">Generate PowerPoint</button>
      <button id="generate-pdf" class="pdf-button">Generate PDF</button>
      <button id="generate-doc" class="doc-button">Generate Word Doc</button>
      <button id="convert-to-markdown" class="md-button">Convert to Markdown</button>
    `;
  }

  /**
   * Initialize action buttons
   */
  initActionButtons() {
    const generatePptBtn = this.$('#generate-ppt');
    const generatePdfBtn = this.$('#generate-pdf');
    const generateDocBtn = this.$('#generate-doc');
    const convertToMarkdownBtn = this.$('#convert-to-markdown');

    generatePptBtn.addEventListener('click', () => this.generatePpt());
    generatePdfBtn.addEventListener('click', () => this.generatePdf());
    generateDocBtn.addEventListener('click', () => this.generateDoc());
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
   * Generate a PowerPoint presentation from the HTML content
   */
  async generatePpt() {
    try {
      this.showStatus('Generating PowerPoint presentation...');
      
      const html = this.getContent();
      const pptBlob = await ApiClient.htmlToPpt(html, 'presentation.pptx', 'Presentation');
      
      ApiClient.downloadBlob(pptBlob, 'presentation.pptx');
      
      this.showStatus('PowerPoint presentation generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating PowerPoint presentation');
    }
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
customElements.define('slides-editor', SlidesEditor);