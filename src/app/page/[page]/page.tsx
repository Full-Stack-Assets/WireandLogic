import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { listPosts } from '@/lib/posts';
import { paginate, POSTS_PER_PAGE } from '@/lib/pagination';
import { PostCard } from '@/components/PostGrid';
import { Pagination } from '@/components/Pagination';
import { Masthead, SectionRule } from '@/components/Masthead';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await listPosts();
  // Page 1's worth of "rest" items is POSTS_PER_PAGE - 1 (the home page also
  // shows a lead story); every page after that is a full POSTS_PER_PAGE.
  const rest = Math.max(0, posts.length - 1);
  const firstPageRest = POSTS_PER_PAGE - 1;
  const remaining = Math.max(0, rest - firstPageRest);
  const extraPages = Math.ceil(remaining / POSTS_PER_PAGE);
  return Array.from({ length: extraPages }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return { title: `Page ${page}`, robots: { index: false, follow: true } };
}

export default async function PagedHomePage({ params }: { params: Promise<{ page: string }> }) {
  const { page: pageParam } = await params;
  const pageNum = Number(pageParam);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const posts = await listPosts();
  const [, ...rest] = posts; // page 1's lead story isn't repeated here

  // This page is addressed relative to the same "rest" list the home page
  // paginates, offset by the lead-story page's smaller first page.
  const firstPageRest = POSTS_PER_PAGE - 1;
  const remaining = rest.slice(firstPageRest);
  const { items, totalPages, currentPage } = paginate(remaining, pageNum - 1, POSTS_PER_PAGE);

  if (pageNum - 1 > totalPages) notFound();
  if (items.length === 0) redirect('/');

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Masthead />
      <SectionRule label="More dispatches" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
      <Pagination
        currentPage={currentPage + 1}
        totalPages={totalPages + 1}
        hrefFor={(p) => (p === 1 ? '/' : `/page/${p}`)}
      />
    </div>
  );
}
