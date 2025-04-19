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
    
    // Create a transition container
    const transitionContainer = document.createElement('div');
    transitionContainer.className = 'route-transition-container';
    transitionContainer.style.position = 'absolute';
    transitionContainer.style.top = '0';
    transitionContainer.style.left = '0';
    transitionContainer.style.width = '100%';
    transitionContainer.style.height = '100%';
    transitionContainer.style.backgroundColor = 'var(--background-color)';
    transitionContainer.style.color = 'var(--text-primary)';
    transitionContainer.style.opacity = '0';
    transitionContainer.style.transition = 'opacity 150ms ease-in-out';
    transitionContainer.innerHTML = '<div class="loading">Loading...</div>';
    
    // Add the transition container to the root element
    rootElement.style.position = 'relative';
    rootElement.appendChild(transitionContainer);
    
    // Fade in the transition container
    setTimeout(() => {
      transitionContainer.style.opacity = '1';
    }, 0);
    
    try {
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
        
        // Prepare the new content in the background
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = content;
        
        // Apply theme-related styles to ensure proper coloring
        const themeStyles = document.createElement('style');
        themeStyles.textContent = `
          * {
            color: var(--text-primary);
            background-color: var(--background-color);
            transition: none !important;
          }
        `;
        tempContainer.appendChild(themeStyles);
        
        // Fade out the transition container
        transitionContainer.style.opacity = '0';
        
        // Wait for the fade out transition to complete
        setTimeout(() => {
          // Update the DOM with the prepared content
          console.log('Updating DOM with content');
          rootElement.innerHTML = content;
          
          // Call afterRender if provided
          if (route.afterRender) {
            console.log('Calling afterRender function');
            setTimeout(() => {
              try {
                route.afterRender();
              } catch (error) {
                console.error('Error in afterRender:', error);
              }
            }, 0);
          }
          
          // Dispatch route changed event
          window.dispatchEvent(new CustomEvent('route-changed', {
            detail: { path, route }
          }));
        }, 150); // Match the transition duration
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