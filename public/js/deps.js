/**
 * Dependencies module
 * 
 * This file centralizes all external ESM dependencies to make them easier to manage
 * and update. It also allows for potential future bundling or local hosting of these
 * dependencies if needed.
 */

// Import and re-export spa-router
export { Router, transitions, renderer, componentLoader } from 'https://esm.sh/@profullstack/spa-router';

// Import and re-export localizer
export { localizer, _t } from 'https://esm.sh/@profullstack/localizer';

// Import and re-export enhanced-router
export * as enhancedRouter from 'https://esm.sh/@profullstack/enhanced-router';

// Re-export other modules
export * as apiKeyManager from 'https://esm.sh/@profullstack/api-key-manager';
export * as authSystem from 'https://esm.sh/@profullstack/auth-system';
export * as documentConverters from 'https://esm.sh/@profullstack/document-converters';
export * as paymentGateway from 'https://esm.sh/@profullstack/payment-gateway';
export * as storageService from 'https://esm.sh/@profullstack/storage-service';
export * as websocketClient from 'https://esm.sh/@profullstack/websocket-client';