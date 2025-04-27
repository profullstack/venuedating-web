/**
 * Router module for SPA navigation
 */
import { Router, transitions, renderer } from 'https://esm.sh/@profullstack/spa-router@1.5.0';
import { localizer } from './i18n-setup.js';
import { detectAndImportModules, filterScriptTags } from './utils/component-loader.js';
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
    await detectAndImportModules(doc);
    
    // Filter out script tags
    const contentWithoutScripts = filterScriptTags(doc.body);
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
 * Create and initialize the router
 * @param {Object} options - Router options
 * @returns {Router} Router instance
 */
export function createRouter(options = {}) {
  // Create the router
  const router = new Router({
    rootElement: options.rootElement || '#app',
    transition: transitions.fade({
      duration: options.transitionDuration || 300,
      onComplete: () => {
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
      }
    }),
    renderer: renderer.createRenderer({
      translateContainer: localizer.translateContainer.bind(localizer),
      applyRTLToDocument: localizer.applyRTLToDocument.bind(localizer)
    }),
    errorHandler: renderer.createErrorHandler()
  });
  
  // Add middleware for translations
  router.use(async (to, from, next) => {
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
  
  // Override navigate method to dispatch events
  const originalNavigate = router.navigate.bind(router);
  router.navigate = async function(path, params = {}) {
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
  
  // Register routes
  router.registerRoutes(routes);
  
  return router;
}