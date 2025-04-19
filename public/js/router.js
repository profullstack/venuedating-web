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
    // Handle initial route
    this.navigate(window.location.pathname, false);
    
    // Handle popstate events (browser back/forward)
    window.addEventListener('popstate', (e) => {
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
    // Skip if already loading
    if (this.loading) return;
    
    // Set loading state
    this.loading = true;
    
    // Normalize path
    path = path || '/';
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Find matching route
    const route = this.findRoute(path);
    
    // Update history if needed
    if (pushState) {
      window.history.pushState(null, '', path);
    }
    
    // Get root element
    const rootElement = document.querySelector(this.rootElement);
    if (!rootElement) {
      console.error(`Root element "${this.rootElement}" not found`);
      this.loading = false;
      return;
    }
    
    // Show loading state
    rootElement.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
      // Handle route
      if (route) {
        // Set current route
        this.currentRoute = route;
        
        // Get view content
        let content;
        
        if (typeof route.view === 'function') {
          // If view is a function, call it
          content = await route.view();
        } else if (typeof route.view === 'string') {
          // If view is a string, treat it as HTML
          content = route.view;
        } else if (route.component) {
          // If route has a component, create it
          const component = document.createElement(route.component);
          content = component.outerHTML;
        } else {
          // Default to empty content
          content = '';
        }
        
        // Update the DOM
        rootElement.innerHTML = content;
        
        // Call afterRender if provided
        if (route.afterRender) {
          route.afterRender();
        }
        
        // Dispatch route changed event
        window.dispatchEvent(new CustomEvent('route-changed', {
          detail: { path, route }
        }));
      } else {
        // Handle 404
        this.errorHandler(path, rootElement);
      }
    } catch (error) {
      console.error('Error rendering route:', error);
      rootElement.innerHTML = `<div class="error">Error loading page: ${error.message}</div>`;
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
      <div class="error-page">
        <h1>404 - Page Not Found</h1>
        <p>The page "${path}" could not be found.</p>
        <a href="/" class="back-link">Go back to home</a>
      </div>
    `;
  }
}

// Export the router
export default Router;