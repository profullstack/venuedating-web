/**
 * Simple SPA router using the History API
 */
class Router {
  /**
   * Create a new router
   * @param {Object} options - Router options
   * @param {Object} options.routes - Route definitions
   * @param {string} options.rootElement - Root element selector
   * @param {Function} options.errorHandler - 404 error handler
   */
  constructor(options = {}) {
    this.routes = options.routes || {};
    this.rootElement = options.rootElement || '#app';
    this.errorHandler = options.errorHandler || this.defaultErrorHandler;
    this.currentRoute = null;
    this.loading = false;
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the router
   */
  init() {
    console.log('Router initializing...');
    
    // Handle initial route immediately if document is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log('Document already loaded, navigating to:', window.location.pathname);
      this.navigate(window.location.pathname, false);
    }
    
    // Also handle when DOM is fully loaded
    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded event, navigating to:', window.location.pathname);
      this.navigate(window.location.pathname, false);
    });
    
    // Handle popstate events (browser back/forward)
    window.addEventListener('popstate', (e) => {
      console.log('Popstate event, navigating to:', window.location.pathname);
      this.navigate(window.location.pathname, false);
    });
    
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      // Find closest anchor element
      const anchor = e.target.closest('a');
      
      // Skip if no anchor or if modifier keys are pressed
      if (!anchor || e.metaKey || e.ctrlKey || e.shiftKey) return;
      
      // Skip if it's an external link or has a target
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//') || anchor.hasAttribute('target')) return;
      
      // Skip if it's a download link
      if (anchor.hasAttribute('download')) return;
      
      // Skip if it's an anchor link
      if (href.startsWith('#')) return;
      
      // Skip if it's a file link (has extension)
      if (href.match(/\.\w+$/)) return;
      
      // Prevent default behavior
      e.preventDefault();
      
      // Navigate to the link
      this.navigate(href);
    });
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {boolean} pushState - Whether to push state to history
   */
  async navigate(path, pushState = true) {
    console.log(`Router navigating to: ${path}`);
    
    // Skip if already loading
    if (this.loading) {
      console.log('Already loading, skipping navigation');
      return;
    }
    
    // Set loading state
    this.loading = true;
    
    // Normalize path
    path = path || '/';
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Find matching route
    const route = this.findRoute(path);
    console.log('Found route:', route ? 'yes' : 'no');
    
    // Update history if needed
    if (pushState) {
      console.log('Updating history with path:', path);
      window.history.pushState({path}, document.title, path);
    }
    
    // Get root element
    const rootElement = document.querySelector(this.rootElement);
    if (!rootElement) {
      console.error(`Root element "${this.rootElement}" not found`);
      this.loading = false;
      return;
    }
    
    try {
      // Create a full-screen overlay to hide everything during transition
      const transitionOverlay = document.createElement('div');
      transitionOverlay.className = 'transition-overlay';
      transitionOverlay.style.position = 'fixed';
      transitionOverlay.style.top = '0';
      transitionOverlay.style.left = '0';
      transitionOverlay.style.width = '100vw';
      transitionOverlay.style.height = '100vh';
      transitionOverlay.style.backgroundColor = 'var(--background-color)';
      transitionOverlay.style.zIndex = '9999';
      transitionOverlay.style.opacity = '0';
      transitionOverlay.style.transition = 'opacity 150ms ease-in-out';
      
      // Add the overlay to the body
      document.body.appendChild(transitionOverlay);
      
      // Prevent scrolling during transition
      document.body.style.overflow = 'hidden';
      
      // Fade in the overlay
      setTimeout(() => {
        transitionOverlay.style.opacity = '1';
      }, 0);
      
      // Handle route
      if (route) {
        console.log('Handling route for path:', path);
        
        // Set current route
        this.currentRoute = route;
        
        // Get view content
        let content;
        
        if (typeof route.view === 'function') {
          // If view is a function, call it
          console.log('Calling view function');
          content = await route.view();
        } else if (typeof route.view === 'string') {
          // If view is a string, treat it as HTML
          console.log('Using string view');
          content = route.view;
        } else if (route.component) {
          // If route has a component, create it
          console.log('Creating component:', route.component);
          const component = document.createElement(route.component);
          content = component.outerHTML;
        } else {
          // Default to empty content
          console.log('No view or component found, using empty content');
          content = '';
        }
        
        // Replace the content directly
        rootElement.innerHTML = content;
        
        // Call afterRender if provided
        if (route.afterRender) {
          console.log('Calling afterRender function');
          try {
            route.afterRender();
          } catch (error) {
            console.error('Error in afterRender:', error);
          }
        }
        
        // Dispatch route changed event
        window.dispatchEvent(new CustomEvent('route-changed', {
          detail: { path, route }
        }));
        
        // Fade out the overlay
        transitionOverlay.style.opacity = '0';
        
        // Remove the overlay after the transition completes
        setTimeout(() => {
          document.body.removeChild(transitionOverlay);
          document.body.style.overflow = '';
        }, 150); // Match the transition duration
      } else {
        // Handle 404
        console.log('Route not found, showing 404 page');
        
        // Call the error handler
        this.errorHandler(path, rootElement);
        
        // Fade out the overlay
        transitionOverlay.style.opacity = '0';
        
        // Remove the overlay after the transition completes
        setTimeout(() => {
          document.body.removeChild(transitionOverlay);
          document.body.style.overflow = '';
        }, 150); // Match the transition duration
      }
    } catch (error) {
      console.error('Error rendering route:', error);
      
      // Handle errors
      rootElement.innerHTML = `<div class="error">Error loading page: ${error.message}</div>`;
      
      // Remove the overlay
      if (document.querySelector('.transition-overlay')) {
        document.body.removeChild(document.querySelector('.transition-overlay'));
        document.body.style.overflow = '';
      }
    } finally {
      // Clear loading state
      this.loading = false;
    }
  }

  /**
   * Find a route that matches the path
   * @param {string} path - Route path
   * @returns {Object|null} - Matching route or null
   */
  findRoute(path) {
    // Check for exact match
    if (this.routes[path]) {
      return this.routes[path];
    }
    
    // Check for dynamic routes
    for (const routePath in this.routes) {
      // Skip if not a dynamic route
      if (!routePath.includes(':')) continue;
      
      // Convert route path to regex
      const pattern = routePath
        .replace(/:[^\s/]+/g, '([^/]+)')
        .replace(/\//g, '\\/');
      
      const regex = new RegExp(`^${pattern}$`);
      const match = path.match(regex);
      
      if (match) {
        // Extract params
        const params = {};
        const paramNames = routePath.match(/:[^\s/]+/g) || [];
        
        paramNames.forEach((param, index) => {
          const paramName = param.slice(1); // Remove the colon
          params[paramName] = match[index + 1];
        });
        
        // Return route with params
        return {
          ...this.routes[routePath],
          params
        };
      }
    }
    
    return null;
  }

  /**
   * Default 404 error handler
   * @param {string} path - Route path
   * @param {HTMLElement} rootElement - Root element
   */
  defaultErrorHandler(path, rootElement) {
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
}

// Export the router
export default Router;