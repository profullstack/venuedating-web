import { errorUtils } from '../utils/error-utils.js';

/**
 * Mock payment service for testing without external dependencies
 */
export const mockPaymentService = {
  /**
   * Create a new subscription without external dependencies
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol)
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(email, plan, coin) {
    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      throw errorUtils.validationError('Invalid subscription plan. Must be "monthly" or "yearly".');
    }
    
    // Validate coin
    if (!['btc', 'eth', 'sol'].includes(coin)) {
      throw errorUtils.validationError('Invalid cryptocurrency. Must be "btc", "eth", or "sol".');
    }
    
    // Calculate amount and expiration date with hardcoded prices
    const amount = plan === 'monthly' ? 5 : 30;
    
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
    
    // Hardcoded cryptocurrency wallet addresses
    const addresses = {
      btc: "bc1q254klmlgtanf8xez28gy7r0enpyhk88r2499pt",
      eth: "0x402282c72a2f2b9f059C3b39Fa63932D6AA09f11",
      sol: "CsTWZTbDryjcb229RQ9b7wny5qytH9jwoJy6Lu98xpeF"
    };
    
    // Create a mock subscription without database interaction
    const subscription = {
      id: `sub_${Date.now()}`,
      email,
      plan,
      amount,
      interval: plan === 'monthly' ? 'month' : 'year',
      payment_method: coin,
      status: 'pending',
      start_date: now.toISOString(),
      expiration_date: expirationDate.toISOString(),
      payment_address: addresses[coin],
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    // Log the subscription for debugging
    console.log('Created mock subscription:', subscription);
    
    return {
      subscription: subscription,
      payment_info: {
        address: subscription.payment_address,
        coin: subscription.payment_method,
        amount_fiat: subscription.amount,
        currency: 'USD'
      }
    };
  },
  
  /**
   * Check if a user has an active subscription
   * @param {string} email - User email
   * @returns {Promise<boolean>} - Whether the user has an active subscription
   */
  async hasActiveSubscription(email) {
    // Always return true for testing
    return true;
  },
  
  /**
   * Get user's subscription details
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - Subscription details or null if not found
   */
  async getSubscription(email) {
    // Create a mock subscription for the user
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    
    return {
      id: `sub_${Date.now()}`,
      email,
      plan: 'monthly',
      amount: 5,
      interval: 'month',
      payment_method: 'btc',
      status: 'active',
      start_date: now.toISOString(),
      expiration_date: expirationDate.toISOString(),
      payment_address: 'bc1q254klmlgtanf8xez28gy7r0enpyhk88r2499pt',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  }
};