import type { Post } from './posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wireandlogic.com';
const SITE_NAME = 'Wire and Logic';

/**
 * JSON-LD for a single post. BlogPosting (an Article subtype) keeps every post
 * — news, engineering, opinion — eligible for article rich results, and gives
 * search/answer engines a clean, machine-readable summary of the page.
 */
export function articleJsonLd(post: Post): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const published = new Date(post.frontmatter.date).toISOString();

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    datePublished: published,
    dateModified: published,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    // The pipeline writes these posts, so the byline is the publication itself.
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };

  if (post.frontmatter.hero?.url) schema.image = [post.frontmatter.hero.url];
  if (post.frontmatter.category) schema.articleSection = post.frontmatter.category;
  if (post.frontmatter.tags?.length) schema.keywords = post.frontmatter.tags.join(', ');

  return schema;
}

/**
 * FAQPage JSON-LD built from the post's `<Question>` blocks. Returns null when a
 * post has no FAQ so we never emit an empty schema.
 */
export function faqJsonLd(post: Post): Record<string, unknown> | null {
  const faqs = extractFaq(post.body);
  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

const QUESTION_RE =
  /<Question\s+[^>]*?q=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/Question>/gi;

/** Pull the `q` + answer text out of each `<Question>` block in the MDX body. */
export function extractFaq(body: string): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];
  for (const m of body.matchAll(QUESTION_RE)) {
    const question = decodeEntities((m[1] ?? m[2] ?? '').trim());
    const answer = toPlainText(m[3] ?? '');
    if (question && answer) out.push({ question, answer });
  }
  return out;
}

/** Reduce MDX/markdown to clean plain text suitable for an Answer field. */
function toPlainText(s: string): string {
  const stripped = s
    .replace(/<[^>]+>/g, ' ') // drop any nested MDX/HTML tags
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // markdown links -> their text
    .replace(/[*_`#>]/g, '') // emphasis / code / heading / quote markers
    .replace(/\s+/g, ' ')
    .trim();
  return decodeEntities(stripped);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
