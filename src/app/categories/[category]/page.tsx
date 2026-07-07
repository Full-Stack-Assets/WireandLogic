import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listPosts } from '@/lib/posts';
import { paginate } from '@/lib/pagination';
import { Pagination } from '@/components/Pagination';
import { SITE_NAME, SITE_URL } from '@/lib/structured-data';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = category[0].toUpperCase() + category.slice(1);
  const description = `The latest ${category} coverage from ${SITE_NAME}.`;
  const url = `${SITE_URL}/categories/${category}`;
  return {
    title: label,
    description,
    // Paginated views (?page=N) canonicalize to the base listing.
    alternates: { canonical: url },
    openGraph: { title: `${label} — ${SITE_NAME}`, description, url },
  };
}

/** Posts per page for this listing. No hero images here, so a larger page size
 *  than the home page is fine while still bounding an ever-growing category
 *  (e.g. "engineering" already has 50+ posts and grows hourly). */
const PAGE_SIZE = 40;

export async function generateStaticParams() {
  const posts = await listPosts();
  const cats = Array.from(new Set(posts.map((p) => p.frontmatter.category)));
  return cats.map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category } = await params;
  const { page } = await searchParams;
  const all = (await listPosts()).filter((p) => p.frontmatter.category === category);
  if (all.length === 0) notFound();

  const { items: posts, currentPage, totalPages } = paginate(all, Number(page), PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Category</div>
        <h1 className="mt-2 font-display text-5xl font-black capitalize">{category}</h1>
        <p className="mt-2 text-muted">{all.length} {all.length === 1 ? 'post' : 'posts'}</p>
      </div>
      <ul className="divide-y divide-ink/20">
        {posts.map((p) => (
          <li key={p.slug} className="py-6">
            <Link href={`/blog/${p.slug}`} className="group block">
              <h2 className="font-display text-2xl font-semibold group-hover:text-accent transition-colors">
                {p.frontmatter.title}
              </h2>
              <p className="mt-1 text-ink/70">{p.frontmatter.description}</p>
              <div className="mt-2 text-xs uppercase tracking-widest text-muted">
                {new Date(p.frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{p.readingTimeMin} min
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        hrefFor={(p) => (p === 1 ? `/categories/${category}` : `/categories/${category}?page=${p}`)}
      />
    </div>
  );
}
