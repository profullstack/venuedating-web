/**
 * Stripe integration helper for inline payments
 */

// Load the Stripe.js library and initialize with your publishable key
let stripePromise = null;

/**
 * Initialize Stripe with your publishable key
 * @returns {Promise<Stripe>} - Initialized Stripe instance
 */
export async function initStripe() {
  if (!stripePromise) {
    // Load the Stripe.js script dynamically
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.head.appendChild(script);
      
      // Wait for the script to load
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
    
    // Get the publishable key from your server or environment
    // For security, it's better to have your server provide this
    try {
      const response = await fetch('/api/1/payments/stripe/config');
      
      if (!response.ok) {
        console.error('Failed to fetch Stripe configuration:', response.status, response.statusText);
        
        // Handle server errors more gracefully
        if (response.status === 500) {
          try {
            // Try to get more details from the error response
            const errorData = await response.json();
            if (errorData.missingKey) {
              throw new Error('Stripe is not properly configured on the server. Please contact support.');
            }
          } catch (jsonError) {
            // If we can't parse the JSON, just use the generic error
          }
        }
        
        throw new Error('Could not load Stripe configuration. Please try another payment method.');
      }
      
      const data = await response.json();
      if (!data.publishableKey) {
        console.error('No publishable key found in Stripe configuration');
        throw new Error('Stripe is not properly configured. Please try another payment method or contact support.');
      }
      const { publishableKey } = data;
      
      stripePromise = window.Stripe(publishableKey);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }
  
  return stripePromise;
}

/**
 * Create Stripe card elements and mount them to the DOM
 * @param {string} elementId - The ID of the container element
 * @returns {Object} - The Stripe elements and card element
 */
export async function createCardElement(elementId) {
  try {
    // Make sure the element exists
    const container = document.getElementById(elementId);
    if (!container) {
      console.error(`Cannot create card element - container #${elementId} not found`);
      throw new Error(`Card element container #${elementId} not found`);
    }
    
    const stripe = await initStripe();
    const elements = stripe.elements();
    
    // Custom styling for the card element
    const style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };
    
    // Create the card element and mount it
    const cardElement = elements.create('card', { style });
    
    try {
      cardElement.mount(`#${elementId}`);
      console.log(`Stripe card element mounted to #${elementId}`);
    } catch (mountError) {
      console.error(`Error mounting card element to #${elementId}:`, mountError);
      throw new Error(`Could not mount card element: ${mountError.message}`);
    }
    
    return { stripe, elements, cardElement };
  } catch (error) {
    console.error('Error creating card element:', error);
    throw error;
  }
}

/**
 * Process payment with Stripe
 * @param {Object} stripeElements - The Stripe elements object containing stripe instance and card element
 * @param {Object} paymentData - Payment data including customer info and plan details
 * @returns {Promise<Object>} - The result of the payment processing
 */
export async function processPayment(stripeElements, paymentData) {
  const { stripe, cardElement } = stripeElements;
  
  try {
    // Create a payment method using the card element
    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        email: paymentData.email,
        name: paymentData.name || paymentData.email
      }
    });
    
    if (paymentMethodError) {
      return { success: false, error: paymentMethodError.message };
    }
    
    // Send the payment method ID to your server to create the subscription
    const response = await fetch('/api/1/payments/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_method_id: paymentMethod.id,
        email: paymentData.email,
        plan: paymentData.plan
      })
    });
    
    const result = await response.json();
    
    if (result.requiresAction) {
      // Handle 3D Secure authentication if required
      const { error, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret);
      
      if (error) {
        return { success: false, error: error.message };
      } else if (paymentIntent.status === 'succeeded') {
        return { success: true, subscription: result.subscription };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
