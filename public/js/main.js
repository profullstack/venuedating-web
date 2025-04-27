/**
 * Main application entry point
 */
import { initI18n } from './i18n-setup.js';
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
  // Initialize i18n first
  initI18n().then(() => {
    console.log('i18n initialized');
    
    // Create the router with initialization disabled
    const router = createRouter({
      rootElement: '#app',
      transitionDuration: 300,
      disableAutoInit: true // Disable auto-initialization
    });
    
    // Define routes BEFORE initializing
    console.log('Defining routes before initialization');
    defineRoutes(router);
    
    // Expose router globally
    window.router = router;
    
    // Manually initialize the router after routes are defined
    console.log('Manually initializing router');
    router.init();
    
    // Wait a moment to ensure routes are registered and any loading state is cleared
    setTimeout(() => {
      // Reset loading state if needed
      if (router.loading) {
        console.log('Resetting router loading state before navigation');
        router.loading = false;
      }
      
      // Navigate to the current path
      console.log('Navigating to:', window.location.pathname);
      router.navigate(window.location.pathname, false);
      
      console.log('Application initialized successfully');
    }, 100); // Increased timeout to ensure loading state is cleared
  }).catch(error => {
    console.error('Error initializing i18n:', error);
    
    // Initialize router anyway to allow basic navigation
    const router = createRouter({
      rootElement: '#app',
      transitionDuration: 300,
      disableAutoInit: true
    });
    
    // Define routes BEFORE initializing
    console.log('Defining routes before initialization (fallback)');
    defineRoutes(router);
    
    window.router = router;
    
    // Manually initialize the router after routes are defined
    console.log('Manually initializing router (fallback)');
    router.init();
    
    // Wait a moment to ensure routes are registered and any loading state is cleared
    setTimeout(() => {
      // Reset loading state if needed
      if (router.loading) {
        console.log('Resetting router loading state before navigation (fallback)');
        router.loading = false;
      }
      
      // Navigate to the current path
      console.log('Navigating to:', window.location.pathname);
      router.navigate(window.location.pathname, false);
    }, 100); // Increased timeout to ensure loading state is cleared
  });
}

// Expose functions globally
window.app = window.app || {};
Object.assign(window.app, {
  initApp
});