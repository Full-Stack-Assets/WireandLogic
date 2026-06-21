// AdSense configuration. The publisher id is a public value (it appears in the
// client-side ad script and the verification meta tag on every page), so it is
// safe to default here; override with NEXT_PUBLIC_ADSENSE_CLIENT if needed.
// Slot ids are account-specific ad units — set them to render the manual
// in-article and footer slots; without them those slots stay empty (Auto Ads
// still works from the loaded script if enabled in the dashboard).
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-4655488107179825';

export const ADSENSE_SLOT_IN_ARTICLE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE;
export const ADSENSE_SLOT_FOOTER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER;
