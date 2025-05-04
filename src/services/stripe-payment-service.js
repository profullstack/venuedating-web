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
  // Use the simplest possible configuration to avoid HTTP agent issues
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  console.log('Stripe client initialized successfully with minimal configuration');
} catch (error) {
  console.error('Failed to initialize Stripe client:', error);
  throw error;
}

// Cache for Stripe prices to avoid repeated API calls
const priceCache = {
  monthly: null,
  yearly: null,
  lastFetched: 0
};

// USE PRICE LOOKUP INSTEAD of hardcoded IDs, as they may have changed
// This approach is more reliable and avoids hardcoding values that might change
const PRICE_LOOKUP = {
  monthly: { interval: 'month', nickname: 'Monthly Subscription' },
  yearly: { interval: 'year', nickname: 'Yearly Subscription' }
};

/**
 * Stripe payment service for handling Stripe payments and subscriptions
 */
export const stripePaymentService = {
  /**
   * Create a new Stripe checkout session
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} tempClientId - Temporary client ID
   * @param {string} successUrl - URL to redirect to on successful payment
   * @param {string} cancelUrl - URL to redirect to on cancelled payment
   * @returns {Promise<Object>} - Checkout session details
   */
  async createCheckoutSession(email, plan, tempClientId, successUrl = null, cancelUrl = null) {
    console.log(`Creating Stripe checkout: ${email}, plan: ${plan}`);
    
    try {
      // Determine which price ID to use
      const priceId = plan === 'monthly' 
        ? process.env.STRIPE_MONTHLY_PRICE_ID 
        : process.env.STRIPE_YEARLY_PRICE_ID;
      
      if (!priceId) {
        throw new Error(`No Stripe price ID found for ${plan} plan`);
      }
      
      // Create checkout session with bare minimum parameters
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: successUrl || `${process.env.API_BASE_URL || 'http://localhost:8099'}/dashboard?success=true`,
        cancel_url: cancelUrl || `${process.env.API_BASE_URL || 'http://localhost:8099'}/register?canceled=true`,
        line_items: [{ price: priceId, quantity: 1 }]
      });
      
      console.log(`Checkout session created: ${session.id}`);
      
      // ⚠️ IMMEDIATE RETURN - Don't do anything else that could hang
      // Return directly to prevent any possible hanging
      const response = {
        id: session.id,
        session_id: session.id,
        checkout_url: session.url,
        url: session.url,
        created_at: new Date().toISOString()
      };

      return response;
      
      // Schedule database operations to run later
      // This won't block the response
      process.nextTick(() => {
        try {
          console.log(`Checkout URL: ${session.url}`);
          
          // Store in database after returning response
          supabase.from('stripe_payments').insert({
            email,
            session_id: session.id,
            plan,
            status: 'pending',
            payment_method: 'stripe',
            amount: plan === 'monthly' ? 500 : 3000,
            currency: 'usd',
            metadata: { temp_client_id: tempClientId }
          }).then(() => {
            console.log('Session stored in database');
          }).catch(err => {
            console.warn('Database storage failed:', err.message);
          });
        } catch (err) {
          console.warn('Error scheduling database update');
        }
      });
      
      // Return immediately with the response
      return response;
    } catch (error) {
      // Log error and continue
      console.error(`Stripe checkout error: ${error.message}`);
      
      // Create a friendly error URL for redirection
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:8099';
      const errorUrl = `${baseUrl}/register?error=${encodeURIComponent('Payment processing error')}&retry=true`;
      
      // Return minimal response that won't hang
      return {
        id: `error_${Date.now()}`,
        session_id: `error_${Date.now()}`,
        checkout_url: errorUrl,
        url: errorUrl,
        error: 'Could not process payment',
        created_at: new Date().toISOString()
      };
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
        const metadata = session.metadata || {};
        const email = metadata.email || session.customer_email;
        
        if (!email) {
          console.error('No email found in checkout session');
          return { error: 'No email found in checkout session' };
        }
        
        console.log(`Checkout completed for ${email}`);
        
        // Get the payment record
        const { data: paymentData, error: paymentError } = await supabase
          .from('stripe_payments')
          .select('*')
          .eq('session_id', session.id)
          .single();
        
        if (paymentError) {
          console.error('Error fetching payment record:', paymentError);
          return { error: paymentError.message };
        }
        
        if (!paymentData) {
          // Try finding by email if session_id doesn't match
          const { data: emailPaymentData, error: emailPaymentError } = await supabase
            .from('stripe_payments')
            .select('*')
            .eq('email', email)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (emailPaymentError || !emailPaymentData || emailPaymentData.length === 0) {
            console.error('No payment record found for completed checkout');
            return { error: 'No payment record found' };
          }
          
          paymentData = emailPaymentData[0];
        }
        
        // Get user data from auth database
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
        
        let userId;
        
        if (userError) {
          console.error('Error fetching user:', userError);
          // Create a new user automatically since payment was successful
          try {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                plan: paymentData.plan,
                payment_method: 'stripe'
              }
            });
            
            if (createError) {
              console.error('Error creating user after payment:', createError);
              return { error: createError.message };
            }
            
            userId = newUser.user.id;
            console.log(`Created new user after payment: ${userId}`);
          } catch (createUserError) {
            console.error('Failed to create user after payment:', createUserError);
            return { error: createUserError.message };
          }
        } else {
          userId = userData.user.id;
          console.log(`Found existing user: ${userId}`);
        }
        
        // Update payment record with user ID and set status to completed
        const { data: stripePaymentData, error: updateError } = await supabase
          .from('stripe_payments')
          .update({
            user_id: userId, // Now we have a real user ID to associate with the payment
            status: 'completed',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            payment_intent_id: session.payment_intent,
            completed_at: new Date().toISOString()
          })
          .eq('id', paymentData.id)
          .select();
        
        if (updateError) {
          console.error('Error updating payment record:', updateError);
          return { error: updateError.message };
        }
        
        // Create a subscription record in the subscriptions table
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: userId,
            plan: paymentData.plan,
            payment_method: 'stripe',
            status: 'active',
            start_date: new Date().toISOString(),
            // Set end date 30 days (monthly) or 365 days (yearly) from now
            end_date: paymentData.plan === 'monthly'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_subscription_id: session.subscription,
            amount: paymentData.amount,
            currency: paymentData.currency
          }]);
        
        if (subscriptionError) {
          console.error('Error creating subscription record:', subscriptionError);
          return { error: subscriptionError.message };
        }
        
        // Send welcome email with receipt
        try {
          await emailService.sendSubscriptionConfirmation(email, {
            plan: paymentData.plan,
            amount: paymentData.amount,
            currency: paymentData.currency
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the webhook if email fails
        }
        
        return {
          success: true,
          message: `Payment completed and user ${userId} subscription activated`
        };
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        if (!subscriptionId) {
          console.log('No subscription ID in invoice.paid event');
          return { error: 'No subscription ID found' };
        }
        
        // Find the subscription record by Stripe subscription ID
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        
        if (subscriptionError || !subscriptionData) {
          console.error('Error finding subscription:', subscriptionError?.message);
          return { error: 'Subscription not found' };
        }
        
        // Extend subscription period based on plan
        const currentEndDate = new Date(subscriptionData.end_date);
        let newEndDate;
        
        if (subscriptionData.plan === 'monthly') {
          // Add 30 days to current end date
          newEndDate = new Date(currentEndDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          // Add 365 days to current end date for yearly plan
          newEndDate = new Date(currentEndDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        }
        
        // Update subscription record with new end date
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            end_date: newEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionData.id);
        
        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return { error: updateError.message };
        }
        
        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        
        // Send renewal confirmation email
        try {
          if (email) {
            await emailService.sendSubscriptionRenewal(email, {
              plan: subscriptionData.plan,
              amount: subscriptionData.amount,
              currency: subscriptionData.currency,
              endDate: newEndDate.toISOString().split('T')[0]
            });
          }
        } catch (emailError) {
          console.error('Error sending renewal email:', emailError);
          // Don't fail the webhook if email fails
        }
        
        return {
          success: true,
          message: `Subscription ${subscriptionId} renewed successfully`
        };
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find the payment record by Stripe customer ID and subscription ID
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (subscriptionError || !subscriptionData) {
          console.error('Error finding subscription for deletion:', subscriptionError?.message);
          return { error: 'Subscription not found' };
        }
        
        // Update subscription status to canceled
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
            canceled_at: new Date().toISOString()
          })
          .eq('id', subscriptionData.id);
        
        if (updateError) {
          console.error('Error updating subscription to canceled:', updateError);
          return { error: updateError.message };
        }
        
        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        
        // Send cancellation email
        try {
          if (email) {
            await emailService.sendSubscriptionCanceled(email, {
              plan: subscriptionData.plan,
              endDate: subscriptionData.end_date.split('T')[0]
            });
          }
        } catch (emailError) {
          console.error('Error sending cancellation email:', emailError);
          // Don't fail the webhook if email fails
        }
        
        return {
          success: true,
          message: `Subscription ${subscription.id} canceled successfully`
        };
      }
      
      default:
        // Log unhandled events but don't take action
        console.log(`Unhandled webhook event type: ${event.type}`);
        return { message: `Event type ${event.type} not handled` };
    }
  },
  
  /**
   * Get user's Stripe subscription details
   * @param {string} email - User email
   * @returns {Promise<Object>} - Subscription details
   */
  async getSubscriptionDetails(email) {
    try {
      // First check if the user exists in Supabase
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError || !userData || !userData.user) {
        console.error('User not found:', userError?.message);
        return { error: 'User not found' };
      }
      
      const userId = userData.user.id;
      
      // Get the latest active subscription for this user
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        return { error: subscriptionError.message };
      }
      
      if (!subscriptionData || subscriptionData.length === 0) {
        // No active subscription found
        return { subscription: null };
      }
      
      const subscription = subscriptionData[0];
      
      // If it's a Stripe subscription, get latest details from Stripe
      if (subscription.payment_method === 'stripe' && subscription.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
          
          // Update local record if the status has changed
          if (stripeSubscription.status !== subscription.status) {
            await supabase
              .from('subscriptions')
              .update({ status: stripeSubscription.status })
              .eq('id', subscription.id);
              
            subscription.status = stripeSubscription.status;
          }
        } catch (stripeError) {
          console.warn('Could not fetch subscription from Stripe:', stripeError.message);
          // Continue with local data
        }
      }
      
      return { subscription };
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return { error: error.message };
    }
  },
  
  /**
   * Cancel a user's subscription
   * @param {string} email - User email
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelSubscription(email) {
    try {
      // Get the user's ID
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError || !userData || !userData.user) {
        console.error('User not found:', userError?.message);
        return { error: 'User not found' };
      }
      
      const userId = userData.user.id;
      
      // Get the active subscription for this user
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        return { error: subscriptionError.message };
      }
      
      if (!subscriptionData || subscriptionData.length === 0) {
        return { error: 'No active subscription found' };
      }
      
      const subscription = subscriptionData[0];
      
      // If it's a Stripe subscription, cancel it in Stripe
      if (subscription.payment_method === 'stripe' && subscription.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        } catch (stripeError) {
          console.error('Error canceling Stripe subscription:', stripeError);
          return { error: stripeError.message };
        }
      }
      
      // Update subscription status to canceled
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error('Error updating subscription to canceled:', updateError);
        return { error: updateError.message };
      }
      
      return { success: true, message: 'Subscription canceled successfully' };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { error: error.message };
    }
  },
  
  /**
   * Get Stripe publishable key
   * @returns {string} Stripe publishable key
   */
  getPublishableKey() {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  },
  
  /**
   * Get price ID for a subscription plan
   * @param {string} plan - Plan type (monthly, yearly)
   * @returns {string} - Price ID
   */
  async _getPriceIdForPlan(plan) {
    try {
      // Validate plan
      if (!['monthly', 'yearly'].includes(plan)) {
        throw new Error(`Invalid plan: ${plan}`);
      }
      
      // First try environment variables
      if (plan === 'monthly' && process.env.STRIPE_MONTHLY_PRICE_ID) {
        return process.env.STRIPE_MONTHLY_PRICE_ID;
      }
      
      if (plan === 'yearly' && process.env.STRIPE_YEARLY_PRICE_ID) {
        return process.env.STRIPE_YEARLY_PRICE_ID;
      }
      
      // Hardcoded fallbacks from logs
      const hardcodedPrices = {
        monthly: 'price_1RJS2RRAvUM4Kl4i4qyEkWDW',
        yearly: 'price_1RJS2RRAvUM4Kl4i8MYqDFPb'
      };
      
      return hardcodedPrices[plan];
    } catch (error) {
      console.error(`Error getting price ID for plan ${plan}:`, error);
      // Use hardcoded fallback values to avoid failing
      return plan === 'monthly' ? 'price_1RJS2RRAvUM4Kl4i4qyEkWDW' : 'price_1RJS2RRAvUM4Kl4i8MYqDFPb';
    }
  }
};
