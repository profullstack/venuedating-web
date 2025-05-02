import { paymentService } from '../services/payment-service.js';
import { errorUtils } from '../utils/error-utils.js';
import { supabase } from '../utils/supabase.js';
import { 
  getBitcoinAddressBalance,
  getEthereumAddressBalance,
  getSolanaAddressBalance,
  getUsdcAddressBalance
} from '../utils/tatum.js';

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
 * Route handler for checking subscription status
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with subscription status
 */
/**
 * Route handler for checking subscription status and verifying cryptocurrency payments
 * @param {Object} c - Hono context
 * @returns {Response} - JSON response with subscription status
 */
export async function subscriptionStatusHandler(c) {
  try {
    // Get request body or parameters
    const body = await c.req.json();
    const { id, email } = body;
    
    if (!id && !email) {
      return c.json({ error: 'Subscription ID or email is required' }, 400);
    }
    
    // Get subscription details from the database
    const subscription = id 
      ? await paymentService.getSubscriptionById(id)
      : await paymentService.getSubscription(email);
    
    if (!subscription) {
      return c.json({
        has_subscription: false,
        subscription: null
      });
    }
    
    console.log('Retrieved subscription:', JSON.stringify(subscription));
    
    // Check payment verification based on payment method
    let paymentVerified = false;
    let balance = null;
    
    // Check if this is a crypto payment or stripe payment
    if (subscription.crypto_payments) {
      // Handle crypto payment verification
      try {
        const cryptoPayment = subscription.crypto_payments;
        const paymentData = cryptoPayment.payment_data || {};
        const paymentAddress = paymentData.payment_address;
        const cryptoCurrency = cryptoPayment.currency;
        const requiredAmount = cryptoPayment.amount || 0;
        
        console.log(`Verifying payment for ${cryptoCurrency} at address ${paymentAddress}`);
        console.log(`Required amount: ${requiredAmount} ${cryptoCurrency}`);
        
        // Check balance for the appropriate cryptocurrency using Tatum API
        switch (cryptoCurrency) {
          case 'btc':
            balance = await getBitcoinAddressBalance(paymentAddress);
            break;
          case 'eth':
            balance = await getEthereumAddressBalance(paymentAddress);
            break;
          case 'sol':
            balance = await getSolanaAddressBalance(paymentAddress);
            break;
          case 'usdc':
            balance = await getUsdcAddressBalance(paymentAddress);
            break;
          default:
            throw new Error(`Unsupported cryptocurrency: ${cryptoCurrency}`);
        }
      
        console.log(`Retrieved balance from Tatum:`, balance);
        
        // Parse the balance based on cryptocurrency type
        let actualBalance = 0;
        if (cryptoCurrency === 'btc') {
          actualBalance = parseFloat(balance.incoming) - parseFloat(balance.outgoing);
        } else if (cryptoCurrency === 'eth' || cryptoCurrency === 'usdc') {
          actualBalance = parseFloat(balance.balance);
        } else if (cryptoCurrency === 'sol') {
          actualBalance = parseFloat(balance.balance);
        }
        
        console.log(`Actual balance: ${actualBalance} ${cryptoCurrency}`);
        
        // Verify if payment meets or exceeds the required amount
        if (actualBalance >= requiredAmount) {
          paymentVerified = true;
          console.log(`Payment verified: ${actualBalance} ${cryptoCurrency} >= ${requiredAmount} ${cryptoCurrency}`);
          
          // Update subscription status to active if payment is verified
          if (subscription.status !== 'active') {
            // First, create a user account if one doesn't exist yet
            let userId = subscription.user_id;
            
            if (!userId) {
              console.log(`Creating user account for ${subscription.email} after successful payment verification`);
              
              try {
                // Check if user already exists (to avoid duplicates)
                const { data: existingUsers } = await supabase
                  .from('users')
                  .select('id')
                  .eq('email', subscription.email)
                  .limit(1);
                  
                if (existingUsers && existingUsers.length > 0) {
                  // User already exists
                  userId = existingUsers[0].id;
                  console.log(`User ${subscription.email} already exists with ID ${userId}`);
                } else {
                  // Create new user
                  const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ email: subscription.email }])
                    .select()
                    .single();
                    
                  if (createError) {
                    console.error('Error creating user after payment verification:', createError);
                  } else {
                    userId = newUser.id;
                    console.log(`Created new user with ID: ${userId} after payment verification`);
                  }
                }
              } catch (error) {
                console.error('Error during user creation after payment verification:', error);
              }
            }
            
            // Now update the subscription with user ID and active status
            await supabase
              .from('subscriptions')
              .update({
                user_id: userId,
                status: 'active',
                updated_at: new Date().toISOString(),
                last_payment_date: new Date().toISOString()
              })
              .eq('id', subscription.id);
            
            console.log(`Subscription ${subscription.id} status updated to active and linked to user ${userId}`);
            
            // Update the subscription object to reflect the changes
            subscription.status = 'active';
            subscription.user_id = userId;
            subscription.updated_at = new Date().toISOString();
            subscription.last_payment_date = new Date().toISOString();
          }
        } else {
          console.log(`Payment verification failed: ${actualBalance} ${cryptoCurrency} < ${requiredAmount} ${cryptoCurrency}`);
        }
      } catch (verificationError) {
        console.error('Error verifying payment:', verificationError);
      }
    } else if (subscription.stripe_payments) {
      // For Stripe payments, we check if the subscription is active in Stripe's records
      console.log('Stripe payment detected - assuming verified if subscription exists');
      paymentVerified = subscription.status === 'active';
    }
    
    // Check if subscription is active based on status and expiration date
    const isActive = (subscription.status === 'active' || paymentVerified) && 
      new Date(subscription.expiration_date) > new Date();
    
    return c.json({
      has_subscription: isActive,
      payment_verified: paymentVerified,
      balance: balance,
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
        payment_address: subscription.payment_address,
        crypto_amount: subscription.crypto_amount,
        crypto_currency: subscription.crypto_currency,
        exchange_rate_usd: subscription.exchange_rate_usd,
        last_payment_date: subscription.last_payment_date,
        is_active: isActive
      }
    });
  } catch (error) {
    console.error('Error in subscription status handler:', error);
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
 * Route configuration for subscription status endpoint
 */
export const subscriptionStatusRoute = {
  method: 'POST',
  path: '/api/1/subscription-status',
  middleware: [],
  handler: subscriptionStatusHandler
};
