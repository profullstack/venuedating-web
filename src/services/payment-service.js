import { createCryptAPIClient } from '../utils/cryptapi-wrapper.js';
import { supabase } from '../utils/supabase.js';
import { emailService } from './email-service.js';
import dotenv from 'dotenv-flow';

// Load environment variables
dotenv.config();

/**
 * Payment service for handling cryptocurrency payments
 */
export const paymentService = {
  /**
   * Get CryptAPI client for a specific cryptocurrency
   * @param {string} coin - Cryptocurrency code (btc, eth, sol)
   * @returns {Object} - CryptAPI client
   * @private
   */
  _getCryptAPIClient(coin) {
    console.log(`Payment service: Getting CryptAPI client for coin: ${coin}`);
    
    // Get cryptocurrency wallet addresses from environment variables or use defaults
    const addresses = {
      btc: process.env.BITCOIN_ADDRESS || "bc1q254klmlgtanf8xez28gy7r0enpyhk88r2499pt",
      eth: process.env.ETHEREUM_ADDRESS || "0x402282c72a2f2b9f059C3b39Fa63932D6AA09f11",
      sol: process.env.SOLANA_ADDRESS || "CsTWZTbDryjcb229RQ9b7wny5qytH9jwoJy6Lu98xpeF",
      usdc: process.env.USDC_ADDRESS || "0x402282c72a2f2b9f059C3b39Fa63932D6AA09f11"
    };
    
    console.log(`Payment service: Using address for ${coin}: ${addresses[coin]}`);
    
    if (!addresses[coin]) {
      console.error(`Payment service: Unsupported cryptocurrency: ${coin}`);
      throw new Error(`Unsupported cryptocurrency: ${coin}`);
    }
    
    // Initialize the CryptAPI client using our wrapper
    console.log('Payment service: Initializing CryptAPI client with wrapper');
    const api = createCryptAPIClient();
    console.log('Payment service: CryptAPI client initialized with wrapper');
    
    // Return an object with methods for creating addresses and handling callbacks
    return {
      createAddress: (options) => {
        console.log('Payment service: Creating address with CryptAPI with options:', JSON.stringify(options));
        console.log(`Payment service: CryptAPI endpoint: /${coin}/create`);
        console.log(`Payment service: CryptAPI address: ${addresses[coin]}`);
        console.log(`Payment service: CryptAPI callback URL: ${options.callback}`);
        
        try {
          const result = api._createAddress(coin, addresses[coin], options.callback, {
            pending: options.pending,
            parameters: options.parameters
          });
          
          console.log('Payment service: CryptAPI createAddress successful');
          return result;
        } catch (error) {
          console.error('Payment service: Error in CryptAPI createAddress:', error);
          console.error('Payment service: Error stack:', error.stack);
          throw error;
        }
      }
    };
  },

  /**
   * Create a new subscription
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol)
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(email, plan, coin) {
    console.log(`Payment service: Creating subscription for ${email}, plan: ${plan}, coin: ${coin}`);
    
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
    console.log('Supabase URL:', supabase.supabaseUrl);
    console.log('Supabase key exists:', !!supabase.supabaseKey);
    
    try {
      // Create subscription record in Supabase
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert([{
          email,
          plan,
          amount,
          interval: plan === 'monthly' ? 'month' : 'year',
          payment_method: coin,
          status: 'pending',
          start_date: now.toISOString(),
          expiration_date: expirationDate.toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Payment service: Error creating subscription in Supabase:', error);
        console.error('Error details:', JSON.stringify(error));
        throw error;
      }
      
      console.log('Payment service: Subscription created in Supabase:', JSON.stringify(subscription));
      
      // Generate payment invoice
      console.log('Payment service: Preparing to generate payment invoice');
      console.log('Payment service: Getting CryptAPI client for', coin);
      
      try {
        const cryptapiClient = this._getCryptAPIClient(coin);
        const callbackUrl = 'https://pdf.profullstack.com/api/1/payment-callback';
        
        console.log('Payment service: Creating address with CryptAPI');
        console.log('Payment service: Using callback URL:', callbackUrl);
        
        const requestParams = {
          callback: callbackUrl,
          pending: true,
          parameters: {
            subscription_id: subscription.id,
            email
          }
        };
        
        console.log('Payment service: CryptAPI request parameters:', JSON.stringify(requestParams));
        
        const invoice = await cryptapiClient.createAddress(requestParams);
        
        if (!invoice) {
          console.error('Payment service: CryptAPI returned null or undefined response');
          throw new Error('CryptAPI returned null or undefined response');
        }
        
        console.log('Payment service: CryptAPI response:', JSON.stringify(invoice));
        
        // Validate the response
        if (!invoice.address_in) {
          console.error('Payment service: CryptAPI response missing address_in:', JSON.stringify(invoice));
          throw new Error('CryptAPI response missing payment address');
        }
        
        // Update subscription with payment details
        console.log('Payment service: Updating subscription with payment details');
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            payment_address: invoice.address_in,
            payment_info: invoice
          })
          .eq('id', subscription.id);
        
        if (updateError) {
          console.error('Payment service: Error updating subscription with payment details:', updateError);
          console.error('Error details:', JSON.stringify(updateError));
          throw updateError;
        }
      
      // Send subscription confirmation email
      try {
        console.log('Payment service: Sending confirmation email to', email);
        await emailService.sendSubscriptionConfirmation(email, {
          ...subscription,
          payment_address: invoice.address_in
        });
        console.log('Payment service: Confirmation email sent successfully');
      } catch (emailError) {
        console.error('Payment service: Error sending subscription confirmation email:', emailError);
        console.error('Error stack:', emailError.stack);
        // Don't throw error here, as the subscription was created successfully
      }
      
      const result = {
        ...subscription,
        payment_address: invoice.address_in,
        payment_info: invoice
      };
      
      console.log('Payment service: Returning subscription result:', JSON.stringify(result));
      return result;
      } catch (cryptapiError) {
        console.error('Payment service: Error in CryptAPI operations:', cryptapiError);
        console.error('Payment service: Error stack:', cryptapiError.stack);
        
        // Add more detailed error information for CryptAPI errors
        if (cryptapiError.response) {
          console.error('Payment service: CryptAPI error response status:', cryptapiError.response.status);
          console.error('Payment service: CryptAPI error response headers:', JSON.stringify(cryptapiError.response.headers));
          console.error('Payment service: CryptAPI error response data:', JSON.stringify(cryptapiError.response.data));
        }
        
        // Check if it's a 404 error from Unirest
        if (cryptapiError.message && cryptapiError.message.includes('got 404 response')) {
          console.error('Payment service: 404 error detected - CryptAPI endpoint might be incorrect or service might be down');
        }
        
        throw cryptapiError;
      }
    } catch (error) {
      console.error('Payment service: Unexpected error in createSubscription:', error);
      console.error('Error stack:', error.stack);
      
      // Add more detailed error information
      if (error.response) {
        console.error('Payment service: Error response status:', error.response.status);
        console.error('Payment service: Error response headers:', JSON.stringify(error.response.headers));
        console.error('Payment service: Error response data:', JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error('Payment service: Error request sent but no response received');
        console.error('Payment service: Error request details:', JSON.stringify(error.request));
      } else {
        console.error('Payment service: Error message:', error.message);
      }
      
      // Check if it's a 404 error from Unirest
      if (error.message && error.message.includes('got 404 response')) {
        console.error('Payment service: 404 error detected - CryptAPI endpoint might be incorrect or service might be down');
        
        // Generate a curl command for manual testing of the CryptAPI endpoint
        try {
          const baseURL = 'https://cryptapi.io/api/';
          const testCoin = coin || 'btc';
          const testAddress = process.env.BITCOIN_ADDRESS || "bc1q254klmlgtanf8xez28gy7r0enpyhk88r2499pt";
          const callbackUrl = 'https://pdf.profullstack.com/api/1/payment-callback';
          
          // Build query parameters
          const queryParams = new URLSearchParams();
          queryParams.append('address', testAddress);
          queryParams.append('callback', callbackUrl);
          queryParams.append('pending', 'true');
          
          const fullURL = `${baseURL}${testCoin}/create?${queryParams.toString()}`;
          const curlCommand = `curl -v "${fullURL}"`;
          
          console.error('Payment service: Try testing the CryptAPI endpoint with this curl command:');
          console.error(curlCommand);
          console.error('Payment service: If this also fails, the CryptAPI service might be down or the endpoint might have changed.');
        } catch (curlError) {
          console.error('Payment service: Error generating test curl command:', curlError);
        }
      }
      
      throw error;
    }
  },

  /**
   * Process payment callback
   * @param {Object} callbackData - Callback data from CryptAPI
   * @returns {Promise<Object>} - Updated subscription
   */
  async processPaymentCallback(callbackData) {
    // Extract subscription ID from parameters
    const subscriptionId = callbackData.parameters?.subscription_id;
    const email = callbackData.parameters?.email;
    
    if (!subscriptionId || !email) {
      throw new Error('Missing subscription ID or email in callback parameters');
    }
    
    // Get subscription from Supabase
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    if (error || !subscription) {
      console.error('Error fetching subscription:', error);
      throw error || new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Check if payment is confirmed
    if (callbackData.status_code === 2) { // 2 = Confirmed
      // Record payment in Supabase
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          subscription_id: subscriptionId,
          amount: subscription.amount,
          currency: subscription.payment_method,
          transaction_id: callbackData.txid_in,
          status: 'completed',
          payment_data: callbackData
        }])
        .select()
        .single();
      
      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        throw paymentError;
      }
      
      // Update subscription status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_payment_date: new Date().toISOString()
        })
        .eq('id', subscriptionId);
      
      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        throw updateError;
      }
      
      // Send payment received email
      try {
        await emailService.sendPaymentReceived(email, {
          ...payment,
          subscription
        });
      } catch (emailError) {
        console.error('Error sending payment received email:', emailError);
        // Don't throw error here, as the payment was processed successfully
      }
      
      return {
        ...subscription,
        status: 'active',
        last_payment_date: new Date().toISOString(),
        payment
      };
    }
    
    // Payment is still pending
    return subscription;
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
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, payments(*)')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
    
    return data && data.length > 0 ? data[0] : null;
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