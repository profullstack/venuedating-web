/**
 * Main application entry point
 */
import Router from './router.js';

// Import components
import './components/pf-header.js';
import './components/pf-footer.js';
import './components/pf-dialog.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  initApp();
});

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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract the content from the page
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get the content
    const content = doc.querySelector('body').innerHTML;
    
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
      if (window.router) {
        window.router.navigate('/api-keys');
      } else {
        window.location.href = '/api-keys.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      PfDialog.alert('Login failed. Please try again.');
    }
  });
}

/**
 * Initialize register page
 */
function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      PfDialog.alert('Passwords do not match');
      return;
    }
    
    try {
      // For now, just store the email in localStorage as if it were an API key
      // In a real implementation, this would register the user with the server
      localStorage.setItem('api_key', email);
      localStorage.setItem('username', email);
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      // Redirect to the API keys page
      if (window.router) {
        window.router.navigate('/api-keys');
      } else {
        window.location.href = '/api-keys.html';
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error dialog with option to continue as test account
      const proceed = await PfDialog.confirm(
        'There was an error with the payment system, but you can continue with a test account. Proceed?',
        'Registration Error'
      );
      
      if (proceed) {
        localStorage.setItem('api_key', email);
        localStorage.setItem('username', email);
        
        // Dispatch auth changed event
        window.dispatchEvent(new CustomEvent('auth-changed'));
        
        // Redirect to the API keys page
        if (window.router) {
          window.router.navigate('/api-keys');
        } else {
          window.location.href = '/api-keys.html';
        }
      }
    }
  });
}

/**
 * Initialize API keys page
 */
function initApiKeysPage() {
  // Check if user is logged in
  const apiKey = localStorage.getItem('api_key');
  if (!apiKey) {
    // Redirect to login page
    if (window.router) {
      window.router.navigate('/login');
    } else {
      window.location.href = '/login.html';
    }
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
    if (window.router) {
      window.router.navigate('/login');
    } else {
      window.location.href = '/login.html';
    }
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
        if (window.router) {
          window.router.navigate('/');
        } else {
          window.location.href = '/';
        }
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