import { stripePaymentService } from '../services/stripe-payment-service.js';
import { errorUtils } from '../utils/error-utils.js';
import Stripe from 'stripe';
import dotenv from 'dotenv-flow';

// Load environment variables
dotenv.config();

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Route handler for creating a Stripe checkout session
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with checkout session details
 */
export async function createCheckoutSessionHandler(c) {
  try {
    console.log('Stripe checkout session API called');
    
    // Log request body
    const body = await c.req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { email, plan, success_url, cancel_url } = body;
    
    // Validate required fields
    if (!email) {
      console.log('Validation error: Email is required');
      return c.json({ error: 'Email is required' }, 400);
    }
    
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      console.log(`Validation error: Invalid plan "${plan}"`);
      return c.json({ error: 'Valid plan is required (monthly or yearly)' }, 400);
    }
    
    if (!success_url) {
      console.log('Validation error: Success URL is required');
      return c.json({ error: 'Success URL is required' }, 400);
    }
    
    if (!cancel_url) {
      console.log('Validation error: Cancel URL is required');
      return c.json({ error: 'Cancel URL is required' }, 400);
    }
    
    console.log(`Creating Stripe checkout session for ${email} with plan ${plan}`);
    
    // Create checkout session
    const session = await stripePaymentService.createCheckoutSession(
      email, 
      plan, 
      success_url, 
      cancel_url
    );
    
    console.log('Checkout session created:', JSON.stringify(session));
    
    // Return session details
    return c.json({
      session_id: session.id,
      checkout_url: session.url
    });
  } catch (error) {
    console.error('Error in checkout session handler:', error);
    console.error('Error stack:', error.stack);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for Stripe webhooks
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with webhook processing result
 */
export async function webhookHandler(c) {
  try {
    // Get the raw request body
    const rawBody = await c.req.raw.text();
    
    // Get the Stripe signature header
    const signature = c.req.header('stripe-signature');
    
    if (!signature) {
      console.error('Webhook error: No Stripe signature header');
      return c.json({ error: 'No Stripe signature header' }, 400);
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (verifyError) {
      console.error('Webhook signature verification failed:', verifyError);
      return c.json({ error: `Webhook signature verification failed: ${verifyError.message}` }, 400);
    }
    
    console.log(`Webhook received: ${event.type}`);
    
    // Process the webhook event
    const result = await stripePaymentService.handleWebhookEvent(event);
    
    return c.json(result);
  } catch (error) {
    console.error('Error in webhook handler:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
}

/**
 * Route handler for getting a user's Stripe subscription
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with subscription details
 */
export async function getSubscriptionHandler(c) {
  try {
    // Get request body or parameters
    const body = await c.req.json();
    const { email } = body;
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Get subscription details
    const subscription = await stripePaymentService.getStripeSubscription(email);
    
    if (!subscription) {
      return c.json({
        has_subscription: false,
        subscription: null
      });
    }
    
    return c.json({
      has_subscription: subscription.status === 'active',
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
        last_payment_date: subscription.last_payment_date,
        is_active: subscription.status === 'active'
      }
    });
  } catch (error) {
    console.error('Error in subscription handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route handler for cancelling a Stripe subscription
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with cancellation result
 */
export async function cancelSubscriptionHandler(c) {
  try {
    // Get request body or parameters
    const body = await c.req.json();
    const { email } = body;
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Cancel subscription
    const result = await stripePaymentService.cancelSubscription(email);
    
    return c.json(result);
  } catch (error) {
    console.error('Error in cancel subscription handler:', error);
    return errorUtils.handleError(error, c);
  }
}

/**
 * Route configuration for Stripe checkout session endpoint
 */
export const stripeCheckoutRoute = {
  method: 'POST',
  path: '/api/1/payments/stripe/create-checkout-session',
  middleware: [],
  handler: createCheckoutSessionHandler
};

/**
 * Route configuration for Stripe webhook endpoint
 */
export const stripeWebhookRoute = {
  method: 'POST',
  path: '/api/1/payments/stripe/webhook',
  middleware: [],
  handler: webhookHandler
};

/**
 * Route configuration for getting Stripe subscription endpoint
 */
export const stripeSubscriptionRoute = {
  method: 'POST',
  path: '/api/1/payments/stripe/subscription',
  middleware: [],
  handler: getSubscriptionHandler
};

/**
 * Route configuration for cancelling Stripe subscription endpoint
 */
export const stripeCancelSubscriptionRoute = {
  method: 'POST',
  path: '/api/1/payments/stripe/cancel-subscription',
  middleware: [],
  handler: cancelSubscriptionHandler
};

/**
 * All Stripe payment routes
 */
export const stripePaymentRoutes = [
  stripeCheckoutRoute,
  stripeWebhookRoute,
  stripeSubscriptionRoute,
  stripeCancelSubscriptionRoute
];