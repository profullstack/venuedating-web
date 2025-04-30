import { BaseComponent } from '../base-component.js';
import './api-auth.js';
import './api-doc-generation.js';
import './api-get-keys.js';
import './api-post-key.js';
import './api-put-key.js';
import './api-delete-key.js';

/**
 * API Documentation component
 * Displays the API documentation with all endpoints
 */
export class ApiDocs extends BaseComponent {
  /**
   * Create a new API documentation component
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
      
      h1 {
        margin-bottom: var(--spacing-lg);
      }
      
      .api-section {
        margin-bottom: var(--spacing-xxl);
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
      <h1>API Documentation</h1>
      
      <div class="api-section">
        <h2>Authentication</h2>
        <api-auth></api-auth>
      </div>
      
      <div class="api-section">
        <api-doc-generation></api-doc-generation>
      </div>
      
      <div class="api-section">
        <h2>API Key Management</h2>
        <api-get-keys></api-get-keys>
        <api-post-key></api-post-key>
        <api-put-key></api-put-key>
        <api-delete-key></api-delete-key>
      </div>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-docs')) {
  customElements.define('api-docs', ApiDocs);
  console.log('API docs component registered');
}