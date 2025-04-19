/**
 * Main application entry point
 */
import Router from './router.js';

// Import components
import './components/pf-header.js';
import './components/pf-footer.js';
import './components/pf-dialog.js';
import './components/pf-hero.js';

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing app');
  initApp();
});

// Also initialize immediately to handle direct navigation
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Document already ready, initializing app');
  initApp();
}

/**
 * Initialize the application
 */
function initApp() {
  // Initialize the router for SPA mode
  initRouter();
}

/**
 * Initialize the router for SPA mode
 */
function initRouter() {
  // Define routes
  const routes = {
    '/': {
      view: () => loadPage('/views/home.html')
    },
    '/login': {
      view: () => loadPage('/views/login.html'),
      afterRender: () => initLoginPage()
    },
    '/register': {
      view: () => loadPage('/views/register.html'),
      afterRender: () => initRegisterPage()
    },
    '/api-docs': {
      view: () => loadPage('/views/api-docs.html')
    },
    '/api-keys': {
      view: () => loadPage('/views/api-keys.html'),
      afterRender: () => initApiKeysPage()
    },
    '/settings': {
      view: () => loadPage('/views/settings.html'),
      afterRender: () => initSettingsPage()
    },
    '/subscription': {
      view: () => loadPage('/views/subscription.html'),
      afterRender: () => initSubscriptionPage()
    }
  };
  
  // Add aliases for routes with .html extension
  Object.keys(routes).forEach(path => {
    if (path !== '/') {
      routes[`${path}.html`] = routes[path];
    }
  });
  
  // Create router
  const router = new Router({
    routes,
    rootElement: '#app',
    errorHandler: (path, rootElement) => {
      rootElement.innerHTML = `
        <pf-header></pf-header>
        <div class="error-page">
          <h1>404 - Page Not Found</h1>
          <p>The page "${path}" could not be found.</p>
          <a href="/" class="back-link">Go back to home</a>
        </div>
        <pf-footer></pf-footer>
      `;
    }
  });
  
  // Expose router globally
  window.router = router;
}

/**
 * Load a page from the server
 * @param {string} url - Page URL
 * @returns {Promise<string>} - Page HTML
 */
async function loadPage(url) {
  try {
    console.log(`Loading page: ${url}`);
    // Add cache-busting parameter to prevent caching
    const cacheBuster = `?_=${Date.now()}`;
    const response = await fetch(`${url}${cacheBuster}`);
    if (!response.ok) {
      throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract the content from the page
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get the content - either from body or the first element
    let content;
    if (doc.body.children.length === 0) {
      content = doc.body.innerHTML;
    } else if (doc.body.children.length === 1) {
      // If there's a single container, use it directly
      content = doc.body.innerHTML;
    } else {
      // Otherwise wrap all content
      content = doc.body.innerHTML;
    }
    
    // Wrap with our components
    return `
      <pf-header></pf-header>
      <div class="content">
        ${content}
      </div>
      <pf-footer></pf-footer>
    `;
  } catch (error) {
    console.error('Error loading page:', error);
    return `
      <pf-header></pf-header>
      <div class="error">
        <h1>Error Loading Page</h1>
        <p>${error.message}</p>
      </div>
      <pf-footer></pf-footer>
    `;
  }
}

// No longer needed since we're using SPA mode exclusively

/**
 * Initialize login page
 */
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    try {
      // Import the API client
      const { ApiClient } = await import('./api-client.js');
      
      // Check subscription status
      const subscriptionStatus = await ApiClient.checkSubscriptionStatus(email);
      console.log('Subscription status:', subscriptionStatus);
      
      if (subscriptionStatus.has_subscription) {
        // User has an active subscription, store the email as an API key
        localStorage.setItem('api_key', email);
        localStorage.setItem('username', email);
        localStorage.setItem('subscription_data', JSON.stringify(subscriptionStatus));
        
        // Create and store a publicly accessible user object
        const userObject = {
          email: email,
          username: email,
          subscription: {
            plan: subscriptionStatus.plan || 'monthly',
            status: subscriptionStatus.status || 'active',
            expiresAt: subscriptionStatus.expires_at || null
          },
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(userObject));
        
        // Dispatch auth changed event
        window.dispatchEvent(new CustomEvent('auth-changed'));
        
        // Redirect to the API keys page
        window.router.navigate('/api-keys');
      } else {
        // User doesn't have an active subscription
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        
        // Show error message with option to register
        const register = confirm(
          'No active subscription found for this email. Would you like to register and subscribe?'
        );
        
        if (register) {
          window.router.navigate('/register');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      
      // Show error message
      alert('Login failed: ' + (error.message || 'Unable to check subscription status'));
    }
  });
}

/**
 * Initialize register page
 */
function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;
  
  // Set up plan selection
  const planOptions = document.querySelectorAll('.plan-option');
  if (planOptions.length > 0) {
    planOptions.forEach(option => {
      option.addEventListener('click', () => {
        planOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
  }
  
  // Set up payment method selection
  const paymentMethods = document.querySelectorAll('.payment-method');
  if (paymentMethods.length > 0) {
    paymentMethods.forEach(method => {
      method.addEventListener('click', () => {
        paymentMethods.forEach(m => m.classList.remove('selected'));
        method.classList.add('selected');
      });
    });
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Get selected plan and payment method if they exist
    let selectedPlan = 'monthly';
    let selectedPayment = 'btc';
    
    const selectedPlanElement = document.querySelector('.plan-option.selected');
    if (selectedPlanElement) {
      selectedPlan = selectedPlanElement.dataset.plan;
    }
    
    const selectedPaymentElement = document.querySelector('.payment-method.selected');
    if (selectedPaymentElement) {
      selectedPayment = selectedPaymentElement.dataset.payment;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    try {
      // Import the API client
      const { ApiClient } = await import('./api-client.js');
      
      // Create subscription using the API
      const subscriptionData = await ApiClient.createSubscription(email, selectedPlan, selectedPayment);
      console.log('Subscription created:', subscriptionData);
      
      // Store user data in localStorage
      localStorage.setItem('api_key', email);
      localStorage.setItem('username', email);
      localStorage.setItem('subscription_data', JSON.stringify(subscriptionData));
      
      // Create and store a publicly accessible user object
      const userObject = {
        email: email,
        username: email,
        subscription: {
          plan: subscriptionData.subscription?.plan || selectedPlan,
          status: 'pending',
          expiresAt: null
        },
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(userObject));
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      // Show success message with payment information
      const paymentAddress = subscriptionData.subscription.payment_address;
      const amount = subscriptionData.subscription.amount;
      const coin = subscriptionData.subscription.payment_method.toUpperCase();
      
      alert(`Registration successful! Please send ${amount} USD worth of ${coin} to: ${paymentAddress}`);
      
      // Redirect to the API keys page
      window.router.navigate('/api-keys');
    } catch (error) {
      console.error('Registration error:', error);
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      
      // Show error message
      alert('Registration failed: ' + (error.message || 'Unable to create subscription'));
    }
  });
}

// Function removed - no more mock data

/**
 * Initialize API keys page
 */
function initApiKeysPage() {
  // Check if user is logged in
  const apiKey = localStorage.getItem('api_key');
  if (!apiKey) {
    // Redirect to login page
    window.router.navigate('/login');
    return;
  }
  
  // Initialize API keys page
  // ...
}

/**
 * Initialize settings page
 */
function initSettingsPage() {
  // Check if user is logged in
  const apiKey = localStorage.getItem('api_key');
  if (!apiKey) {
    // Redirect to login page
    window.router.navigate('/login');
    return;
  }
  
  // Initialize profile form
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Update profile
      // ...
      
      PfDialog.alert('Profile updated successfully!');
    });
  }
  
  // Initialize password form
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (newPassword !== confirmPassword) {
        PfDialog.alert('New passwords do not match');
        return;
      }
      
      // Update password
      // ...
      
      PfDialog.alert('Password changed successfully!');
    });
  }
  
  // Initialize delete account button
  const deleteButton = document.getElementById('delete-account-button');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      const confirmed = await PfDialog.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.',
        'Delete Account',
        null,
        null,
        'Delete',
        'Cancel'
      );
      
      if (confirmed) {
        // Delete account
        // ...
        
        // Clear authentication data
        localStorage.removeItem('api_key');
        localStorage.removeItem('username');
        
        // Dispatch auth changed event
        window.dispatchEvent(new CustomEvent('auth-changed'));
        
        // Redirect to home page
        window.router.navigate('/');
      }
    });
  }
}

/**
 * Initialize subscription page
 */
function initSubscriptionPage() {
  // Import the subscription form component
  import('./components/subscription-form.js').then(() => {
    console.log('Subscription form component loaded');
    
    // Check if user is logged in
    const apiKey = localStorage.getItem('api_key');
    const email = localStorage.getItem('username');
    
    // If user is logged in, pre-fill the email field
    if (email) {
      const subscriptionForm = document.querySelector('subscription-form');
      if (subscriptionForm) {
        subscriptionForm._email = email;
        subscriptionForm.render();
      }
    }
    
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
          if (data.subscription) {
            subscriptionForm._subscription = data.subscription;
          }
          if (data.payment_info) {
            subscriptionForm._paymentInfo = data.payment_info;
          }
          subscriptionForm._email = data.subscription?.email || email || '';
          subscriptionForm.render();
          
          // Clear the localStorage data to prevent reuse
          localStorage.removeItem('subscription_data');
        }
      } catch (error) {
        console.error('Error parsing subscription data:', error);
      }
    }
  }).catch(error => {
    console.error('Error loading subscription form component:', error);
  });
}

// Expose functions globally
window.app = {
  initApp,
  initRouter
};