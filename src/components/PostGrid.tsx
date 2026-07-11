import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/posts';

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
        <Link href={`/categories/${frontmatter.category}`} className="mb-3 inline-block self-start border border-accent-deep px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep hover:bg-accent-deep hover:text-paper transition-colors">
          {frontmatter.category}
        </Link>
        <Link href={`/blog/${slug}`} className="group">
          <h2 className="font-display text-3xl sm:text-4xl font-black leading-[1.05] tracking-tight group-hover:text-accent-deep transition-colors">
            {frontmatter.title}
          </h2>
        </Link>
        <p className="mt-4 text-lg leading-relaxed text-muted">{frontmatter.description}</p>
        <div className="mt-5 font-mono text-[11px] uppercase tracking-widest text-muted">
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
    <article className="card-glow group flex flex-col overflow-hidden border border-rule bg-white">
      {frontmatter.hero?.url && (
        <Link href={`/blog/${slug}`} className="relative block aspect-[16/10] overflow-hidden border-b border-rule bg-ink/5">
          <Image
            src={frontmatter.hero.url}
            alt={frontmatter.hero.alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
          {frontmatter.category}
        </div>
        <Link href={`/blog/${slug}`}>
          <h3 className="font-display text-xl font-bold leading-tight tracking-tight group-hover:text-accent-deep transition-colors">
            {frontmatter.title}
          </h3>
        </Link>
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">{frontmatter.description}</p>
        <div className="mt-auto pt-4 font-mono text-[10px] uppercase tracking-widest text-muted">
          {new Date(frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' · '} {readingTimeMin} min
        </div>
      </div>
    </article>
  );
}
