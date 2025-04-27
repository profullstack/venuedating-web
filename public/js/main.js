/**
 * Main application entry point
 */
import { initI18n } from './i18n-setup.js';
import { createRouter, defineRoutes } from './router.js';

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
  // Initialize i18n first
  initI18n().then(() => {
    console.log('i18n initialized');
    
    // Create and initialize the router
    const router = createRouter({
      rootElement: '#app',
      transitionDuration: 300
    });
    
    // Define routes
    defineRoutes(router);
    
    // Expose router globally
    window.router = router;
    
    console.log('Application initialized successfully');
  }).catch(error => {
    console.error('Error initializing i18n:', error);
    
    // Initialize router anyway to allow basic navigation
    const router = createRouter();
    defineRoutes(router);
    window.router = router;
  });
}

// Expose functions globally
window.app = window.app || {};
Object.assign(window.app, {
  initApp
});