import { subscribeButtondown, sendEmailButtondown } from './buttondown';

export interface NewsletterResult {
  ok: boolean;
  /** True when no provider is configured — caller can treat as a soft no-op. */
  skipped?: boolean;
  error?: string;
}

function provider(): string {
  // Unset GitHub Actions secrets arrive as "" (not undefined), which `??` would
  // let through — blanking the provider and silently disabling the newsletter.
  const p = process.env.NEWSLETTER_PROVIDER?.trim();
  return (p && p.length > 0 ? p : 'buttondown').toLowerCase();
}

/** Whether a provider is configured with the credentials it needs. */
export function newsletterConfigured(): boolean {
  switch (provider()) {
    case 'buttondown':
      return !!process.env.BUTTONDOWN_API_KEY;
    default:
      return false;
  }
}

export async function subscribeEmail(email: string): Promise<NewsletterResult> {
  if (!newsletterConfigured()) return { ok: false, skipped: true, error: 'newsletter not configured' };
  switch (provider()) {
    case 'buttondown':
      return subscribeButtondown(email);
    default:
      return { ok: false, error: `unknown newsletter provider: ${provider()}` };
  }
}

export async function sendDigest(subject: string, body: string): Promise<NewsletterResult> {
  if (!newsletterConfigured()) return { ok: false, skipped: true, error: 'newsletter not configured' };
  switch (provider()) {
    case 'buttondown':
      return sendEmailButtondown(subject, body);
    default:
      return { ok: false, error: `unknown newsletter provider: ${provider()}` };
  }
}
