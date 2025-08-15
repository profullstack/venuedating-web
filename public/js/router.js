/**
 * Router module for SPA navigation
 */
import { Router, transitions, renderer, componentLoader } from './deps.js';
import { localizer } from './i18n-setup.js';
import { createRoutes } from './route-helpers.js';
import {
  initLoginPage,
  initRegisterPage,
  initApiKeysPage,
  initSettingsPage,
  initSubscriptionPage,
  initResetPasswordPage,
  initManageSubscriptionPage,
  initTestFeaturePage,
  initFaqsPage,
  initAuthPage,
  initFeedPage,
  initChartsPage
} from './page-initializers.js';


// Import profile page functionality
import { initProfilePage } from './profile-page.js';
import { initProfileGenderPage } from './profile-gender.js';
import { initProfileInterestsPage } from './profile-interests.js';
import { initProfileVerifyPage } from './profile-verify.js';
import { initProfileCompletePage } from './profile-complete.js';
import { initDiscoverPage } from './discover.js';
import { initProfileDetail } from './profile-detail.js';
import supabase from './api/supabase-client.js';

// Create a DOM fragment with the default layout
function createLayoutFragment(content, pageUrl) {
  // Create a document fragment
  const fragment = document.createDocumentFragment();

  // If this is the splash, auth, or profile screen, do NOT add header/footer
  const isNoHeaderFooter = (
    pageUrl === '/views/home.html' || pageUrl === '/home.html' || pageUrl === '/' ||
    pageUrl === '/views/auth.html' || pageUrl === '/auth.html' || pageUrl === '/auth' ||
    pageUrl === '/views/phone-login.html' || pageUrl === '/phone-login' ||
    pageUrl === '/views/profile.html' || pageUrl === '/profile' ||
    pageUrl === '/views/profile-gender.html' || pageUrl === '/profile-gender' ||
    pageUrl === '/views/profile-interests.html' || pageUrl === '/profile-interests' ||
    pageUrl === '/views/profile-verify.html' || pageUrl === '/profile-verify' ||
    pageUrl === '/views/profile-complete.html' || pageUrl === '/profile-complete' ||
    pageUrl === '/views/feed.html' || pageUrl === '/feed' ||
    pageUrl === '/views/phone-reset.html' || pageUrl === '/phone-reset' ||
    pageUrl === '/views/discover.html' || pageUrl === '/discover' ||
    pageUrl === '/views/matching.html' || pageUrl === '/matching' ||
    pageUrl === '/views/chat.html' || pageUrl === '/chat' ||
    pageUrl === '/views/conversation.html' || pageUrl === '/conversation' ||
    pageUrl === '/views/profile-detail.html' || pageUrl === '/profile-detail'
  );

  if (!isNoHeaderFooter) {
    // Create header
    const header = document.createElement('pf-header');
    fragment.appendChild(header);
  }

  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';

  // If content is a string, use createContextualFragment to parse it
  if (typeof content === 'string') {
    const range = document.createRange();
    const parsedContent = range.createContextualFragment(content);
    contentDiv.appendChild(parsedContent);
  } else if (content instanceof DocumentFragment) {
    // If it's already a fragment, append it directly
    contentDiv.appendChild(content);
  } else if (content instanceof Node) {
    // If it's a DOM node, append it directly
    contentDiv.appendChild(content);
  }

  fragment.appendChild(contentDiv);

  if (!isNoHeaderFooter) {
    // Create footer
    const footer = document.createElement('pf-footer');
    fragment.appendChild(footer);
  }

  return fragment;
}

/**
 * Load a page from the server
 * @param {string} url - Page URL
 * @returns {Promise<string>} - Page HTML
 */
/**
 * Load a page from the server
 * @param {string} url - Page URL
 * @returns {Promise<string>} - Page HTML
 */
export async function loadPage(url) {
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
    
    // Extract module script sources
    const moduleScripts = componentLoader.extractModuleScriptSources(doc);
    console.log('Extracted module scripts in router.js:', moduleScripts);
    
    // Execute any inline scripts
    await componentLoader.executeInlineScripts(doc);
    
    // Use the component loader to create a fragment with properly handled scripts
    const contentFragment = componentLoader.createFragmentWithScripts(doc);
    
    // Create a wrapper for translation
    const wrapper = document.createElement('div');
    wrapper.appendChild(contentFragment.cloneNode(true));
    
    // Pre-translate the content
    localizer.translateContainer(wrapper);
    
    // Create a new fragment with the translated content
    const translatedFragment = document.createDocumentFragment();
    while (wrapper.firstChild) {
      translatedFragment.appendChild(wrapper.firstChild);
    }
    
    // Extract and clone script tags again to ensure they're executed
    const scriptElements = componentLoader.extractAndCloneScripts(doc);
    
    // Add the script elements to the fragment
    scriptElements.forEach(script => {
      translatedFragment.appendChild(script);
    });
    
    // Create and add module scripts to the fragment
    if (moduleScripts && moduleScripts.length > 0) {
      console.log(`Adding ${moduleScripts.length} module scripts to the fragment`);
      
      moduleScripts.forEach(src => {
        // Create a new script element
        const script = document.createElement('script');
        script.type = 'module';
        
        // Convert to absolute URL if needed
        if (src.startsWith('http://') || src.startsWith('https://')) {
          script.src = src;
        } else {
          // For local scripts, create absolute URL based on current origin
          const baseUrl = window.location.origin;
          const absoluteSrc = src.startsWith('/')
            ? `${baseUrl}${src}`
            : `${baseUrl}/${src}`;
          script.src = absoluteSrc;
        }
        
        console.log(`Adding module script: ${script.src}`);
        translatedFragment.appendChild(script);
      });
    }
    
    // Return the content wrapped in the default layout as a DOM fragment
    return createLayoutFragment(translatedFragment, url);
  } catch (error) {
    console.error('Error loading page:', error);
    
    // Create an error fragment
    const errorFragment = document.createDocumentFragment();
    
    // Create error container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    
    // Create error heading
    const heading = document.createElement('h1');
    heading.setAttribute('data-i18n', 'errors.error_loading_page');
    heading.textContent = 'Error Loading Page';
    errorDiv.appendChild(heading);
    
    // Create error message
    const message = document.createElement('p');
    message.textContent = error.message;
    errorDiv.appendChild(message);
    
    // Add to fragment
    errorFragment.appendChild(errorDiv);
    
    // Return the error wrapped in the default layout
    return createLayoutFragment(errorFragment);
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
  
  // Create a basic router
  console.log('Creating basic router');
  const router = new Router({
    rootElement: options.rootElement || '#app',
    transition: customFade,
    renderer: renderer.createRenderer({
      translateContainer: localizer.translateContainer.bind(localizer),
      applyRTLToDocument: localizer.applyRTLToDocument.bind(localizer),
      keepScripts: true // Keep script tags in views
    })
  });
  
  // Add custom error handling
  router.errorHandler = (path) => {
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
    
    // Create error content fragment
    const contentFragment = document.createDocumentFragment();
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    contentContainer.style.display = 'flex';
    contentContainer.style.justifyContent = 'center';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.minHeight = '60vh';
    
    // Create error page div
    const errorPage = document.createElement('div');
    errorPage.className = 'error-page';
    
    // Create heading
    const heading = document.createElement('h1');
    heading.textContent = '404 - Page Not Found';
    errorPage.appendChild(heading);
    
    // Create message
    const message = document.createElement('p');
    message.textContent = `The page "${path}" could not be found.`;
    errorPage.appendChild(message);
    
    // Create back link
    const backLink = document.createElement('a');
    backLink.href = '/';
    backLink.className = 'back-link';
    backLink.textContent = 'Go back to home';
    errorPage.appendChild(backLink);
    
    // Assemble the fragment
    contentContainer.appendChild(errorPage);
    contentFragment.appendChild(contentContainer);
    
    // Return the error wrapped in the default layout
    return createLayoutFragment(contentFragment);
  };
  
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
  
  // Add middleware for translations if the router supports it
  if (typeof router.use === 'function') {
    try {
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
    } catch (error) {
      console.error('Error adding middleware to router:', error);
    }
  } else {
    console.warn('Router does not support middleware (use method not available)');
  }
  
  // Override navigate method to dispatch events and handle loading state
  if (typeof router.navigate === 'function') {
    try {
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
        
        try {
          return await originalNavigate(path, params);
        } catch (error) {
          console.error('Error during navigation:', error);
          return Promise.resolve();
        }
      };
    } catch (error) {
      console.error('Error overriding navigate method:', error);
    }
  } else {
    console.warn('Router does not have a navigate method to override');
  }
  
  return router;
}

/**
 * Define routes for the application
 * @param {Router} router - Router instance
 */
export function defineRoutes(router) {
  console.log('Defining routes...');
  
  // Define routes using the createRoutes helper
  const routes = createRoutes({
    // Public routes
    '/': '/views/home.html',
    
    '/discover': {
      viewPath: '/views/discover.html',
      afterRender: initDiscoverPage,
      noheaderfooter: true
    },
    
    '/matching': {
      viewPath: '/views/matching.html',
      noheaderfooter: true,
      afterRender: () => {
        console.log('Matching page initialized');
        // Initialize any matching page specific code if needed
        if (typeof window.initMatchingPage === 'function') {
          window.initMatchingPage();
        }
      }
    },

    '/notifications': {
      viewPath: '/views/notifications.html',
      noheaderfooter: true,
      afterRender: () => {
        console.log('Notifications page initialized');
        // Initialize any notifications page specific code if needed
        if (typeof window.initNotificationsPage === 'function') {
          window.initNotificationsPage();
        }
      }
    },

    '/edit-profile': {
      viewPath: '/views/edit-profile.html',
      noheaderfooter: true,
      afterRender: () => {
        console.log('Edit profile page initialized');
        // Initialize any edit profile page specific code if needed
        if (typeof window.initEditProfilePage === 'function') {
          window.initEditProfilePage();
        }
      }
    },
    
    '/admin/venues': {
      viewPath: '/views/admin-venues.html',
      requireAuth: true,
      beforeEnter: async (to, from, next) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            alert('Please log in');
            return next('/');
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          // Handle case where profile doesn't exist yet
          if (error && error.code === 'PGRST116') {
            console.log('No profile found for admin check, denying access');
            alert('Admin access required');
            return next('/');
          }

          if (!profile || !profile.is_admin) {
            alert('Admin access required');
            return next('/');
          }

          next();
        } catch (err) {
          console.error('Admin route guard error:', err);
          alert('Error validating admin access');
          next('/');
        }
      },
      afterRender: () => {
        if (window.initAdminVenuesPage) {
          window.initAdminVenuesPage();
        }
      }
    },

    '/chat': {
      viewPath: '/views/chat.html',
      afterRender: () => {
        console.log('Chat page initialized');
        // Initialize chat page specific code if needed
        if (typeof window.initChatPage === 'function') {
          window.initChatPage();
        }
      }
    },

    '/conversation': {
      viewPath: '/views/conversation.html',
      afterRender: () => {
        console.log('Conversation page initialized');
        // Initialize conversation page specific code if needed
        if (typeof window.initConversationPage === 'function') {
          window.initConversationPage();
        }
      }
    },

    '/auth': {
      viewPath: '/views/auth.html',
      afterRender: initAuthPage
    },
    
    '/phone-login': {
      viewPath: '/views/phone-login.html',
      afterRender: () => {
        console.log('Phone login page initialized');
        
        // Wait for the page to fully initialize
        setTimeout(() => {
          // Initialize country dropdown if the function is available
          if (typeof window.populateCountries === 'function') {
            window.populateCountries();
          } else {
            console.warn('populateCountries function not found in window scope');
          }
        }, 100);
      }
    },
    
    '/phone-reset': {
      viewPath: '/views/phone-reset.html',
      afterRender: () => {
        console.log('Phone reset page initialized');
        
        // Wait for the page to fully initialize
        setTimeout(() => {
          // Initialize country dropdown if the function is available
          if (typeof window.populateCountries === 'function') {
            window.populateCountries();
          } else {
            console.warn('populateCountries function not found in window scope');
          }
        }, 100);
      }
    },

    '/profile': {
      viewPath: '/views/profile.html',
      afterRender: initProfilePage
    },

    '/profile-detail': {
      viewPath: '/views/profile-detail.html',
      afterRender: initProfileDetail,
      noheaderfooter: true
    },

    '/profile-gender': {
      viewPath: '/views/profile-gender.html',
      afterRender: initProfileGenderPage
    },
    
    '/profile-interests': {
      viewPath: '/views/profile-interests.html',
      afterRender: initProfileInterestsPage
    },
    
    '/profile-verify': {
      viewPath: '/views/profile-verify.html',
      afterRender: initProfileVerifyPage
    },
    
    '/profile-complete': {
      viewPath: '/views/profile-complete.html',
      afterRender: initProfileCompletePage
    },
    
    // Authentication routes
    '/login': {
      viewPath: '/views/auth.html',
      afterRender: initAuthPage
    },
    '/login-email': {
      viewPath: '/views/login-email.html',
      afterRender: () => {
        console.log('Login-email page initialized');
        if (typeof window.initLoginEmailPage === 'function') {
          window.initLoginEmailPage();
        }
      }
    },
    '/register': {
      viewPath: '/views/profile.html',
      afterRender: initRegisterPage
    },
    '/reset-password': {
      viewPath: '/views/reset-password.html',
      afterRender: initResetPasswordPage
    },
    '/reset-password-confirm': '/views/reset-password-confirm.html',
    
    // Demo routes
    '/state-demo': '/views/state-demo.html',
    '/charts': {
      viewPath: '/views/charts.html',
      afterRender: initChartsPage
    },
    '/simple-state-demo': {
      viewPath: '/views/simple-state-demo.html',
      afterRender: () => {
        import('./components/simple-counter.js').catch(error => {
          console.error('Error loading simple-counter component:', error);
        });
      }
    },
    '/faqs': {
      viewPath: '/views/faqs.html',
      afterRender: initFaqsPage
    },
    '/feed': {
      viewPath: '/views/feed.html',
      afterRender: initFeedPage,
      requireAuth: false
    },
    '/test-feature': {
      viewPath: '/views/test-feature.html',
      afterRender: initTestFeaturePage
    },
    '/i18n-demo': '/views/i18n-demo.html',
    
    // Protected routes
    '/dashboard': {
      viewPath: '/views/dashboard.html',
      requireAuth: true,
      requireSubscription: true
    },
    '/api-docs': '/views/api-docs.html',
    '/api-keys': {
      viewPath: '/views/api-keys.html',
      afterRender: initApiKeysPage,
      requireAuth: true
    },
    '/settings': {
      viewPath: '/views/settings.html',
      afterRender: initSettingsPage,
      requireAuth: true
    },
    '/subscription': {
      viewPath: '/views/subscription.html',
      afterRender: initSubscriptionPage
    },
    '/stripe-payment': '/views/stripe-payment-new.html',
    
    // Legal routes
    '/terms': '/views/terms.html',
    '/privacy': '/views/privacy.html',
    '/refund': '/views/refund.html',
    '/contact': '/views/contact.html',
    '/about': '/views/about.html',
    
    // Subscription management
    '/manage-subscription': {
      viewPath: '/views/manage-subscription.html',
      afterRender: initManageSubscriptionPage,
      requireAuth: true
    }
  });
  
  console.log('Routes defined:', Object.keys(routes));
  
  // Register routes if the method exists
  if (typeof router.registerRoutes === 'function') {
    try {
      router.registerRoutes(routes);
      
      // Debug: Log registered routes
      if (router.routes) {
        console.log('Routes registered:', Object.keys(router.routes));
      } else {
        console.warn('Router has no routes property after registration');
      }
    } catch (error) {
      console.error('Error registering routes:', error);
    }
  } else {
    console.warn('Router does not have a registerRoutes method');
    
    // Fallback: Set routes directly if possible
    if (router) {
      router.routes = routes;
      console.log('Routes set directly on router object');
    }
  }
  
  // Initialize the router if the method exists
  console.log('Router initializing...');
  if (typeof router.init === 'function') {
    try {
      router.init();
    } catch (error) {
      console.error('Error initializing router:', error);
    }
  } else {
    console.warn('Router does not have an init method');
  }
  
  return router;
}