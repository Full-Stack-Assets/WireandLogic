'use client';

export function SubscribeForm() {
  const subscribeUrl = process.env.NEXT_PUBLIC_NEWSLETTER_SUBSCRIBE_URL;

  if (!subscribeUrl) {
    return <p className="text-sm text-ink/60">Newsletter signup is being reconfigured.</p>;
  }

  return (
    <a
      href={subscribeUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-event="newsletter_signup"
      data-placement="footer"
      className="inline-flex border border-accent bg-gradient-to-r from-accent-deep via-accent to-lime px-4 py-2 text-sm font-semibold text-paper transition-[opacity,box-shadow] hover:opacity-90 hover:shadow-[0_0_18px_-4px_rgb(var(--c-accent-rgb)/0.6)]"
    >
      Subscribe to the newsletter
    </a>
  );
}
