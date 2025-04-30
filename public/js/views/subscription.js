import { ApiClient } from '/js/api-client.js';

/**
 * Initialize the subscription page
 */
export function initSubscriptionPage() {
  // Check if we have subscription data in localStorage
  const subscriptionData = localStorage.getItem('subscription_data');
  
  if (subscriptionData) {
    try {
      // Parse the subscription data
      const data = JSON.parse(subscriptionData);
      
      // Get the subscription form component
      const subscriptionForm = document.querySelector('subscription-form');
      
      // Set the subscription data
      if (subscriptionForm) {
        // Use the component's API to set the data
        subscriptionForm._subscription = data.subscription;
        subscriptionForm._paymentInfo = data.payment_info;
        subscriptionForm._email = data.subscription.email;
        subscriptionForm.render();
        
        // Clear the localStorage data to prevent reuse
        localStorage.removeItem('subscription_data');
      }
    } catch (error) {
      console.error('Error parsing subscription data:', error);
    }
  }

  // Handle offline/online status
  window.addEventListener('online', () => {
    document.getElementById('offline-notification').classList.remove('visible');
  });
  
  window.addEventListener('offline', () => {
    document.getElementById('offline-notification').classList.add('visible');
  });
}

// Initialize the page when the module is imported
initSubscriptionPage();