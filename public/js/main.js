/**
 * Main application entry point
 */
import Router from './router.js';

// Import components
import './components/pf-header.js';
import './components/pf-footer.js';
import './components/pf-dialog.js';
import './components/pf-hero.js';
import './components/api-key-manager.js';

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
    '/dashboard': {
      view: () => loadPage('/views/dashboard.html'),
      afterRender: () => checkAuthAndInitPage('dashboard')
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
    },
    '/terms': {
      view: () => loadPage('/views/terms.html')
    },
    '/privacy': {
      view: () => loadPage('/views/privacy.html')
    },
    '/refund': {
      view: () => loadPage('/views/refund.html')
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
      
      // Import Supabase client for JWT authentication
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabaseUrl = 'https://arokhsfbkdnfuklmqajh.supabase.co'; // Should match server config
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2toc2Zia2RuZnVrbG1xYWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI0NTI4MDAsImV4cCI6MTk5ODAyODgwMH0.KxwHdxWXLLrJtFzLAYI-fwzgz8m5xsHD4XGdNw_xJm8'; // Public anon key
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Sign in with Supabase to get JWT token
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        // Continue with subscription check even if Supabase auth fails
        // This allows backward compatibility with existing users
      } else if (authData && authData.session) {
        // Store JWT token in localStorage
        localStorage.setItem('jwt_token', authData.session.access_token);
        console.log('JWT token stored successfully');
      }
      
      // Check subscription status (existing flow)
      const subscriptionStatus = await ApiClient.checkSubscriptionStatus(email);
      console.log('Subscription status:', subscriptionStatus);
      
      if (subscriptionStatus.has_subscription) {
        // User has an active subscription
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
      
      // Import Supabase client for JWT authentication
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabaseUrl = 'https://arokhsfbkdnfuklmqajh.supabase.co'; // Should match server config
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2toc2Zia2RuZnVrbG1xYWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI0NTI4MDAsImV4cCI6MTk5ODAyODgwMH0.KxwHdxWXLLrJtFzLAYI-fwzgz8m5xsHD4XGdNw_xJm8'; // Public anon key
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Register user with Supabase to get JWT token
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            plan: selectedPlan,
            payment_method: selectedPayment
          }
        }
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        // Continue with subscription creation even if Supabase auth fails
        // This allows backward compatibility with existing users
      } else if (authData && authData.session) {
        // Store JWT token in localStorage
        localStorage.setItem('jwt_token', authData.session.access_token);
        console.log('JWT token stored successfully');
      }
      
      // Create subscription using the API
      const subscriptionData = await ApiClient.createSubscription(email, selectedPlan, selectedPayment);
      console.log('Subscription created:', subscriptionData);
      
      // Store user data in localStorage
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
      const cryptoAmount = subscriptionData.subscription.crypto_amount ? subscriptionData.subscription.crypto_amount.toFixed(8) : 'calculating...';
      const coin = subscriptionData.subscription.payment_method.toUpperCase();
      
      // Create elements to store references for updating later
      const statusDisplay = {
        container: null,
        text: null,
        spinner: null
      };
      
      // Function to check payment status and update UI
      const checkPaymentStatus = async (email, paymentAddress, coin) => {
        try {
          const response = await fetch('/api/subscription/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
          });
          
          if (!response.ok) {
            throw new Error('Failed to check payment status');
          }
          
          const data = await response.json();
          console.log('Payment status check result:', data);
          
          // Check if we have valid references to the elements
          if (!statusDisplay.container || !statusDisplay.text || !statusDisplay.spinner) {
            console.error('Status elements not found');
            return false;
          }
          
          if (data.has_subscription && data.subscription.status === 'active') {
            // Payment received, show success message
            statusDisplay.container.style.backgroundColor = '#d1fae5'; // Light green
            statusDisplay.text.textContent = 'Payment received! Redirecting to your dashboard...';
            statusDisplay.spinner.style.display = 'none';
            
            // Wait 3 seconds and redirect
            setTimeout(() => {
              // Use the dialog completion handler instead of trying to click a button
              window.router.navigate('/api-keys');
            }, 3000);
            
            // Clear the polling interval
            return true;
          }
          
          // Payment not received yet, keep polling
          return false;
        } catch (error) {
          console.error('Error checking payment status:', error);
          return false;
        }
      };
      
      // Enhanced dialog with the payment information, copyable fields and payment verification
      // Using classes instead of IDs to make them easier to query
      const paymentDialog = PfDialog.alert(`
        <div class="payment-success">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Registration Successful!</h3>
          <p style="margin-bottom: 20px;">Please send <strong>${amount} USD</strong> (<strong>${cryptoAmount} ${coin}</strong>) to the address below:</p>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 5px;">Amount:</label>
            <div style="display: flex; align-items: center;">
              <input type="text" value="${cryptoAmount} ${coin}" readonly
                style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background-color: #f9fafb;">
              <button onclick="navigator.clipboard.writeText('${cryptoAmount} ${coin}').then(() => this.textContent = 'Copied!'); setTimeout(() => this.textContent = 'Copy', 2000)"
                style="margin-left: 8px; padding: 8px 12px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">Copy</button>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 5px;">Address:</label>
            <div style="display: flex; align-items: center;">
              <input type="text" value="${paymentAddress}" readonly
                style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background-color: #f9fafb;">
              <button onclick="navigator.clipboard.writeText('${paymentAddress}').then(() => this.textContent = 'Copied!'); setTimeout(() => this.textContent = 'Copy', 2000)"
                style="margin-left: 8px; padding: 8px 12px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">Copy</button>
            </div>
          </div>
          
          <div class="payment-status-container" style="margin-top: 20px; padding: 12px; border-radius: 6px; background-color: #f0f9ff; display: flex; align-items: center;">
            <div class="payment-spinner" style="margin-right: 12px; width: 20px; height: 20px; border: 3px solid rgba(37, 99, 235, 0.3); border-radius: 50%; border-top-color: #2563eb; animation: spin 1s linear infinite;"></div>
            <p class="payment-status-text" style="margin: 0; color: #1e40af;">Waiting for payment confirmation...</p>
          </div>
          
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `, 'Payment Details', null, 'Check Payment Status');
      
      // Find the dialog in the DOM and get references to status elements
      // We need to wait for the dialog to be fully rendered
      const userEmail = document.getElementById('email').value;
      let pollingInterval = null;
      
      setTimeout(() => {
        // Find dialog in the document
        const dialog = document.querySelector('pf-dialog');
        if (dialog && dialog.shadowRoot) {
          // Query the dialog's shadow DOM for elements
          const dialogBody = dialog.shadowRoot.querySelector('.dialog-body');
          const continueButton = dialog.shadowRoot.querySelector('.confirm-button');
          
          if (dialogBody && continueButton) {
            // Get references to status elements
            statusDisplay.container = dialogBody.querySelector('.payment-status-container');
            statusDisplay.spinner = dialogBody.querySelector('.payment-spinner');
            statusDisplay.text = dialogBody.querySelector('.payment-status-text');
            
            // Initial state - hide the status container until Continue is clicked
            if (statusDisplay.container) {
              statusDisplay.container.style.display = 'none';
            }
            
            // Replace the Continue button click handler to handle polling
            continueButton.removeEventListener('click', continueButton.onclick);
            continueButton.addEventListener('click', async function(e) {
              e.preventDefault();
              e.stopPropagation();
              
              // Show the spinner in the button and disable it
              const originalButtonText = continueButton.textContent;
              continueButton.innerHTML = `<span style="display: inline-block; width: 15px; height: 15px; border: 2px solid white; border-radius: 50%; border-top-color: transparent; margin-right: 8px; animation: spin 1s linear infinite;"></span> Checking...`;
              continueButton.disabled = true;
              
              // Show the status container
              if (statusDisplay.container) {
                statusDisplay.container.style.display = 'flex';
              }
              
              // First check if payment is already received
              const paymentReceived = await checkPaymentStatus(userEmail, paymentAddress, coin);
              if (paymentReceived) {
                // Already paid, will redirect shortly
                return;
              }
              
              // Start polling for payment status every 5 seconds
              pollingInterval = setInterval(async () => {
                const paymentReceived = await checkPaymentStatus(userEmail, paymentAddress, coin);
                if (paymentReceived) {
                  clearInterval(pollingInterval);
                }
              }, 5000); // Check every 5 seconds
            });
            
            console.log('Payment verification components initialized');
          }
        }
      }, 300); // Short delay to ensure dialog is rendered
      
      // Add an event listener to clean up the interval when the dialog is closed
      // The continue button already has the click handler from the PfDialog.alert call
      document.addEventListener('dialog-closed', function dialogClosedHandler() {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        document.removeEventListener('dialog-closed', dialogClosedHandler);
      }, { once: true });
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
 * Check if user is authenticated and initialize page
 * @param {string} pageType - Type of page to initialize
 */
function checkAuthAndInitPage(pageType) {
  // Check if user is logged in
  const jwtToken = localStorage.getItem('jwt_token');
  if (!jwtToken) {
    // Redirect to login page
    window.router.navigate('/login');
    return;
  }
  
  // For protected pages that require an active subscription
  if (pageType === 'dashboard') {
    // Check if user has an active subscription
    const userJson = localStorage.getItem('user');
    let user = null;
    
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch (e) {
        console.error('Error parsing user JSON:', e);
      }
    }
    
    // Verify subscription status
    const hasActiveSubscription = user &&
                                 user.subscription &&
                                 user.subscription.status === 'active';
    
    if (!hasActiveSubscription) {
      // Redirect to subscription page
      alert('You need an active subscription to access the dashboard.');
      window.router.navigate('/subscription');
      return;
    }
  }
  
  // Initialize specific page if needed
  switch (pageType) {
    case 'dashboard':
      // Dashboard initialization is handled by the page's own script
      break;
    default:
      break;
  }
}

/**
 * Initialize API keys page
 */
function initApiKeysPage() {
  // Check if user is logged in
  const jwtToken = localStorage.getItem('jwt_token');
  if (!jwtToken) {
    // Redirect to login page
    window.router.navigate('/login');
    return;
  }
  
  // Initialize API keys page
  console.log('Initializing API keys page');
  
  // Make sure the API key manager component is loaded
  import('./components/api-key-manager.js').then(() => {
    console.log('API key manager component loaded');
    
    // Force refresh the API key manager component
    setTimeout(() => {
      const apiKeyManager = document.querySelector('api-key-manager');
      if (apiKeyManager) {
        console.log('Found API key manager component, refreshing');
        // Try to force a re-render
        apiKeyManager.render();
        
        // Also try to reload the API keys
        if (typeof apiKeyManager._loadApiKeys === 'function') {
          console.log('Reloading API keys');
          apiKeyManager._loadApiKeys();
        }
      } else {
        console.error('API key manager component not found in the DOM');
      }
    }, 500);
  }).catch(error => {
    console.error('Error loading API key manager component:', error);
  });
  
  // Set up tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.onclick = () => {
      console.log('Tab button clicked:', button.dataset.tab);
      
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
      });
      
      // Show selected tab content
      const tabId = button.dataset.tab;
      const tabContent = document.getElementById(`${tabId}-tab`);
      
      if (tabContent) {
        tabContent.style.display = 'block';
        console.log('Tab content displayed:', tabId);
      } else {
        console.error('Tab content not found:', tabId);
      }
    };
  });
}

/**
 * Initialize settings page
 */
function initSettingsPage() {
  // Check if user is logged in
  const jwtToken = localStorage.getItem('jwt_token');
  if (!jwtToken) {
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
        localStorage.removeItem('jwt_token');
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
    const jwtToken = localStorage.getItem('jwt_token');
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
  initRouter,
  checkAuthAndInitPage
};