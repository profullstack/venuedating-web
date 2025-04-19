/**
 * Main application entry point
 */
import Router from './router.js';

// Import components
import './components/pf-header.js';
import './components/pf-footer.js';
import './components/pf-dialog.js';

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
    
    try {
      // For now, just store the email in localStorage as if it were an API key
      // In a real implementation, this would validate credentials with the server
      localStorage.setItem('api_key', email);
      localStorage.setItem('username', email);
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      // Redirect to the API keys page
      window.router.navigate('/api-keys');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
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
    
    try {
      // For now, just store the email in localStorage as if it were an API key
      // In a real implementation, this would register the user with the server
      localStorage.setItem('api_key', email);
      localStorage.setItem('username', email);
      
      // Create a mock subscription for testing
      const mockSubscription = createMockSubscription(email, selectedPlan, selectedPayment);
      localStorage.setItem('subscription_data', JSON.stringify(mockSubscription));
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      // Redirect to the API keys page
      window.router.navigate('/api-keys');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error dialog with option to continue as test account
      const proceed = confirm(
        'There was an error with the payment system, but you can continue with a test account. Proceed?'
      );
      
      if (proceed) {
        localStorage.setItem('api_key', email);
        localStorage.setItem('username', email);
        
        // Create a mock subscription for testing
        const mockSubscription = createMockSubscription(email, selectedPlan, selectedPayment);
        localStorage.setItem('subscription_data', JSON.stringify(mockSubscription));
        
        // Dispatch auth changed event
        window.dispatchEvent(new CustomEvent('auth-changed'));
        
        // Redirect to the API keys page
        window.router.navigate('/api-keys');
      }
    }
  });
}

// Create a mock subscription for testing
function createMockSubscription(email, plan, coin) {
  const now = new Date();
  const expirationDate = new Date(now);
  expirationDate.setMonth(expirationDate.getMonth() + (plan === 'monthly' ? 1 : 12));
  
  // Hardcoded cryptocurrency wallet addresses
  const addresses = {
    btc: "bc1q254klmlgtanf8xez28gy7r0enpyhk88r2499pt",
    eth: "0x402282c72a2f2b9f059C3b39Fa63932D6AA09f11",
    sol: "CsTWZTbDryjcb229RQ9b7wny5qytH9jwoJy6Lu98xpeF"
  };
  
  const amount = plan === 'monthly' ? 5 : 30;
  
  return {
    subscription: {
      id: `sub_${Date.now()}`,
      email,
      plan,
      amount,
      interval: plan === 'monthly' ? 'month' : 'year',
      payment_method: coin,
      status: 'pending',
      start_date: now.toISOString(),
      expiration_date: expirationDate.toISOString(),
      payment_address: addresses[coin]
    },
    payment_info: {
      address: addresses[coin],
      coin,
      amount_fiat: amount,
      currency: 'USD'
    }
  };
}

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
  // Initialize subscription page
  // ...
}

// Expose functions globally
window.app = {
  initApp,
  initRouter
};