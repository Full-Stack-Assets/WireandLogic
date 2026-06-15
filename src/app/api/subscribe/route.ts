import { NextResponse } from 'next/server';
import { subscribeEmail, newsletterConfigured } from '@/lib/newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = '';
  try {
    const data = await req.json();
    email = typeof data?.email === 'string' ? data.email.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!newsletterConfigured()) {
    return NextResponse.json({ error: 'The newsletter is not live yet.' }, { status: 503 });
  }

  const result = await subscribeEmail(email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Subscription failed.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
