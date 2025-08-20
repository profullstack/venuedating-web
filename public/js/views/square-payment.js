/**
 * Square Payment Page
 * 
 * Handles the payment flow using Square Web Payments SDK
 */

import SquarePaymentForm from '../components/square-payment-form.js';
import { getAuthenticatedUser } from '../modules/auth-system/auth.js';
import { showToast } from '../utils/toast.js';

// Payment configuration
const PAYMENT_CONFIG = {
  // Premium subscription amount in cents
  PREMIUM_AMOUNT: 1999, // $19.99
};

// DOM Elements
let paymentContainer;
let loadingIndicator;
let paymentForm;
let subscriptionDetails;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  initializeUI();
  await checkAuthentication();
  await initializePayment();
});

/**
 * Initialize UI elements
 */
function initializeUI() {
  paymentContainer = document.getElementById('payment-container');
  loadingIndicator = document.getElementById('loading-indicator');
  subscriptionDetails = document.getElementById('subscription-details');
  
  // Show loading indicator
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
}

/**
 * Check if user is authenticated
 */
async function checkAuthentication() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      // Redirect to login page if not authenticated
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    showToast('Authentication error. Please log in again.', 'error');
    window.location.href = '/login.html';
    return false;
  }
}

/**
 * Initialize the payment form
 */
async function initializePayment() {
  try {
    // Check if user already has an active subscription
    const hasSubscription = await checkExistingSubscription();
    
    if (hasSubscription) {
      showSubscriptionActive();
      return;
    }
    
    // Initialize Square payment form
    paymentForm = new SquarePaymentForm({
      amount: PAYMENT_CONFIG.PREMIUM_AMOUNT,
      currency: 'USD',
      buttonText: 'Subscribe Now',
      onPaymentStart: handlePaymentStart,
      onPaymentSuccess: handlePaymentSuccess,
      onPaymentError: handlePaymentError
    });
    
    await paymentForm.initialize('square-payment-form');
    
    // Update subscription details
    updateSubscriptionDetails();
    
    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  } catch (error) {
    console.error('Payment initialization failed:', error);
    showPaymentError('Failed to initialize payment system. Please try again later.');
  }
}

/**
 * Check if user already has an active subscription
 * @returns {Promise<boolean>} - Whether user has an active subscription
 */
async function checkExistingSubscription() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return false;
    }
    
    // Get user profile from Supabase
    const response = await fetch('/api/user-profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await response.json();
    
    // Check if user has paid
    return profile.has_paid === true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Update subscription details in the UI
 */
function updateSubscriptionDetails() {
  if (!subscriptionDetails) return;
  
  const formattedPrice = (PAYMENT_CONFIG.PREMIUM_AMOUNT / 100).toFixed(2);
  
  subscriptionDetails.innerHTML = `
    <h3>Premium Subscription</h3>
    <p class="price">$${formattedPrice}</p>
    <ul class="features">
      <li>Unlimited matches</li>
      <li>See who liked you</li>
      <li>Advanced filters</li>
      <li>Priority customer support</li>
    </ul>
  `;
}

/**
 * Show subscription active message
 */
function showSubscriptionActive() {
  if (!paymentContainer) return;
  
  // Hide loading indicator
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
  
  paymentContainer.innerHTML = `
    <div class="subscription-active">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h2>You're all set!</h2>
      <p>Your premium subscription is already active.</p>
      <p>Enjoy all the premium features of BarCrush!</p>
      <a href="/dashboard.html" class="button primary">Go to Dashboard</a>
    </div>
  `;
}

/**
 * Show payment error message
 * @param {string} message - Error message
 */
function showPaymentError(message) {
  // Hide loading indicator
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
  
  if (!paymentContainer) return;
  
  paymentContainer.innerHTML = `
    <div class="payment-error">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2>Payment Error</h2>
      <p>${message}</p>
      <button class="button primary" onclick="window.location.reload()">Try Again</button>
    </div>
  `;
}

/**
 * Handle payment start event
 */
function handlePaymentStart() {
  console.log('Payment started');
  showToast('Processing your payment...', 'info');
}

/**
 * Handle successful payment
 * @param {Object} result - Payment result
 */
function handlePaymentSuccess(result) {
  console.log('Payment successful:', result);
  showToast('Payment successful! Your subscription is now active.', 'success');
  
  // Show success message and redirect after a delay
  if (paymentContainer) {
    paymentContainer.innerHTML = `
      <div class="payment-success">
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2>Payment Successful!</h2>
        <p>Thank you for subscribing to BarCrush Premium.</p>
        <p>Your subscription is now active.</p>
        <div class="redirect-message">
          <p>Redirecting to dashboard in <span id="countdown">5</span> seconds...</p>
        </div>
      </div>
    `;
    
    // Countdown and redirect
    let seconds = 5;
    const countdownElement = document.getElementById('countdown');
    
    const interval = setInterval(() => {
      seconds--;
      
      if (countdownElement) {
        countdownElement.textContent = seconds;
      }
      
      if (seconds <= 0) {
        clearInterval(interval);
        window.location.href = '/dashboard.html';
      }
    }, 1000);
  }
}

/**
 * Handle payment error
 * @param {Error} error - Payment error
 */
function handlePaymentError(error) {
  console.error('Payment error:', error);
  showToast('Payment failed: ' + error.message, 'error');
}

// Export functions for testing
export {
  initializeUI,
  checkAuthentication,
  initializePayment,
  checkExistingSubscription,
  updateSubscriptionDetails,
  showSubscriptionActive,
  showPaymentError,
  handlePaymentStart,
  handlePaymentSuccess,
  handlePaymentError
};
