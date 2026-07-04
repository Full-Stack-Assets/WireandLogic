import Link from 'next/link';

/**
 * Prev/next pagination control. `hrefFor` builds the href for a given page
 * number so callers can use either path-based (`/page/2`) or query-string
 * (`?page=2`) pagination schemes.
 */
export function Pagination({
  currentPage,
  totalPages,
  hrefFor,
}: {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-between border-t-2 border-ink pt-6"
    >
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className="font-display font-semibold text-accent hover:underline">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs uppercase tracking-widest text-muted">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} className="font-display font-semibold text-accent hover:underline">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
