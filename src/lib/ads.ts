// AdSense configuration. The publisher id (public value) defaults from
// site.config.ts; override per-deploy with NEXT_PUBLIC_ADSENSE_CLIENT. Slot ids
// are account-specific ad units — set them to render the manual slots below;
// without them those slots stay empty (Auto Ads still works from the loaded
// script if enabled in the dashboard).
//
// NOTE: keep the literal `process.env.NEXT_PUBLIC_*` expressions — Next.js
// inlines them textually at build time, so they can't be read dynamically.
import { siteConfig } from '@/site.config';

/** Unset CI secrets arrive as "" — treat blank/whitespace as unset. */
function envValue(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t && t.length > 0 ? t : undefined;
}

export const ADSENSE_CLIENT =
  envValue(process.env.NEXT_PUBLIC_ADSENSE_CLIENT) || siteConfig.adsenseClient;

/** In-article unit rendered right after the takeaway callout (top of body). */
export const ADSENSE_SLOT_ARTICLE_TOP = envValue(process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP);
/** In-article unit rendered mid-article, just before the FAQ section. */
export const ADSENSE_SLOT_ARTICLE_MID = envValue(process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MID);
/** In-article unit rendered after the body (below the FAQ). */
export const ADSENSE_SLOT_IN_ARTICLE = envValue(process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE);
/** Display unit rendered inside listing grids (home + paginated pages). */
export const ADSENSE_SLOT_LISTING = envValue(process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING);
/** Display unit rendered site-wide in the footer. */
export const ADSENSE_SLOT_FOOTER = envValue(process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER);
