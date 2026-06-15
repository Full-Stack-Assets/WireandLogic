#!/usr/bin/env tsx
/**
 * Weekly newsletter digest — collects posts from the last N days and sends them
 * through the configured provider. Run by .github/workflows/newsletter.yml.
 *
 * Usage: npx tsx scripts/newsletter-digest.ts
 */
import 'dotenv/config';
import { listPosts } from '../src/lib/posts';
import { buildDigest } from '../src/lib/newsletter/digest';
import { sendDigest, newsletterConfigured } from '../src/lib/newsletter';

const WINDOW_DAYS = Number(process.env.NEWSLETTER_WINDOW_DAYS ?? 7);

async function main() {
  if (!newsletterConfigured()) {
    console.log('Newsletter not configured (set NEWSLETTER_PROVIDER + the provider API key) — skipping.');
    return;
  }

  const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
  const posts = (await listPosts()).filter(
    (p) => new Date(p.frontmatter.date).getTime() >= cutoff
  );

  if (posts.length === 0) {
    console.log(`No posts in the last ${WINDOW_DAYS} days — nothing to send.`);
    return;
  }

  const { subject, body } = buildDigest(posts);
  console.log(`→ Sending digest: "${subject}" (${posts.length} posts)`);

  const result = await sendDigest(subject, body);
  if (result.ok) {
    console.log('✓ Digest sent.');
  } else {
    console.error('Digest send failed:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
