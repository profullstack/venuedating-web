/**
 * Venue Payment Modal for BarCrush Matching Page
 * 
 * Handles Square payment integration specifically for unlocking venue information
 */

import { fetchSquareCredentials, loadSquareSDK, processPayment } from './utils/square-api.js';

export default class VenuePaymentModal {
  constructor(options = {}) {
    this.amount = options.amount || 200; // $2.00 in cents
    this.currency = options.currency || 'USD';
    this.onPaymentSuccess = options.onPaymentSuccess || (() => {});
    this.onPaymentCancel = options.onPaymentCancel || (() => {});
    
    this.modalElement = null;
    this.paymentForm = null;
    this.card = null;
    this.isProcessing = false;
    this.isVisible = false;
    
    // Square payment form configuration
    this.squareApplicationId = null;
    this.squareLocationId = null;
    
    this.init();
  }
  
  /**
   * Initialize the payment modal
   */
  init() {
    this.modalElement = document.getElementById('payment-modal');
    if (!this.modalElement) {
      console.error('❌ Payment modal element not found in DOM');
      return;
    }
    
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners for the modal
   */
  setupEventListeners() {
    // Cancel payment button
    const cancelButton = document.getElementById('cancel-payment');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.hide();
        this.onPaymentCancel();
      });
    }
    
    // Complete payment button
    const completeButton = document.getElementById('complete-payment');
    if (completeButton) {
      completeButton.addEventListener('click', () => {
        this.processPayment();
      });
    }
    
    // Close modal when clicking overlay
    const overlay = this.modalElement.querySelector('.payment-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.hide();
        this.onPaymentCancel();
      });
    }
    
    // Prevent modal content clicks from closing modal
    const content = this.modalElement.querySelector('.payment-modal-content');
    if (content) {
      content.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }
  
  /**
   * Show the payment modal
   */
  async show() {
    if (this.isVisible) return;
    
    try {
      console.log('💳 Showing venue payment modal...');
      
      // Show modal with animation
      this.modalElement.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Trigger animation
      setTimeout(() => {
        this.modalElement.classList.add('show');
        this.isVisible = true;
      }, 10);
      
      // Initialize Square payment form
      await this.initializeSquarePaymentForm();
      
    } catch (error) {
      console.error('❌ Error showing payment modal:', error);
      this.hide();
    }
  }
  
  /**
   * Hide the payment modal
   */
  hide() {
    if (!this.isVisible) return;
    
    console.log('🔒 Hiding venue payment modal...');
    
    // Remove animation class
    this.modalElement.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Hide modal after animation
    setTimeout(() => {
      this.modalElement.style.display = 'none';
      this.isVisible = false;
      
      // Clean up Square payment form
      if (this.card) {
        this.card.destroy();
        this.card = null;
      }
    }, 400);
  }
  
  /**
   * Initialize Square payment form
   */
  async initializeSquarePaymentForm() {
    try {
      console.log('🔧 Initializing Square payment form...');
      
      // Load Square SDK
      await loadSquareSDK();
      
      // Fetch Square credentials
      const credentials = await fetchSquareCredentials();
      this.squareApplicationId = credentials.applicationId;
      this.squareLocationId = credentials.locationId;
      
      // Initialize Square Payments
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }
      
      const payments = window.Square.payments(this.squareApplicationId, this.squareLocationId);
      
      // Initialize card payment form
      this.card = await payments.card({
        style: {
          '.input-container': {
            borderRadius: '8px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--border-color, #e1e5e9)',
            backgroundColor: 'var(--surface-color, #ffffff)'
          },
          '.input-container.is-focus': {
            borderColor: '#FF4B77'
          },
          '.input-container.is-error': {
            borderColor: '#EF4444'
          },
          '.message-text': {
            color: '#EF4444',
            fontSize: '14px',
            marginTop: '8px'
          },
          'input': {
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: 'var(--text-primary, #000000)',
            backgroundColor: 'transparent'
          },
          'input::placeholder': {
            color: 'var(--text-secondary, #666666)'
          }
        }
      });
      
      // Attach card to container
      const cardContainer = document.getElementById('card-container');
      if (cardContainer) {
        await this.card.attach('#card-container');
        
        // Enable payment button when card is ready
        this.card.addEventListener('cardBrandChanged', () => {
          this.updatePaymentButton(true);
        });
        
        this.card.addEventListener('postalCodeChanged', () => {
          this.updatePaymentButton(true);
        });
      }
      
      console.log('✅ Square payment form initialized');
      
    } catch (error) {
      console.error('❌ Error initializing Square payment form:', error);
      this.showError('Failed to load payment form. Please try again.');
    }
  }
  
  /**
   * Process the payment
   */
  async processPayment() {
    if (this.isProcessing || !this.card) return;
    
    try {
      this.isProcessing = true;
      this.updatePaymentButton(false, true);
      
      console.log('💰 Processing venue access payment...');
      
      // Tokenize card
      const result = await this.card.tokenize();
      
      if (result.status === 'OK') {
        // Process payment with backend
        const paymentResult = await processPayment(
          result.token,
          this.amount,
          this.currency
        );
        
        if (paymentResult.success) {
          console.log('✅ Payment successful!');
          this.onPaymentSuccess(paymentResult);
          this.hide();
        } else {
          throw new Error(paymentResult.error || 'Payment failed');
        }
      } else {
        // Handle tokenization errors
        const errors = result.errors || [];
        const errorMessage = errors.length > 0 
          ? errors[0].message 
          : 'Please check your card details and try again.';
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      this.showError(error.message || 'Payment failed. Please try again.');
    } finally {
      this.isProcessing = false;
      this.updatePaymentButton(true, false);
    }
  }
  
  /**
   * Update payment button state
   */
  updatePaymentButton(enabled, loading = false) {
    const button = document.getElementById('complete-payment');
    const buttonText = button?.querySelector('.button-text');
    const buttonSpinner = button?.querySelector('.button-spinner');
    
    if (!button) return;
    
    button.disabled = !enabled || loading;
    
    if (loading) {
      button.classList.add('loading');
      if (buttonSpinner) buttonSpinner.style.display = 'flex';
      if (buttonText) buttonText.style.opacity = '0';
    } else {
      button.classList.remove('loading');
      if (buttonSpinner) buttonSpinner.style.display = 'none';
      if (buttonText) buttonText.style.opacity = '1';
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    // Create or update error element
    let errorElement = document.getElementById('payment-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'payment-error';
      errorElement.style.cssText = `
        color: #EF4444;
        font-size: 14px;
        margin-top: 12px;
        padding: 12px;
        background-color: rgba(239, 68, 68, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(239, 68, 68, 0.2);
      `;
      
      const cardContainer = document.getElementById('card-container');
      if (cardContainer && cardContainer.parentNode) {
        cardContainer.parentNode.insertBefore(errorElement, cardContainer.nextSibling);
      }
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }, 5000);
  }
  
  /**
   * Clear any error messages
   */
  clearError() {
    const errorElement = document.getElementById('payment-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * Destroy the payment modal and clean up resources
   */
  destroy() {
    if (this.card) {
      this.card.destroy();
      this.card = null;
    }
    
    if (this.isVisible) {
      this.hide();
    }
    
    // Remove event listeners would go here if we stored references
    console.log('🧹 Venue payment modal destroyed');
  }
}
