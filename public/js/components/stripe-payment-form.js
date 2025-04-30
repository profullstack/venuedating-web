class StripePaymentForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.setupEventListeners();
    this.updatePriceDisplay('monthly'); // Default to monthly
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-family, 'Arial, sans-serif');
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: var(--text-color);
        }
        
        input[type="email"] {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 6px;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        
        input[type="email"]:focus {
          border-color: var(--primary-color);
          outline: none;
        }
        
        .plan-options {
          display: flex;
          gap: 1rem;
        }
        
        .plan-option {
          flex: 1;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 8px;
          padding: 1.25rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .plan-option:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .plan-option.selected {
          border-color: var(--primary-color);
          background-color: rgba(var(--primary-color-rgb, 0, 102, 204), 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--primary-color-rgb, 0, 102, 204), 0.2);
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
          font-size: 1.125rem;
        }
        
        .price-display {
          font-size: 1.75rem;
          font-weight: bold;
          text-align: center;
          margin: 1.25rem 0;
          color: var(--primary-color);
          padding: 0.625rem;
          border-radius: 8px;
          background-color: rgba(var(--primary-color-rgb, 0, 102, 204), 0.05);
        }
        
        button {
          width: 100%;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 1rem;
          font-size: 1.125rem;
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
          gap: 0.5rem;
          margin-top: 1.25rem;
          color: var(--text-light, #666);
          font-size: 0.875rem;
          padding: 0.625rem;
          border-radius: 6px;
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        @media (max-width: 768px) {
          .plan-options {
            flex-direction: column;
          }
        }
      </style>
      
      <form id="stripe-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required placeholder="your@email.com">
        </div>
        
        <div class="form-group">
          <label>Choose Your Subscription Plan</label>
          <div class="plan-options">
            <div class="plan-option selected" id="monthly-plan">
              <input type="radio" name="plan" value="monthly" checked>
              <span>Monthly</span>
              <div>Billed monthly</div>
            </div>
            <div class="plan-option" id="yearly-plan">
              <input type="radio" name="plan" value="yearly">
              <span>Yearly</span>
              <div>Save 50%</div>
            </div>
          </div>
        </div>
        
        <div class="price-display" id="price-display">
          $5.00/month
        </div>
        
        <input type="hidden" id="selected-plan" name="selected-plan" value="monthly">
        
        <button type="submit" id="payment-button">Subscribe with Stripe</button>
        
        <div class="secure-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.3v3.5c0 .6-.6 1.2-1.3 1.2H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3z" />
          </svg>
          Secure payment via Stripe
        </div>
      </form>
    `;
  }

  setupEventListeners() {
    // Get elements
    const form = this.shadowRoot.getElementById('stripe-form');
    const monthlyPlan = this.shadowRoot.getElementById('monthly-plan');
    const yearlyPlan = this.shadowRoot.getElementById('yearly-plan');
    const monthlyRadio = this.shadowRoot.querySelector('input[value="monthly"]');
    const yearlyRadio = this.shadowRoot.querySelector('input[value="yearly"]');

    // Add event listeners for plan selection
    monthlyPlan.addEventListener('click', () => {
      monthlyRadio.checked = true;
      this.updatePriceDisplay('monthly');
    });

    yearlyPlan.addEventListener('click', () => {
      yearlyRadio.checked = true;
      this.updatePriceDisplay('yearly');
    });

    // Add event listeners for radio buttons
    monthlyRadio.addEventListener('change', () => {
      if (monthlyRadio.checked) {
        this.updatePriceDisplay('monthly');
      }
    });

    yearlyRadio.addEventListener('change', () => {
      if (yearlyRadio.checked) {
        this.updatePriceDisplay('yearly');
      }
    });

    // Handle form submission
    form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  updatePriceDisplay(plan) {
    const priceDisplay = this.shadowRoot.getElementById('price-display');
    const selectedPlanInput = this.shadowRoot.getElementById('selected-plan');
    const monthlyPlan = this.shadowRoot.getElementById('monthly-plan');
    const yearlyPlan = this.shadowRoot.getElementById('yearly-plan');
    
    // Update price display
    if (plan === 'yearly') {
      priceDisplay.textContent = '$30.00/year';
      yearlyPlan.classList.add('selected');
      monthlyPlan.classList.remove('selected');
    } else {
      priceDisplay.textContent = '$5.00/month';
      monthlyPlan.classList.add('selected');
      yearlyPlan.classList.remove('selected');
    }
    
    // Update selected plan input
    selectedPlanInput.value = plan;
    
    console.log(`Price display updated to: ${priceDisplay.textContent} for plan: ${plan}`);
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const email = this.shadowRoot.getElementById('email').value.trim();
    const plan = this.shadowRoot.getElementById('selected-plan').value;
    
    if (!email) {
      window.showFloatingAlert('Please enter your email address', 'error');
      return;
    }
    
    // Show loading state
    const submitButton = this.shadowRoot.getElementById('payment-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    
    // Get the current URL for success and cancel URLs
    const currentUrl = window.location.href;
    const successUrl = `${currentUrl}?payment=success`;
    const cancelUrl = `${currentUrl}?payment=cancel`;
    
    try {
      console.log('Creating checkout session with:', { email, plan, successUrl, cancelUrl });
      
      // Create checkout session
      const response = await fetch('/api/1/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          plan,
          success_url: successUrl,
          cancel_url: cancelUrl
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Checkout session created:', data);
      
      if (data && data.checkout_url) {
        console.log('Redirecting to:', data.checkout_url);
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        console.error('No checkout URL in response:', data);
        window.showFloatingAlert('Failed to create checkout session', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Subscribe with Stripe';
      }
    } catch (error) {
      console.error('Payment error:', error);
      window.showFloatingAlert('An error occurred while processing your payment', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Subscribe with Stripe';
    }
  }
}

// Register the custom element
customElements.define('stripe-payment-form', StripePaymentForm);