import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { getContact } from '../lib/contact.js';

// The module's browser helper (mountGuard), served to the static contact view.
const browserHelper = createRequire(import.meta.url).resolve('@profullstack/contact-form/browser');
let browserJs;

/**
 * The contact form's API (@profullstack/contact-form, see src/lib/contact.js).
 *
 * GET  /api/contact  a fresh token and the questions (no-store), which the
 *                    static contact view mounts with mountGuard()
 * GET  /js/vendor/contact-form-browser.js  that helper
 * POST /api/contact  honeypot, token, fill time and rate limit, then
 *                    validation and the email
 */
export const contactRoutes = [
  { method: 'GET', path: '/api/contact', handler: () => getContact().GET() },
  { method: 'POST', path: '/api/contact', handler: (c) => getContact().POST(c.req.raw) },
  {
    method: 'GET',
    path: '/js/vendor/contact-form-browser.js',
    handler: async (c) => {
      browserJs ??= await readFile(browserHelper, 'utf8');
      return c.body(browserJs, 200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      });
    }
  }
];
