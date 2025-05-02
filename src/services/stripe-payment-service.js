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
    // Add shorter request timeout to avoid hanging
    timeout: 10000,
    // Do not configure a custom httpClient, use the default one from Stripe
    // Disable telemetry to improve performance
    telemetry: false,
    // Add app info
    appInfo: {
      name: 'PDF Service',
      version: '1.0.0',
    },
  });
  console.log('Stripe client initialized successfully with optimized configuration');
} catch (error) {
  console.error('Failed to initialize Stripe client:', error);
  throw new Error('Stripe initialization failed. Check your API key and environment variables.');
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
   * @param {string} successUrl - URL to redirect to on successful payment
   * @param {string} cancelUrl - URL to redirect to on cancelled payment
   * @returns {Promise<Object>} - Checkout session details
   */
  async createCheckoutSession(email, plan, successUrl, cancelUrl) {
    console.log(`Stripe payment service: Creating checkout session for ${email}, plan: ${plan}`);
    
    // Generate a temporary client reference ID instead of creating a user account
    // This will be used to identify the registration data when payment is completed
    const tempClientId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store the registration data temporarily in the checkout metadata
    // The actual user account will be created after successful payment
    const registrationData = {
      email,
      tempClientId,
      plan,
      registeredAt: new Date().toISOString()
    };
    
    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      console.log(`Stripe payment service: Invalid plan "${plan}"`);
      throw new Error('Invalid subscription plan. Must be "monthly" or "yearly".');
    }
    
    // Get price ID for the plan
    let priceId = null;
    try {
      console.log(`Stripe payment service: Finding price for ${plan} plan`);
      
      // First check if there's a cached price ID
      if (priceCache[plan] && (Date.now() - priceCache.lastFetched <= 3600000)) {
        console.log(`Using cached price ID for ${plan} plan`);
        priceId = priceCache[plan];
      } else {
        // No cache, fetch from Stripe
        console.log(`Fetching prices from Stripe for ${plan} plan`);
        
        try {
          // Fetch all active prices
          const { data: prices } = await stripe.prices.list({
            active: true,
            limit: 100
          });
          
          console.log(`Retrieved ${prices.length} prices from Stripe`);
          
          // Look for a price with matching plan in metadata or matching interval
          const matchingPrice = prices.find(p => {
            // Check metadata first
            if (p.metadata && p.metadata.plan === plan) {
              return true;
            }
            
            // If not found, check the interval
            if (p.recurring && p.recurring.interval === PRICE_LOOKUP[plan].interval) {
              // For monthly plans, amount should be around $5
              if (plan === 'monthly' && p.unit_amount >= 400 && p.unit_amount <= 600) {
                return true;
              }
              
              // For yearly plans, amount should be around $30
              if (plan === 'yearly' && p.unit_amount >= 2500 && p.unit_amount <= 3500) {
                return true;
              }
            }
            
            return false;
          });
          
          if (matchingPrice) {
            console.log(`Found matching price: ${matchingPrice.id} (${matchingPrice.nickname || 'unnamed'}) - ${matchingPrice.unit_amount/100} USD`);
            priceId = matchingPrice.id;
            
            // Update cache
            priceCache[plan] = priceId;
            priceCache.lastFetched = Date.now();
          } else {
            console.warn(`No price found for plan ${plan}, falling back to first price in list`);
            
            // Get any price as a last resort
            if (prices.length > 0) {
              priceId = prices[0].id;
              console.log(`Using fallback price: ${priceId}`);
            } else {
              throw new Error(`No prices available in Stripe account`);
            }
          }
        } catch (error) {
          console.error(`Error fetching prices from Stripe: ${error.message}`);
          throw new Error(`Could not fetch prices from Stripe: ${error.message}`);
        }
      }
      
      if (!priceId) {
        throw new Error(`Could not find a price for plan ${plan}`);
      }
      
      console.log(`Using price ID ${priceId} for plan ${plan}`);

    } catch (priceError) {
      console.error('Stripe payment service: Error finding price:', priceError);
      throw priceError;
    }
    
    console.log(`Stripe payment service: Found price ID ${priceId} for plan ${plan}`);
    
    // Create a checkout session with timeout protection
    try {
      console.log('Stripe payment service: Creating checkout session with the following parameters:');
      console.log('- customer_email:', email);
      console.log('- client_reference_id:', tempClientId);
      console.log('- price:', priceId);
      console.log('- success_url:', successUrl);
      console.log('- cancel_url:', cancelUrl);
      
      // Create a promise that will resolve with the checkout session
      const createSessionPromise = stripe.checkout.sessions.create({
        customer_email: email,
        client_reference_id: tempClientId, // Use temporary ID instead of user ID
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
          temp_client_id: tempClientId,
          registration_data: JSON.stringify(registrationData),
          email,
          plan,
          pending_user_creation: 'true' // Flag to indicate user needs to be created
        }
      });
      
      // Create a timeout promise that will reject after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Stripe checkout session creation timed out')), 5000);
      });
      
      // Race the two promises
      const session = await Promise.race([createSessionPromise, timeoutPromise]).catch(error => {
        console.error('Stripe checkout session creation failed or timed out:', error);
        
        // Return a mock session if timeout occurs so user can continue
        if (error.message.includes('timed out')) {
          console.log('Returning redirect URL to Stripe for direct checkout');
          // Create a session-like object to return to the client with a direct Stripe URL
          return {
            id: 'timeout_fallback',
            url: `https://checkout.stripe.com/pay/${priceId}?client_reference_id=${tempClientId}&prefilled_email=${encodeURIComponent(email)}`
          };
        }
        throw error;
      });
      
      console.log(`Stripe payment service: Created checkout session ${session.id}`);
      
      // Store the checkout session in Supabase
      const { error: sessionError } = await supabase
        .from('stripe_payments')
        .insert([{
          // Don't include user_id as it will be set after payment verification
          email,
          temp_client_id: tempClientId, // Store the temporary client ID for reference
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
        const tempClientId = session.client_reference_id;
        const email = session.customer_email || session.metadata?.email;
        const plan = session.metadata?.plan;
        const pendingUserCreation = session.metadata?.pending_user_creation === 'true';
        let registrationData = null;
        
        try {
          if (session.metadata?.registration_data) {
            registrationData = JSON.parse(session.metadata.registration_data);
          }
        } catch (err) {
          console.error('Stripe payment service: Error parsing registration data:', err);
        }
        
        if (!tempClientId || !email || !plan) {
          console.error('Stripe payment service: Missing required metadata in session:', session);
          return { error: 'Missing required metadata' };
        }
        
        // Create user account if payment was successful and user doesn't exist yet
        let userId = null;
        if (pendingUserCreation) {
          // Check if user already exists (in case of duplicate payment)
          const { data: existingUsers } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .limit(1);
            
          if (existingUsers && existingUsers.length > 0) {
            // User already exists, use existing ID
            userId = existingUsers[0].id;
            console.log(`Stripe payment service: User ${email} already exists with ID ${userId}`);
          } else {
            // Create new user account
            console.log(`Stripe payment service: Creating user account for ${email} after successful payment`);
            
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert([{ email }])
              .select()
              .single();
              
            if (createError) {
              console.error('Stripe payment service: Error creating user:', createError);
              return { error: 'Failed to create user account' };
            }
            
            userId = newUser.id;
            console.log(`Stripe payment service: Created new user with ID: ${userId}`);
          }
        }
        
        // First, get or update the stripe_payments record
        const { data: stripePaymentData, error: updateError } = await supabase
          .from('stripe_payments')
          .update({
            user_id: userId, // Now we have a real user ID to associate with the payment
            status: 'completed',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', session.id)
          .select();
          
        if (updateError) {
          console.error('Stripe payment service: Error updating stripe payment record:', updateError);
          return { error: 'Error updating payment record' };
        }
        
        // If no record was found, create one (this shouldn't happen normally)
        let stripePaymentId;
        if (!stripePaymentData || stripePaymentData.length === 0) {
          console.warn('Stripe payment service: No existing stripe_payments record found, creating one');
          const { data: newPayment, error: newPaymentError } = await supabase
            .from('stripe_payments')
            .insert([{
              email,
              amount: plan === 'monthly' 
                ? parseFloat(process.env.MONTHLY_SUBSCRIPTION_PRICE || '5')
                : parseFloat(process.env.YEARLY_SUBSCRIPTION_PRICE || '30'),
              currency: 'USD',
              status: 'completed',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              session_id: session.id,
              payment_data: {
                checkout_session: session.id
              }
            }])
            .select()
            .single();
            
          if (newPaymentError) {
            console.error('Stripe payment service: Error creating stripe payment record:', newPaymentError);
            return { error: 'Error creating payment record' };
          }
          
          stripePaymentId = newPayment.id;
        } else {
          stripePaymentId = stripePaymentData[0].id;
        }
      }
      
      // First, get or update the stripe_payments record
      const { data: stripePaymentData, error: updateError } = await supabase
        .from('stripe_payments')
        .update({
          user_id: userId, // Now we have a real user ID to associate with the payment
          status: 'completed',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', session.id)
        .select();
        
      if (updateError) {
        console.error('Stripe payment service: Error updating stripe payment record:', updateError);
        return { error: 'Error updating payment record' };
      }
      
      // If no record was found, create one (this shouldn't happen normally)
      let stripePaymentId;
      if (!stripePaymentData || stripePaymentData.length === 0) {
        console.warn('Stripe payment service: No existing stripe_payments record found, creating one');
        const { data: newPayment, error: newPaymentError } = await supabase
          .from('stripe_payments')
          .insert([{
            email,
            amount: plan === 'monthly' 
              ? parseFloat(process.env.MONTHLY_SUBSCRIPTION_PRICE || '5')
              : parseFloat(process.env.YEARLY_SUBSCRIPTION_PRICE || '30'),
            currency: 'USD',
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
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!paymentData) {
          console.error('Stripe payment service: No payment record found for customer:', customerId);
          return { error: 'No payment record found' };
        }
        
        const stripePaymentId = paymentData.id;
        const email = paymentData.email;
        
        // First, create a new stripe_payment record for this invoice payment
        const { data: newStripePayment, error: newPaymentError } = await supabase
          .from('stripe_payments')
          .insert([{
            email,
            amount: invoice.amount_paid / 100, // Convert from cents to dollars
            currency: invoice.currency.toUpperCase(),
            status: 'completed',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            payment_data: {
              invoice_id: invoice.id,
              payment_intent: invoice.payment_intent
            }
          }])
          .select()
          .single();
        
        if (newPaymentError) {
          console.error('Stripe payment service: Error creating payment record for invoice:', newPaymentError);
          // Continue anyway to update the subscription
        }
        
        // Get the ID of the new payment record
        const newPaymentId = newStripePayment?.id || null;
        
        // Update subscription record
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
        
        // First try to find a subscription by stripe_payments_id
        let subscriptionUpdateError;
        if (stripePaymentId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              last_payment_date: now.toISOString(),
              expiration_date: expirationDate.toISOString(),
              updated_at: now.toISOString(),
              stripe_payments_id: newPaymentId || stripePaymentId // Update to newest payment if available
            })
            .eq('stripe_payments_id', stripePaymentId);
            
          subscriptionUpdateError = error;
        }
        
        // If no subscription was found or updated, try by email
        if (!stripePaymentId || subscriptionUpdateError) {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              last_payment_date: now.toISOString(),
              expiration_date: expirationDate.toISOString(),
              updated_at: now.toISOString(),
              stripe_payments_id: newPaymentId || stripePaymentId, // Link to the payment record
              payment_method: 'stripe' // Ensure payment method is set
            })
            .eq('email', email)
            .eq('payment_method', 'stripe')
            .eq('status', 'active');
          
          if (subscriptionError) {
            console.error('Stripe payment service: Error updating subscription record:', subscriptionError);
          }
        }
        
        return { success: true, message: 'Invoice paid' };
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find the payment record by Stripe customer ID and subscription ID
        const { data: paymentData } = await supabase
          .from('stripe_payments')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .eq('stripe_subscription_id', subscription.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!paymentData) {
          console.error('Stripe payment service: No payment record found for subscription:', subscription.id);
          return { error: 'No payment record found' };
        }
        
        const stripePaymentId = paymentData.id;
        const email = paymentData.email;
        
        // First try to update subscription by stripe_payments_id reference
        let subscriptionUpdateError;
        if (stripePaymentId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_payments_id', stripePaymentId);
            
          subscriptionUpdateError = error;
        }
        
        // If no subscription was found, try by email
        if (!stripePaymentId || subscriptionUpdateError) {
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
  },

  /**
   * Create a subscription directly using a payment method ID
   * @param {string} email - User email
   * @param {string} paymentMethodId - Stripe payment method ID
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @returns {Promise<Object>} - Subscription creation result
   */
  async createSubscription(email, paymentMethodId, plan) {
    try {
      console.log(`Creating subscription for ${email} with plan ${plan}`);
      
      // Get price ID based on the plan
      const priceId = this._getPriceIdForPlan(plan);
      if (!priceId) {
        throw new Error(`Invalid plan: ${plan}`);
      }
      
      // Find or create the customer
      let customer;
      const existingCustomers = await stripe.customers.list({ email });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log(`Found existing Stripe customer for ${email}: ${customer.id}`);
      } else {
        // Create a new customer
        customer = await stripe.customers.create({
          email,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          }
        });
        console.log(`Created new Stripe customer for ${email}: ${customer.id}`);
      }
      
      // Attach the payment method to the customer if it's not already
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
        console.log(`Attached payment method ${paymentMethodId} to customer ${customer.id}`);
      } catch (attachError) {
        // If the payment method is already attached, this might error
        console.warn('Payment method attachment error (may be already attached):', attachError.message);
      }
      
      // Set this payment method as the default for the customer
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        }
      });
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        }
      });
      
      console.log(`Created subscription ${subscription.id} for customer ${customer.id}`);
      
      // Check if payment needs additional authentication
      const invoice = subscription.latest_invoice;
      const paymentIntent = invoice.payment_intent;
      
      if (paymentIntent.status === 'requires_action') {
        // Return the client secret for the frontend to handle 3D Secure authentication
        return {
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          subscription: {
            id: subscription.id,
            status: subscription.status
          }
        };
      }
      
      // First, insert the payment record into stripe_payments table
      const { data: stripePayment, error: stripePaymentError } = await supabase
        .from('stripe_payments')
        .insert({
          user_id: null, // Will be updated after we get the user details
          email,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          session_id: null, // Not using checkout sessions with this flow
          amount: this._getPriceForPlan(plan),
          status: subscription.status,
          metadata: {
            plan,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            payment_method_id: paymentMethodId,
            payment_intent_id: paymentIntent?.id
          }
        })
        .select('id')
        .single();
      
      if (stripePaymentError) {
        console.error('Error inserting into stripe_payments:', stripePaymentError);
        // Continue with subscription creation despite the error
      }
      
      // Update user's subscription in the database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .upsert({
          email,
          plan,
          status: subscription.status,
          start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          expiration_date: new Date(subscription.current_period_end * 1000).toISOString(),
          payment_method: 'stripe',
          stripe_payments_id: stripePayment?.id // Link to the stripe payment record
        });
      
      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        // We don't want to throw here as the Stripe subscription was created successfully
      }
      
      // Send confirmation email
      await emailService.sendSubscriptionConfirmation(email, {
        plan,
        amount: this._getPriceForPlan(plan),
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        end_date: new Date(subscription.current_period_end * 1000).toISOString()
      });
      
      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end
        }
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to create subscription'
      };
    }
  },
  
  /**
   * Get price ID for a subscription plan
   * @param {string} plan - Plan type (monthly, yearly)
   * @returns {string} - Stripe price ID
   */
  _getPriceIdForPlan(plan) {
    if (plan === 'monthly') {
      return process.env.STRIPE_MONTHLY_PRICE_ID;
    } else if (plan === 'yearly') {
      return process.env.STRIPE_YEARLY_PRICE_ID;
    } else {
      throw new Error(`Invalid plan: ${plan}`);
    }
  },

  /**
   * Get price amount for a subscription plan
   * @param {string} plan - Plan type (monthly, yearly)
   * @returns {number} - Price amount in USD
   */
  _getPriceForPlan(plan) {
    if (plan === 'monthly') {
      return parseFloat(process.env.MONTHLY_SUBSCRIPTION_PRICE || '5');
    } else if (plan === 'yearly') {
      return parseFloat(process.env.YEARLY_SUBSCRIPTION_PRICE || '30');
    } else {
      return 5; // Default to $5
    }
  }
};