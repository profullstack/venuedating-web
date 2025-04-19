import CryptAPI from 'cryptapi';
import { supabase } from '../utils/supabase.js';
import { emailService } from './email-service.js';

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
    const addresses = {
      btc: process.env.BITCOIN_ADDRESS,
      eth: process.env.ETHEREUM_ADDRESS,
      sol: process.env.SOLANA_ADDRESS
    };
    
    if (!addresses[coin]) {
      throw new Error(`Unsupported cryptocurrency: ${coin}`);
    }
    
    return new CryptAPI(coin, addresses[coin]);
  },

  /**
   * Create a new subscription
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol)
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(email, plan, coin) {
    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      throw new Error('Invalid subscription plan. Must be "monthly" or "yearly".');
    }
    
    // Validate coin
    if (!['btc', 'eth', 'sol'].includes(coin)) {
      throw new Error('Invalid cryptocurrency. Must be "btc", "eth", or "sol".');
    }
    
    // Calculate amount and expiration date
    const amount = plan === 'monthly' 
      ? (process.env.MONTHLY_SUBSCRIPTION_PRICE || 5) 
      : (process.env.YEARLY_SUBSCRIPTION_PRICE || 30);
    
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
    
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
      console.error('Error creating subscription:', error);
      throw error;
    }
    
    // Generate payment invoice
    const cryptapi = this._getCryptAPIClient(coin);
    const callbackUrl = `${process.env.API_BASE_URL || 'https://pdf.profullstack.com'}/api/1/payment-callback`;
    
    const invoice = await cryptapi.createAddress({
      callback: callbackUrl,
      pending: true,
      parameters: {
        subscription_id: subscription.id,
        email
      }
    });
    
    // Update subscription with payment details
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        payment_address: invoice.address_in,
        payment_info: invoice
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      console.error('Error updating subscription with payment details:', updateError);
      throw updateError;
    }
    
    // Send subscription confirmation email
    try {
      await emailService.sendSubscriptionConfirmation(email, {
        ...subscription,
        payment_address: invoice.address_in
      });
    } catch (emailError) {
      console.error('Error sending subscription confirmation email:', emailError);
      // Don't throw error here, as the subscription was created successfully
    }
    
    return {
      ...subscription,
      payment_address: invoice.address_in,
      payment_info: invoice
    };
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