import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { Pagination } from '@/components/Pagination';

export const TAXONOMY_PAGE_SIZE = 40;

export function TaxonomyListing({
  kind,
  value,
  posts,
  totalItems,
  currentPage,
  totalPages,
}: {
  kind: 'category' | 'tag';
  value: string;
  posts: Post[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}) {
  const isTag = kind === 'tag';
  const segment = isTag ? 'tags' : 'categories';
  const encodedValue = encodeURIComponent(value);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">
          {isTag ? 'Tag' : 'Category'}
        </div>
        <h1 className={`mt-2 font-display text-5xl font-black sm:text-6xl ${isTag ? '' : 'capitalize'}`}>
          {isTag && <span className="text-accent">#</span>}
          <span className="text-gradient">{value}</span>
        </h1>
        <p className="mt-2 text-muted">
          {totalItems} {totalItems === 1 ? 'post' : 'posts'}
        </p>
      </div>
      <ul className="divide-y divide-ink/20">
        {posts.map((post) => (
          <li key={post.slug} className="py-6">
            <Link href={`/blog/${post.slug}`} className="group block">
              <h2 className="font-display text-2xl font-semibold transition-colors group-hover:text-accent">
                {post.frontmatter.title}
              </h2>
              <p className="mt-1 text-ink/70">{post.frontmatter.description}</p>
              {!isTag && (
                <div className="mt-2 text-xs uppercase tracking-widest text-muted">
                  {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' · '}
                  {post.readingTimeMin} min
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        hrefFor={(page) =>
          page === 1
            ? `/${segment}/${encodedValue}`
            : `/${segment}/${encodedValue}/page/${page}`
        }
      />
    </div>
  );
}
