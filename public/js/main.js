/**
 * Main application entry point
 */
import { Router, transitions } from 'https://esm.sh/@profullstack/spa-router@1.2.0';

// Import components
import './components/pf-header.js';
import './components/pf-footer.js';
import './components/pf-dialog.js';
import './components/pf-hero.js';
import './components/api-key-manager.js';
import './components/language-switcher.js';

// Import i18n module
import { initI18n, _t, translatePage } from './i18n.js';

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
  // Apply stored language before initializing i18n
  const storedLang = localStorage.getItem('profullstack-language');
  
  // Initialize i18n
  initI18n().then(() => {
    console.log('i18n initialized');
    
    // Apply stored language after i18n is initialized
    if (storedLang && window.app && window.app.localizer) {
      console.log(`App init: Applying stored language: ${storedLang}`);
      window.app.localizer.setLanguage(storedLang);
      
      // Apply translations and RTL direction
      if (window.app.translatePage) {
        window.app.translatePage();
      }
      
      if (window.app.applyDirectionToDocument) {
        window.app.applyDirectionToDocument();
      }
    }
  }).catch(error => {
    console.error('Error initializing i18n:', error);
  });
  
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
      view: () => {
        // Apply stored language before loading the page
        const storedLang = localStorage.getItem('profullstack-language');
        if (storedLang && window.app && window.app.localizer) {
          console.log(`Pre-view login: Applying stored language: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
          
          // Apply RTL direction if needed
          if (window.app.applyDirectionToDocument) {
            window.app.applyDirectionToDocument();
          }
          
          // Force translation application
          if (window.app.translatePage) {
            window.app.translatePage();
          }
        }
        return loadPage('/views/login.html');
      },
      afterRender: () => {
        // Initialize login page
        initLoginPage();
        
        // Apply translations after rendering
        const storedLang = localStorage.getItem('profullstack-language');
        if (storedLang && window.app && window.app.localizer) {
          console.log(`Post-render login: Applying stored language: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
          
          // Force translation application
          if (window.app.translatePage) {
            window.app.translatePage();
          }
        }
        
        // Dispatch the spa-transition-end event to ensure translations are applied
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
      }
    },
    '/register': {
      view: () => {
        // Apply stored language before loading the page
        const storedLang = localStorage.getItem('profullstack-language');
        if (storedLang && window.app && window.app.localizer) {
          console.log(`Pre-view register: Applying stored language: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
          
          // Apply RTL direction if needed
          if (window.app.applyDirectionToDocument) {
            window.app.applyDirectionToDocument();
          }
          
          // Force translation application
          if (window.app.translatePage) {
            window.app.translatePage();
          }
        }
        return loadPage('/views/register.html');
      },
      afterRender: () => {
        // Initialize register page
        initRegisterPage();
        
        // Apply translations after rendering
        const storedLang = localStorage.getItem('profullstack-language');
        if (storedLang && window.app && window.app.localizer) {
          console.log(`Post-render register: Applying stored language: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
          
          // Force translation application
          if (window.app.translatePage) {
            window.app.translatePage();
          }
        }
        
        // Dispatch the spa-transition-end event to ensure translations are applied
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
      }
    },
    '/reset-password': {
      view: () => loadPage('/views/reset-password.html'),
      afterRender: () => initResetPasswordPage()
    },
    '/state-demo': {
      view: () => loadPage('/views/state-demo.html')
    },
    '/simple-state-demo': {
      view: () => loadPage('/views/simple-state-demo.html'),
      afterRender: () => {
        // Import the simple state components
        import('./components/simple-counter.js').catch(error => {
          console.error('Error loading simple-counter component:', error);
        });
      }
    },
    '/dashboard': {
      view: () => loadPage('/views/dashboard.html'),
      beforeEnter: async (to, from, next) => {
        // Check if user is authenticated using the auth-status endpoint
        try {
          // Import auth status utility
          const { checkAuthStatus } = await import('./utils/auth-status.js');
          
          // Check auth status with the server
          const status = await checkAuthStatus();
          
          if (!status.authenticated) {
            console.log('Not authenticated, redirecting to login page:', status.message);
            return next('/login');
          }
          
          console.log('Authentication verified with server');
          
          // Check if user has an active subscription
          const userJson = localStorage.getItem('user');
          let user = null;
          
          if (userJson) {
            try {
              user = JSON.parse(userJson);
              console.log('User data found:', user.email);
            } catch (e) {
              console.error('Error parsing user JSON:', e);
            }
          }
          
          // Verify subscription status
          const hasActiveSubscription = user &&
                                      user.subscription &&
                                      user.subscription.status === 'active';
          
          if (!hasActiveSubscription) {
            console.log('No active subscription found, redirecting to subscription page');
            // Redirect to subscription page
            alert('You need an active subscription to access the dashboard.');
            return next('/subscription');
          }
          
          console.log('Active subscription verified');
          next();
        } catch (error) {
          console.error('Error checking authentication status:', error);
          return next('/login');
        }
      },
      afterRender: () => {
        // Dashboard initialization is handled by the page's own script
      }
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
    },
    '/i18n-demo': {
      view: () => {
        // Apply stored language before loading the page
        const storedLang = localStorage.getItem('profullstack-language');
        if (storedLang && window.app && window.app.localizer) {
          console.log(`Pre-view i18n-demo: Applying stored language: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
          
          // Apply RTL direction if needed
          if (window.app.applyDirectionToDocument) {
            window.app.applyDirectionToDocument();
          }
          
          // Force translation application
          if (window.app.translatePage) {
            window.app.translatePage();
          }
        }
        return loadPage('/views/i18n-demo.html');
      },
      afterRender: () => {
        // Apply translations after rendering
        const storedLang = localStorage.getItem('profullstack-language');
        if (storedLang && window.app && window.app.localizer) {
          console.log(`Post-render i18n-demo: Applying stored language: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
          
          // Force translation application
          if (window.app.translatePage) {
            window.app.translatePage();
          }
        }
        
        // Dispatch the spa-transition-end event to ensure translations are applied
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
      }
    }
  };
  
  // Add aliases for routes with .html extension
  Object.keys(routes).forEach(path => {
    if (path !== '/') {
      routes[`${path}.html`] = routes[path];
    }
  });
  
  // Debug: Log routes before registration
  console.log('About to register routes:', Object.keys(routes));
  console.log('Route for / exists:', routes['/'] !== undefined);
  console.log('Route for / details:', routes['/']);
  
  // Create router with fade transition and pre-registered routes
  const router = new Router({
    routes, // Pass routes directly in the constructor
    rootElement: '#app',
    transition: transitions.fade({
      duration: 300, // Increased duration to give more time for rendering
      onComplete: () => {
        // Dispatch a custom event when the transition is complete
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
      }
    }),
    renderer: (content, element) => {
      // Following the pattern:
      // 1. Click link (already happened)
      // 2. Start transition (already started by the router)
      // 3. Load new DOM hidden in browser and off-page using absolute position
      
      // Apply stored language before rendering
      const storedLang = localStorage.getItem('profullstack-language');
      if (storedLang && window.app && window.app.localizer) {
        console.log(`Pre-render: Applying stored language: ${storedLang}`);
        window.app.localizer.setLanguage(storedLang);
        
        // Force language application
        if (window.app.localizer.getLanguage() !== storedLang) {
          console.log(`Language mismatch, forcing to: ${storedLang}`);
          window.app.localizer.setLanguage(storedLang);
        }
      }
      
      // Create a new container with absolute positioning (off-screen)
      const newContainer = document.createElement('div');
      newContainer.style.position = 'absolute';
      newContainer.style.top = '0';
      newContainer.style.left = '0';
      newContainer.style.width = '100%';
      newContainer.style.height = '100%';
      newContainer.style.opacity = '0'; // Start hidden
      newContainer.style.zIndex = '1'; // Above the current content
      
      // Parse the content into DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // Get all existing web components in the current DOM to preserve
      const existingComponents = {};
      const customElements = element.querySelectorAll('*').filter(el => el.tagName.includes('-'));
      
      customElements.forEach(el => {
        const id = el.tagName.toLowerCase();
        existingComponents[id] = el;
      });
      
      // Process the new content
      Array.from(doc.body.children).forEach(child => {
        // If it's a custom element that already exists, skip it (we'll keep the existing one)
        if (child.tagName.includes('-') && existingComponents[child.tagName.toLowerCase()]) {
          console.log(`Preserving existing component: ${child.tagName.toLowerCase()}`);
        } else {
          // Otherwise, add the new element to the container
          newContainer.appendChild(child);
        }
      });
      
      // 4. Translate all text in new DOM
      if (storedLang && window.app && window.app._t) {
        console.log(`Translating content to ${storedLang} before showing`);
        
        // Force language application again to ensure it's set
        window.app.localizer.setLanguage(storedLang);
        
        // Translate elements with data-i18n attribute
        newContainer.querySelectorAll('[data-i18n]').forEach(element => {
          const key = element.getAttribute('data-i18n');
          element.textContent = window.app._t(key);
        });
        
        // Translate other i18n attributes
        newContainer.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
          const key = element.getAttribute('data-i18n-placeholder');
          element.placeholder = window.app._t(key);
        });
        
        newContainer.querySelectorAll('[data-i18n-title]').forEach(element => {
          const key = element.getAttribute('data-i18n-title');
          element.title = window.app._t(key);
        });
        
        newContainer.querySelectorAll('[data-i18n-html]').forEach(element => {
          const key = element.getAttribute('data-i18n-html');
          element.innerHTML = window.app._t(key);
        });
        
        // Handle elements with data-i18n-params attribute (for interpolation)
        newContainer.querySelectorAll('[data-i18n-params]').forEach(element => {
          const key = element.getAttribute('data-i18n');
          if (!key) return;
          
          try {
            const paramsAttr = element.getAttribute('data-i18n-params');
            const params = JSON.parse(paramsAttr);
            element.textContent = window.app._t(key, params);
          } catch (error) {
            console.error(`Error parsing data-i18n-params for key ${key}:`, error);
          }
        });
      }
      
      // Add preserved components back to the new container
      Object.values(existingComponents).forEach(component => {
        newContainer.appendChild(component);
      });
      
      // 5. When translation is done, remove old DOM and show new DOM
      // Add the new container to the DOM
      element.appendChild(newContainer);
      
      // Apply RTL direction if needed
      if (window.app && window.app.applyDirectionToDocument) {
        window.app.applyDirectionToDocument();
      }
      
      // Short delay to ensure everything is ready, then show new content and remove old
      setTimeout(() => {
        // Remove all old content
        Array.from(element.children).forEach(child => {
          if (child !== newContainer) {
            element.removeChild(child);
          }
        });
        
        // Show the new content by changing position and opacity
        newContainer.style.position = 'relative';
        newContainer.style.opacity = '1';
        
        console.log('Transition complete, new content visible');
        
        // 6. Fire transition-complete event is handled by the router
      }, 50);
      
      // Apply RTL direction if needed
      if (window.app && window.app.applyDirectionToDocument) {
        window.app.applyDirectionToDocument();
      }
      
      console.log('Rendered content with component preservation and translations');
    },
    errorHandler: (path) => {
      console.log('Error handler called for path:', path);
      
      // Use a more direct approach that bypasses the router's transition mechanism
      // This will be called immediately when the route is not found
      setTimeout(() => {
        // Get the root element
        const rootElement = document.getElementById('app');
        if (!rootElement) {
          console.error('Root element #app not found');
          return;
        }
        
        console.log('Creating error page for path:', path);
        
        // First, ensure all transition overlays are removed
        const cleanupOverlays = () => {
          // Remove any remaining transition overlays
          const overlays = document.querySelectorAll('.transition-overlay');
          console.log('Found transition overlays:', overlays.length);
          
          overlays.forEach(overlay => {
            if (document.body.contains(overlay)) {
              console.log('Removing transition overlay:', overlay);
              document.body.removeChild(overlay);
            }
          });
          
          // Also check for any elements with opacity or visibility styles that might be leftover
          document.querySelectorAll('[style*="opacity: 0"]').forEach(el => {
            if (el.classList.contains('transition-overlay') || el.style.position === 'absolute') {
              console.log('Removing hidden element with opacity 0:', el);
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
            }
          });
        };
        
        // Clean up overlays first
        cleanupOverlays();
        
        // Clear any existing content
        rootElement.innerHTML = '';
        
        // Create the error page content directly
        const errorContent = document.createElement('div');
        errorContent.className = 'error-page-container';
        errorContent.innerHTML = `
          <pf-header></pf-header>
          <div class="content-container" style="display: flex; justify-content: center; align-items: center; min-height: 60vh;">
            <div class="error-page">
              <h1>404 - Page Not Found</h1>
              <p>The page "${path}" could not be found.</p>
              <a href="/" class="back-link">Go back to home</a>
            </div>
          </div>
          <pf-footer></pf-footer>
        `;
        
        // Append the error content to the root element
        rootElement.appendChild(errorContent);
        
        console.log('Error page content appended to DOM');
        
        // Dispatch the transition-end event to ensure proper cleanup
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
        
        // Clean up overlays again after a short delay to catch any that might have been created during the transition
        setTimeout(cleanupOverlays, 100);
        
        // Set up a safety interval to periodically check for and remove any overlays that might appear
        const safetyInterval = setInterval(cleanupOverlays, 500);
        
        // Clear the safety interval after 3 seconds
        setTimeout(() => {
          clearInterval(safetyInterval);
          console.log('Safety interval cleared');
        }, 3000);
      }, 50); // Slight delay to ensure DOM is ready
      
      // Return an empty string since we're handling the rendering directly
      return '';
    }
  });
  
  // Debug: Try to access the router's internal state
  console.log('Router internal state:', router);
  console.log('Router routes property:', router.routes);
  console.log('Router routes keys after registration:', Object.keys(router.routes));
  console.log('Router route for / exists after registration:', router.routes['/'] !== undefined);
  
  // Add middleware for logging and language persistence
  router.use(async (to, from, next) => {
    console.log(`Navigating from ${from || 'initial'} to ${to.path}`);
    
    // Store the current language before navigation
    const currentLanguage = localStorage.getItem('profullstack-language');
    if (currentLanguage) {
      console.log(`Current language before navigation: ${currentLanguage}`);
    }
    
    // Apply language before navigation
    if (currentLanguage && window.app && window.app.localizer) {
      console.log(`Pre-navigation: Applying stored language: ${currentLanguage}`);
      window.app.localizer.setLanguage(currentLanguage);
    }
    
    // Continue with navigation
    next();
    
    // Listen for the router's transition-end event to apply translations
    // after the new content is fully rendered
    const handleTransitionEnd = () => {
      const storedLang = localStorage.getItem('profullstack-language');
      if (storedLang) {
        console.log(`Applying stored language after navigation transition: ${storedLang}`);
        
        // Apply the stored language using the global app object
        if (window.app && window.app.localizer) {
          // Force language application
          window.app.localizer.setLanguage(storedLang);
          
          // Double-check that the language was applied correctly
          if (window.app.localizer.getLanguage() !== storedLang) {
            console.log(`Language mismatch after navigation, forcing to: ${storedLang}`);
            window.app.localizer.setLanguage(storedLang);
          }
          
          // Apply translations and RTL direction
          if (window.app.translatePage) {
            console.log('Applying translations to page after navigation');
            window.app.translatePage();
          }
          
          if (window.app.applyDirectionToDocument) {
            window.app.applyDirectionToDocument();
          }
          
          // Also manually translate any elements with data-i18n attributes that might have been missed
          document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = window.app._t(key);
          });
          
          // Translate other i18n attributes
          document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = window.app._t(key);
          });
          
          document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = window.app._t(key);
          });
          
          document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = window.app._t(key);
          });
          
          // Handle elements with data-i18n-params attribute (for interpolation)
          document.querySelectorAll('[data-i18n-params]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (!key) return;
            
            try {
              const paramsAttr = element.getAttribute('data-i18n-params');
              const params = JSON.parse(paramsAttr);
              element.textContent = window.app._t(key, params);
            } catch (error) {
              console.error(`Error parsing data-i18n-params for key ${key}:`, error);
            }
          });
        }
      }
      
      // Remove the event listener to avoid multiple calls
      document.removeEventListener('spa-transition-end', handleTransitionEnd);
    };
    
    // Add event listener for transition end
    document.addEventListener('spa-transition-end', handleTransitionEnd, { once: true });
    
    // Also set a backup timeout in case the transition event doesn't fire
    setTimeout(() => {
      // Check if the event listener is still registered
      const storedLang = localStorage.getItem('profullstack-language');
      if (storedLang && window.app && window.app.translatePage) {
        console.log('Backup translation application after timeout');
        window.app.translatePage();
      }
    }, 300); // Longer delay to ensure the DOM is updated after transition
  });
  
  // Expose router globally
  window.router = router;
  
  // Add custom navigate method to dispatch pre-navigation event
  const originalNavigate = router.navigate.bind(router);
  router.navigate = async function(path, params = {}) {
    // Get the current path before navigation
    const currentPath = window.location.pathname;
    console.log(`Router navigating to: ${path}`);
    
    // Store the current language before navigation
    const currentLang = localStorage.getItem('profullstack-language');
    
    // Dispatch pre-navigation event to allow components to prepare for transition
    document.dispatchEvent(new CustomEvent('pre-navigation', {
      detail: {
        fromPath: currentPath,
        toPath: path,
        language: currentLang
      }
    }));
    
    // Call the original navigate method
    return originalNavigate(path, params);
  };
}

// Import utilities
import { detectAndImportModules, filterScriptTags } from './utils/component-loader.js';
import { translateContainer, applyStoredLanguage } from './utils/translation-helper.js';

/**
 * Load a page from the server
 * @param {string} url - Page URL
 * @returns {Promise<string>} - Page HTML
 */
async function loadPage(url) {
  try {
    console.log(`Loading page: ${url}`);
    
    // Apply stored language before loading the page
    const storedLang = applyStoredLanguage();
    
    // Add cache-busting parameter to prevent caching
    const cacheBuster = `?_=${Date.now()}`;
    const fullUrl = `${url}${cacheBuster}`;
    console.log(`Fetching URL: ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      console.error(`Failed to load page: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract the content from the page
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Create a wrapper element to hold the content temporarily
    const wrapper = document.createElement('div');
    wrapper.style.display = 'none';
    document.body.appendChild(wrapper);
    
    // Get the content - either from body or the first element
    let content;
    if (doc.body.children.length === 0) {
      content = doc.body.innerHTML;
    } else {
      // Create a temporary div to hold the content
      const tempDiv = document.createElement('div');
      
      // Automatically detect and import module scripts
      await detectAndImportModules(doc);
      
      // Filter out script tags (they'll be imported dynamically)
      const contentWithoutScripts = filterScriptTags(doc.body);
      content = contentWithoutScripts.innerHTML;
    }
    
    // Add the content to the wrapper
    wrapper.innerHTML = content;
    
    // Pre-translate the content before it's returned to the router
    if (storedLang) {
      console.log(`Pre-translating content to ${storedLang} before DOM insertion`);
      translateContainer(wrapper, storedLang);
    }
    
    // Get the translated content
    content = wrapper.innerHTML;
    
    // Remove the wrapper
    document.body.removeChild(wrapper);
    
    // Create DOM elements instead of using template strings
    const container = document.createElement('div');
    
    // Add header
    const header = document.createElement('pf-header');
    container.appendChild(header);
    
    // Add content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    
    // Use DOM parser to convert content string to DOM nodes
    const contentFragment = document.createRange().createContextualFragment(content);
    contentDiv.appendChild(contentFragment);
    
    container.appendChild(contentDiv);
    
    // Add footer
    const footer = document.createElement('pf-footer');
    container.appendChild(footer);
    
    // Return the HTML string representation
    // Get the HTML content
    const result = container.outerHTML;
    
    // No need to schedule translation after rendering
    // since we're now doing it before rendering in the renderer function
    console.log('Content loaded, translations already applied during rendering');
    
    return result;
  } catch (error) {
    console.error('Error loading page:', error);
    return `
      <pf-header></pf-header>
      <div class="error">
        <h1 data-i18n="errors.error_loading_page">Error Loading Page</h1>
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
async function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  
  // Initialize auth status check button
  const checkAuthStatusButton = document.getElementById('check-auth-status');
  const authStatusResult = document.getElementById('auth-status-result');
  
  if (checkAuthStatusButton && authStatusResult) {
    checkAuthStatusButton.addEventListener('click', async () => {
      try {
        // Import auth status utility
        const { logAuthStatus } = await import('./utils/auth-status.js');
        
        // Show loading state
        authStatusResult.textContent = 'Checking auth status...';
        
        // Check auth status
        const status = await logAuthStatus();
        
        // Display result
        authStatusResult.textContent = JSON.stringify(status, null, 2);
      } catch (error) {
        console.error('Error checking auth status:', error);
        authStatusResult.textContent = `Error: ${error.message}`;
      }
    });
  }
  
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
      
      // Fetch Supabase configuration from the server
      const configResponse = await fetch('/api/1/config/supabase');
      if (!configResponse.ok) {
        throw new Error('Failed to fetch Supabase configuration');
      }
      
      const { supabaseUrl, supabaseAnonKey } = await configResponse.json();
      
      console.log('Creating Supabase client with URL:', supabaseUrl);
      console.log('Anon key exists:', !!supabaseAnonKey);
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('Supabase client created successfully');
      
      console.log('Attempting to sign in with Supabase:', email);
      
      // Sign in with Supabase to get JWT token
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error('Authentication failed: ' + authError.message);
      }
      
      if (!authData || !authData.session) {
        throw new Error('Authentication failed: No session data returned');
      }
      
      // Store JWT token in localStorage
      localStorage.setItem('jwt_token', authData.session.access_token);
      console.log('JWT token stored successfully, length:', authData.session.access_token.length);
      console.log('JWT token preview:', authData.session.access_token.substring(0, 10) + '...');
      
      try {
        // Check subscription status using the JWT token
        console.log('Checking subscription status for:', email);
        const subscriptionStatus = await ApiClient.checkSubscriptionStatus(email);
        console.log('Subscription status:', subscriptionStatus);
      } catch (subscriptionError) {
        console.error('Error checking subscription status:', subscriptionError);
        // Continue even if subscription check fails
        // We'll handle this case below
      }
      
      // Get subscription status from the try/catch block above
      let subscriptionStatus = null;
      try {
        subscriptionStatus = await ApiClient.checkSubscriptionStatus(email);
      } catch (error) {
        console.warn('Could not verify subscription status, proceeding with login anyway');
      }
      
      // Store username regardless of subscription status
      localStorage.setItem('username', email);
      
      if (subscriptionStatus && subscriptionStatus.has_subscription) {
        console.log('User has an active subscription');
        // User has an active subscription
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
      } else {
        console.log('No subscription data available or user has no active subscription');
        // Create a basic user object without subscription data
        const userObject = {
          email: email,
          username: email,
          subscription: {
            status: 'unknown'
          },
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(userObject));
      }
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      // Check if the user is using the default password
      if (password === 'ChangeMe123!') {
        // Redirect to the reset password page
        console.log('User is using default password, redirecting to reset password page');
        alert('For security reasons, please change your default password before continuing.');
        window.router.navigate('/reset-password');
      } else {
        // Redirect to the API keys page
        console.log('Login successful, redirecting to API keys page');
        window.router.navigate('/api-keys');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error stack:', error.stack);
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Login failed: ';
      
      if (error.message && error.message.includes('API key')) {
        errorMessage += 'Invalid credentials. Please check your email and password.';
      } else if (error.message && error.message.includes('session')) {
        errorMessage += 'Authentication server error. Please try again later.';
      } else {
        errorMessage += (error.message || 'Unable to complete login process');
      }
      
      console.error('Showing error message to user:', errorMessage);
      alert(errorMessage);
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
      
      // Register user through the server API instead of directly with Supabase
      console.log('Registering user through server API');
      
      // Create a registration request with all necessary data
      const registrationData = {
        email,
        password,
        plan: selectedPlan,
        payment_method: selectedPayment
      };
      
      // Send registration request to the server
      const response = await fetch('/api/1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error:', errorData);
        throw new Error('Registration failed: ' + (errorData.error || response.statusText));
      }
      
      const authData = await response.json();
      
      if (authData && authData.session && authData.session.access_token) {
        // Store JWT token in localStorage
        localStorage.setItem('jwt_token', authData.session.access_token);
        console.log('JWT token stored successfully');
      } else {
        console.warn('No session data returned during registration. This might be expected if email confirmation is required.');
        // We'll continue with subscription creation even without a JWT token
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
          // Use the ApiClient class for consistency with the correct API path
          const subscriptionStatus = await ApiClient.checkSubscriptionStatus(email);
          console.log('Payment status check result:', subscriptionStatus);
          
          // Use the result from the API client
          const data = subscriptionStatus;
          
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
 * This function is no longer needed as we're using route guards
 * @param {string} pageType - Type of page to initialize
 */
function checkAuthAndInitPage(pageType) {
  console.log(`Checking auth for page type: ${pageType}`);
  
  // This functionality is now handled by route guards
  // We keep this function for backward compatibility
  
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
async function initApiKeysPage() {
  try {
    // Import auth status utility
    const { checkAuthStatus } = await import('./utils/auth-status.js');
    
    // Check auth status with the server
    const status = await checkAuthStatus();
    
    if (!status.authenticated) {
      console.log('Not authenticated, redirecting to login page:', status.message);
      window.router.navigate('/login');
      return;
    }
    
    console.log('Authentication verified with server');
  } catch (error) {
    console.error('Error checking authentication status:', error);
    window.router.navigate('/login');
    return;
  }
  
  // Initialize API keys page
  console.log('JWT token found, initializing API keys page');
  
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
async function initSettingsPage() {
  try {
    // Import auth status utility
    const { checkAuthStatus } = await import('./utils/auth-status.js');
    
    // Check auth status with the server
    const status = await checkAuthStatus();
    
    if (!status.authenticated) {
      console.log('Not authenticated, redirecting to login page:', status.message);
      window.router.navigate('/login');
      return;
    }
    
    console.log('Authentication verified with server');
  } catch (error) {
    console.error('Error checking authentication status:', error);
    window.router.navigate('/login');
    return;
  }
  
  console.log('JWT token found, initializing settings page');
  
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
    
    // Check if user is logged in using JWT token
    const jwtToken = localStorage.getItem('jwt_token');
    const email = localStorage.getItem('username');
    
    console.log('Initializing subscription page, JWT token exists:', !!jwtToken);
    
    // If user is logged in, pre-fill the email field
    if (jwtToken && email) {
      console.log('User is logged in, pre-filling email:', email);
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

/**
 * Initialize reset password page
 */
async function initResetPasswordPage() {
  try {
    // Import auth status utility
    const { checkAuthStatus } = await import('./utils/auth-status.js');
    
    // Check auth status with the server
    const status = await checkAuthStatus();
    
    if (!status.authenticated) {
      console.log('Not authenticated, redirecting to login page:', status.message);
      window.router.navigate('/login');
      return;
    }
    
    console.log('Authentication verified with server');
  } catch (error) {
    console.error('Error checking authentication status:', error);
    window.router.navigate('/login');
    return;
  }
  
  console.log('JWT token found, initializing reset password page');
  
  // The reset password form is handled by the inline script in the HTML file
}

// Expose functions globally
window.app = window.app || {};
Object.assign(window.app, {
  initApp,
  initRouter,
  checkAuthAndInitPage,
  initResetPasswordPage,
  _t // Expose translation function globally
});