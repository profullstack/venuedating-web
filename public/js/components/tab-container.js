import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';

/**
 * Tab container component
 */
export class TabContainer extends BaseComponent {
  /**
   * Create a new tab container
   */
  constructor() {
    super();
    this._activeTab = '';
    this._tabs = [];
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return `
      ${commonStyles}
      
      :host {
        display: block;
        width: 100%;
      }
      
      .tabs {
        display: flex;
        margin-bottom: 20px;
      }
      
      .tab {
        padding: 10px 20px;
        cursor: pointer;
        background-color: #f1f1f1;
        border: 1px solid #ccc;
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        margin-right: 5px;
      }
      
      .tab.active {
        background-color: #fff;
        border-bottom: 1px solid #fff;
      }
      
      .tab-content {
        display: none;
      }
      
      .tab-content.active {
        display: block;
      }
    `;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <div class="tabs">
        ${this._tabs.map(tab => `
          <div class="tab${tab.id === this._activeTab ? ' active' : ''}" data-tab="${tab.id}">
            ${tab.label}
          </div>
        `).join('')}
      </div>
      <div class="tab-contents">
        <slot></slot>
      </div>
    `;
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Add click event listeners to tabs
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        this.setActiveTab(tabId);
      });
    });
  }

  /**
   * Set the active tab
   * @param {string} tabId - Tab ID
   */
  setActiveTab(tabId) {
    this._activeTab = tabId;
    
    // Update tab styles
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      const id = tab.getAttribute('data-tab');
      if (id === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab content visibility
    const tabContents = this.querySelectorAll('[data-tab-content]');
    tabContents.forEach(content => {
      const id = content.getAttribute('data-tab-content');
      if (id === tabId) {
        content.style.display = 'block';
      } else {
        content.style.display = 'none';
      }
    });
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: { tabId }
    }));
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    // Get tabs from child elements
    this._tabs = Array.from(this.querySelectorAll('[data-tab-content]')).map(el => {
      return {
        id: el.getAttribute('data-tab-content'),
        label: el.getAttribute('data-tab-label') || el.getAttribute('data-tab-content')
      };
    });
    
    // Set default active tab
    if (this._tabs.length > 0 && !this._activeTab) {
      this._activeTab = this._tabs[0].id;
    }
    
    // Render the component
    super.connectedCallback();
    
    // Set initial tab visibility
    this.setActiveTab(this._activeTab);
  }

  /**
   * Called when attributes change
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old value
   * @param {string} newValue - New value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'active-tab' && oldValue !== newValue) {
      this._activeTab = newValue;
      if (this.isConnected) {
        this.setActiveTab(newValue);
      }
    }
  }

  /**
   * Observed attributes
   * @returns {string[]} - List of attributes to observe
   */
  static get observedAttributes() {
    return ['active-tab'];
  }
}

// Define the custom element
customElements.define('tab-container', TabContainer);