import { notFound } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { paginate } from '@/lib/pagination';
import { TAXONOMY_PAGE_SIZE, TaxonomyListing } from '@/components/TaxonomyListing';

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await listPosts();
  const categories = Array.from(new Set(posts.map((post) => post.frontmatter.category)));
  return categories.map((category) => ({ category }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const all = (await listPosts()).filter((post) => post.frontmatter.category === category);
  if (all.length === 0) notFound();

  const page = paginate(all, 1, TAXONOMY_PAGE_SIZE);
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
