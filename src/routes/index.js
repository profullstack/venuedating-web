import { htmlToPdfRoute } from './html-to-pdf.js';
import { htmlToDocRoute } from './html-to-doc.js';
import { htmlToExcelRoute } from './html-to-excel.js';
import { htmlToPptRoute } from './html-to-ppt.js';
import { htmlToMarkdownRoute } from './html-to-markdown.js';
import { markdownToHtmlRoute } from './markdown-to-html.js';
import { htmlToEpubRoute } from './html-to-epub.js';
import { documentHistoryRoute } from './document-history.js';
import {
  subscriptionRoute,
  paymentCallbackRoute,
  subscriptionStatusRoute,
  paymentLogsRoute
} from './subscription.js';
import { apiKeyRoutes } from './api-keys.js';
import { refreshTokenRoute, registerRoute } from './auth.js';
import { authStatusRoute } from './auth-status.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

// Routes that require authentication
const protectedRoutes = [
  htmlToPdfRoute,
  htmlToDocRoute,
  htmlToExcelRoute,
  htmlToPptRoute,
  htmlToMarkdownRoute,
  markdownToHtmlRoute,
  htmlToEpubRoute,
  documentHistoryRoute
];

// Apply auth middleware to protected routes
protectedRoutes.forEach(route => {
  if (!route.middleware) {
    route.middleware = [];
  }
  route.middleware.unshift(authMiddleware);
});

// Public routes (no authentication required)
const publicRoutes = [
  subscriptionRoute,
  paymentCallbackRoute,
  subscriptionStatusRoute,
  paymentLogsRoute,
  refreshTokenRoute,
  registerRoute,
  authStatusRoute
];

/**
 * All API routes
 */
export const routes = [
  ...protectedRoutes,
  ...publicRoutes,
  ...apiKeyRoutes
];

/**
 * Register all routes with a Hono app instance
 * @param {Object} app - Hono app instance
 */
export function registerRoutes(app) {
  routes.forEach(route => {
    // Apply middleware if provided
    if (route.middleware && route.middleware.length > 0) {
      app[route.method.toLowerCase()](route.path, ...route.middleware, route.handler);
    } else {
      app[route.method.toLowerCase()](route.path, route.handler);
    }
  });
}