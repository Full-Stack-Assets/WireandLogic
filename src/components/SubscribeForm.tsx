'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'ok' | 'error';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('ok');
        setMessage('You’re in. Watch your inbox.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data?.error ?? 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'ok') {
    return <p className="text-sm font-medium text-accent">{message}</p>;
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="min-w-0 flex-1 border border-ink/30 bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="border border-accent bg-accent px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-transparent hover:text-accent disabled:opacity-60"
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {status === 'error' && <p className="mt-2 text-xs text-ink/60">{message}</p>}
    </div>
  );
}
