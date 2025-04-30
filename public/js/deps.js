/**
 * Dependencies module
 * 
 * This file centralizes all external ESM dependencies to make them easier to manage
 * and update. It also allows for potential future bundling or local hosting of these
 * dependencies if needed.
 */

// Import and re-export spa-router
export { Router, transitions, renderer, componentLoader } from 'https://esm.sh/@profullstack/spa-router@1.11.5';

// Import and re-export state-manager
export { createStore, StoreConnector } from 'https://esm.sh/@profullstack/state-manager@1.0.1';

// Import and re-export localizer
export { localizer, _t } from 'https://esm.sh/@profullstack/localizer@0.5.0';