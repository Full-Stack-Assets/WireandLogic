/**
 * Shared pagination math for post listings (home, categories, tags). Keeping
 * list pages bounded matters for both Core Web Vitals (a 180+ post page is a
 * huge initial payload) and crawl/index hygiene — unbounded lists are a real
 * bounce-rate and performance cost as the hourly generator keeps adding posts.
 */
/** Posts per listing page (home + paginated pages). Chosen to bound the home
 *  page's initial payload — with 180+ posts and growing hourly, rendering
 *  everything on one page hurts both Core Web Vitals and crawl hygiene. */
export const POSTS_PER_PAGE = 24;

export interface Page<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/** Clamp a possibly-invalid page number (NaN, 0, negative, or out of range) to 1..totalPages. */
export function clampPage(raw: number | undefined, totalPages: number): number {
  if (!raw || !Number.isFinite(raw)) return 1;
  return Math.min(Math.max(1, Math.floor(raw)), Math.max(1, totalPages));
}

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = clampPage(page, totalPages);
  const start = (currentPage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}
