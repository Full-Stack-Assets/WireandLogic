import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';
import { loadPost, listPosts, relatedPosts } from '@/lib/posts';
import { mdxComponents } from '@/components/mdx';
import { articleJsonLd, faqJsonLd, breadcrumbJsonLd, SITE_URL, SITE_NAME } from '@/lib/structured-data';
import { AdSlot } from '@/components/AdSlot';
import { AffiliateBox } from '@/components/AffiliateBox';
import { SubscribeCTA } from '@/components/SubscribeCTA';
import { ADSENSE_SLOT_IN_ARTICLE } from '@/lib/ads';

export const revalidate = 300;

export async function generateStaticParams() {
  // Only pre-render published posts; a future-dated (scheduled) post is rendered
  // on demand once its time has passed.
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: 'Not found' };

  // A future-dated (scheduled) post 404s in the body; keep its metadata out of
  // search indexes too, so the two can't disagree.
  if (new Date(post.frontmatter.date).getTime() > Date.now()) {
    return { title: 'Not found', robots: { index: false, follow: false } };
  }

  const { title, description, hero, date, category, tags } = post.frontmatter;
  const url = `${SITE_URL}/blog/${slug}`;
  const images = hero?.url ? [hero.url] : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      images,
      publishedTime: new Date(date).toISOString(),
      authors: [SITE_NAME],
      section: category,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  // Scheduled posts are not published (even by direct URL) until their date.
  if (new Date(post.frontmatter.date).getTime() > Date.now()) notFound();

  const { frontmatter, body, readingTimeMin } = post;
  const date = new Date(frontmatter.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const article = articleJsonLd(post);
  const faq = faqJsonLd(post);
  const breadcrumb = breadcrumbJsonLd(post);
  const related = relatedPosts(post, await listPosts());

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
      {/* Structured data — escape `<` so post content can't break out of the script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, '\\u003c') }}
      />
      {faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, '\\u003c') }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />

      {/* Article header */}
      <header className="mb-12">
        <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          <Link href={`/categories/${frontmatter.category}`} className="border border-accent-deep px-2 py-0.5 text-accent-deep hover:bg-accent-deep hover:text-paper transition-colors">
            {frontmatter.category}
          </Link>
          <span>{date}</span>
          <span>·</span>
          <span>{readingTimeMin} min read</span>
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight">
          {frontmatter.title}
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-muted sm:text-2xl sm:leading-snug">
          {frontmatter.description}
        </p>
      </header>

      {/* Hero */}
      {frontmatter.hero?.url && (
        <figure className="mb-12 -mx-6 sm:mx-0">
          <div className="relative aspect-video w-full overflow-hidden">
            {/* Hero URLs come from Pexels/Openverse (arbitrary source hosts for the
                latter), so `unoptimized` skips Next's remote-pattern allowlist while
                still giving us lazy-loading + a sized container (no layout shift).
                This is the LCP candidate on this page, so mark it `priority`. */}
            <Image
              src={frontmatter.hero.url}
              alt={frontmatter.hero.alt}
              fill
              priority
              unoptimized
              sizes="(min-width: 640px) 768px, 100vw"
              className="object-cover"
            />
          </div>
          {frontmatter.hero.credit && (
            <figcaption className="mt-2 px-6 sm:px-0 text-xs text-muted">
              Photo:{' '}
              <a href={frontmatter.hero.creditUrl} className="underline hover:text-accent" target="_blank" rel="noopener noreferrer">
                {frontmatter.hero.credit}
              </a>
            </figcaption>
          )}
        </figure>
      )}

      {/* Body */}
      <div className="prose-editorial">
        <MDXRemote source={body} components={mdxComponents} />
      </div>

      {/* In-article ad (renders only when AdSense is configured) */}
      <AdSlot
        slot={ADSENSE_SLOT_IN_ARTICLE}
        format="fluid"
        layout="in-article"
        className="my-12 block text-center"
      />

      {/* Topic-matched affiliate recommendations (renders only when enabled) */}
      <AffiliateBox category={frontmatter.category} tags={frontmatter.tags} />

      {/* Sources */}
      {frontmatter.sources?.length > 0 && (
        <section className="mt-16 border-t-2 border-ink pt-8">
          <div className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Sources
          </div>
          <ol className="space-y-2 text-sm">
            {frontmatter.sources.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-accent-deep">{String(i + 1).padStart(2, '0')}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent break-all">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Tags */}
      {frontmatter.tags?.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {frontmatter.tags.map((t) => (
            <Link key={t} href={`/tags/${t}`} className="border border-ink/30 px-2 py-1 text-[11px] uppercase tracking-widest text-ink/70 hover:border-accent hover:text-accent transition-colors">
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* Keep reading — internal links to related posts */}
      {related.length > 0 && (
        <section className="mt-16 border-t-2 border-ink pt-8">
          <div className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Keep reading
          </div>
          <ul className="space-y-6">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted">
                    <span className="text-accent">{p.frontmatter.category}</span>
                    <span>·</span>
                    <span>{p.readingTimeMin} min read</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-bold leading-snug group-hover:text-accent transition-colors">
                    {p.frontmatter.title}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink/70 line-clamp-2">
                    {p.frontmatter.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Newsletter call-to-action */}
      <SubscribeCTA />

      {/* Back link */}
      <div className="mt-16 border-t border-ink/20 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 font-display font-semibold text-accent hover:gap-3 transition-all">
          ← Back to {SITE_NAME}
        </Link>
      </div>
    </article>
  );
}
