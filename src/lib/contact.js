import { createContactForm, withQuestions } from '@profullstack/contact-form';

/**
 * The BarCrush contact form (public/views/contact.html), on
 * @profullstack/contact-form.
 *
 * The page is a static view the SPA router loads, so it cannot carry a
 * server-minted token in its markup: it fetches one from GET /api/contact
 * when it opens and sends it back with POST /api/contact. Both use this one
 * instance, so the token is the one the handler checks.
 *
 * The questions are the ones the page asks: the defaults plus a subject,
 * all required, labelled as the page labels them.
 */
export const QUESTIONS = withQuestions({
  add: [{ name: 'subject', label: 'Subject', required: true, maxLength: 200 }],
  override: {
    name: { label: 'Name' },
    message: { label: 'Message', rows: 5 }
  }
});

export function createSiteContact(overrides = {}) {
  const { env } = process;
  return createContactForm({
    site: 'barcrush',
    brandTerms: ['barcrush', 'bar crush', 'venuedating'],
    // TO_EMAIL / FROM_EMAIL are the names .env.example already uses; the
    // fallback is the address the page lists.
    to: env.TO_EMAIL || 'support@barcrush.app',
    from: env.FROM_EMAIL || 'BarCrush <support@barcrush.app>',
    subject: (s) => `BarCrush contact: ${s.fields.subject} (from ${s.name})`,
    questions: QUESTIONS,
    action: '/api/contact',
    // Without JavaScript the form is a plain post; it comes back here.
    redirect: '/contact',
    ...overrides
  });
}

let instance;
/** Built on first use, so a missing env var never stops the server from starting. */
export const getContact = () => (instance ??= createSiteContact());
