import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/posts';
import { AdSlot } from './AdSlot';
import { ADSENSE_CLIENT, ADSENSE_SLOT_LISTING } from '@/lib/ads';

/**
 * Full-width ad row for listing grids (home + /page/N). Renders nothing at all
 * (not even the wrapper, which would leave an empty grid row + gap) unless both
 * the publisher id and the listing slot id are configured.
 */
export function ListingAd() {
  if (!ADSENSE_CLIENT || !ADSENSE_SLOT_LISTING) return null;
  return (
    <div className="col-span-full">
      <AdSlot slot={ADSENSE_SLOT_LISTING} format="auto" className="block" />
    </div>
  );
}

/**
 * Shared post-listing cards for the home page (page 1 and paginated /page/N).
 * Hero images use next/image with `unoptimized` (sources are Pexels/Openverse —
 * the latter arbitrary hosts, so we skip the remote-pattern allowlist) so we
 * still get lazy loading and a sized container, avoiding layout shift as the
 * hourly generator keeps adding image-heavy cards to this page.
 */
export function LeadStory({ post, priority = false }: { post: Post; priority?: boolean }) {
  const { slug, frontmatter, readingTimeMin } = post;
  return (
    <article className="grid gap-8 sm:grid-cols-5">
      {frontmatter.hero?.url && (
        <div className="relative sm:col-span-3 aspect-[4/3] overflow-hidden bg-ink/5">
          <Link href={`/blog/${slug}`}>
            <Image
              src={frontmatter.hero.url}
              alt={frontmatter.hero.alt}
              fill
              priority={priority}
              unoptimized
              sizes="(min-width: 640px) 60vw, 100vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </Link>
        </div>
      )}
      <div className="sm:col-span-2 flex flex-col justify-center">
        <Link href={`/categories/${frontmatter.category}`} className="mb-3 inline-block self-start border border-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-paper transition-colors">
          {frontmatter.category}
        </Link>
        <Link href={`/blog/${slug}`} className="group">
          <h2 className="font-display text-3xl sm:text-4xl font-black leading-[1.05] tracking-tight group-hover:text-accent transition-colors">
            {frontmatter.title}
          </h2>
        </Link>
        <p className="mt-4 text-lg leading-relaxed text-ink/75">{frontmatter.description}</p>
        <div className="mt-5 text-xs uppercase tracking-widest text-muted">
          {new Date(frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' · '} {readingTimeMin} min read
        </div>
      </div>
    </article>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { slug, frontmatter, readingTimeMin } = post;
  return (
    <article className="group flex flex-col">
      {frontmatter.hero?.url && (
        <Link href={`/blog/${slug}`} className="relative mb-4 block aspect-[16/10] overflow-hidden bg-ink/5">
          <Image
            src={frontmatter.hero.url}
            alt={frontmatter.hero.alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
        {frontmatter.category}
      </div>
      <Link href={`/blog/${slug}`}>
        <h3 className="font-display text-xl font-semibold leading-tight group-hover:text-accent transition-colors">
          {frontmatter.title}
        </h3>
      </Link>
      <p className="mt-2 text-sm text-ink/70 line-clamp-2">{frontmatter.description}</p>
      <div className="mt-3 text-[11px] uppercase tracking-widest text-muted">
        {new Date(frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        {' · '} {readingTimeMin} min
      </div>
    </article>
  );
}
