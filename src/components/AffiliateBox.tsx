import Link from 'next/link';
import {
  AFFILIATES_ENABLED,
  AFFILIATE_DISCLOSURE,
  affiliatesFor,
  amazonPicksFor,
  amazonSearchUrl,
} from '@/lib/affiliates';

/**
 * Topic-matched affiliate recommendations, rendered on every post. Two
 * independent, config-gated surfaces:
 *   - referral programs (NEXT_PUBLIC_AFFILIATES_ENABLED=1)
 *   - Amazon Associates picks (NEXT_PUBLIC_AMAZON_TAG set)
 * Renders nothing when neither is configured, so it's safe to ship before
 * you've joined any program. The FTC disclosure renders with any live link.
 */
export function AffiliateBox({ category, tags }: { category: string; tags?: string[] }) {
  const programs = AFFILIATES_ENABLED ? affiliatesFor(category, tags) : [];
  const picks = amazonPicksFor(category, tags); // empty unless AMAZON_TAG is set
  if (programs.length === 0 && picks.length === 0) return null;

  return (
    <section className="mt-16 border-t-2 border-ink pt-8">
      <div className="mb-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
        Tools we recommend
      </div>
      <ul className="space-y-4">
        {programs.map((p) => (
          <li key={p.id}>
            <a
              href={p.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="group block"
            >
              <span className="font-display text-lg font-bold group-hover:text-accent transition-colors">
                {p.name}
              </span>
              <span className="block text-sm leading-relaxed text-ink/70">{p.blurb}</span>
            </a>
          </li>
        ))}
        {picks.map((p) => {
          const href = amazonSearchUrl(p.query);
          if (!href) return null;
          return (
            <li key={p.id}>
              <a href={href} target="_blank" rel="sponsored noopener noreferrer" className="group block">
                <span className="font-display text-lg font-bold group-hover:text-accent transition-colors">
                  {p.name}
                </span>
                <span className="block text-sm leading-relaxed text-ink/70">{p.blurb}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">
        {AFFILIATE_DISCLOSURE}{' '}
        <Link href="/resources" className="underline hover:text-accent">
          See everything we use →
        </Link>
      </p>
    </section>
  );
}
