import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';
import { ApiClient } from '../api-client.js';

/**
 * Base document editor component
 */
export class DocumentEditor extends BaseComponent {
  /**
   * Create a new document editor
   */
  constructor() {
    super();
    this._content = '';
    this._statusMessage = '';
    this._statusType = '';
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return commonStyles;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <div class="container">
        <div class="editor-container">
          <h2>${this.getEditorTitle()}</h2>
          <textarea id="editor">${this._content}</textarea>
        </div>
        
        <div class="preview-container">
          <h2>Preview</h2>
          <div id="preview-container"></div>
        </div>
      </div>
      
      <div class="buttons">
        <button id="update-preview">Update Preview</button>
        ${this.getActionButtons()}
      </div>
      
      <div id="status" class="status ${this._statusType}">${this._statusMessage}</div>
    `;
  }

  /**
   * Get the editor title
   * @returns {string} - Editor title
   */
  getEditorTitle() {
    return 'Document Editor';
  }

  /**
   * Get the action buttons
   * @returns {string} - HTML for action buttons
   */
  getActionButtons() {
    return '';
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const editor = this.$('#editor');
    const updatePreviewBtn = this.$('#update-preview');

    editor.addEventListener('input', () => {
      this._content = editor.value;
    });

    updatePreviewBtn.addEventListener('click', () => {
      this.updatePreview();
    });

    // Initialize other buttons
    this.initActionButtons();

    // Initial preview update
    this.updatePreview();
  }

  /**
   * Initialize action buttons
   */
  initActionButtons() {
    // Override in subclasses
  }

  /**
   * Update the preview
   */
  updatePreview() {
    // Override in subclasses
  }

  /**
   * Show a status message
   * @param {string} message - Status message
   * @param {string} type - Status type ('success' or 'error')
   */
  showStatus(message, type = '') {
    const status = this.$('#status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    this._statusMessage = message;
    this._statusType = type;
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} operation - Operation description
   */
  handleError(error, operation) {
    console.error(`Error ${operation}:`, error);
    this.showStatus(`Error: ${error.message}`, 'error');
  }

  /**
   * Get the editor content
   * @returns {string} - Editor content
   */
  getContent() {
    return this._content;
  }

  /**
   * Set the editor content
   * @param {string} content - Editor content
   */
  setContent(content) {
    this._content = content;
    const editor = this.$('#editor');
    if (editor) {
      editor.value = content;
    }
  }

  /**
   * Called when attributes change
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old value
   * @param {string} newValue - New value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'content' && oldValue !== newValue) {
      this.setContent(newValue);
    }
  }

  /**
   * Observed attributes
   * @returns {string[]} - List of attributes to observe
   */
  static get observedAttributes() {
    return ['content'];
  }
}