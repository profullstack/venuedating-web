/**
 * Square Hosted Checkout Integration
 * Replaces the embedded payment form with Square's hosted checkout
 */

if (typeof window.HostedCheckoutManager === 'undefined') {
  window.HostedCheckoutManager = class {
    constructor() {
      this.isProcessing = false;
    }

  /**
   * Create checkout session and redirect to Square's hosted checkout
   */
  async createCheckoutSession() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      this.showLoading(true);

      // Get auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Redirect to Square's hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      this.showError(error.message);
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
    }
  }

  /**
   * Show loading state
   */
  showLoading(show) {
    const loadingElements = document.querySelectorAll('.checkout-loading');
    const buttonElements = document.querySelectorAll('.checkout-button');
    
    loadingElements.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
    
    buttonElements.forEach(el => {
      el.disabled = show;
      if (show) {
        el.textContent = 'Processing...';
      } else {
        el.textContent = 'Upgrade to Premium - $2';
      }
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    // Create or update error display
    let errorDiv = document.getElementById('checkout-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'checkout-error';
      errorDiv.style.cssText = `
        background: #fee;
        color: #c33;
        padding: 12px;
        border-radius: 6px;
        margin: 10px 0;
        border: 1px solid #fcc;
      `;
      
      // Insert before checkout button
      const button = document.querySelector('.checkout-button');
      if (button && button.parentNode) {
        button.parentNode.insertBefore(errorDiv, button);
      }
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }

  /**
   * Initialize hosted checkout for payment modals
   */
  init() {
    // Replace existing payment form functionality
    document.addEventListener('DOMContentLoaded', () => {
      this.replacePaymentForms();
    });
  }

  /**
   * Replace existing payment forms with hosted checkout buttons
   */
  replacePaymentForms() {
    // Find existing payment modals/forms
    const paymentModals = document.querySelectorAll('.payment-modal, .square-payment-form');
    
    paymentModals.forEach(modal => {
      // Replace Square Web Payments SDK form with simple button
      const existingForm = modal.querySelector('#payment-form, .square-form');
      if (existingForm) {
        existingForm.innerHTML = `
          <div class="hosted-checkout-container">
            <h3>Upgrade to Premium</h3>
            <p>Unlock venue information and premium features for just $2</p>
            
            <div class="checkout-loading" style="display: none;">
              <p>Creating secure checkout session...</p>
            </div>
            
            <button class="checkout-button" onclick="hostedCheckout.createCheckoutSession()">
              Upgrade to Premium - $2
            </button>
            
            <p class="checkout-info">
              You'll be redirected to Square's secure checkout page
            </p>
          </div>
        `;
      }
    });
  }
  };

  // Create global singleton instance
  window.hostedCheckout = new window.HostedCheckoutManager();

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.hostedCheckout.init();
    });
  } else {
    window.hostedCheckout.init();
  }
}
