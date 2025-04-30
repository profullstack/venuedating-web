/**
 * Router module for SPA navigation
 */
import { Router, transitions, renderer, componentLoader } from './deps.js';
import { localizer } from './i18n-setup.js';
import {
  initLoginPage, 
  initRegisterPage, 
  initApiKeysPage, 
  initSettingsPage, 
  initSubscriptionPage, 
  initResetPasswordPage 
} from './page-initializers.js';

// Default page layout with header and footer
const DEFAULT_LAYOUT = (content) => `
  <pf-header></pf-header>
  <div class="content">${content}</div>
  <pf-footer></pf-footer>
`;

/**
 * Load a page from the server
 * @param {string} url - Page URL
 * @returns {Promise<string>} - Page HTML
 */
async function loadPage(url) {
  try {
    // Add cache-busting parameter
    const fullUrl = `${url}?_=${Date.now()}`;
    
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Import any modules
    await componentLoader.detectAndImportModules(doc);
    
    // Execute any inline scripts
    await componentLoader.executeInlineScripts(doc);
    
    // Filter out script tags, but keep them for views
    const contentWithoutScripts = componentLoader.filterScriptTags(doc.body, true); // Keep script tags
    const content = contentWithoutScripts.innerHTML;
    
    // Pre-translate the content
    const wrapper = document.createElement('div');
    wrapper.innerHTML = content;
    localizer.translateContainer(wrapper);
    
    // Return the content wrapped in the default layout
    return DEFAULT_LAYOUT(wrapper.innerHTML);
  } catch (error) {
    console.error('Error loading page:', error);
    return `
      <div class="error">
        <h1 data-i18n="errors.error_loading_page">Error Loading Page</h1>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * Clean up any transition overlays
 */
function cleanupOverlays() {
  // Remove any transition overlays
  const overlays = document.querySelectorAll('.transition-overlay');
  console.log('Found transition overlays:', overlays.length);
  
  overlays.forEach(overlay => {
    if (document.body.contains(overlay)) {
      console.log('Removing transition overlay');
      document.body.removeChild(overlay);
    }
  });
  
  // Also check for any elements with opacity or visibility styles that might be leftover
  document.querySelectorAll('[style*="opacity: 0"]').forEach(el => {
    if (el.classList.contains('transition-overlay') || el.style.position === 'absolute') {
      console.log('Removing hidden element with opacity 0');
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  });
  
  // Remove the initial loading overlay if it exists
  const initialOverlay = document.getElementById('initial-loading-overlay');
  if (initialOverlay && initialOverlay.parentNode) {
    console.log('Removing initial loading overlay');
    initialOverlay.style.opacity = '0';
    setTimeout(() => {
      if (initialOverlay.parentNode) {
        initialOverlay.parentNode.removeChild(initialOverlay);
      }
    }, 150);
  }
}

/**
 * Create and initialize the router
 * @param {Object} options - Router options
 * @returns {Router} Router instance
 */
export function createRouter(options = {}) {
  console.log('Creating router with options:', options);
  
  // Create a custom fade transition that ensures overlays are cleaned up
  const customFade = transitions.fade({
    duration: options.transitionDuration || 300,
    onComplete: () => {
      // Clean up any overlays
      cleanupOverlays();
      
      // Dispatch a custom event when the transition is complete
      document.dispatchEvent(new CustomEvent('spa-transition-end'));
    }
  });
  
  // Create the router
  const router = new Router({
    rootElement: options.rootElement || '#app',
    transition: customFade,
    renderer: renderer.createRenderer({
      translateContainer: localizer.translateContainer.bind(localizer),
      applyRTLToDocument: localizer.applyRTLToDocument.bind(localizer),
      keepScripts: true // Keep script tags in views
    }),
    errorHandler: (path) => {
      console.log('Custom error handler called for path:', path);
      
      // Clean up any overlays immediately
      cleanupOverlays();
      
      // Set up a safety interval to periodically check for and remove any overlays
      const safetyInterval = setInterval(cleanupOverlays, 500);
      
      // Clear the safety interval after 3 seconds
      setTimeout(() => {
        clearInterval(safetyInterval);
        console.log('Safety interval cleared');
      }, 3000);
      
      return `
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
    }
  });
  
  // Store the original init method
  const originalInit = router.init;
  
  // Override the init method to do nothing if disableAutoInit is true
  if (options.disableAutoInit) {
    console.log('Auto-initialization disabled');
    router.init = function() {
      console.log('Manual initialization called');
      
      // Add event listeners for popstate and clicks
      window.addEventListener('popstate', (e) => {
        console.log('Popstate event, navigating to:', window.location.pathname);
        this.navigate(window.location.pathname, false);
      });
      
      // Intercept all clicks at the document level
      document.addEventListener('click', (e) => {
        // Skip if modifier keys are pressed
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        
        // Find anchor element in the event path
        const path = e.composedPath();
        let anchor = null;
        
        for (let i = 0; i < path.length; i++) {
          if (path[i].tagName === 'A') {
            anchor = path[i];
            break;
          }
        }
        
        // Skip if no anchor found
        if (!anchor) return;
        
        // Get the href attribute
        const href = anchor.getAttribute('href');
        
        // Skip if no href
        if (!href) return;
        
        // Skip if it's an external link
        if (href.startsWith('http') || href.startsWith('//')) return;
        
        // Skip if it has a target
        if (anchor.hasAttribute('target')) return;
        
        // Skip if it's a download link
        if (anchor.hasAttribute('download')) return;
        
        // Skip if it's an anchor link
        if (href.startsWith('#')) return;
        
        // Prevent default behavior
        e.preventDefault();
        
        // Navigate to the link
        this.navigate(href);
        
        console.log('Intercepted click on link:', href);
      }, { capture: true });
    };
  }
  
  // Add middleware for translations
  router.use(async (to, from, next) => {
    console.log(`Router middleware: from ${from || 'initial'} to ${to.path}`);
    
    // Dispatch pre-navigation event
    document.dispatchEvent(new CustomEvent('pre-navigation', {
      detail: { fromPath: from || '', toPath: to.path }
    }));
    
    // Continue with navigation
    next();
    
    // Apply translations after transition
    document.addEventListener('spa-transition-end', () => {
      localizer.translateDOM();
      localizer.applyRTLToDocument();
    }, { once: true });
  });
  
  // Override navigate method to dispatch events and handle loading state
  const originalNavigate = router.navigate.bind(router);
  router.navigate = async function(path, params = {}) {
    console.log(`Custom navigate method called for path: ${path}`);
    
    // Reset loading state if needed
    if (this.loading) {
      console.log('Resetting loading state before navigation');
      this.loading = false;
    }
    
    document.dispatchEvent(new CustomEvent('pre-navigation', {
      detail: { fromPath: window.location.pathname, toPath: path }
    }));
    
    return originalNavigate(path, params);
  };
  
  return router;
}

/**
 * Define routes for the application
 * @param {Router} router - Router instance
 */
export function defineRoutes(router) {
  console.log('Defining routes...');
  
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
    '/reset-password': {
      view: () => loadPage('/views/reset-password.html'),
      afterRender: () => initResetPasswordPage()
    },
    '/reset-password-confirm': {
      view: () => loadPage('/views/reset-password-confirm.html')
    },
    '/state-demo': {
      view: () => loadPage('/views/state-demo.html')
    },
    '/simple-state-demo': {
      view: () => loadPage('/views/simple-state-demo.html'),
      afterRender: () => {
        import('./components/simple-counter.js').catch(error => {
          console.error('Error loading simple-counter component:', error);
        });
      }
    },
    '/dashboard': {
      view: () => loadPage('/views/dashboard.html'),
      beforeEnter: async (to, from, next) => {
        try {
          const { checkAuthStatus } = await import('./utils/auth-status.js');
          const status = await checkAuthStatus();
          
          if (!status.authenticated) {
            return next('/login');
          }
          
          // Check subscription status
          const userJson = localStorage.getItem('user');
          if (userJson) {
            const user = JSON.parse(userJson);
            const hasActiveSubscription = user?.subscription?.status === 'active';
            
            if (!hasActiveSubscription) {
              alert('You need an active subscription to access the dashboard.');
              return next('/subscription');
            }
          }
          
          next();
        } catch (error) {
          console.error('Error checking authentication status:', error);
          return next('/login');
        }
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
    '/stripe-payment': {
      view: () => loadPage('/views/stripe-payment-new.html')
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
      view: () => loadPage('/views/i18n-demo.html')
    }
  };
  
  // Add aliases for routes with .html extension
  Object.keys(routes).forEach(path => {
    if (path !== '/') {
      routes[`${path}.html`] = routes[path];
    }
  });
  
  console.log('Routes defined:', Object.keys(routes));
  
  // Register routes
  router.registerRoutes(routes);
  
  // Debug: Log registered routes
  console.log('Routes registered:', Object.keys(router.routes));
  
  // Initialize the router
  console.log('Router initializing...');
  router.init();
  
  return router;
}