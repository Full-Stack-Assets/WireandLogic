/**
 * Affiliate / referral programs surfaced in a tasteful "Tools we recommend" box
 * on every post, matched to the post's topic. This box renders on ALL posts
 * (existing and future) at render time — no need to edit individual posts.
 *
 * To go live:
 *   1. Join the programs you actually want (only keep those below).
 *   2. Replace each `YOUR_ID` in the `url`s with your real referral/affiliate id.
 *   3. Set NEXT_PUBLIC_AFFILIATES_ENABLED=1 (Vercel env var) to turn the box on.
 *
 * Until enabled it renders nothing, so placeholder links never ship to prod.
 * The FTC disclosure is rendered automatically with the box — it's legally
 * required and keeps you on the right side of ad/content policies. Links use
 * rel="sponsored" per Google's guidance for paid/affiliate links.
 */
export const AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_AFFILIATES_ENABLED === '1';

/**
 * Amazon Associates tracking tag (e.g. `yoursite-20`). Empty-safe: unset (or
 * the ""-valued secret CI passes through) disables every Amazon surface. Never
 * ship a made-up tag — Amazon requires the one issued to your account.
 */
export const AMAZON_TAG = (process.env.NEXT_PUBLIC_AMAZON_TAG ?? '').trim();

/** Tagged Amazon search link for a pick; null when no tag is configured. */
export function amazonSearchUrl(query: string): string | null {
  if (!AMAZON_TAG) return null;
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(AMAZON_TAG)}`;
}

export const AFFILIATE_DISCLOSURE =
  'Some links above are affiliate links — if you sign up or buy through them we may earn a commission, at no extra cost to you.';

export interface AffiliateProgram {
  id: string;
  name: string;
  blurb: string;
  /** Replace YOUR_ID with your real referral/affiliate id once you've joined. */
  url: string;
  /** Show on posts whose category or any tag matches one of these (lowercase). */
  match: string[];
}

// Example developer-audience programs. Replace ids, prune to what you've joined.
export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    blurb: 'Ship frontends and serverless functions with a generous free tier.',
    url: 'https://vercel.com/?utm_source=YOUR_ID',
    match: ['engineering', 'tools', 'news', 'ai'],
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    blurb: 'Simple cloud servers — new accounts get free credit to start.',
    url: 'https://www.digitalocean.com/?refcode=YOUR_ID',
    match: ['engineering', 'tools', 'devops', 'security'],
  },
  {
    id: 'frontendmasters',
    name: 'Frontend Masters',
    blurb: 'In-depth engineering courses taught by working practitioners.',
    url: 'https://frontendmasters.com/?ref=YOUR_ID',
    match: ['engineering', 'tools', 'ai', 'career'],
  },
  {
    id: '1password',
    name: '1Password',
    blurb: 'Password and secrets management for individuals and teams.',
    url: 'https://1password.com/?ref=YOUR_ID',
    match: ['security', 'tools'],
  },
  {
    id: 'kagi',
    name: 'Kagi',
    blurb: 'Ad-free premium search built for power users.',
    url: 'https://kagi.com/?ref=YOUR_ID',
    match: ['ai', 'tools', 'news'],
  },
];

/** Programs shown when a post matches none by topic. */
const DEFAULT_IDS = ['vercel', 'frontendmasters'];

/** Pick up to `limit` programs relevant to a post's category/tags. */
export function affiliatesFor(category: string, tags: string[] = [], limit = 3): AffiliateProgram[] {
  const hay = [category.toLowerCase(), ...tags.map((t) => t.toLowerCase())];
  const matched = AFFILIATE_PROGRAMS.filter((p) => p.match.some((m) => hay.includes(m)));
  const chosen = matched.length ? matched : AFFILIATE_PROGRAMS.filter((p) => DEFAULT_IDS.includes(p.id));
  return chosen.slice(0, limit);
}

/**
 * The plain (untagged) homepage of a program — used on /resources when
 * affiliates aren't enabled yet, so placeholder `YOUR_ID` links never render.
 */
export function plainUrl(p: AffiliateProgram): string {
  try {
    const u = new URL(p.url);
    return `${u.origin}${u.pathname === '/' ? '' : u.pathname}` || p.url;
  } catch {
    return p.url;
  }
}

/**
 * Amazon Associates picks — dev books & hardware rendered as tagged Amazon
 * search links (search links can't go stale like ASINs and still carry the
 * tag). Shown only when AMAZON_TAG is set. Prune/re-niche this list per site.
 */
export interface AmazonPick {
  id: string;
  name: string;
  blurb: string;
  /** Amazon search query the link resolves to. */
  query: string;
  /** Show on posts whose category or any tag matches one of these (lowercase). */
  match: string[];
}

export const AMAZON_PICKS: AmazonPick[] = [
  {
    id: 'designing-data-intensive',
    name: 'Designing Data-Intensive Applications',
    blurb: 'The systems-design book most engineers end up recommending.',
    query: 'Designing Data-Intensive Applications Kleppmann',
    match: ['engineering', 'ai', 'tools', 'news'],
  },
  {
    id: 'pragmatic-programmer',
    name: 'The Pragmatic Programmer (20th Anniversary)',
    blurb: 'Timeless craft advice, still the best general-purpose dev book.',
    query: 'Pragmatic Programmer 20th anniversary',
    match: ['engineering', 'opinion', 'tools'],
  },
  {
    id: 'mechanical-keyboard',
    name: 'A proper mechanical keyboard',
    blurb: 'The cheapest upgrade to every hour you spend typing.',
    query: 'hot swappable mechanical keyboard',
    match: ['tools', 'engineering', 'news'],
  },
  {
    id: 'raspberry-pi-5',
    name: 'Raspberry Pi 5 kit',
    blurb: 'A tinker box for self-hosting, homelab, and hardware projects.',
    query: 'Raspberry Pi 5 starter kit',
    match: ['tools', 'engineering', 'security'],
  },
  {
    id: 'security-engineering',
    name: 'Security Engineering (Anderson)',
    blurb: 'The reference text on building systems that survive adversaries.',
    query: 'Security Engineering Ross Anderson third edition',
    match: ['security', 'engineering'],
  },
];

/** Pick up to `limit` Amazon picks for a post; empty when no tag is set. */
export function amazonPicksFor(category: string, tags: string[] = [], limit = 2): AmazonPick[] {
  if (!AMAZON_TAG) return [];
  const hay = [category.toLowerCase(), ...tags.map((t) => t.toLowerCase())];
  return AMAZON_PICKS.filter((p) => p.match.some((m) => hay.includes(m))).slice(0, limit);
}
