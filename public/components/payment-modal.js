/**
 * BarCrush Payment Modal Component
 * 
 * Handles Square payment integration for unlocking matching features
 */

import { getConfig } from '../js/config.js';

class PaymentModal {
  constructor() {
    this.modal = null;
    this.squarePayments = null;
    this.card = null;
    this.isInitialized = false;
  }

  /**
   * Initialize hosted checkout (no Square SDK needed)
   */
  async initializeHostedCheckout() {
    // No initialization needed for hosted checkout
    this.isInitialized = true;
    console.log('✅ Hosted checkout ready');
  }

  /**
   * Create and show the payment modal
   */
  async show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      return;
    }

    await this.createModal();
    await this.initializeHostedCheckout();
    await this.setupPaymentButton();
    
    document.body.appendChild(this.modal);
    this.modal.style.display = 'flex';
    
    // Animate in
    setTimeout(() => {
      this.modal.classList.add('show');
    }, 10);
  }

  /**
   * Hide the payment modal
   */
  hide() {
    if (!this.modal) return;
    
    this.modal.classList.remove('show');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);
  }

  /**
   * Create the modal HTML structure
   */
  async createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'payment-modal-overlay';
    
    this.modal.innerHTML = `
      <div class="payment-modal">
        <!-- Header -->
        <div class="payment-header">
          <button class="close-button" id="close-payment-modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="payment-content">
          <!-- Venue Preview -->
          <div class="venue-preview">
            <div class="venue-card">
              <div class="people-badge">12 people</div>
              <div class="venue-name">Cidercade Dallas</div>
              <div class="distance-badge">12 km away</div>
            </div>
            <div class="venue-card">
              <div class="people-badge">20 people</div>
              <div class="venue-name">Rockwood Club</div>
              <div class="distance-badge">14 km away</div>
            </div>
            <div class="venue-card">
              <div class="people-badge">15 people</div>
              <div class="venue-name">Kessler Theater</div>
              <div class="distance-badge">16 km away</div>
            </div>
          </div>

          <!-- Payment Section -->
          <div class="payment-section">
            <div class="payment-info">
              <h2>Pay $2 to unlock who's at this venue</h2>
            </div>

            <!-- Benefits List -->
            <div class="benefits-list">
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>See who's currently at venues near you</span>
              </div>
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>Connect with people at your favorite spots</span>
              </div>
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>Premium matching features</span>
              </div>
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>Access to exclusive venue information</span>
              </div>
            </div>

            <!-- Simple Payment Button -->
            <div class="payment-form">
              <div class="payment-errors" id="payment-errors"></div>
              
              <button class="pay-button" id="pay-button">
                <span class="pay-text">Pay $2.00 - Secure Checkout</span>
                <div class="pay-spinner" style="display: none;">
                  <div class="spinner"></div>
                </div>
              </button>
              
              <div class="payment-security">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Secured by Square</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.modal.querySelector('#close-payment-modal').addEventListener('click', () => {
      this.hide();
    });

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  /**
   * Setup payment button for hosted checkout
   */
  async setupPaymentButton() {
    try {
      const payButton = this.modal.querySelector('#pay-button');
      const errorsContainer = this.modal.querySelector('#payment-errors');

      // Handle payment button click
      payButton.addEventListener('click', async () => {
        await this.handleHostedCheckout();
      });

    } catch (error) {
      console.error('❌ Failed to setup payment button:', error);
      this.showError('Failed to load payment button. Please try again.');
    }
  }

  /**
   * Tokenize a payment method
   * Following Square's recommended implementation
   */
  async tokenize(paymentMethod) {
    const verificationDetails = {
      amount: '2.00',
      billingContact: {
        givenName: 'BarCrush',
        familyName: 'User',
        email: 'user@barcrush.app'
      },
      currencyCode: 'USD',
      intent: 'CHARGE',
      customerInitiated: true
    };
    
    const tokenResult = await paymentMethod.tokenize(verificationDetails);
    if (tokenResult.status === 'OK') {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Create payment with the tokenized card
   */
  async createPayment(token) {
    try {
      // Use an idempotency key to prevent duplicate charges
      const idempotencyKey = crypto.randomUUID();
      
      // Call your backend API to create the payment
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          sourceId: token,
          locationId: window.locationId,
          idempotencyKey,
          amount: 200 // $2.00 in cents
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Payment processing failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Payment API error:', error);
      throw error;
    }
  }

  /**
   * Handle hosted checkout redirect
   */
  async handleHostedCheckout() {
    const payButton = this.modal.querySelector('#pay-button');
    const payText = payButton.querySelector('.pay-text');
    const paySpinner = payButton.querySelector('.pay-spinner');
    const errorsContainer = this.modal.querySelector('#payment-errors');

    try {
      // Show loading state
      payButton.disabled = true;
      payText.style.display = 'none';
      paySpinner.style.display = 'flex';
      errorsContainer.innerHTML = '';
      
      // Get auth token
      const token = localStorage.getItem('supabase.auth.token') || 
                   JSON.parse(localStorage.getItem('sb-whwodcfvmdhkzwjsxfju-auth-token') || '{}').access_token;
      
      if (!token) {
        throw new Error('Please log in to continue with payment');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        console.log('✅ Checkout session created, redirecting to:', data.checkoutUrl);
        
        // Hide modal before redirect
        this.hide();
        
        // Redirect to Square hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Invalid checkout session response');
      }
      
    } catch (error) {
      console.error('❌ Hosted checkout failed:', error);
      this.showError(error.message || 'Failed to start checkout. Please try again.');
      
      // Reset button state
      payButton.disabled = false;
      payText.style.display = 'block';
      paySpinner.style.display = 'none';
    }
  }

  /**
   * Process payment with backend
   */
  async processPayment(token) {
    try {
      // Import auth utilities dynamically
      const { authenticatedFetch } = await import('/js/auth-utils.js');
      
      const response = await authenticatedFetch('/api/process-payment', {
        method: 'POST',
        body: JSON.stringify({
          token: token,
          amount: 200, // $2.00 in cents
          currency: 'USD'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Backend payment processing failed:', error);
      return { success: false, error: error.message || 'Payment processing failed' };
    }
  }

  /**
   * Unlock matching features after successful payment
   */
  async unlockMatching() {
    try {
      // Store payment status in localStorage
      localStorage.setItem('barcrush_paid', 'true');
      localStorage.setItem('barcrush_payment_date', new Date().toISOString());
      
      // Import auth utilities dynamically
      const { authenticatedFetch } = await import('/js/auth-utils.js');
      
      // Update user profile in backend
      const response = await authenticatedFetch('/api/user/payment-status', {
        method: 'POST',
        body: JSON.stringify({ has_paid: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlock matching in backend');
      }

      console.log('✅ Matching unlocked successfully');
      
      // Trigger success callback if provided
      if (this.onPaymentSuccess) {
        await this.onPaymentSuccess();
      }
      
    } catch (error) {
      console.error('❌ Failed to unlock matching:', error);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorsContainer = this.modal.querySelector('#payment-errors');
    errorsContainer.textContent = message;
  }
  
  /**
   * Create or update user subscription record in Supabase
   */
  async createSubscriptionRecord(paymentResult) {
    try {
      // Get current user
      const { data: { user } } = await window.supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ Cannot create subscription: User not authenticated');
        return false;
      }
      
      console.log('ℹ️ Creating subscription record for user:', user.id);
      
      // Create subscription record
      const { data, error } = await window.supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          is_active: true,
          subscription_level: 'premium',
          payment_method: 'square',
          payment_id: paymentResult?.payment?.id || ('square-' + Date.now()),
          payment_amount: paymentResult?.payment?.amount || 200, // Amount in cents
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        });
      
      if (error) {
        console.error('❌ Error creating subscription record:', error);
        return false;
      }
      
      console.log('✅ Subscription record created successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to create subscription record:', error);
      return false;
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    // Create temporary success overlay
    const successOverlay = document.createElement('div');
    successOverlay.className = 'success-overlay';
    successOverlay.innerHTML = `
      <div class="success-message">
        <div class="success-icon">✅</div>
        <h3>Payment Successful!</h3>
        <p>You can now access matching features</p>
      </div>
    `;
    
    document.body.appendChild(successOverlay);
    
    setTimeout(() => {
      successOverlay.remove();
    }, 3000);
  }

  /**
   * Check if user has already paid
   */
  static hasUserPaid() {
    const paid = localStorage.getItem('barcrush_paid');
    const paymentDate = localStorage.getItem('barcrush_payment_date');
    
    if (!paid || !paymentDate) return false;
    
    // Check if payment is still valid (e.g., within 30 days)
    const paymentTime = new Date(paymentDate);
    const now = new Date();
    const daysDiff = (now - paymentTime) / (1000 * 60 * 60 * 24);
    
    return daysDiff <= 30; // Payment valid for 30 days
  }
}

// Export for use in other modules
export default PaymentModal;

// Also make it available globally for debugging
window.PaymentModal = PaymentModal;

console.log('✅ PaymentModal class loaded and exported');
