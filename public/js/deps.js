/**
 * Dependencies module
 * 
 * This file centralizes all external ESM dependencies to make them easier to manage
 * and update. It also allows for potential future bundling or local hosting of these
 * dependencies if needed.
 */

// Import and re-export spa-router
export { Router, transitions, renderer, componentLoader } from './modules/spa-router/src/index.js';

// Import and re-export state-manager
export { createStore, StoreConnector } from './modules/state-manager/src/index.js';

// Import and re-export localizer
export { localizer, _t } from './modules/localizer/src/index.js';