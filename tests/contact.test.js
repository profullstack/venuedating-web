import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { createSiteContact } from '../src/lib/contact.js';
import { contactRoutes } from '../src/routes/contact.js';

const SECRET = 'test-secret-that-is-long-enough-0123456789';
process.env.FORM_GUARD_SECRET = SECRET;
process.env.TO_EMAIL = 'owner@example.test';
process.env.FROM_EMAIL = 'hello@example.test';

function setup() {
  const sent = [];
  const contact = createSiteContact({
    guard: { secret: SECRET, minAgeMs: 0 },
    send: async (mail) => {
      sent.push(mail);
      return { sent: true, id: 'msg_1' };
    }
  });
  return { contact, sent };
}

const post = (body) =>
  new Request('https://barcrush.app/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
    body: JSON.stringify(body)
  });

const filled = {
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  subject: 'Group booking',
  message: 'Can two people share one venue pass?'
};

test('GET /api/contact hands out a token and the honeypot field, never cached', async () => {
  const app = new Hono();
  for (const r of contactRoutes) app[r.method.toLowerCase()](r.path, r.handler);
  const res = await app.request('/api/contact');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const props = await res.json();
  assert.equal(props.tokenField, 'fg_token');
  assert.ok(props.token);
  assert.equal(props.honeypotField, 'website');
});

test('POST /api/contact without a token is answered like a success and not delivered', async () => {
  const app = new Hono();
  for (const r of contactRoutes) app[r.method.toLowerCase()](r.path, r.handler);
  const res = await app.request(post(filled));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
});

test('a tokenless post delivers nothing', async () => {
  const { contact, sent } = setup();
  const res = await contact.POST(post(filled));
  assert.deepEqual(await res.json(), { success: true });
  assert.equal(sent.length, 0);
});

test('a post with the token is delivered', async () => {
  const { contact, sent } = setup();
  const { token } = await contact.props();
  const res = await contact.POST(post({ ...filled, fg_token: token }));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'owner@example.test');
  assert.equal(sent[0].replyTo, 'ada@example.test');
  assert.match(sent[0].subject, /^BarCrush contact: Group booking \(from Ada Lovelace\)/);
  assert.ok(sent[0].text.includes('two people'));
});

test('a missing subject is refused', async () => {
  const { contact, sent } = setup();
  const { token } = await contact.props();
  const res = await contact.POST(post({ ...filled, subject: '', fg_token: token }));
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0);
});

test('the browser helper the contact view imports is served', async () => {
  const app = new Hono();
  for (const r of contactRoutes) app[r.method.toLowerCase()](r.path, r.handler);
  const res = await app.request('/js/vendor/contact-form-browser.js');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  assert.match(await res.text(), /export async function mountGuard/);
});
