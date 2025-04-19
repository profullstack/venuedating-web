import { DocumentEditor } from './document-editor.js';
import { ApiClient } from '../api-client.js';

/**
 * Table editor component for Excel generation
 */
export class TableEditor extends DocumentEditor {
  /**
   * Create a new table editor
   */
  constructor() {
    super();
    this._content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Excel Test</title>
  <style>
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  </style>
</head>
<body>
  <h1>Excel Generation Test</h1>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Jane Smith</td>
        <td>jane@example.com</td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Bob Johnson</td>
        <td>bob@example.com</td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Get the editor title
   * @returns {string} - Editor title
   */
  getEditorTitle() {
    return 'HTML Table Editor';
  }

  /**
   * Get the action buttons
   * @returns {string} - HTML for action buttons
   */
  getActionButtons() {
    return `
      <button id="generate-excel" class="excel-button">Generate Excel</button>
      <button id="generate-pdf" class="pdf-button">Generate PDF</button>
      <button id="generate-doc" class="doc-button">Generate Word Doc</button>
      <button id="convert-to-markdown" class="md-button">Convert to Markdown</button>
    `;
  }

  /**
   * Initialize action buttons
   */
  initActionButtons() {
    const generateExcelBtn = this.$('#generate-excel');
    const generatePdfBtn = this.$('#generate-pdf');
    const generateDocBtn = this.$('#generate-doc');
    const convertToMarkdownBtn = this.$('#convert-to-markdown');

    generateExcelBtn.addEventListener('click', () => this.generateExcel());
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
   * Generate an Excel spreadsheet from the HTML table
   */
  async generateExcel() {
    try {
      this.showStatus('Generating Excel spreadsheet...');
      
      const html = this.getContent();
      const excelBlob = await ApiClient.htmlToExcel(html, 'data.xlsx', 'Data');
      
      ApiClient.downloadBlob(excelBlob, 'data.xlsx');
      
      this.showStatus('Excel spreadsheet generated successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'generating Excel spreadsheet');
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
customElements.define('table-editor', TableEditor);