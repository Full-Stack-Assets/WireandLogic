/**
 * Affiliate / referral programs surfaced in a tasteful "Tools we recommend" box
 * on every post, matched to the post's topic. This box renders on all posts at
 * render time, so individual content files do not need affiliate edits.
 *
 * To go live:
 *   1. Join only the programs you actually want to recommend.
 *   2. Replace each `YOUR_ID` in the `url`s with your real referral/affiliate id.
 *   3. Set NEXT_PUBLIC_AFFILIATES_ENABLED=1 in your deployment environment.
 *
 * Until enabled it renders nothing, so placeholder links never ship to production.
 * The FTC disclosure is rendered automatically. Links use rel="sponsored".
 */
export const AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_AFFILIATES_ENABLED === '1';

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
const DEFAULT_IDS = ['frontendmasters'];

/** Pick up to `limit` programs relevant to a post's category/tags. */
export function affiliatesFor(category: string, tags: string[] = [], limit = 3): AffiliateProgram[] {
  const hay = [category.toLowerCase(), ...tags.map((t) => t.toLowerCase())];
  const matched = AFFILIATE_PROGRAMS.filter((p) => p.match.some((m) => hay.includes(m)));
  const chosen = matched.length ? matched : AFFILIATE_PROGRAMS.filter((p) => DEFAULT_IDS.includes(p.id));
  return chosen.slice(0, limit);
}
