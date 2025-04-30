/**
 * Base component class that all components will extend
 */
export class BaseComponent extends HTMLElement {
  /**
   * Create a new component
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return '';
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return '';
  }

  /**
   * Render the component
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      ${this.getTemplate()}
    `;
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    this.render();
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Override in subclasses
  }

  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Override in subclasses if needed
  }

  /**
   * Called when an attribute is changed
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    // Override in subclasses if needed
  }

  /**
   * Get a DOM element from the shadow root
   * @param {string} selector - CSS selector
   * @returns {Element} - DOM element
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Get all DOM elements matching a selector from the shadow root
   * @param {string} selector - CSS selector
   * @returns {NodeList} - DOM elements
   */
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
  
  /**
   * Get the authentication token
   * @returns {Promise<string>} - Authentication token
   */
  async getAuthToken() {
    // Try to get the token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (token) {
      return token;
    }
    
    // If no token is found, try to get it from the API client
    try {
      const { ApiClient } = await import('../api-client.js');
      return ApiClient.getAuthToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication token not found. Please log in again.');
    }
  }
}