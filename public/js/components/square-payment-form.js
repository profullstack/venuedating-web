/**
 * Square Payment Form Component
 * 
 * This component handles the Square Web Payments SDK integration
 * for processing payments in the BarCrush app.
 */

import { fetchSquareCredentials, loadSquareSDK, processPayment } from '../utils/square-api.js';

class SquarePaymentForm {
  constructor(options = {}) {
    this.options = {
      amount: 1000, // Default amount in cents (e.g., $10.00)
      currency: 'USD',
      onPaymentStart: () => {},
      onPaymentSuccess: () => {},
      onPaymentError: () => {},
      buttonText: 'Pay Now',
      ...options
    };
    
    this.paymentForm = null;
    this.card = null;
    this.applicationId = null;
    this.locationId = null;
    this.container = null;
    this.isLoading = false;
  }
  
  /**
   * Initialize the payment form
   * @param {string} containerId - ID of the container element
   * @returns {Promise} - Resolves when the form is initialized
   */
  async initialize(containerId) {
    try {
      this.container = document.getElementById(containerId);
      
      if (!this.container) {
        throw new Error(`Container element with ID '${containerId}' not found`);
      }
      
      // Create the payment form container structure
      this.container.innerHTML = `
        <div class="square-payment-form">
          <div class="payment-status-container"></div>
          <div class="card-container"></div>
          <button type="button" id="square-pay-button" class="payment-button">${this.options.buttonText}</button>
          <div class="payment-footer">
            <img src="https://web.squarecdn.com/v1/square.svg" alt="Powered by Square" width="100" />
            <span>Your payment information is secure</span>
          </div>
        </div>
      `;
      
      // Add basic styles
      this.addStyles();
      
      // Fetch Square credentials from the server
      await this.fetchCredentials();
      
      // Load Square Web Payments SDK
      await this.loadSquareSDK();
      
      // Initialize the payment form
      await this.initializePaymentForm();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Square payment form:', error);
      this.showError(`Payment form initialization failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Fetch Square credentials from the server
   * @returns {Promise} - Resolves when credentials are fetched
   */
  async fetchCredentials() {
    try {
      const credentials = await fetchSquareCredentials();
      this.applicationId = credentials.applicationId;
      this.locationId = credentials.locationId;
      
      console.log('Square credentials loaded successfully');
    } catch (error) {
      console.error('Error fetching Square credentials:', error);
      throw error;
    }
  }
  
  /**
   * Load the Square Web Payments SDK
   * @returns {Promise} - Resolves when the SDK is loaded
   */
  async loadSquareSDK() {
    return loadSquareSDK();
  }
  
  /**
   * Initialize the Square payment form
   * @returns {Promise} - Resolves when the form is initialized
   */
  async initializePaymentForm() {
    if (!window.Square) {
      throw new Error('Square SDK not loaded');
    }
    
    try {
      // Initialize Square
      this.paymentForm = await window.Square.payments(this.applicationId, this.locationId);
      
      // Initialize Card payment method
      this.card = await this.paymentForm.card();
      
      // Attach the card to the page
      await this.card.attach('.card-container');
      
      // Set up the pay button
      const payButton = document.getElementById('square-pay-button');
      payButton.addEventListener('click', this.handlePayment.bind(this));
      
      console.log('Square payment form initialized successfully');
    } catch (error) {
      console.error('Error initializing Square payment form:', error);
      throw error;
    }
  }
  
  /**
   * Handle the payment submission
   * @param {Event} event - Click event
   */
  async handlePayment(event) {
    event.preventDefault();
    
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    this.setButtonLoading(true);
    this.showStatus('Processing payment...');
    
    try {
      // Notify payment start
      this.options.onPaymentStart();
      
      // Get a payment token
      const result = await this.card.tokenize();
      
      if (result.status === 'OK') {
        // Process the payment with the token
        await this.processPayment(result.token);
      } else {
        throw new Error(result.errors[0].message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(`Payment failed: ${error.message}`);
      this.options.onPaymentError(error);
    } finally {
      this.isLoading = false;
      this.setButtonLoading(false);
    }
  }
  
  /**
   * Process the payment with the server
   * @param {string} token - Payment token from Square
   * @returns {Promise} - Resolves when payment is processed
   */
  async processPayment(token) {
    try {
      const result = await processPayment(token, this.options.amount, this.options.currency);
      
      // Payment successful
      this.showSuccess('Payment successful!');
      this.options.onPaymentSuccess(result);
      
      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
  
  /**
   * Set the payment button loading state
   * @param {boolean} isLoading - Whether the button is loading
   */
  setButtonLoading(isLoading) {
    const button = document.getElementById('square-pay-button');
    
    if (!button) return;
    
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span> Processing...';
    } else {
      button.disabled = false;
      button.innerHTML = this.options.buttonText;
    }
  }
  
  /**
   * Show a status message
   * @param {string} message - Status message
   */
  showStatus(message) {
    const statusContainer = this.container.querySelector('.payment-status-container');
    
    if (!statusContainer) return;
    
    statusContainer.innerHTML = `
      <div class="payment-status payment-status-info">
        ${message}
      </div>
    `;
  }
  
  /**
   * Show an error message
   * @param {string} message - Error message
   */
  showError(message) {
    const statusContainer = this.container.querySelector('.payment-status-container');
    
    if (!statusContainer) return;
    
    statusContainer.innerHTML = `
      <div class="payment-status payment-status-error">
        ${message}
      </div>
    `;
  }
  
  /**
   * Show a success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    const statusContainer = this.container.querySelector('.payment-status-container');
    
    if (!statusContainer) return;
    
    statusContainer.innerHTML = `
      <div class="payment-status payment-status-success">
        ${message}
      </div>
    `;
  }
  
  /**
   * Add basic styles for the payment form
   */
  addStyles() {
    if (document.getElementById('square-payment-styles')) {
      return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'square-payment-styles';
    styles.textContent = `
      .square-payment-form {
        max-width: 550px;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
      }
      
      .card-container {
        margin: 20px 0;
        min-height: 90px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 12px;
        transition: border-color 0.3s;
        background: white;
      }
      
      .card-container.focus {
        border-color: #F44B74;
        box-shadow: 0 0 0 1px #F44B74;
      }
      
      .payment-button {
        width: 100%;
        padding: 12px;
        background-color: #F44B74;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .payment-button:hover {
        background-color: #E03A63;
      }
      
      .payment-button:disabled {
        background-color: #f8a0b5;
        cursor: not-allowed;
      }
      
      .payment-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 20px;
        color: #666;
        font-size: 14px;
      }
      
      .payment-status {
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 15px;
      }
      
      .payment-status-info {
        background-color: #e3f2fd;
        color: #0277bd;
      }
      
      .payment-status-error {
        background-color: #ffebee;
        color: #c62828;
      }
      
      .payment-status-success {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Destroy the payment form
   */
  destroy() {
    if (this.card) {
      this.card.destroy();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default SquarePaymentForm;
