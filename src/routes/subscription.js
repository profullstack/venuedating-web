import { paymentService } from '../services/payment-service.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Route handler for creating a subscription
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with subscription details
 */
export async function createSubscriptionHandler(c) {
  try {
    console.log('Subscription API called');
    
    // Log request body
    const body = await c.req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { email, plan, coin } = body;
    
    // Validate required fields
    if (!email) {
      console.log('Validation error: Email is required');
      return c.json({ error: 'Email is required' }, 400);
    }
    
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      console.log(`Validation error: Invalid plan "${plan}"`);
      return c.json({ error: 'Valid plan is required (monthly or yearly)' }, 400);
    }
    
    if (!coin || !['btc', 'eth', 'sol'].includes(coin)) {
      console.log(`Validation error: Invalid coin "${coin}"`);
      return c.json({ error: 'Valid cryptocurrency is required (btc, eth, or sol)' }, 400);
    }
    
    console.log(`Creating subscription for ${email} with plan ${plan} and coin ${coin}`);
    
    // Create subscription
    const subscription = await paymentService.createSubscription(email, plan, coin);
    console.log('Subscription created:', JSON.stringify(subscription));
    
    // Return subscription details
    const response = {
      subscription: {
        id: subscription.id,
        email: subscription.email,
        plan: subscription.plan,
        amount: subscription.amount,
        interval: subscription.interval,
        status: subscription.status,
        start_date: subscription.start_date,
        expiration_date: subscription.expiration_date,
        payment_method: subscription.payment_method,
        payment_address: subscription.payment_address
      },
      payment_info: {
        address: subscription.payment_address,
        coin: subscription.payment_method,
        amount_fiat: subscription.amount,
        currency: 'USD'
      }
    };
    
    console.log('Returning response:', JSON.stringify(response));
    return c.json(response);
  } catch (error) {
    console.error('Error in subscription handler:', error);
    console.error('Error stack:', error.stack);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for payment callback
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with status
 */
export async function paymentCallbackHandler(c) {
  try {
    const callbackData = await c.req.json();
    
    // Process payment callback
    const subscription = await paymentService.processPaymentCallback(callbackData);
    
    // Return success response
    return c.json({
      status: 'success',
      subscription_id: subscription.id,
      subscription_status: subscription.status
    });
  } catch (error) {
    console.error('Error processing payment callback:', error);
    // Always return 200 OK to CryptAPI, even if there's an error
    return c.json({
      status: 'error',
      message: error.message
    }, 200);
  }
}

/**
 * Route handler for checking subscription status
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with subscription status
 */
export async function subscriptionStatusHandler(c) {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Get subscription details
    const subscription = await paymentService.getSubscription(email);
    
    if (!subscription) {
      return c.json({
        has_subscription: false,
        subscription: null
      });
    }
    
    // Check if subscription is active
    const isActive = subscription.status === 'active' && 
      new Date(subscription.expiration_date) > new Date();
    
    return c.json({
      has_subscription: isActive,
      subscription: {
        id: subscription.id,
        email: subscription.email,
        plan: subscription.plan,
        amount: subscription.amount,
        interval: subscription.interval,
        status: subscription.status,
        start_date: subscription.start_date,
        expiration_date: subscription.expiration_date,
        payment_method: subscription.payment_method,
        is_active: isActive
      }
    });
  } catch (error) {
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for subscription endpoint
 */
export const subscriptionRoute = {
  method: 'POST',
  path: '/api/1/subscription',
  middleware: [],
  handler: createSubscriptionHandler
};

/**
 * Route configuration for payment callback endpoint
 */
export const paymentCallbackRoute = {
  method: 'POST',
  path: '/api/1/payment-callback',
  middleware: [],
  handler: paymentCallbackHandler
};

/**
 * Route configuration for subscription status endpoint
 */
export const subscriptionStatusRoute = {
  method: 'POST',
  path: '/api/1/subscription-status',
  middleware: [],
  handler: subscriptionStatusHandler
};