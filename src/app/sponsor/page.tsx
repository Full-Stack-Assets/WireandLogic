import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/site.config';
import { sponsorContactEmail, sponsorStats, sponsorTiers } from '@/lib/sponsor';

export const metadata: Metadata = {
  title: 'Sponsor',
  description: `Put your product in front of ${siteConfig.audience} on ${siteConfig.name}. Newsletter and on-site sponsorship.`,
};

export default function SponsorPage() {
  const mailto = `mailto:${sponsorContactEmail}?subject=${encodeURIComponent(`Sponsoring ${siteConfig.name}`)}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
      {/* Hero */}
      <header className="max-w-2xl">
        <div className="mb-4 text-xs uppercase tracking-[0.3em] text-muted">Sponsor</div>
        <h1 className="font-display text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight">
          Reach {siteConfig.audience}.
        </h1>
        <p className="mt-6 font-display text-xl sm:text-2xl font-normal leading-snug text-ink/70">
          {siteConfig.name} puts your product in front of an engaged technical audience —
          in the weekly email and across the site. This page is the media kit.
        </p>
        <div className="mt-8">
          <a
            href={mailto}
            className="inline-block border border-accent bg-accent px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-transparent hover:text-accent"
          >
            Book a slot →
          </a>
        </div>
      </header>

      {/* Media kit — at a glance */}
      <section className="mt-20 border-t-2 border-ink pt-8">
        <div className="mb-6 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
          At a glance
        </div>
        <dl className="grid grid-cols-1 gap-px overflow-hidden border border-ink/15 bg-ink/15 sm:grid-cols-2">
          {sponsorStats.map((s) => (
            <div key={s.label} className="bg-paper p-5">
              <dt className="text-xs uppercase tracking-[0.2em] text-muted">{s.label}</dt>
              <dd className="mt-1 font-display text-lg font-bold text-ink">
                {s.value ?? <span className="text-ink/50">Request current figures</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Why this audience */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-black tracking-tight">Why this audience</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
          Readers are builders — developers, engineers, and technical founders who evaluate
          and adopt tools for a living. They&rsquo;re a high-intent, hard-to-reach demographic, and
          they trust a focused publication more than a banner ad. Every sponsored placement is
          clearly disclosed and uses <code className="text-accent">rel=&quot;sponsored&quot;</code> — good for
          your brand and ours.
        </p>
      </section>

      {/* Options */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-black tracking-tight">Sponsorship options</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {sponsorTiers.map((t) => (
            <div key={t.name} className="flex flex-col border border-ink/20 p-6">
              <div className="font-display text-lg font-bold">{t.name}</div>
              <div className="mt-1 text-sm font-semibold text-accent">{t.price}</div>
              {t.note && <p className="mt-1 text-xs text-muted">{t.note}</p>}
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{t.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink/80">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 border-t-2 border-ink pt-10">
        <h2 className="font-display text-3xl font-black tracking-tight">Let&rsquo;s talk</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/80">
          Email for the current media kit, live figures, and available dates. Founding-sponsor
          rates are available while we ramp.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href={mailto}
            className="inline-block border border-accent bg-accent px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-transparent hover:text-accent"
          >
            {sponsorContactEmail}
          </a>
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            See the latest posts →
          </Link>
        </div>
      </section>
    </div>
  );
}
