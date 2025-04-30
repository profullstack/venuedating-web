import { BaseComponent } from '../base-component.js';

/**
 * API Authentication component
 * Displays the authentication information for the API
 */
export class ApiAuth extends BaseComponent {
  /**
   * Create a new API authentication component
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
      
      p {
        margin-bottom: var(--spacing-md);
        color: var(--text-secondary);
      }
      
      .code-block {
        background-color: var(--surface-variant);
        padding: var(--spacing-md);
        border-radius: var(--border-radius-md);
        overflow-x: auto;
        margin-bottom: var(--spacing-md);
      }
      
      pre {
        margin: 0;
        font-family: monospace;
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
      <p>All API endpoints require authentication using an API key. You can create and manage your API keys in the <a href="/api-keys.html">API Keys</a> section.</p>
      <p>Include your API key in the request headers using one of the following methods:</p>
      
      <div class="code-block">
        <pre>Authorization: Bearer pfs_your_api_key_here</pre>
      </div>
      
      <p>Or for backward compatibility:</p>
      
      <div class="code-block">
        <pre>X-API-Key: your_email@example.com</pre>
      </div>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-auth')) {
  customElements.define('api-auth', ApiAuth);
  console.log('API auth component registered');
}