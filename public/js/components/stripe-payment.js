import { BaseComponent } from './base-component.js';
import { ApiClient } from '../api-client.js';
// Use the global showAlert function

/**
 * Stripe Payment Component
 * Handles Stripe payment integration for subscriptions
 */
export class StripePayment extends BaseComponent {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.plan = 'monthly'; // Default plan
  }

  static get observedAttributes() {
    return ['plan'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'plan' && oldValue !== newValue) {
      this.plan = newValue;
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  addEventListeners() {
    this.shadowRoot.querySelector('#stripe-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePayment();
    });

    this.shadowRoot.querySelectorAll('input[name="plan"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.plan = e.target.value;
        this.updatePriceDisplay();
      });
    });
  }

  updatePriceDisplay() {
    const priceElement = this.shadowRoot.querySelector('#price-display');
    const monthlyPrice = parseFloat(this.getAttribute('monthly-price') || '5');
    const yearlyPrice = parseFloat(this.getAttribute('yearly-price') || '30');
    
    if (this.plan === 'monthly') {
      priceElement.textContent = `$${monthlyPrice.toFixed(2)}/month`;
    } else {
      priceElement.textContent = `$${yearlyPrice.toFixed(2)}/year`;
    }
  }

  async handlePayment() {
    try {
      const emailInput = this.shadowRoot.querySelector('#email');
      const email = emailInput.value.trim();
      
      if (!email) {
        window.showFloatingAlert('Please enter your email address', 'error');
        return;
      }
      
      if (!this.validateEmail(email)) {
        window.showFloatingAlert('Please enter a valid email address', 'error');
        return;
      }
      
      // Show loading state
      this.shadowRoot.querySelector('#payment-button').disabled = true;
      this.shadowRoot.querySelector('#payment-button').textContent = 'Processing...';
      
      // Get the current URL for success and cancel URLs
      const currentUrl = window.location.href;
      const successUrl = `${currentUrl}?payment=success`;
      const cancelUrl = `${currentUrl}?payment=cancel`;
      
      // Create checkout session
      const response = await fetch('/api/1/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          plan: this.plan,
          success_url: successUrl,
          cancel_url: cancelUrl
        })
      });
      
      const data = await response.json();
      
      if (data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        window.showFloatingAlert('Failed to create checkout session', 'error');
        this.shadowRoot.querySelector('#payment-button').disabled = false;
        this.shadowRoot.querySelector('#payment-button').textContent = 'Subscribe with Stripe';
      }
    } catch (error) {
      console.error('Payment error:', error);
      window.showFloatingAlert('An error occurred while processing your payment', 'error');
      this.shadowRoot.querySelector('#payment-button').disabled = false;
      this.shadowRoot.querySelector('#payment-button').textContent = 'Subscribe with Stripe';
    }
  }
  
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  render() {
    const monthlyPrice = parseFloat(this.getAttribute('monthly-price') || '5');
    const yearlyPrice = parseFloat(this.getAttribute('yearly-price') || '30');
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-family, 'Space Mono', monospace);
          color: var(--text-color, #333);
          max-width: 500px;
          margin: 0 auto;
        }
        
        h2 {
          margin-top: 0;
          color: var(--primary-color, #0066cc);
          text-align: center;
          display: none; /* Hide the heading as it's already in the container */
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: var(--text-color, #333);
        }
        
        input[type="email"] {
          width: 100%;
          padding: 12px;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        
        input[type="email"]:focus {
          border-color: var(--primary-color, #0066cc);
          outline: none;
        }
        
        .plan-options {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
        }
        
        .plan-option {
          flex: 1;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .plan-option:hover {
          border-color: var(--primary-color, #0066cc);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .plan-option.selected {
          border-color: var(--primary-color, #0066cc);
          background-color: rgba(0, 102, 204, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
        }
        
        .plan-option input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .plan-option span {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 18px;
        }
        
        .price-display {
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          color: var(--primary-color, #0066cc);
          padding: 10px;
          border-radius: 8px;
          background-color: rgba(0, 102, 204, 0.05);
        }
        
        button {
          background-color: var(--primary-color, #0066cc);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 16px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        button:hover {
          background-color: var(--primary-color-dark, #0052a3);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        button:disabled {
          background-color: var(--disabled-color, #cccccc);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          color: var(--text-light, #666);
          font-size: 14px;
          padding: 10px;
          border-radius: 6px;
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        .secure-badge svg {
          width: 18px;
          height: 18px;
        }
      </style>
      
      <h2>Subscribe with Stripe</h2>
      
      <form id="stripe-form">
        <div>
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required placeholder="your@email.com">
        </div>
        
        <div>
          <label>Choose Your Subscription Plan</label>
          <div class="plan-options">
            <label class="plan-option ${this.plan === 'monthly' ? 'selected' : ''}">
              <input type="radio" name="plan" value="monthly" ${this.plan === 'monthly' ? 'checked' : ''}>
              <span>Monthly</span>
              <div>Billed monthly</div>
            </label>
            <label class="plan-option ${this.plan === 'yearly' ? 'selected' : ''}">
              <input type="radio" name="plan" value="yearly" ${this.plan === 'yearly' ? 'checked' : ''}>
              <span>Yearly</span>
              <div>Save 50%</div>
            </label>
          </div>
        </div>
        
        <div class="price-display" id="price-display">
          ${this.plan === 'monthly' ? `$${monthlyPrice.toFixed(2)}/month` : `$${yearlyPrice.toFixed(2)}/year`}
        </div>
        
        <button type="submit" id="payment-button">Subscribe with Stripe</button>
        
        <div class="secure-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.3v3.5c0 .6-.6 1.2-1.3 1.2H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3z" />
          </svg>
          Secure payment via Stripe
        </div>
      </form>
    `;
    
    // Add event listeners after rendering
    this.addEventListeners();
    
    // Update plan selection styling
    const updatePlanSelection = () => {
      const planOptions = this.shadowRoot.querySelectorAll('.plan-option');
      planOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio.checked) {
          option.classList.add('selected');
        } else {
          option.classList.remove('selected');
        }
      });
    };
    
    this.shadowRoot.querySelectorAll('input[name="plan"]').forEach(radio => {
      radio.addEventListener('change', updatePlanSelection);
    });
  }
}

// Register the custom element
customElements.define('stripe-payment', StripePayment);