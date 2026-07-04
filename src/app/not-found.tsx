import Link from 'next/link';
import { listPosts } from '@/lib/posts';
import { siteConfig } from '@/site.config';

export const metadata = { title: 'Page not found' };

/**
 * Custom 404. A default Next.js not-found page is a dead end for broken links,
 * typos, and stale shares/backlinks — pure bounce. Giving the visitor recent
 * posts and category links keeps them on the site instead.
 */
export default async function NotFound() {
  const recent = (await listPosts()).slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <div className="mb-12 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">404</div>
        <h1 className="mt-2 font-display text-5xl font-black leading-none tracking-tight">
          That page doesn&rsquo;t exist.
        </h1>
        <p className="mt-4 max-w-xl text-ink/70">
          The link may be old, mistyped, or the post may have moved. Here&rsquo;s what&rsquo;s current
          on {siteConfig.name}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-block border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-transparent hover:text-accent"
          >
            ← Back to the front page
          </Link>
          {siteConfig.navCategories.map((c) => (
            <Link
              key={c}
              href={`/categories/${c}`}
              className="inline-block border border-ink/30 px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <section>
          <div className="mb-6 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted">
            Recent dispatches
          </div>
          <ul className="divide-y divide-ink/20">
            {recent.map((p) => (
              <li key={p.slug} className="py-5">
                <Link href={`/blog/${p.slug}`} className="group block">
                  <h2 className="font-display text-xl font-semibold leading-tight group-hover:text-accent transition-colors">
                    {p.frontmatter.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink/70 line-clamp-2">{p.frontmatter.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
