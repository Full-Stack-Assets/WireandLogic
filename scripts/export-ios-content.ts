#!/usr/bin/env tsx
/**
 * Export content/posts/*.mdx into a single JSON file the iOS app bundles.
 *
 * This mirrors src/lib/posts.ts: same frontmatter model, same date sort, same
 * reading-time calculation. The only extra work is flattening the MDX body
 * (custom <Callout>, <Pros>, <FAQ>, … components) into plain Markdown so the
 * lightweight SwiftUI renderer can display it without a full MDX runtime.
 *
 * Usage: npx tsx scripts/export-ios-content.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const OUT_FILE = path.join(process.cwd(), 'ios', 'Dispatch', 'Resources', 'posts.json');

const CALLOUT_LABELS: Record<string, string> = {
  takeaway: 'Takeaway',
  warning: 'Watch out',
  note: 'Note',
};

/**
 * Flatten the MDX body to Markdown the Swift renderer understands.
 * Custom components become blockquotes / bold headings; their inner text is
 * always preserved.
 */
function mdxToMarkdown(body: string): string {
  let md = body;

  // <Callout type="takeaway">…</Callout> → blockquote with a bold label
  md = md.replace(
    /<Callout\b[^>]*?type=["'](\w+)["'][^>]*>([\s\S]*?)<\/Callout>/g,
    (_m, type: string, inner: string) => {
      const label = CALLOUT_LABELS[type] ?? 'Note';
      const text = inner.trim().replace(/\s*\n\s*/g, ' ');
      return `\n> **${label}:** ${text}\n`;
    }
  );
  // <Callout>…</Callout> with no type
  md = md.replace(
    /<Callout\b[^>]*>([\s\S]*?)<\/Callout>/g,
    (_m, inner: string) => `\n> **Note:** ${inner.trim().replace(/\s*\n\s*/g, ' ')}\n`
  );

  // <Question q="…">answer</Question> → bold question then the answer
  md = md.replace(
    /<Question\b[^>]*?q=["']([^"']*)["'][^>]*>([\s\S]*?)<\/Question>/g,
    (_m, q: string, inner: string) => `\n**${q.trim()}**\n\n${inner.trim()}\n`
  );

  // Pros / Cons headers, then drop the wrapping tags
  md = md.replace(/<Pros>/g, '\n**Pros**\n').replace(/<Cons>/g, '\n**Cons**\n');

  // Strip any remaining capitalized JSX component tags, keep inner text
  md = md.replace(/<\/?[A-Z][A-Za-z0-9]*\b[^>]*>/g, '');

  // Collapse 3+ newlines to a clean paragraph break
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

async function main() {
  let files: string[] = [];
  try {
    files = await fs.readdir(POSTS_DIR);
  } catch {
    console.error(`No posts directory at ${POSTS_DIR}`);
    process.exit(1);
  }

  const posts = [];
  for (const file of files.filter((f) => f.endsWith('.mdx'))) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const rt = readingTime(content);
    posts.push({
      slug,
      title: data.title ?? slug,
      description: data.description ?? '',
      date: data.date ?? '',
      category: data.category ?? 'dispatch',
      tags: data.tags ?? [],
      hero: data.hero ?? null,
      sources: data.sources ?? [],
      body: mdxToMarkdown(content),
      readingTimeMin: Math.max(1, Math.round(rt.minutes)),
    });
  }

  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(posts, null, 2) + '\n', 'utf8');
  console.log(`✓ Wrote ${posts.length} posts → ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
