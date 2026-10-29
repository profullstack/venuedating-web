import { getContact } from '../lib/contact.js';

/**
 * The contact form's API (@profullstack/contact-form, see src/lib/contact.js).
 *
 * GET  /api/contact  a fresh token and the questions (no-store), which the
 *                    static contact view fetches when it opens
 * POST /api/contact  honeypot, token, fill time and rate limit, then
 *                    validation and the email
 */
export const contactRoutes = [
  { method: 'GET', path: '/api/contact', handler: () => getContact().GET() },
  { method: 'POST', path: '/api/contact', handler: (c) => getContact().POST(c.req.raw) }
];
