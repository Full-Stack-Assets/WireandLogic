import { AFFILIATES_ENABLED, AFFILIATE_DISCLOSURE, affiliatesFor } from '@/lib/affiliates';

/**
 * Topic-matched affiliate recommendations, rendered on every post. Renders
 * nothing unless NEXT_PUBLIC_AFFILIATES_ENABLED=1 and at least one program
 * matches — so it's safe to ship before you've configured real links.
 */
export function AffiliateBox({ category, tags }: { category: string; tags?: string[] }) {
  if (!AFFILIATES_ENABLED) return null;
  const items = affiliatesFor(category, tags);
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t-2 border-ink pt-8">
      <div className="mb-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
        Tools we recommend
      </div>
      <ul className="space-y-4">
        {items.map((p) => (
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
      </ul>
      <p className="mt-4 text-xs text-muted">{AFFILIATE_DISCLOSURE}</p>
    </section>
  );
}
