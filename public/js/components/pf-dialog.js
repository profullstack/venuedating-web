/**
 * Dialog component for the application
 * Replaces native alert() and confirm() with a nicer UI
 */
class PfDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Dialog state
    this._isOpen = false;
    this._type = 'alert'; // 'alert' or 'confirm'
    this._message = '';
    this._title = '';
    this._confirmCallback = null;
    this._cancelCallback = null;
    this._confirmText = 'OK';
    this._cancelText = 'Cancel';
  }

  connectedCallback() {
    this.render();
    this.initEventListeners();
  }

  /**
   * Set dialog attributes
   */
  static get observedAttributes() {
    return ['open', 'type', 'message', 'title', 'confirm-text', 'cancel-text'];
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'open':
        this._isOpen = newValue !== null;
        break;
      case 'type':
        this._type = newValue;
        break;
      case 'message':
        this._message = newValue;
        break;
      case 'title':
        this._title = newValue;
        break;
      case 'confirm-text':
        this._confirmText = newValue;
        break;
      case 'cancel-text':
        this._cancelText = newValue;
        break;
    }
    
    this.render();
  }

  /**
   * Render the dialog
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-family, 'SpaceMono', monospace);
        }
        
        .dialog-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--overlay-color, rgba(0, 0, 0, 0.5));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
        }
        
        .dialog-backdrop.open {
          opacity: 1;
          visibility: visible;
        }
        
        .dialog {
          background-color: var(--card-background, white);
          border-radius: var(--border-radius-lg, 8px);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
          width: 90%;
          max-width: 450px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 0;
          transform: translateY(20px);
          transition: transform 0.2s;
        }
        
        .dialog-backdrop.open .dialog {
          transform: translateY(0);
        }
        
        .dialog-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }
        
        .dialog-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }
        
        .dialog-body {
          padding: 20px;
          color: var(--text-secondary, #4b5563);
        }
        
        .dialog-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .dialog-button {
          padding: 8px 16px;
          border-radius: var(--border-radius-md, 6px);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
        }
        
        .cancel-button {
          background-color: var(--surface-variant, #f3f4f6);
          color: var(--text-secondary, #4b5563);
        }
        
        .cancel-button:hover {
          background-color: var(--divider-color, #e5e7eb);
        }
        
        .confirm-button {
          background-color: var(--primary-color, #e02337);
          color: var(--text-on-primary, white);
        }
        
        .confirm-button:hover {
          background-color: var(--primary-dark, #c01d2f);
        }
      </style>
      
      <div class="dialog-backdrop ${this._isOpen ? 'open' : ''}">
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h3 class="dialog-title">${this._title || (this._type === 'alert' ? 'Alert' : 'Confirm')}</h3>
          </div>
          
          <div class="dialog-body">
            <p>${this._message}</p>
          </div>
          
          <div class="dialog-footer">
            ${this._type === 'confirm' ? `<button class="dialog-button cancel-button">${this._cancelText}</button>` : ''}
            <button class="dialog-button confirm-button">${this._confirmText}</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.classList.contains('confirm-button')) {
        this.close(true);
      } else if (e.target.classList.contains('cancel-button')) {
        this.close(false);
      } else if (e.target.classList.contains('dialog-backdrop')) {
        // Close on backdrop click only for alerts, not for confirms
        if (this._type === 'alert') {
          this.close(false);
        }
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) {
        // Close on ESC only for alerts, not for confirms
        if (this._type === 'alert') {
          this.close(false);
        }
      }
    });
  }

  /**
   * Open the dialog
   * @param {Object} options - Dialog options
   * @param {string} options.type - Dialog type ('alert' or 'confirm')
   * @param {string} options.message - Dialog message
   * @param {string} options.title - Dialog title
   * @param {Function} options.onConfirm - Confirm callback
   * @param {Function} options.onCancel - Cancel callback
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.cancelText - Cancel button text
   */
  open(options = {}) {
    this._type = options.type || 'alert';
    this._message = options.message || '';
    this._title = options.title || '';
    this._confirmCallback = options.onConfirm || null;
    this._cancelCallback = options.onCancel || null;
    this._confirmText = options.confirmText || 'OK';
    this._cancelText = options.cancelText || 'Cancel';
    
    this._isOpen = true;
    this.render();
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus the confirm button
    setTimeout(() => {
      const confirmButton = this.shadowRoot.querySelector('.confirm-button');
      if (confirmButton) {
        confirmButton.focus();
      }
    }, 100);
  }

  /**
   * Close the dialog
   * @param {boolean} confirmed - Whether the dialog was confirmed
   */
  close(confirmed) {
    this._isOpen = false;
    this.render();
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Call the appropriate callback
    if (confirmed && this._confirmCallback) {
      this._confirmCallback();
    } else if (!confirmed && this._cancelCallback) {
      this._cancelCallback();
    }
    
    // Dispatch a custom event
    this.dispatchEvent(new CustomEvent('dialog-closed', {
      detail: { confirmed }
    }));
  }

  /**
   * Static method to show an alert dialog
   * @param {string} message - Alert message
   * @param {string} title - Alert title
   * @param {Function} onConfirm - Confirm callback
   * @param {string} confirmText - Confirm button text
   * @returns {PfDialog} - The dialog element
   */
  static alert(message, title = 'Alert', onConfirm = null, confirmText = 'OK') {
    // Check if a dialog already exists
    let dialog = document.querySelector('pf-dialog');
    
    // Create a new dialog if one doesn't exist
    if (!dialog) {
      dialog = document.createElement('pf-dialog');
      document.body.appendChild(dialog);
    }
    
    // Open the dialog
    dialog.open({
      type: 'alert',
      message,
      title,
      onConfirm,
      confirmText
    });
    
    return dialog;
  }

  /**
   * Static method to show a confirm dialog
   * @param {string} message - Confirm message
   * @param {string} title - Confirm title
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @returns {PfDialog} - The dialog element
   */
  static confirm(message, title = 'Confirm', onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel') {
    // Check if a dialog already exists
    let dialog = document.querySelector('pf-dialog');
    
    // Create a new dialog if one doesn't exist
    if (!dialog) {
      dialog = document.createElement('pf-dialog');
      document.body.appendChild(dialog);
    }
    
    // Open the dialog
    dialog.open({
      type: 'confirm',
      message,
      title,
      onConfirm,
      onCancel,
      confirmText,
      cancelText
    });
    
    return dialog;
  }
}

// Define the custom element
customElements.define('pf-dialog', PfDialog);

// Replace native alert and confirm with our custom dialog
if (typeof window !== 'undefined') {
  // Store original methods
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  
  // Replace alert
  window.alert = function(message) {
    return PfDialog.alert(message);
  };
  
  // Replace confirm
  window.confirm = function(message) {
    return new Promise((resolve) => {
      PfDialog.confirm(message, 'Confirm', () => resolve(true), () => resolve(false));
    });
  };
  
  // Add to window for direct access
  window.PfDialog = PfDialog;
}

// Export the class for module imports
export default PfDialog;