import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/structured-data';
import {
  AFFILIATES_ENABLED,
  AFFILIATE_DISCLOSURE,
  AFFILIATE_PROGRAMS,
  AMAZON_PICKS,
  AMAZON_TAG,
  amazonSearchUrl,
  plainUrl,
} from '@/lib/affiliates';
import { SubscribeCTA } from '@/components/SubscribeCTA';

export const revalidate = 3600;

const description = `The tools, services, books, and hardware ${SITE_NAME} actually uses and recommends.`;

export const metadata: Metadata = {
  title: 'Resources',
  description,
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: { title: `Resources — ${SITE_NAME}`, description, url: `${SITE_URL}/resources` },
};

/**
 * "Tools we use" resources page. Content is driven entirely by
 * src/lib/affiliates.ts. Empty-safe by construction:
 *   - programs link to their affiliate URL only when AFFILIATES_ENABLED,
 *     otherwise to the plain homepage (so `YOUR_ID` placeholders never ship);
 *   - the books & gear section renders only when an Amazon tag is configured;
 *   - the FTC disclosure appears only when at least one link is monetized.
 */
export default function ResourcesPage() {
  const anyAffiliate = AFFILIATES_ENABLED || Boolean(AMAZON_TAG);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Resources</div>
        <h1 className="mt-2 font-display text-5xl font-black">Tools we use</h1>
        <p className="mt-3 max-w-xl text-muted">{description}</p>
      </div>

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
          Services &amp; platforms
        </h2>
        <ul className="mt-6 space-y-6">
          {AFFILIATE_PROGRAMS.map((p) => {
            const href = AFFILIATES_ENABLED ? p.url : plainUrl(p);
            const rel = AFFILIATES_ENABLED ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
            return (
              <li key={p.id}>
                <a href={href} target="_blank" rel={rel} className="group block">
                  <span className="font-display text-xl font-bold group-hover:text-accent transition-colors">
                    {p.name}
                  </span>
                  <span className="block text-sm leading-relaxed text-ink/70">{p.blurb}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      {AMAZON_TAG && (
        <section className="mt-14">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
            Books &amp; gear
          </h2>
          <ul className="mt-6 space-y-6">
            {AMAZON_PICKS.map((p) => {
              const href = amazonSearchUrl(p.query);
              if (!href) return null;
              return (
                <li key={p.id}>
                  <a href={href} target="_blank" rel="sponsored noopener noreferrer" className="group block">
                    <span className="font-display text-xl font-bold group-hover:text-accent transition-colors">
                      {p.name}
                    </span>
                    <span className="block text-sm leading-relaxed text-ink/70">{p.blurb}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {anyAffiliate && <p className="mt-10 text-xs text-muted">{AFFILIATE_DISCLOSURE}</p>}

      <div className="mt-14">
        <SubscribeCTA />
      </div>

      <div className="mt-12 border-t border-ink/20 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 font-display font-semibold text-accent hover:gap-3 transition-all">
          ← Back to {SITE_NAME}
        </Link>
      </div>
    </div>
  );
}
