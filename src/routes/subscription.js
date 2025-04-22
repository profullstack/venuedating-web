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
        crypto_amount: subscription.crypto_amount,
        crypto_currency: subscription.crypto_currency,
        exchange_rate_usd: subscription.exchange_rate_usd,
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
 * @returns {Response} - Plain text response with "ok" to acknowledge receipt
 */
export async function paymentCallbackHandler(c) {
  try {
    // Get callback data - could be JSON or query parameters
    let callbackData;
    const contentType = c.req.header('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      callbackData = await c.req.json();
      console.log('Payment callback received (JSON):', JSON.stringify(callbackData));
    } else {
      // Get data from query parameters
      const url = new URL(c.req.url);
      callbackData = Object.fromEntries(url.searchParams.entries());
      console.log('Payment callback received (Query):', JSON.stringify(callbackData));
    }
    
    // Log important callback data
    console.log(`Payment callback: uuid=${callbackData.uuid}, address_in=${callbackData.address_in}, txid_in=${callbackData.txid_in}`);
    console.log(`Payment details: value_coin=${callbackData.value_coin}, pending=${callbackData.pending}, confirmations=${callbackData.confirmations}`);
    
    // Verify the callback signature if provided
    const signature = c.req.header('x-ca-signature');
    if (signature) {
      console.log('Payment callback signature received:', signature);
      // TODO: Implement signature verification
    }
    
    // Process payment callback
    const subscription = await paymentService.processPaymentCallback(callbackData);
    console.log(`Payment processed for subscription ${subscription.id}, status: ${subscription.status}`);
    
    // Return plain text "ok" response as required by CryptAPI
    return c.text('*ok*');
  } catch (error) {
    console.error('Error processing payment callback:', error);
    console.error('Error stack:', error.stack);
    
    // Always return 200 OK with "ok" to CryptAPI, even if there's an error
    // This prevents CryptAPI from retrying the callback
    return c.text('*ok*');
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
 * Route handler for checking payment logs
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with payment logs
 */
export async function paymentLogsHandler(c) {
  try {
    const { subscription_id } = await c.req.json();
    
    if (!subscription_id) {
      return c.json({ error: 'Subscription ID is required' }, 400);
    }
    
    // Get payment logs
    const logs = await paymentService.checkPaymentLogs(subscription_id);
    
    return c.json({
      subscription_id,
      logs
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
 * Route configuration for CryptAPI payment callback endpoint
 */
export const paymentCallbackRoute = {
  method: 'POST',
  path: '/api/1/payments/cryptapi/callback',
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

/**
 * Route configuration for CryptAPI payment logs endpoint
 */
export const paymentLogsRoute = {
  method: 'POST',
  path: '/api/1/payments/cryptapi/logs',
  middleware: [],
  handler: paymentLogsHandler
};