import { notFound } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { paginate } from '@/lib/pagination';
import { TAXONOMY_PAGE_SIZE, TaxonomyListing } from '@/components/TaxonomyListing';

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await listPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    const category = post.frontmatter.category;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).flatMap(([category, count]) =>
    Array.from(
      { length: Math.max(0, Math.ceil(count / TAXONOMY_PAGE_SIZE) - 1) },
      (_, index) => ({ category, page: String(index + 2) }),
    ),
  );
}

export default async function PagedCategoryPage({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}) {
  const { category, page: pageParam } = await params;
  const pageNumber = Number(pageParam);
  if (!Number.isInteger(pageNumber) || pageNumber < 2) notFound();

  const all = (await listPosts()).filter((post) => post.frontmatter.category === category);
  const page = paginate(all, pageNumber, TAXONOMY_PAGE_SIZE);
  if (all.length === 0 || page.currentPage !== pageNumber || page.items.length === 0) notFound();

  return (
    <TaxonomyListing
      kind="category"
      value={category}
      posts={page.items}
      totalItems={all.length}
      currentPage={page.currentPage}
      totalPages={page.totalPages}
    />
  );
}
