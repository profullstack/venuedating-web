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
  subscriptionStatusRoute 
} from './subscription.js';
import { subscriptionCheck } from '../middleware/subscription-check.js';

// Routes that require subscription
const paidRoutes = [
  htmlToPdfRoute,
  htmlToDocRoute,
  htmlToExcelRoute,
  htmlToPptRoute,
  htmlToMarkdownRoute,
  markdownToHtmlRoute,
  htmlToEpubRoute,
  documentHistoryRoute
];

// Apply subscription check middleware to paid routes
paidRoutes.forEach(route => {
  if (!route.middleware) {
    route.middleware = [];
  }
  route.middleware.unshift(subscriptionCheck);
});

// Free routes (no subscription required)
const freeRoutes = [
  subscriptionRoute,
  paymentCallbackRoute,
  subscriptionStatusRoute
];

/**
 * All API routes
 */
export const routes = [
  ...paidRoutes,
  ...freeRoutes
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