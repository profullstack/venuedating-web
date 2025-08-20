/**
 * Square API Utility
 * 
 * Provides helper functions for interacting with Square API
 */

import { supabaseClientPromise } from '../supabase-client.js';

/**
 * Fetch Square credentials from the server
 * @returns {Promise<Object>} - Square credentials
 */
export async function fetchSquareCredentials() {
  try {
    // Get the current user's token from Supabase session
    const supabase = await supabaseClientPromise;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('User authentication required');
    }
    
    // Use the correct port for the API server
    const apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/square-credentials'
      : '/api/square-credentials';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch Square credentials');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Square credentials:', error);
    throw error;
  }
}

/**
 * Load the Square Web Payments SDK
 * @returns {Promise<void>} - Resolves when the SDK is loaded
 */
export function loadSquareSDK() {
  return new Promise((resolve, reject) => {
    if (window.Square) {
      console.log('Square SDK already loaded');
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
    script.onload = () => {
      console.log('Square SDK loaded successfully');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Square SDK'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Process a payment with Square
 * @param {string} token - Payment token from Square
 * @param {number} amount - Payment amount in cents
 * @param {string} currency - Currency code (default: USD)
 * @returns {Promise<Object>} - Payment result
 */
export async function processPayment(token, amount, currency = 'USD') {
  try {
    // Get the current user's token
    const authToken = localStorage.getItem('supabase.auth.token');
    
    if (!authToken) {
      throw new Error('User authentication required');
    }
    
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token,
        amount,
        currency
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Payment processing failed');
    }
    
    return result;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

/**
 * Check if user has an active subscription
 * @returns {Promise<boolean>} - Whether user has an active subscription
 */
export async function checkSubscriptionStatus() {
  try {
    // First check localStorage for cached payment status
    const cachedStatus = localStorage.getItem('barcrush_payment_status');
    if (cachedStatus === 'paid') {
      console.log('User has already paid (from localStorage cache)');
      return true;
    }
    
    // Get the current user's token
    const supabase = await supabaseClientPromise;
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    if (!authToken) {
      console.log('No auth token available, user not logged in');
      return false;
    }
    
    console.log('Checking payment status from API...');
    
    // Get user profile from API
    const response = await fetch('/api/user-profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await response.json();
    
    // Check if user has paid
    const hasPaid = profile.has_paid === true;
    
    // Cache the result in localStorage
    if (hasPaid) {
      localStorage.setItem('barcrush_payment_status', 'paid');
      console.log('User has paid (from API), caching result');
    } else {
      console.log('User has not paid yet (from API)');
    }
    
    return hasPaid;
  } catch (error) {
    console.error('Error checking subscription:', error);
    // Fallback to localStorage if API fails
    const fallbackStatus = localStorage.getItem('barcrush_payment_status');
    if (fallbackStatus === 'paid') {
      console.log('API failed, using cached payment status');
      return true;
    }
    return false;
  }
}
