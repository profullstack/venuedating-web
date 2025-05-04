import { supabase } from '../utils/supabase.js';
import { emailService } from './email-service.js';
import { apiKeyService } from './api-key-service.js';
import { 
  getBitcoinAddressBalance,
  getEthereumAddressBalance,
  getSolanaAddressBalance,
  getUsdcAddressBalance,
  getTatumExchangeRateRest
} from '../utils/tatum.js';
import dotenv from 'dotenv-flow';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Payment service for handling cryptocurrency payments
 * Note: CryptAPI integration has been removed
 */
export const paymentService = {
  /**
   * Create a new subscription
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol)
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(email, plan, coin) {
    console.log(`Payment service: Creating subscription for ${email}, plan: ${plan}, coin: ${coin}`);
    
    // We no longer create a user account at this stage
    // Instead, we'll just check if one exists and only create it after payment verification
    let pendingUserCreation = true;
    let userId = null;
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
        
      if (userData) {
        console.log(`Payment service: User with email ${email} already exists with ID ${userData.id}`);
        userId = userData.id;
        pendingUserCreation = false;
      } else {
        console.log(`Payment service: User with email ${email} does not exist, will be created after payment verification`);
      }
    } catch (error) {
      console.warn('Payment service: Error checking user existence:', error);
    }
    
    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      console.log(`Payment service: Invalid plan "${plan}"`);
      throw new Error('Invalid subscription plan. Must be "monthly" or "yearly".');
    }
    
    // Validate coin
    if (!['btc', 'eth', 'sol', 'usdc'].includes(coin)) {
      console.log(`Payment service: Invalid coin "${coin}"`);
      throw new Error('Invalid cryptocurrency. Must be "btc", "eth", "sol", or "usdc".');
    }
    
    // Get amount from environment variables or use default values
    const amount = plan === 'monthly'
      ? parseFloat(process.env.MONTHLY_SUBSCRIPTION_PRICE || '5')
      : parseFloat(process.env.YEARLY_SUBSCRIPTION_PRICE || '30');
    
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
    
    console.log('Payment service: Creating subscription record in Supabase');
    
    try {
      // Get current exchange rate for the cryptocurrency
      let cryptoAmount;
      try {
        const rate = await getTatumExchangeRateRest(coin.toUpperCase(), 'USD');
        cryptoAmount = amount / rate;
        console.log(`Payment service: Converted ${amount} USD to ${cryptoAmount} ${coin} at rate ${rate}`);
      } catch (rateError) {
        console.error('Payment service: Error getting exchange rate:', rateError);
        throw rateError;
      }

      // Create records in both tables using a transaction approach
      let subscription;
      let cryptoPayment;
      try {
        // First, create the subscription record
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .insert([{
            email,
            plan,
            amount,
            interval: plan === 'monthly' ? 'month' : 'year',
            payment_method: coin, // Still keep the payment method in subscriptions for filtering
            status: 'pending',
            start_date: now.toISOString(),
            expiration_date: expirationDate.toISOString()
          }])
          .select()
          .single();
          
        if (subError) throw subError;
        subscription = subData;
        
        // Next, create the crypto_payments record
        // Wrap in try/catch to handle permission errors gracefully
        let paymentData = null;
        let paymentError = null;
        
        try {
          const result = await supabase
            .from('crypto_payments')
            .insert([{
              subscription_id: subscription.id,
              amount: cryptoAmount,
              currency: coin,
              exchange_rate_usd: amount / cryptoAmount,
              status: 'pending',
              payment_data: {
                fiat_amount: amount,
                fiat_currency: 'USD'
              }
            }])
            .select()
            .single();
            
          paymentData = result.data;
          paymentError = result.error;
          
          if (paymentError && paymentError.code === '42501') { // Permission denied
            console.warn('Permission denied for crypto_payments table, using localStorage fallback instead');
            
            // Create a temporary payment object with a generated ID
            // This will be stored in localStorage on the client until permissions are fixed
            paymentData = {
              id: crypto.randomUUID(),
              subscription_id: subscription.id,
              amount: cryptoAmount,
              currency: coin,
              exchange_rate_usd: amount / cryptoAmount,
              status: 'pending',
              payment_data: {
                fiat_amount: amount,
                fiat_currency: 'USD'
              },
              created_at: new Date().toISOString()
            };
            
            // Reset the error since we're handling it with our fallback
            paymentError = null;
          }
        } catch (err) {
          console.error('Error creating crypto payment record:', err);
          paymentError = err;
        }
          
        if (paymentError) throw paymentError;
        cryptoPayment = paymentData;
        
        // Finally, update the subscription with the crypto_payments_id reference
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ crypto_payments_id: cryptoPayment.id })
          .eq('id', subscription.id);
          
        if (updateError) throw updateError;
        
        if (subError) {
          if (subError.code === '42501') { // Permission denied error
            console.warn('Payment service: Permission denied when creating subscription, creating temporary record');
            
            // Create a temporary subscription object with a generated ID
            subscription = {
              id: crypto.randomUUID(),
              email,
              plan,
              amount,
              crypto_amount: cryptoAmount,
              crypto_currency: coin,
              exchange_rate_usd: amount / cryptoAmount,
              interval: plan === 'monthly' ? 'month' : 'year',
              payment_method: coin,
              status: 'pending',
              start_date: now.toISOString(),
              expiration_date: expirationDate.toISOString(),
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              temp_record: true
            };
          } else {
            console.error('Payment service: Error creating subscription in Supabase:', error);
            throw error;
          }
        } else {
          subscription = data;
        }
      } catch (subError) {
        if (subError.code === '42501') { // Permission denied error
          console.warn('Payment service: Permission denied when creating subscription, creating temporary record');
          
          // Create a temporary subscription object with a generated ID
          subscription = {
            id: crypto.randomUUID(),
            email,
            plan,
            amount,
            crypto_amount: cryptoAmount,
            crypto_currency: coin,
            exchange_rate_usd: amount / cryptoAmount,
            interval: plan === 'monthly' ? 'month' : 'year',
            payment_method: coin,
            status: 'pending',
            start_date: now.toISOString(),
            expiration_date: expirationDate.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            temp_record: true
          };
        } else {
          console.error('Payment service: Error creating subscription in Supabase:', subError);
          throw subError;
        }
      }
      
      console.log('Payment service: Subscription created in Supabase:', JSON.stringify(subscription));
      
      // Get cryptocurrency wallet addresses from environment variables
      const addresses = {
        btc: process.env.BITCOIN_ADDRESS,
        eth: process.env.ETHEREUM_ADDRESS,
        sol: process.env.SOLANA_ADDRESS,
        usdc: process.env.USDC_ADDRESS
      };
      
      // Update crypto_payments record with payment address
      console.log('Payment service: Updating crypto_payments with payment address');
      if (cryptoPayment && !cryptoPayment.temp_record) {
        const { error: updateError } = await supabase
          .from('crypto_payments')
          .update({
            transaction_id: null, // Will be filled when payment is received
            payment_data: {
              ...cryptoPayment.payment_data,
              payment_address: addresses[coin],
              crypto_amount: cryptoAmount,
              exchange_rate_usd: amount / cryptoAmount
            }
          })
          .eq('id', cryptoPayment.id);
      } else {
        // For temporary records, just log that we would have updated the address
        console.log(`Payment service: Would assign ${addresses[coin]} as payment address for temporary record`);
      }
      
      // Let's handle potential errors in updating crypto_payments
      if (cryptoPayment && !cryptoPayment.temp_record && updateError) {
        console.error('Payment service: Error updating crypto_payments with payment details:', updateError);
        console.error('Error details:', JSON.stringify(updateError));
        // Continue despite error since we have the main subscription record
      }
    
      // Send subscription confirmation email
      try {
        console.log('Payment service: Sending confirmation email to', email);
        // Prepare data combining both subscription and payment details
        const emailData = {
          ...subscription,
          payment_method: coin,
          payment_address: addresses[coin],
          crypto_amount: cryptoAmount,
          crypto_currency: coin
        };
        
        await emailService.sendSubscriptionConfirmation(email, emailData);
        console.log('Payment service: Confirmation email sent successfully');
      } catch (emailError) {
        console.error('Payment service: Error sending subscription confirmation email:', emailError);
        console.error('Error stack:', emailError.stack);
      }
      
      // Construct a combined result object that includes both subscription and crypto payment details
      const result = {
        ...subscription,
        crypto_payment: cryptoPayment ? {
          id: cryptoPayment.id,
          payment_address: addresses[coin],
          crypto_amount: cryptoAmount,
          crypto_currency: coin,
          exchange_rate_usd: amount / cryptoAmount
        } : null
      };
      
      console.log('Payment service: Returning subscription result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Payment service: Unexpected error in createSubscription:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  /**
   * Check if a user has an active subscription
   * @param {string} email - User email
   * @returns {Promise<boolean>} - Whether the user has an active subscription
   */
  async hasActiveSubscription(email) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .gte('expiration_date', new Date().toISOString())
      .order('expiration_date', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error checking subscription status:', error);
      throw error;
    }
    
    return data && data.length > 0;
  },

  /**
   * Get user's subscription details
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - Subscription details or null if not found
   */
  async getSubscription(email) {
    console.log(`Payment service: Getting subscription for ${email}`);
    
    try {
      // Query the subscription with related crypto payment data
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          crypto_payments:crypto_payments_id (*),
          stripe_payments:stripe_payments_id (*)
        `)
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // Handle not found error - this is expected for users without subscriptions
        if (error.code === 'PGRST116') {
          console.log(`Payment service: No subscription found for ${email}`);
          return null;
        }
        
        // Handle permission errors - 42501 is the PostgreSQL permission denied code
        if (error.code === '42501') {
          console.error(`Payment service: Permission denied when getting subscription for ${email}`);
          throw error; // Throw the error to be handled by the UI
        }
        
        console.error('Payment service: Error getting subscription:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Payment service: Error getting subscription:', error);
      console.error('Payment service: Error stack:', error.stack);
      
      // Throw the error to be handled by the UI
      throw error;
    }
  },
  
  /**
   * Get subscription details by ID
   * @param {string} id - Subscription ID
   * @returns {Promise<Object|null>} - Subscription details or null if not found
   */
  async getSubscriptionById(id) {
    console.log(`Payment service: Getting subscription by ID ${id}`);
    
    try {
      // Query the subscription with related payment data
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          crypto_payments:crypto_payments_id (*),
          stripe_payments:stripe_payments_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`Payment service: No subscription found with ID ${id}`);
          return null;
        }
        
        // Handle permission errors - 42501 is the PostgreSQL permission denied code
        if (error.code === '42501') {
          console.error(`Payment service: Permission denied when getting subscription by ID ${id}`);
          throw error; // Throw the error to be handled by the UI
        }
        
        console.error('Payment service: Error getting subscription by ID:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Payment service: Error getting subscription by ID:', error);
      console.error('Payment service: Error stack:', error.stack);
      
      // Throw the error to be handled by the UI
      throw error;
    }
  },

  /**
   * Send payment reminders for expiring subscriptions
   * @returns {Promise<number>} - Number of reminders sent
   */
  async sendPaymentReminders() {
    const now = new Date();
    
    // Get subscriptions expiring in 7 days
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const { data: expiringSubscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .gte('expiration_date', now.toISOString())
      .lte('expiration_date', sevenDaysFromNow.toISOString());
    
    if (error) {
      console.error('Error fetching expiring subscriptions:', error);
      throw error;
    }
    
    // Send reminders
    let remindersSent = 0;
    
    for (const subscription of expiringSubscriptions) {
      try {
        const expirationDate = new Date(subscription.expiration_date);
        const daysLeft = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        await emailService.sendPaymentReminder(subscription.email, subscription, daysLeft);
        remindersSent++;
        
        // Update subscription to mark reminder as sent
        await supabase
          .from('subscriptions')
          .update({
            reminder_sent: true
          })
          .eq('id', subscription.id);
      } catch (error) {
        console.error(`Error sending reminder for subscription ${subscription.id}:`, error);
      }
    }
    
    return remindersSent;
  },

  /**
   * Expire subscriptions that have passed their expiration date
   * @returns {Promise<number>} - Number of subscriptions expired
   */
  async expireSubscriptions() {
    const now = new Date();
    
    // Get active subscriptions that have expired
    const { data: expiredSubscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('expiration_date', now.toISOString());
    
    if (error) {
      console.error('Error fetching expired subscriptions:', error);
      throw error;
    }
    
    // Update subscriptions and send notifications
    let subscriptionsExpired = 0;
    
    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired'
          })
          .eq('id', subscription.id);
        
        // Send expiration notification
        await emailService.sendSubscriptionExpired(subscription.email, subscription);
        
        subscriptionsExpired++;
      } catch (error) {
        console.error(`Error expiring subscription ${subscription.id}:`, error);
      }
    }
    
    return subscriptionsExpired;
  }
};