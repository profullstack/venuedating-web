import { createCryptAPIClient } from '../utils/cryptapi-wrapper.js';
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
    
    // Get cryptocurrency wallet addresses from environment variables
    const addresses = {
      btc: process.env.BITCOIN_ADDRESS,
      eth: process.env.ETHEREUM_ADDRESS,
      sol: process.env.SOLANA_ADDRESS,
      usdc: process.env.USDC_ADDRESS
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
    
    // Return an object with methods for creating addresses, converting currency, and handling callbacks
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
      },
      
      // Add the convertUsdToCrypto method to the returned object
      convertUsdToCrypto: async (coinType, amount) => {
        console.log(`Payment service: Converting USD to ${coinType}, amount: ${amount}`);
        
        try {
          // Use the original client's convertUsdToCrypto method
          const result = await api.convertUsdToCrypto(coinType, amount);
          console.log('Payment service: Currency conversion successful:', result);
          return result;
        } catch (error) {
          console.error('Payment service: Error in convertUsdToCrypto:', error);
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
    // Ensure user exists in Supabase
    try {
      await apiKeyService._createUserIfNotExists(email);
      console.log('Payment service: Ensured user exists in Supabase');
    } catch (userError) {
      console.error('Payment service: Error ensuring user exists in Supabase:', userError);
      throw userError;
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
    console.log('Supabase URL:', supabase.supabaseUrl);
    console.log('Supabase key exists:', !!supabase.supabaseKey);
    
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

      // Create subscription record in Supabase
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert([{
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
        const callbackUrl = 'https://pdf.profullstack.com/api/1/payments/cryptapi/callback';
        
        // Convert USD amount to cryptocurrency
        console.log(`Payment service: Converting ${amount} USD to ${coin}`);
        const conversion = await cryptapiClient.convertUsdToCrypto(coin, amount);
        console.log(`Payment service: Conversion result: ${JSON.stringify(conversion)}`);
        
        // Store the converted amount and rate
        const cryptoAmount = conversion.value;
        const conversionRate = conversion.rate;
        
        console.log('Payment service: Creating address with CryptAPI');
        console.log('Payment service: Using callback URL:', callbackUrl);
        
        const requestParams = {
          callback: callbackUrl,
          pending: 1,
          confirmations: 1,
          json: 1,
          parameters: {
            subscription_id: subscription.id,
            email,
            crypto_amount: cryptoAmount,
            conversion_rate: conversionRate
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
            payment_info: invoice,
            crypto_amount: cryptoAmount,
            conversion_rate: conversionRate
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
        payment_info: invoice,
        crypto_amount: cryptoAmount,
        conversion_rate: conversionRate
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
          const baseURL = 'https://api.cryptapi.io/';
          const testCoin = coin || 'btc';
          
          // Get the correct address for the selected coin from environment variables
          const addresses = {
            btc: process.env.BITCOIN_ADDRESS,
            eth: process.env.ETHEREUM_ADDRESS,
            sol: process.env.SOLANA_ADDRESS,
            usdc: process.env.USDC_ADDRESS
          };
          
          const testAddress = addresses[testCoin];
          const callbackUrl = 'https://pdf.profullstack.com/api/1/payments/cryptapi/callback';
          
          // Build query parameters according to official documentation
          const queryParams = new URLSearchParams();
          queryParams.append('address', testAddress);
          queryParams.append('callback', callbackUrl);
          queryParams.append('pending', '1');
          queryParams.append('confirmations', '1');
          queryParams.append('json', '1');
          
          const fullURL = `${baseURL}${testCoin}/create/?${queryParams.toString()}`;
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
    console.log('Payment service: Processing payment callback:', JSON.stringify(callbackData));
    
    // Extract subscription ID from parameters
    const subscriptionId = callbackData.parameters?.subscription_id;
    const email = callbackData.parameters?.email;
    
    if (!subscriptionId || !email) {
      console.error('Payment service: Missing subscription ID or email in callback parameters');
      throw new Error('Missing subscription ID or email in callback parameters');
    }
    
    // Get subscription from Supabase
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    if (error || !subscription) {
      console.error('Payment service: Error fetching subscription:', error);
      throw error || new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    // Check if this is a pending or confirmed callback
    const isPending = callbackData.pending === '1' || callbackData.pending === 1;
    console.log(`Payment service: Callback type: ${isPending ? 'Pending' : 'Confirmed'}`);
    
    if (isPending) {
      // This is a pending payment notification
      console.log(`Payment service: Pending payment received for subscription ${subscriptionId}`);
      console.log(`Payment service: Transaction ID: ${callbackData.txid_in}, Amount: ${callbackData.value_coin}`);
      
      // Primary verification using Tatum
      let verifiedAmount;
      let tatumBalance;
      try {
        // Get balance from appropriate Tatum endpoint based on coin type
        switch (callbackData.coin.toLowerCase()) {
          case 'btc':
            tatumBalance = await getBitcoinAddressBalance(callbackData.address_in);
            break;
          case 'eth':
            tatumBalance = await getEthereumAddressBalance(callbackData.address_in);
            break;
          case 'sol':
            tatumBalance = await getSolanaAddressBalance(callbackData.address_in);
            break;
          case 'usdc':
            tatumBalance = await getUsdcAddressBalance(callbackData.address_in);
            break;
          default:
            throw new Error(`Unsupported cryptocurrency: ${callbackData.coin}`);
        }
        console.log(`Payment service: Tatum balance verification for ${callbackData.coin}:`, tatumBalance);
        verifiedAmount = tatumBalance.incoming || tatumBalance.balance || tatumBalance.incoming_amount || 0;
      } catch (tatumError) {
        console.error('Payment service: Error verifying balance with Tatum:', tatumError);
        console.log('Payment service: Falling back to CryptAPI data');
        verifiedAmount = parseFloat(callbackData.value_coin);
      }

      // Record pending payment in Supabase
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          subscription_id: subscriptionId,
          amount: verifiedAmount,
          currency: callbackData.coin,
          transaction_id: callbackData.txid_in,
          status: 'pending',
          payment_data: callbackData,
          tatum_balance: tatumBalance
        }])
        .select()
        .single();
      
      if (paymentError) {
        console.error('Payment service: Error recording pending payment:', paymentError);
        throw paymentError;
      }
      
      // Update subscription status to pending_payment
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'pending_payment'
        })
        .eq('id', subscriptionId);
      
      if (updateError) {
        console.error('Payment service: Error updating subscription status:', updateError);
        throw updateError;
      }
      
      return {
        ...subscription,
        status: 'pending_payment',
        payment
      };
    } else {
      // This is a confirmed payment notification
      console.log(`Payment service: Confirmed payment received for subscription ${subscriptionId}`);
      console.log(`Payment service: Transaction ID: ${callbackData.txid_in}, Amount: ${callbackData.value_coin}`);
      console.log(`Payment service: Forwarded Amount: ${callbackData.value_forwarded_coin}, Fee: ${callbackData.fee_coin}`);
      
      // Find the pending payment record
      const { data: pendingPayments, error: findError } = await supabase
        .from('payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .eq('transaction_id', callbackData.txid_in)
        .eq('status', 'pending');
      
      if (findError) {
        console.error('Payment service: Error finding pending payment:', findError);
        throw findError;
      }
      
      let paymentId;
      
      if (pendingPayments && pendingPayments.length > 0) {
        // Primary verification using Tatum for confirmation
        let verifiedAmount;
        let tatumBalance;
        try {
          // Get balance from appropriate Tatum endpoint based on coin type
          switch (callbackData.coin.toLowerCase()) {
            case 'btc':
              tatumBalance = await getBitcoinAddressBalance(callbackData.address_in);
              break;
            case 'eth':
              tatumBalance = await getEthereumAddressBalance(callbackData.address_in);
              break;
            case 'sol':
              tatumBalance = await getSolanaAddressBalance(callbackData.address_in);
              break;
            case 'usdc':
              tatumBalance = await getUsdcAddressBalance(callbackData.address_in);
              break;
            default:
              throw new Error(`Unsupported cryptocurrency: ${callbackData.coin}`);
          }
          console.log(`Payment service: Tatum balance verification for ${callbackData.coin}:`, tatumBalance);
          verifiedAmount = tatumBalance.incoming || tatumBalance.balance || tatumBalance.incoming_amount || 0;
        } catch (tatumError) {
          console.error('Payment service: Error verifying balance with Tatum:', tatumError);
          console.log('Payment service: Falling back to CryptAPI data');
          verifiedAmount = parseFloat(callbackData.value_coin);
        }

        // Update existing payment record
        console.log(`Payment service: Updating existing payment record ${pendingPayments[0].id}`);
        
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            amount: verifiedAmount,
            amount_forwarded: parseFloat(callbackData.value_forwarded_coin),
            fee: parseFloat(callbackData.fee_coin),
            transaction_id_out: callbackData.txid_out,
            confirmations: parseInt(callbackData.confirmations),
            payment_data: callbackData,
            tatum_balance: tatumBalance,
            verification_source: tatumBalance ? 'tatum' : 'cryptapi'
          })
          .eq('id', pendingPayments[0].id);
        
        if (updatePaymentError) {
          console.error('Payment service: Error updating payment record:', updatePaymentError);
          throw updatePaymentError;
        }
        
        paymentId = pendingPayments[0].id;
      } else {
        // Verify payment using Tatum for new payment
        let tatumBalance;
        try {
          // Get balance from appropriate Tatum endpoint based on coin type
          switch (callbackData.coin.toLowerCase()) {
            case 'btc':
              tatumBalance = await getBitcoinAddressBalance(callbackData.address_in);
              break;
            case 'eth':
              tatumBalance = await getEthereumAddressBalance(callbackData.address_in);
              break;
            case 'sol':
              tatumBalance = await getSolanaAddressBalance(callbackData.address_in);
              break;
            case 'usdc':
              tatumBalance = await getUsdcAddressBalance(callbackData.address_in);
              break;
            default:
              throw new Error(`Unsupported cryptocurrency: ${callbackData.coin}`);
          }
          console.log(`Payment service: Tatum balance verification for ${callbackData.coin}:`, tatumBalance);
        } catch (tatumError) {
          console.error('Payment service: Error verifying balance with Tatum:', tatumError);
          // Continue with CryptAPI data if Tatum verification fails
          console.log('Payment service: Continuing with CryptAPI data due to Tatum error');
        }

        // Create new payment record
        console.log('Payment service: Creating new payment record');
        
        const { data: newPayment, error: createPaymentError } = await supabase
          .from('payments')
          .insert([{
            subscription_id: subscriptionId,
            amount: verifiedAmount,
            amount_forwarded: parseFloat(callbackData.value_forwarded_coin),
            fee: parseFloat(callbackData.fee_coin),
            currency: callbackData.coin,
            transaction_id: callbackData.txid_in,
            transaction_id_out: callbackData.txid_out,
            confirmations: parseInt(callbackData.confirmations),
            status: 'completed',
            payment_data: callbackData,
            tatum_balance: tatumBalance,
            verification_source: tatumBalance ? 'tatum' : 'cryptapi'
          }])
          .select()
          .single();
        
        if (createPaymentError) {
          console.error('Payment service: Error creating payment record:', createPaymentError);
          throw createPaymentError;
        }
        
        paymentId = newPayment.id;
      }
      
      // Calculate subscription expiration date
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setMonth(expirationDate.getMonth() + (subscription.plan === 'monthly' ? 1 : 12));
      
      // Update subscription status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_payment_date: now.toISOString(),
          expiration_date: expirationDate.toISOString()
        })
        .eq('id', subscriptionId);
      
      if (updateError) {
        console.error('Payment service: Error updating subscription status:', updateError);
        throw updateError;
      }
      
      // Get the updated payment record
      const { data: payment, error: getPaymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      
      if (getPaymentError) {
        console.error('Payment service: Error fetching updated payment:', getPaymentError);
        throw getPaymentError;
      }
      
      // Send payment received email
      try {
        await emailService.sendPaymentReceived(email, {
          ...payment,
          subscription: {
            ...subscription,
            status: 'active',
            last_payment_date: now.toISOString(),
            expiration_date: expirationDate.toISOString()
          }
        });
        console.log(`Payment service: Payment confirmation email sent to ${email}`);
      } catch (emailError) {
        console.error('Payment service: Error sending payment received email:', emailError);
        // Don't throw error here, as the payment was processed successfully
      }
      
      return {
        ...subscription,
        status: 'active',
        last_payment_date: now.toISOString(),
        expiration_date: expirationDate.toISOString(),
        payment
      };
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
   * Check payment logs for a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Payment logs
   */
  async checkPaymentLogs(subscriptionId) {
    console.log(`Payment service: Checking payment logs for subscription ${subscriptionId}`);
    
    try {
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
      
      const coin = subscription.payment_method;
      const callbackUrl = 'https://pdf.profullstack.com/api/1/payments/cryptapi/callback';
      
      // Get CryptAPI client
      const cryptapiClient = this._getCryptAPIClient(coin);
      
      // Check payment logs
      console.log(`Payment service: Checking payment logs for ${coin} with callback URL: ${callbackUrl}`);
      const logs = await cryptapiClient.checkPaymentLogs(coin, callbackUrl);
      
      // Filter logs for this subscription
      const subscriptionLogs = logs.filter(log =>
        log.parameters && log.parameters.subscription_id === subscriptionId
      );
      
      console.log(`Payment service: Found ${subscriptionLogs.length} logs for subscription ${subscriptionId}`);
      
      return subscriptionLogs;
    } catch (error) {
      console.error(`Payment service: Error checking payment logs for subscription ${subscriptionId}:`, error);
      console.error('Error stack:', error.stack);
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