import { notFound } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { paginate } from '@/lib/pagination';
import { TAXONOMY_PAGE_SIZE, TaxonomyListing } from '@/components/TaxonomyListing';

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await listPosts();
  const tags = Array.from(new Set(posts.flatMap((post) => post.frontmatter.tags ?? [])));
  return tags.map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const all = (await listPosts()).filter((post) => post.frontmatter.tags?.includes(tag));
  if (all.length === 0) notFound();

  const page = paginate(all, 1, TAXONOMY_PAGE_SIZE);
  return (
    <TaxonomyListing
      kind="tag"
      value={tag}
      posts={page.items}
      totalItems={all.length}
      currentPage={page.currentPage}
      totalPages={page.totalPages}
    />
  );
}
