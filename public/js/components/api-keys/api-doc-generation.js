import { BaseComponent } from '../base-component.js';
import './api-html-to-pdf.js';
import './api-html-to-doc.js';
import './api-html-to-epub.js';
import './api-html-to-excel.js';
import './api-html-to-ppt.js';
import './api-html-to-markdown.js';
import './api-markdown-to-html.js';

/**
 * Document Generation section component
 * Displays the document generation endpoints section
 */
export class ApiDocGeneration extends BaseComponent {
  /**
   * Create a new document generation section component
   */
  constructor() {
    super();
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return `
      :host {
        display: block;
      }
      
      h2 {
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }
    `;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <h2>Document Generation Endpoints</h2>
      <api-html-to-pdf></api-html-to-pdf>
      <api-html-to-doc></api-html-to-doc>
      <api-html-to-epub></api-html-to-epub>
      <api-html-to-excel></api-html-to-excel>
      <api-html-to-ppt></api-html-to-ppt>
      <api-html-to-markdown></api-html-to-markdown>
      <api-markdown-to-html></api-markdown-to-html>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-doc-generation')) {
  customElements.define('api-doc-generation', ApiDocGeneration);
  console.log('API document generation section component registered');
}