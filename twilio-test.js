/* SMS utility using Twilio REST API (no SDK). ESM, Node 20+ */

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

function normalizeE164(num) {
  if (!num) return null;
  const s = String(num).trim();
  return s.startsWith('+') ? s : `+${s.replace(/[^\d]/g, '')}`;
}

export function getTwilioConfig() {
  // Support both Account SID/Auth Token and API Key (SK...)/Secret
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_SECRET;

  // Optional API Keys (recommended in production)
  // If provided, use API Key SID/Secret for Basic auth BUT keep accountSid for URL path
  const apiKeySid = process.env.TWILIO_API_KEY_SID || process.env.TWILIO_API_KEY;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_API_SECRET;

  const from = process.env.TWILIO_PHONE_NUMBER;
  return { accountSid, authToken, apiKeySid, apiKeySecret, from };
}

export async function sendSMS({ to, body, from } = {}) {
  const { accountSid, authToken, apiKeySid, apiKeySecret, from: envFrom } = getTwilioConfig();

  // Validate account SID for the URL path
  if (!accountSid) {
    throw new Error('Missing TWILIO_ACCOUNT_SID/TWILIO_SID in .env (required for the request URL path).');
  }

  // Determine auth method: API Key if present, else Account SID/Auth Token
  let authUser, authPass, authMethod;
  if (apiKeySid && apiKeySecret) {
    authUser = apiKeySid;    // SK...
    authPass = apiKeySecret; // secret
    authMethod = 'apiKey';
  } else {
    authUser = accountSid;   // AC...
    authPass = authToken;    // auth token
    authMethod = 'account';
  }

  if (!authUser || !authPass) {
    throw new Error('Twilio credentials missing. Provide either (TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN) or (TWILIO_API_KEY_SID & TWILIO_API_KEY_SECRET).');
  }

  const fromNumber = normalizeE164(from || envFrom);
  const toNumber = normalizeE164(to);
  if (!fromNumber) throw new Error('Missing from number. Set TWILIO_PHONE_NUMBER in .env or pass { from }');
  if (!toNumber) throw new Error('Missing to number. Provide { to } as E.164 or digits');
  if (!body?.trim()) throw new Error('Missing SMS body');

  // Use the account SID for the resource path; credentials can be Account or API Key
  const url = `${TWILIO_API_BASE}/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const authHeader = Buffer.from(`${authUser}:${authPass}`).toString('base64');
  const form = new URLSearchParams({ To: toNumber, From: fromNumber, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`
    },
    body: form
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data?.code || res.status;
    const message = data?.message || res.statusText || 'Twilio API error';
    const more = data?.more_info;
    // Provide context to help debug 20003 auth issues
    throw new Error(`Twilio send failed (${code}): ${message}${more ? ` | ${more}` : ''} | auth=${authMethod} | pathAccountSid=${accountSid}`);
  }

  return data;
}

export async function sendOTP({ otp, to, from }) {
  if (!otp) throw new Error('Missing otp');
  return sendSMS({ to, from, body: `Your OTP is: ${otp}` });
}