import type { NewsletterResult } from './index';
import { fetchWithTimeout } from '../fetch-timeout';

const API = 'https://api.buttondown.email/v1';

function headers() {
  return {
    'content-type': 'application/json',
    Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
  };
}

/** Add a subscriber. Treats an already-subscribed address as success (idempotent). */
export async function subscribeButtondown(email: string): Promise<NewsletterResult> {
  const res = await fetchWithTimeout(`${API}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email_address: email }),
  });
  if (res.ok) return { ok: true };

  // A duplicate subscriber is a success, not an error. Buttondown returns 400 or
  // 409 for this, with varying copy — treat both as already-subscribed.
  const text = await res.text();
  if ((res.status === 400 || res.status === 409) && /already|exists|subscrib/i.test(text)) {
    return { ok: true };
  }
  return { ok: false, error: `buttondown ${res.status}: ${text.slice(0, 200)}` };
}

/** Create and send an email to all subscribers. */
export async function sendEmailButtondown(subject: string, body: string): Promise<NewsletterResult> {
  const res = await fetchWithTimeout(`${API}/emails`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject, body, status: 'about_to_send' }),
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: `buttondown ${res.status}: ${(await res.text()).slice(0, 200)}` };
}
