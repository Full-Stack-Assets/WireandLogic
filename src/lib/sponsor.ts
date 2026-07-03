/** Where sponsorship enquiries go. */
export const sponsorContactEmail = 'Nicholas@fullstackassets.com';

/**
 * Media-kit facts. Update the figures as the audience grows. Leave a `value` as
 * null and the page shows "Request current figures" instead of a number — so you
 * never ship a stat you can't back up.
 */
export const sponsorStats: { label: string; value: string | null }[] = [
  { label: 'Audience', value: 'Developers, engineers & builders' },
  { label: 'Topics', value: 'Tech · AI · developer tools · security' },
  { label: 'Cadence', value: 'Hourly site · weekly email digest' },
  { label: 'Newsletter subscribers', value: null }, // TODO: set once you have figures
  { label: 'Monthly readers', value: null }, // TODO: set from your analytics
];

export interface SponsorTier {
  name: string;
  price: string;
  /** Optional context under the price — used for the founding-rate/milestone framing. */
  note?: string;
  blurb: string;
  features: string[];
}

/**
 * Sponsorship options. Priced as founding-sponsor rates for a pre-scale
 * audience (flat fees, not CPM — CPM only makes sense once sponsorStats has
 * real subscriber/traffic numbers to back it). Raise these as the milestones
 * in each `note` are hit, then swap to CPM-based pricing.
 */
export const sponsorTiers: SponsorTier[] = [
  {
    name: 'Newsletter primary',
    price: '$99 / issue',
    note: 'Founding rate — first 5 sponsors. Rising to $199 at 1,000 subscribers, $400+ at 5,000.',
    blurb: 'Top slot in the weekly dispatch — the first thing every reader sees.',
    features: [
      'Headline + 2–3 sentences + link',
      'One primary sponsor per issue',
      'Click + performance recap after each send',
    ],
  },
  {
    name: 'Site placement',
    price: '$149 / month',
    note: 'Founding rate: $99/mo for the first 3 sponsors.',
    blurb: 'A topic-matched “Tools we recommend” slot across high-traffic posts.',
    features: ['Matched to relevant articles', 'Disclosed, rel=sponsored', 'Monthly impression report'],
  },
  {
    name: 'Bundle',
    price: '$299 / month',
    note: 'Newsletter primary + site placement + one sponsored deep-dive — priced below buying separately.',
    blurb: 'Newsletter + site placement + a dedicated sponsored deep-dive.',
    features: ['Multi-issue newsletter run', 'Sitewide placement', 'One sponsored review post'],
  },
];
