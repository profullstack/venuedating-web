/**
 * Dependencies module
 * 
 * This file centralizes all external ESM dependencies to make them easier to manage
 * and update. It also allows for potential future bundling or local hosting of these
 * dependencies if needed.
 */

// Import and re-export spa-router directly from source
import Router from './modules/spa-router/src/router.js';
import * as transitions from './modules/spa-router/src/transitions.js';
import * as renderer from './modules/spa-router/src/renderer.js';
import * as componentLoader from './modules/spa-router/src/component-loader.js';
export { Router, transitions, renderer, componentLoader };

// Import and re-export state-manager
import { createStore, StoreConnector } from './modules/state-manager/dist/index.js';
export { createStore, StoreConnector };

// Import and re-export localizer from compiled version
import localizerDefault from './modules/localizer/dist/index.mjs';
export const localizer = localizerDefault;
export function _t(key, options = {}) {
  return localizer.translate(key, options);
}