import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';
import { ApiClient } from '../api-client.js';
import { generateQRCode } from '../utils/qrcode-generator.js';

/**
 * Subscription form component
 */
export class SubscriptionForm extends BaseComponent {
  /**
   * Create a new subscription form
   */
  constructor() {
    super();
    this._email = '';
    this._plan = 'monthly';
    this._coin = 'btc';
    this._loading = false;
    this._error = null;
    this._subscription = null;
    this._paymentInfo = null;
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
        padding: 30px;
        background-color: var(--card-background);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-md);
        margin-bottom: 30px;
        color: var(--text-primary);
      }
      
      h2 {
        margin-top: 0;
        margin-bottom: 20px;
        color: var(--primary-color);
        font-weight: bold;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: var(--font-weight-medium);
        color: var(--text-secondary);
      }
      
      input[type="email"],
      select {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--input-border);
        border-radius: var(--border-radius-md);
        background-color: var(--input-background);
        color: var(--text-primary);
        font-size: var(--font-size-md);
        transition: border-color 0.2s;
      }
      
      input[type="email"]:focus,
      select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(224, 35, 55, 0.1);
      }
      
      .radio-group {
        display: flex;
        gap: 20px;
        margin-top: 10px;
      }
      
      .radio-option {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .submit-button {
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background-color 0.2s, transform 0.2s;
      }
      
      .submit-button:hover {
        background-color: var(--primary-dark);
        transform: translateY(-2px);
      }
      
      .submit-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        transform: none;
      }
      
      .error {
        padding: 12px;
        background-color: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-radius: 5px;
        margin-bottom: 20px;
        border-left: 4px solid #ef4444;
      }
      
      .payment-info {
        margin-top: 30px;
        padding: 25px;
        background-color: var(--surface-color);
        border-radius: var(--border-radius-lg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
      }
      
      .payment-info h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: var(--text-primary);
        font-weight: var(--font-weight-bold);
      }
      
      .payment-address {
        font-family: monospace;
        padding: 15px;
        background-color: var(--input-background);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        color: var(--text-primary);
        word-break: break-all;
        margin-bottom: 20px;
      }
      
      .payment-details {
        margin-bottom: 20px;
      }
      
      .payment-details p {
        margin: 8px 0;
        color: var(--text-secondary);
      }
      
      .payment-details strong {
        color: var(--text-primary);
      }
      
      .payment-qr {
        text-align: center;
        margin-top: 25px;
      }
      
      .payment-qr img {
        max-width: 200px;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .qr-caption {
        margin-top: 10px;
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }
      
      .subscription-info {
        margin-top: 30px;
        padding: 25px;
        background-color: rgba(224, 35, 55, 0.1);
        color: var(--primary-color);
        border-radius: var(--border-radius-lg);
        border-left: 4px solid var(--primary-color);
      }
      
      .subscription-info h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: var(--primary-color);
        font-weight: var(--font-weight-bold);
      }
      
      .subscription-details p {
        margin: 8px 0;
        color: var(--text-primary);
      }
      
      .loading {
        text-align: center;
        padding: 30px;
        font-style: italic;
        color: #6b7280;
      }
    `;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    if (this._loading) {
      return `
        <div class="loading">Processing your subscription request...</div>
      `;
    }
    
    if (this._subscription && this._paymentInfo) {
      return this._renderPaymentInfo();
    }
    
    return `
      <h2>Complete Your Subscription</h2>
      
      <p>Fill out the form below to subscribe to our document generation service and access all features.</p>
      
      ${this._error ? `<div class="error">${this._error}</div>` : ''}
      
      <form id="subscription-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required value="${this._email}" placeholder="your@email.com">
        </div>
        
        <div class="form-group">
          <label>Subscription Plan</label>
          <div class="radio-group">
            <div class="radio-option">
              <input type="radio" id="monthly" name="plan" value="monthly" ${this._plan === 'monthly' ? 'checked' : ''}>
              <label for="monthly" style="color: var(--text-primary);">Monthly - $5/month</label>
            </div>
            <div class="radio-option">
              <input type="radio" id="yearly" name="plan" value="yearly" ${this._plan === 'yearly' ? 'checked' : ''}>
              <label for="yearly" style="color: var(--text-primary);">Yearly - $30/year (Save over 50%!)</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="coin">Payment Method</label>
          <select id="coin" name="coin">
            <option value="btc" ${this._coin === 'btc' ? 'selected' : ''}>Bitcoin (BTC)</option>
            <option value="eth" ${this._coin === 'eth' ? 'selected' : ''}>Ethereum (ETH)</option>
            <option value="sol" ${this._coin === 'sol' ? 'selected' : ''}>Solana (SOL)</option>
            <option value="usdc" ${this._coin === 'usdc' ? 'selected' : ''}>USD Coin (USDC)</option>
          </select>
        </div>
        
        <button type="submit" class="submit-button" id="subscribe-button">Subscribe Now</button>
      </form>
    `;
  }

  /**
   * Render payment information
   * @returns {string} - HTML for payment information
   * @private
   */
  _renderPaymentInfo() {
    return `
      <h2>Complete Your Payment</h2>
      
      ${this._error ? `<div class="error">${this._error}</div>` : ''}
      
      <div class="payment-info">
        <h3>Payment Information</h3>
        
        <p>Please send the exact amount to the following cryptocurrency address:</p>
        
        <div class="payment-address">
          ${this._paymentInfo.address}
        </div>
        
        <div class="payment-details">
          <p><strong>Amount:</strong> $${this._subscription.amount} USD</p>
          <p><strong>Cryptocurrency:</strong> ${this._getCoinName(this._subscription.payment_method)}</p>
          <p><strong>Crypto Amount:</strong> ${this._subscription.crypto_amount} ${this._subscription.payment_method.toUpperCase()}</p>
          <p><strong>Exchange Rate:</strong> 1 USD = ${this._subscription.conversion_rate} ${this._subscription.payment_method.toUpperCase()}</p>
          <p><strong>Plan:</strong> ${this._subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'}</p>
          <p><strong>Email:</strong> ${this._subscription.email}</p>
        </div>
        
        <div class="payment-qr">
          <canvas id="qr-code-canvas" width="200" height="200"></canvas>
          <p class="qr-caption">Scan to pay ${this._subscription.crypto_amount} ${this._subscription.payment_method.toUpperCase()}</p>
        </div>
        
        <p>Once your payment is confirmed, your subscription will be activated automatically. This usually takes a few minutes, but can take longer depending on network congestion.</p>
      </div>
      
      <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
        <button id="check-status-button" class="submit-button">Check Payment Status</button>
        <button id="new-subscription-button" class="submit-button" style="background-color: #6b7280;">Create New Subscription</button>
      </div>
    `;
  }

  /**
   * Get cryptocurrency name
   * @param {string} coin - Cryptocurrency code
   * @returns {string} - Cryptocurrency name
   * @private
   */
  _getCoinName(coin) {
    const coins = {
      btc: 'Bitcoin (BTC)',
      eth: 'Ethereum (ETH)',
      sol: 'Solana (SOL)',
      usdc: 'USD Coin (USDC)'
    };
    
    return coins[coin] || coin;
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    if (this._loading) {
      return;
    }
    
    if (this._subscription && this._paymentInfo) {
      const checkStatusButton = this.$('#check-status-button');
      const newSubscriptionButton = this.$('#new-subscription-button');
      
      checkStatusButton.addEventListener('click', () => this.checkSubscriptionStatus());
      newSubscriptionButton.addEventListener('click', () => this.resetForm());
      
      // Generate QR code
      this._generateQRCode();
      
      return;
    }
    
    const form = this.$('#subscription-form');
    const emailInput = this.$('#email');
    const monthlyRadio = this.$('#monthly');
    const yearlyRadio = this.$('#yearly');
    const coinSelect = this.$('#coin');
    
    emailInput.addEventListener('input', (e) => {
      this._email = e.target.value;
    });
    
    monthlyRadio.addEventListener('change', () => {
      this._plan = 'monthly';
    });
    
    yearlyRadio.addEventListener('change', () => {
      this._plan = 'yearly';
    });
    
    coinSelect.addEventListener('change', (e) => {
      this._coin = e.target.value;
    });
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createSubscription();
    });
  }

  /**
   * Create a subscription
   */
  async createSubscription() {
    try {
      this._loading = true;
      this._error = null;
      this.render();
      
      // Use the ApiClient to create a subscription
      const data = await ApiClient.createSubscription(this._email, this._plan, this._coin);
      
      this._subscription = data.subscription;
      this._paymentInfo = data.payment_info;
      this._loading = false;
      
      this.render();
      
      // Track conversion event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'subscription_created', {
          'event_category': 'subscription',
          'event_label': this._plan,
          'value': this._plan === 'monthly' ? 5 : 30
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      this._error = error.message;
      this._loading = false;
      this.render();
    }
  }

  /**
   * Check subscription status
   */
  async checkSubscriptionStatus() {
    try {
      this._loading = true;
      this._error = null;
      this.render();
      
      const response = await fetch('/api/1/subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: this._email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check subscription status');
      }
      
      const data = await response.json();
      
      if (data.has_subscription) {
        // Subscription is active, show success message
        this._subscription = data.subscription;
        this._paymentInfo = null;
        this._loading = false;
        
        // Show success message
        this.render();
        this.showSuccessMessage();
      } else {
        // Subscription is not active yet
        this._loading = false;
        this.render();
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      this._error = error.message;
      this._loading = false;
      this.render();
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    const paymentInfo = this.$('.payment-info');
    
    if (paymentInfo) {
      paymentInfo.insertAdjacentHTML('afterend', `
        <div class="subscription-info">
          <h3>Subscription Active!</h3>
          
          <div class="subscription-details">
            <p>Your subscription is now active! You can start using the API immediately.</p>
            <p><strong>API Key:</strong> ${this._email}</p>
            <p><strong>Plan:</strong> ${this._subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'}</p>
            <p><strong>Expiration Date:</strong> ${new Date(this._subscription.expiration_date).toLocaleDateString()}</p>
            <p>You can view your API usage and manage your subscription in your account dashboard.</p>
          </div>
        </div>
      `);
      
      // Track conversion event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'subscription_activated', {
          'event_category': 'subscription',
          'event_label': this._subscription.plan,
          'value': this._subscription.amount
        });
      }
    }
  }

  /**
   * Reset the form
   */
  resetForm() {
    this._subscription = null;
    this._paymentInfo = null;
    this._error = null;
    this.render();
  }
  
  /**
   * Generate QR code for payment
   * @private
   */
  async _generateQRCode() {
    try {
      const canvas = this.$('#qr-code-canvas');
      if (!canvas) {
        console.error('QR code canvas element not found');
        return;
      }
      
      // Create payment URL with amount
      const paymentUrl = `${this._paymentInfo.address}?amount=${this._subscription.crypto_amount}`;
      console.log('Generating QR code for payment URL:', paymentUrl);
      
      // Import the QR code generator
      const { generateQRCodeToCanvas } = await import('../utils/qrcode-generator.js');
      
      // Generate QR code
      await generateQRCodeToCanvas(paymentUrl, canvas, {
        width: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: 'H',
        margin: 4
      });
      
      console.log('QR code generated successfully');
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      // Fallback to text if QR code generation fails
      const qrContainer = this.$('.payment-qr');
      if (qrContainer) {
        qrContainer.innerHTML = `
          <div class="payment-address" style="word-break: break-all; margin-bottom: 10px;">
            ${this._paymentInfo.address}
          </div>
          <p class="qr-caption">Send ${this._subscription.crypto_amount} ${this._subscription.payment_method.toUpperCase()}</p>
        `;
      }
    }
  }
}

// Define the custom element
customElements.define('subscription-form', SubscriptionForm);