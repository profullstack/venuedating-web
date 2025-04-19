import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';
import { ApiClient } from '../api-client.js';

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
        padding: 20px;
      }
      
      h2 {
        margin-top: 0;
        margin-bottom: 20px;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      input[type="email"],
      select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
      }
      
      .radio-group {
        display: flex;
        gap: 20px;
        margin-top: 10px;
      }
      
      .radio-option {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .submit-button {
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      
      .submit-button:hover {
        background-color: #45a049;
      }
      
      .submit-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      .error {
        padding: 10px;
        background-color: #f8d7da;
        color: #721c24;
        border-radius: 4px;
        margin-bottom: 20px;
      }
      
      .payment-info {
        margin-top: 30px;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 4px;
        border: 1px solid #ddd;
      }
      
      .payment-info h3 {
        margin-top: 0;
        margin-bottom: 15px;
      }
      
      .payment-address {
        font-family: monospace;
        padding: 10px;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        word-break: break-all;
        margin-bottom: 15px;
      }
      
      .payment-details {
        margin-bottom: 15px;
      }
      
      .payment-details p {
        margin: 5px 0;
      }
      
      .payment-qr {
        text-align: center;
        margin-top: 20px;
      }
      
      .payment-qr img {
        max-width: 200px;
        height: auto;
      }
      
      .subscription-info {
        margin-top: 30px;
        padding: 20px;
        background-color: #d4edda;
        color: #155724;
        border-radius: 4px;
      }
      
      .subscription-info h3 {
        margin-top: 0;
        margin-bottom: 15px;
      }
      
      .subscription-details p {
        margin: 5px 0;
      }
      
      .loading {
        text-align: center;
        padding: 20px;
        font-style: italic;
        color: #666;
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
      <h2>Subscribe to Document Generation API</h2>
      
      <p>Subscribe to our document generation service to access all features.</p>
      
      ${this._error ? `<div class="error">${this._error}</div>` : ''}
      
      <form id="subscription-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required value="${this._email}">
        </div>
        
        <div class="form-group">
          <label>Subscription Plan</label>
          <div class="radio-group">
            <div class="radio-option">
              <input type="radio" id="monthly" name="plan" value="monthly" ${this._plan === 'monthly' ? 'checked' : ''}>
              <label for="monthly">Monthly - $${process.env.MONTHLY_SUBSCRIPTION_PRICE || 5}/month</label>
            </div>
            <div class="radio-option">
              <input type="radio" id="yearly" name="plan" value="yearly" ${this._plan === 'yearly' ? 'checked' : ''}>
              <label for="yearly">Yearly - $${process.env.YEARLY_SUBSCRIPTION_PRICE || 30}/year (Save over 50%!)</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="coin">Payment Method</label>
          <select id="coin" name="coin">
            <option value="btc" ${this._coin === 'btc' ? 'selected' : ''}>Bitcoin (BTC)</option>
            <option value="eth" ${this._coin === 'eth' ? 'selected' : ''}>Ethereum (ETH)</option>
            <option value="sol" ${this._coin === 'sol' ? 'selected' : ''}>Solana (SOL)</option>
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
      <h2>Complete Your Subscription</h2>
      
      ${this._error ? `<div class="error">${this._error}</div>` : ''}
      
      <div class="payment-info">
        <h3>Payment Information</h3>
        
        <p>Please send the exact amount to the following address:</p>
        
        <div class="payment-address">
          ${this._paymentInfo.address}
        </div>
        
        <div class="payment-details">
          <p><strong>Amount:</strong> $${this._subscription.amount} USD</p>
          <p><strong>Cryptocurrency:</strong> ${this._getCoinName(this._subscription.payment_method)}</p>
          <p><strong>Plan:</strong> ${this._subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'}</p>
        </div>
        
        <div class="payment-qr">
          <img src="https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${this._paymentInfo.address}" alt="Payment QR Code">
        </div>
        
        <p>Once your payment is confirmed, your subscription will be activated automatically.</p>
      </div>
      
      <button id="check-status-button" class="submit-button">Check Payment Status</button>
      <button id="new-subscription-button" class="submit-button">Create New Subscription</button>
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
      sol: 'Solana (SOL)'
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
      
      const response = await fetch('/api/1/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: this._email,
          plan: this._plan,
          coin: this._coin
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      const data = await response.json();
      
      this._subscription = data.subscription;
      this._paymentInfo = data.payment_info;
      this._loading = false;
      
      this.render();
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
            <p>Your subscription is now active. You can start using the API with your email as the API key.</p>
            <p><strong>API Key:</strong> ${this._email}</p>
            <p><strong>Expiration Date:</strong> ${new Date(this._subscription.expiration_date).toLocaleDateString()}</p>
          </div>
        </div>
      `);
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
}

// Define the custom element
customElements.define('subscription-form', SubscriptionForm);