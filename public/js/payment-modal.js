/**
 * Payment Modal Component
 * 
 * A modal that blocks access to matching functionality until payment is made
 */

import { loadSquareSDK, fetchSquareCredentials, processPayment, checkSubscriptionStatus } from './utils/square-api.js';
import { showToast } from './utils/toast.js';

export default class PaymentModal {
  /**
   * Create a new payment modal
   * @param {Object} options - Configuration options
   * @param {number} options.amount - Payment amount in cents
   * @param {string} options.currency - Currency code
   * @param {Function} options.onPaymentSuccess - Callback for successful payment
   */
  constructor(options = {}) {
    this.amount = options.amount || 200; // Default $2.00
    this.currency = options.currency || 'USD';
    this.onPaymentSuccess = options.onPaymentSuccess || (() => {});
    
    this.modalElement = null;
    this.paymentForm = null;
    this.card = null;
    this.isProcessing = false;
    
    // Square payment form configuration
    this.squareApplicationId = null;
    this.squareLocationId = null;
  }
  
  /**
   * Show the payment modal
   * @returns {Promise<void>}
   */
  async show() {
    // Check if user has already paid
    try {
      const hasPaid = await checkSubscriptionStatus();
      if (hasPaid) {
        console.log('User has already paid, no need to show payment modal');
        this.onPaymentSuccess();
        return;
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Continue showing payment modal if status check fails
    }
    
    // Create modal if it doesn't exist
    if (!this.modalElement) {
      await this.createModal();
    }
    
    // Show modal
    document.body.appendChild(this.modalElement);
    setTimeout(() => {
      this.modalElement.classList.add('visible');
    }, 10);
    
    // Initialize Square payment form
    await this.initializePaymentForm();
  }
  
  /**
   * Hide the payment modal
   */
  hide() {
    if (this.modalElement) {
      this.modalElement.classList.remove('visible');
      setTimeout(() => {
        if (this.modalElement && this.modalElement.parentNode) {
          this.modalElement.parentNode.removeChild(this.modalElement);
        }
      }, 300);
    }
  }
  
  /**
   * Create the modal element
   * @returns {Promise<void>}
   */
  async createModal() {
    // Create modal container
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'payment-modal';
    
    // Format amount for display
    const amountFormatted = (this.amount / 100).toFixed(2);
    
    // Set modal content
    this.modalElement.innerHTML = `
      <div class="payment-modal-overlay"></div>
      <div class="payment-modal-content">
        <div class="payment-modal-header">
          <h2>Unlock Premium Features</h2>
          <button class="payment-modal-close">&times;</button>
        </div>
        <div class="payment-modal-body">
          <div class="payment-info">
            <p>To continue swiping and chatting with matches, a one-time payment of $${amountFormatted} is required.</p>
            <div class="payment-benefits">
              <h3>What you'll get:</h3>
              <ul>
                <li>Unlimited profile swiping</li>
                <li>Chat with your matches</li>
                <li>See who liked you</li>
                <li>Premium support</li>
              </ul>
            </div>
          </div>
          
          <div class="payment-form-container">
            <div id="payment-status-container"></div>
            <div id="card-container"></div>
            <button id="payment-button" class="payment-button">
              Pay $${amountFormatted}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    this.addStyles();
    
    // Add event listeners
    const closeButton = this.modalElement.querySelector('.payment-modal-close');
    closeButton.addEventListener('click', () => this.hide());
    
    const payButton = this.modalElement.querySelector('#payment-button');
    payButton.addEventListener('click', () => this.handlePayment());
  }
  
  /**
   * Initialize Square payment form
   * @returns {Promise<void>}
   */
  async initializePaymentForm() {
    try {
      // Load Square SDK
      await loadSquareSDK();
      
      // Get Square credentials
      const credentials = await fetchSquareCredentials();
      this.squareApplicationId = credentials.applicationId;
      this.squareAccessToken = credentials.accessToken;
      
      if (!this.squareApplicationId) {
        throw new Error('Invalid Square credentials');
      }
      
      // Initialize Square payments
      const payments = window.Square.payments(this.squareApplicationId);
      
      // Create card payment method
      this.card = await payments.card();
      await this.card.attach('#card-container');
      
      // Update status
      const statusContainer = document.getElementById('payment-status-container');
      statusContainer.innerHTML = '<p class="payment-status">Enter your card details above</p>';
      
    } catch (error) {
      console.error('Error initializing payment form:', error);
      const statusContainer = document.getElementById('payment-status-container');
      statusContainer.innerHTML = `<p class="payment-status error">Error: ${error.message}</p>`;
      showToast('Failed to initialize payment form: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle payment submission
   * @returns {Promise<void>}
   */
  async handlePayment() {
    if (this.isProcessing) {
      return;
    }
    
    const statusContainer = document.getElementById('payment-status-container');
    const payButton = document.getElementById('payment-button');
    
    try {
      this.isProcessing = true;
      payButton.disabled = true;
      payButton.textContent = 'Processing...';
      statusContainer.innerHTML = '<p class="payment-status">Processing payment...</p>';
      
      // Tokenize payment method
      const result = await this.card.tokenize();
      
      if (result.status === 'OK') {
        // Process payment with token
        const paymentResult = await processPayment(
          result.token,
          this.amount,
          this.currency
        );
        
        // Show success message
        statusContainer.innerHTML = '<p class="payment-status success">Payment successful!</p>';
        payButton.textContent = 'Paid';
        showToast('Payment successful!', 'success');
        
        // Store payment status in localStorage for our temporary solution
        localStorage.setItem('barcrush_payment_status', 'paid');
        
        // Close modal after delay
        setTimeout(() => {
          this.hide();
          this.onPaymentSuccess(paymentResult);
        }, 2000);
        
      } else {
        // Show tokenization error
        let errorMessage = 'Payment failed';
        if (result.errors) {
          errorMessage = result.errors.map(error => error.message).join(', ');
        }
        
        statusContainer.innerHTML = `<p class="payment-status error">Error: ${errorMessage}</p>`;
        payButton.disabled = false;
        payButton.textContent = `Pay $${(this.amount / 100).toFixed(2)}`;
        showToast('Payment failed: ' + errorMessage, 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      statusContainer.innerHTML = `<p class="payment-status error">Error: ${error.message}</p>`;
      payButton.disabled = false;
      payButton.textContent = `Pay $${(this.amount / 100).toFixed(2)}`;
      showToast('Payment error: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Add modal styles to document
   */
  addStyles() {
    if (document.getElementById('payment-modal-styles')) {
      return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'payment-modal-styles';
    styles.textContent = `
      .payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
      }
      
      .payment-modal.visible {
        opacity: 1;
        visibility: visible;
      }
      
      .payment-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .payment-modal-content {
        position: relative;
        width: 90%;
        max-width: 500px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transform: translateY(20px);
        transition: transform 0.3s;
      }
      
      .payment-modal.visible .payment-modal-content {
        transform: translateY(0);
      }
      
      .payment-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
      }
      
      .payment-modal-header h2 {
        margin: 0;
        font-size: 20px;
        color: #F44B74;
      }
      
      .payment-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        transition: color 0.2s;
      }
      
      .payment-modal-close:hover {
        color: #F44B74;
      }
      
      .payment-modal-body {
        padding: 20px;
      }
      
      .payment-info {
        margin-bottom: 20px;
      }
      
      .payment-benefits {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }
      
      .payment-benefits h3 {
        margin-top: 0;
        font-size: 16px;
        color: #333;
      }
      
      .payment-benefits ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }
      
      .payment-benefits li {
        margin-bottom: 8px;
      }
      
      .payment-form-container {
        margin-top: 20px;
      }
      
      #card-container {
        min-height: 90px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
      }
      
      .payment-button {
        display: block;
        width: 100%;
        padding: 12px;
        background-color: #F44B74;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .payment-button:hover {
        background-color: #E03A63;
      }
      
      .payment-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      
      .payment-status {
        margin: 0 0 15px;
        padding: 10px;
        border-radius: 4px;
        background-color: #f5f5f5;
        text-align: center;
      }
      
      .payment-status.error {
        background-color: #ffebee;
        color: #d32f2f;
      }
      
      .payment-status.success {
        background-color: #e8f5e9;
        color: #388e3c;
      }
    `;
    
    document.head.appendChild(styles);
  }
}
