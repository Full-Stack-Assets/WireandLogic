import { SITE_HOST } from '@/lib/structured-data';

/** Where sponsorship enquiries go. Set up this alias on your domain. */
export const sponsorContactEmail = `sponsor@${SITE_HOST}`;

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
  blurb: string;
  features: string[];
}

/** Sponsorship options. Replace `price` with your real rates when ready. */
export const sponsorTiers: SponsorTier[] = [
  {
    name: 'Newsletter primary',
    price: 'Request rates',
    blurb: 'Top slot in the weekly dispatch — the first thing every reader sees.',
    features: [
      'Headline + 2–3 sentences + link',
      'One primary sponsor per issue',
      'Click + performance recap after each send',
    ],
  },
  {
    name: 'Site placement',
    price: 'Request rates',
    blurb: 'A topic-matched “Tools we recommend” slot across high-traffic posts.',
    features: ['Matched to relevant articles', 'Disclosed, rel=sponsored', 'Monthly impression report'],
  },
  {
    name: 'Bundle',
    price: 'Custom',
    blurb: 'Newsletter + site placement + a dedicated sponsored deep-dive.',
    features: ['Multi-issue newsletter run', 'Sitewide placement', 'One sponsored review post'],
  },
];
