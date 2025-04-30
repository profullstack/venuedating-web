/**
 * Main application entry point
 */
import { initI18n, localizer } from './i18n-setup.js';
import { createRouter, defineRoutes } from './router.js';
import './components-loader.js'; // Import all components

// Initialize the application
let initialized = false;

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing app');
  if (!initialized) {
    initialized = true;
    initApp();
  }
});

// Also initialize immediately to handle direct navigation
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Document already ready, initializing app');
  if (!initialized) {
    initialized = true;
    initApp();
  }
}

/**
 * Initialize the application
 */
function initApp() {
  // Set API base URL for client-side requests (domain only, without /api/1)
  window.API_BASE_URL = 'https://convert2doc.com';
  console.log('API base URL set to:', window.API_BASE_URL);
  
  // Initialize i18n first
  initI18n().then(() => {
    console.log('i18n initialized');
    
    // Initialize the router for SPA mode
    initRouter();
  }).catch(error => {
    console.error('Error initializing i18n:', error);
    
    // Initialize router anyway to allow basic navigation
    initRouter();
  });
}

/**
 * Initialize the router for SPA mode
 */
function initRouter() {
  // Debug: Log routes before registration
  console.log('About to register routes');
  
  // Create router with the imported functions
  const router = createRouter({
    rootElement: '#app'
  });
  
  // Define and register routes
  defineRoutes(router);
  
  // Debug: Try to access the router's internal state
  console.log('Router internal state:', router);
  console.log('Router routes property:', router.routes);
  console.log('Router routes keys after registration:', Object.keys(router.routes));
  console.log('Router route for / exists after registration:', router.routes['/'] !== undefined);
  
  // Expose router globally
  window.router = router;
}

// Import utilities from deps.js
import { componentLoader } from './deps.js';
import {
  initLoginPage,
  initRegisterPage,
  initApiKeysPage,
  initSettingsPage,
  initSubscriptionPage,
  initResetPasswordPage
} from './page-initializers.js';

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
      await componentLoader.detectAndImportModules(doc);
      
      // Filter out script tags (they'll be imported dynamically)
      const contentWithoutScripts = componentLoader.filterScriptTags(doc.body, true); // Keep script tags
      content = contentWithoutScripts.innerHTML;
    }
    
    // Add the content to the wrapper
    wrapper.innerHTML = content;
    
    // Pre-translate the content before it's returned to the router
    localizer.translateContainer(wrapper);
    
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

// No longer needed since we're using SPA mode exclusively

// Expose functions globally
window.app = window.app || {};
Object.assign(window.app, {
  initApp
});