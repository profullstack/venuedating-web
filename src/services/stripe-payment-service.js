import { supabase } from '../utils/supabase.js';
import { emailService } from './email-service.js';
import Stripe from 'stripe';
import dotenv from 'dotenv-flow';

// Load environment variables
dotenv.config();

// Initialize Stripe with the secret key
// Ensure the API key is available and log a clear error if it's not
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set or empty');
  console.error('Please check your .env file and ensure STRIPE_SECRET_KEY is properly configured');
}

// Initialize Stripe with better error handling and explicit configuration
let stripe;
try {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    // Add explicit request timeout
    timeout: 30000,
    // Add explicit HTTP client configuration
    httpClient: Stripe.createNodeHttpClient(),
    // Enable telemetry
    telemetry: true,
    // Add app info
    appInfo: {
      name: 'PDF Service',
      version: '1.0.0',
    },
  });
  console.log('Stripe client initialized successfully with explicit configuration');
} catch (error) {
  console.error('Failed to initialize Stripe client:', error);
  throw new Error('Stripe initialization failed. Check your API key and environment variables.');
}

/**
 * Stripe payment service for handling Stripe payments and subscriptions
 */
export const stripePaymentService = {
  /**
   * Create a new Stripe checkout session
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} successUrl - URL to redirect to on successful payment
   * @param {string} cancelUrl - URL to redirect to on cancelled payment
   * @returns {Promise<Object>} - Checkout session details
   */
  async createCheckoutSession(email, plan, successUrl, cancelUrl) {
    console.log(`Stripe payment service: Creating checkout session for ${email}, plan: ${plan}`);
    
    // Check if user exists in Supabase
    let userId = null;
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
        
      if (userData) {
        userId = userData.id;
        console.log(`Stripe payment service: User exists in Supabase with ID: ${userId}`);
      } else {
        console.log(`Stripe payment service: User does not exist in Supabase, will be created`);
        // Create user in Supabase
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ email }])
          .select()
          .single();
          
        if (createError) {
          console.error('Stripe payment service: Error creating user:', createError);
          throw createError;
        }
        
        userId = newUser.id;
        console.log(`Stripe payment service: Created new user with ID: ${userId}`);
      }
    } catch (userError) {
      console.warn('Stripe payment service: Error checking/creating user:', userError);
      throw userError;
    }
    
    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      console.log(`Stripe payment service: Invalid plan "${plan}"`);
      throw new Error('Invalid subscription plan. Must be "monthly" or "yearly".');
    }
    
    // Get price ID from Stripe based on the plan
    let priceId;
    try {
      // Find the appropriate price based on the plan
      console.log(`Stripe payment service: Fetching prices for plan "${plan}"`);
      try {
        const { data: prices } = await stripe.prices.list({
          active: true,
          limit: 100,
        });
        
        console.log(`Stripe payment service: Retrieved ${prices.length} prices from Stripe`);
        
        // Find price with metadata matching our plan
        const price = prices.find(p => p.metadata?.plan === plan);
        
        if (!price) {
          console.error(`Stripe payment service: No price found for plan "${plan}"`);
          console.log('Stripe payment service: Available prices:', prices.map(p => ({
            id: p.id,
            nickname: p.nickname,
            metadata: p.metadata
          })));
          throw new Error(`No price found for plan "${plan}"`);
        }
        
        priceId = price.id;
        console.log(`Stripe payment service: Found price ID ${priceId} for plan ${plan}`);
      } catch (listError) {
        console.error('Stripe payment service: Error listing prices:', listError);
        throw listError;
      }
    } catch (priceError) {
      console.error('Stripe payment service: Error finding price:', priceError);
      throw priceError;
    }
    
    // Create a checkout session
    try {
      console.log('Stripe payment service: Creating checkout session with the following parameters:');
      console.log('- customer_email:', email);
      console.log('- client_reference_id:', userId);
      console.log('- price:', priceId);
      console.log('- success_url:', successUrl);
      console.log('- cancel_url:', cancelUrl);
      
      // Create the checkout session with Stripe
      const session = await stripe.checkout.sessions.create({
        customer_email: email,
        client_reference_id: userId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: userId,
          email,
          plan
        }
      });
      
      console.log(`Stripe payment service: Created checkout session ${session.id}`);
      
      // Store the checkout session in Supabase
      const { error: sessionError } = await supabase
        .from('stripe_payments')
        .insert([{
          user_id: userId,
          email,
          session_id: session.id,
          plan,
          status: 'pending',
          payment_method: 'stripe',
          metadata: session
        }]);
        
      if (sessionError) {
        console.error('Stripe payment service: Error storing checkout session:', sessionError);
      }
      
      return session;
    } catch (sessionError) {
      console.error('Stripe payment service: Error creating checkout session:', sessionError);
      throw sessionError;
    }
  },
  
  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} - Processing result
   */
  async handleWebhookEvent(event) {
    console.log(`Stripe payment service: Handling webhook event ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract metadata
        const userId = session.client_reference_id;
        const email = session.customer_email || session.metadata?.email;
        const plan = session.metadata?.plan;
        
        if (!userId || !email || !plan) {
          console.error('Stripe payment service: Missing required metadata in session:', session);
          return { error: 'Missing required metadata' };
        }
        
        // Update stripe_payments record
        const { error: updateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'completed',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', session.id);
          
        if (updateError) {
          console.error('Stripe payment service: Error updating payment record:', updateError);
        }
        
        // Create or update subscription record
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
        
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert([{
            email,
            plan,
            amount: plan === 'monthly' 
              ? parseFloat(process.env.MONTHLY_SUBSCRIPTION_PRICE || '5')
              : parseFloat(process.env.YEARLY_SUBSCRIPTION_PRICE || '30'),
            interval: plan === 'monthly' ? 'month' : 'year',
            payment_method: 'stripe',
            status: 'active',
            start_date: now.toISOString(),
            expiration_date: expirationDate.toISOString(),
            payment_info: {
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              stripe_session_id: session.id
            },
            last_payment_date: now.toISOString()
          }])
          .select();
          
        if (subscriptionError) {
          console.error('Stripe payment service: Error creating subscription record:', subscriptionError);
        }
        
        // Send confirmation email
        try {
          await emailService.sendSubscriptionConfirmation(email, {
            plan,
            payment_method: 'stripe',
            start_date: now.toISOString(),
            expiration_date: expirationDate.toISOString()
          });
        } catch (emailError) {
          console.error('Stripe payment service: Error sending confirmation email:', emailError);
        }
        
        return { success: true, message: 'Checkout session completed' };
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        if (!subscriptionId) {
          console.error('Stripe payment service: Missing subscription ID in invoice:', invoice);
          return { error: 'Missing subscription ID' };
        }
        
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const plan = subscription.metadata?.plan || 
          (subscription.items.data[0]?.price.recurring?.interval === 'month' ? 'monthly' : 'yearly');
        
        // Find the user by Stripe customer ID
        const { data: paymentData } = await supabase
          .from('stripe_payments')
          .select('user_id, email')
          .eq('stripe_customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!paymentData) {
          console.error('Stripe payment service: No payment record found for customer:', customerId);
          return { error: 'No payment record found' };
        }
        
        const userId = paymentData.user_id;
        const email = paymentData.email;
        
        // Update subscription record
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
        
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            last_payment_date: now.toISOString(),
            expiration_date: expirationDate.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('email', email)
          .eq('payment_method', 'stripe')
          .eq('status', 'active');
          
        if (subscriptionError) {
          console.error('Stripe payment service: Error updating subscription record:', subscriptionError);
        }
        
        return { success: true, message: 'Invoice paid' };
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find the user by Stripe customer ID
        const { data: paymentData } = await supabase
          .from('stripe_payments')
          .select('user_id, email')
          .eq('stripe_customer_id', customerId)
          .eq('stripe_subscription_id', subscription.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!paymentData) {
          console.error('Stripe payment service: No payment record found for subscription:', subscription.id);
          return { error: 'No payment record found' };
        }
        
        const email = paymentData.email;
        
        // Update subscription record
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .eq('payment_method', 'stripe')
          .eq('status', 'active');
          
        if (subscriptionError) {
          console.error('Stripe payment service: Error updating subscription record:', subscriptionError);
        }
        
        return { success: true, message: 'Subscription cancelled' };
      }
      
      default:
        console.log(`Stripe payment service: Unhandled event type ${event.type}`);
        return { message: `Unhandled event type ${event.type}` };
    }
  },
  
  /**
   * Get user's Stripe subscription details
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - Subscription details or null if not found
   */
  async getStripeSubscription(email) {
    console.log(`Stripe payment service: Getting Stripe subscription for ${email}`);
    
    try {
      // Get the latest active subscription from Supabase
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', email)
        .eq('payment_method', 'stripe')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Stripe payment service: Error getting subscription:', error);
        throw error;
      }
      
      if (!subscription) {
        console.log(`Stripe payment service: No active Stripe subscription found for ${email}`);
        return null;
      }
      
      // Get Stripe subscription details if available
      if (subscription.payment_info?.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.payment_info.stripe_subscription_id
          );
          
          // Merge Stripe data with our subscription record
          return {
            ...subscription,
            stripe_details: stripeSubscription
          };
        } catch (stripeError) {
          console.error('Stripe payment service: Error retrieving Stripe subscription:', stripeError);
          // Return our subscription data even if Stripe retrieval fails
          return subscription;
        }
      }
      
      return subscription;
    } catch (error) {
      console.error('Stripe payment service: Error getting subscription:', error);
      throw error;
    }
  },
  
  /**
   * Cancel a Stripe subscription
   * @param {string} email - User email
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelSubscription(email) {
    console.log(`Stripe payment service: Cancelling subscription for ${email}`);
    
    try {
      // Get the active subscription
      const subscription = await this.getStripeSubscription(email);
      
      if (!subscription) {
        console.log(`Stripe payment service: No active subscription found for ${email}`);
        return { success: false, message: 'No active subscription found' };
      }
      
      // Cancel the Stripe subscription if available
      if (subscription.payment_info?.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(subscription.payment_info.stripe_subscription_id);
          console.log(`Stripe payment service: Cancelled Stripe subscription ${subscription.payment_info.stripe_subscription_id}`);
        } catch (stripeError) {
          console.error('Stripe payment service: Error cancelling Stripe subscription:', stripeError);
          throw stripeError;
        }
      }
      
      // Update our subscription record
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
        
      if (updateError) {
        console.error('Stripe payment service: Error updating subscription record:', updateError);
        throw updateError;
      }
      
      return { success: true, message: 'Subscription cancelled successfully' };
    } catch (error) {
      console.error('Stripe payment service: Error cancelling subscription:', error);
      throw error;
    }
  }
};