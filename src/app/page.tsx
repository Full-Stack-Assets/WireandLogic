import { listPosts } from '@/lib/posts';
import { paginate, POSTS_PER_PAGE } from '@/lib/pagination';
import { LeadStory, PostCard } from '@/components/PostGrid';
import { Pagination } from '@/components/Pagination';
import { Masthead, SectionRule } from '@/components/Masthead';

export const revalidate = 300; // re-check content every 5 minutes

export default async function HomePage() {
  const posts = await listPosts();

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <Masthead />
        <EmptyState />
      </div>
    );
  }

  // Page 1 gets the lead-story treatment for the newest post; the rest of this
  // page (and every subsequent /page/N) is a plain grid. Bounding this list
  // (rather than rendering all 180+ posts) keeps the initial payload small —
  // this page grows by one post every hour, so an unbounded render is a
  // real and worsening Core Web Vitals / bounce-rate problem.
  const [lead, ...rest] = posts;
  const { items: gridItems, totalPages } = paginate(rest, 1, POSTS_PER_PAGE - 1);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Masthead />

      <LeadStory post={lead} priority />

      {gridItems.length > 0 && (
        <div className="mt-20">
          <SectionRule label="More dispatches" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridItems.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      )}

      <Pagination currentPage={1} totalPages={totalPages} hrefFor={(p) => (p === 1 ? '/' : `/page/${p}`)} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-2 border-dashed border-ink/25 py-24 text-center">
      <div className="font-display text-3xl font-bold">Nothing published yet.</div>
      <p className="mt-3 text-muted">
        Run <code className="rounded bg-ink/10 px-2 py-0.5 text-sm">npm run generate</code> or wait for the next cron tick.
      </p>
    </div>
  );
}
