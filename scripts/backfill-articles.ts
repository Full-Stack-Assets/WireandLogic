#!/usr/bin/env tsx
/**
 * One-time backfill: 18 long-form (roughly double-length) evergreen articles,
 * each dated to a specific historical day that had zero or only one post —
 * smoothing out the lopsided early publishing history. Computed from
 * content/posts/*.mdx frontmatter on 2026-07-04: of the 79 days between the
 * first post (2026-04-17) and the point where the hourly pipeline started
 * producing multiple posts a day (mid-June), 59 had 0 or 1 posts. The four
 * genuine zero-post days (2026-04-18, 2026-04-24, 2026-04-26, 2026-05-17) are
 * included, plus 14 more single-post days spread evenly across April–June so
 * the back catalog reads as a steady cadence instead of a thin trickle.
 *
 * Each entry uses the same generateForTopic() path as scripts/seed.ts (real
 * Brave-search research + a real LLM author), just with `targetWords` /
 * `minBodyChars` set so the body comes out roughly double the site's usual
 * ~4,970-char / ~690-word median instead of the standard length. Topics are
 * evergreen developer/tech-news pieces matching this site's actual niche
 * (`siteConfig.audience`), distinct from anything already in the topic log.
 *
 * NEVER commits via Octokit: posts are written to content/posts/ and the local
 * content/.topic-log.json is updated, exactly like seed.ts. The companion
 * workflow (.github/workflows/backfill-articles.yml) commits the result.
 * Idempotent — an item whose signature is already in the log is skipped, so a
 * partial/interrupted run can simply be re-dispatched.
 *
 * Requires the writer LLM key (`llm.apiKeyEnv` in site.config.ts) and
 * BRAVE_API_KEY (these topics have no source URL, so research relies on web
 * search). PEXELS_API_KEY is optional (hero images).
 *
 * Usage:
 *   npx tsx scripts/backfill-articles.ts         # run the whole batch
 *   npx tsx scripts/backfill-articles.ts --dry   # research+write the first item, write nothing
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateForTopic } from '../src/lib/orchestrator/pipeline';
import { signature } from '../src/lib/orchestrator/score';
import type { TopicLog } from '../src/lib/orchestrator/types';
import { siteConfig } from '../src/site.config';

const LOG_PATH = path.join(process.cwd(), 'content', '.topic-log.json');
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

// Long-form target: the site's body currently runs ~4,970 chars / ~690 words
// at the median. Aim the prompt at roughly double that, and enforce a floor
// well above standard (but below the exact target, since LLM word counts
// vary) so a short response is rejected and retried rather than shipped.
const TARGET_WORDS = 1400;
const MIN_BODY_CHARS = 7500;

const DELAY_MS = 2000;

interface BackfillItem {
  topic: string;
  date: string; // ISO
}

// Chronological. Each date is a day that had 0 or 1 posts in the published
// history (computed from content/posts/*.mdx frontmatter on 2026-07-04); the
// four 04-18/04-24/04-26/05-17 entries are the real zero-post days.
const BACKFILL_ITEMS: BackfillItem[] = [
  { topic: 'What REST APIs are and how to design one well', date: '2026-04-18T12:00:00.000Z' },
  { topic: 'Git branching strategies: trunk-based development versus GitFlow', date: '2026-04-20T12:00:00.000Z' },
  { topic: 'What CI/CD pipelines are and why they matter for shipping software', date: '2026-04-22T12:00:00.000Z' },
  { topic: 'Understanding databases: SQL versus NoSQL trade-offs', date: '2026-04-24T12:00:00.000Z' },
  { topic: 'What containers are and how Docker changed software deployment', date: '2026-04-26T12:00:00.000Z' },
  { topic: 'How Kubernetes orchestrates containerized applications', date: '2026-04-29T12:00:00.000Z' },
  { topic: 'What TypeScript adds over JavaScript and when to reach for it', date: '2026-05-02T12:00:00.000Z' },
  { topic: 'What technical debt is and how teams actually manage it', date: '2026-05-06T12:00:00.000Z' },
  { topic: 'What causes a memory leak and how to track one down', date: '2026-05-09T12:00:00.000Z' },
  { topic: 'What Big-O notation means and why algorithmic complexity matters', date: '2026-05-13T12:00:00.000Z' },
  { topic: 'What makes code review useful instead of a rubber stamp', date: '2026-05-17T12:00:00.000Z' },
  { topic: 'What caching is and why it makes applications feel faster', date: '2026-05-19T12:00:00.000Z' },
  { topic: 'What OAuth is and how modern authentication actually works', date: '2026-05-23T12:00:00.000Z' },
  { topic: 'What a CDN is and how it speeds up the web', date: '2026-05-27T12:00:00.000Z' },
  { topic: 'Monorepos versus polyrepos: trade-offs for growing codebases', date: '2026-05-30T12:00:00.000Z' },
  { topic: 'What observability means and how logs, metrics, and traces differ', date: '2026-06-02T12:00:00.000Z' },
  { topic: 'What machine learning is and how models actually learn from data', date: '2026-06-09T12:00:00.000Z' },
  { topic: 'What open source licensing means and how to pick a license', date: '2026-06-25T12:00:00.000Z' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadLocalLog(): Promise<TopicLog> {
  try {
    return JSON.parse(await fs.readFile(LOG_PATH, 'utf8')) as TopicLog;
  } catch {
    return { topics: [] };
  }
}

async function saveLocalLog(log: TopicLog): Promise<void> {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry');

  const llmKeyEnv = siteConfig.llm.apiKeyEnv;
  if (!process.env[llmKeyEnv]?.trim()) {
    console.error(`✗ ${llmKeyEnv} is not set — it's required to write posts. See .env.example.`);
    process.exit(1);
  }
  if (!process.env.BRAVE_API_KEY?.trim()) {
    console.error(
      '✗ BRAVE_API_KEY is not set. These topics have no source URL of their own, ' +
        'so without web search there is nothing to research — every item would be skipped.'
    );
    process.exit(1);
  }

  let log = await loadLocalLog();
  const covered = new Set(log.topics.map((t) => t.signature));
  const queue = BACKFILL_ITEMS.filter((item) => !covered.has(signature(item.topic)));

  console.log(
    `→ ${BACKFILL_ITEMS.length} items in batch, ${queue.length} not yet covered.\n` +
      `→ Long-form target: ~${TARGET_WORDS} words, ${MIN_BODY_CHARS}+ body chars.\n` +
      `→ ${dryRun ? 'DRY RUN (1 item, nothing written)' : `generating ${queue.length}`}…\n`
  );

  if (dryRun) {
    const item = queue[0] ?? BACKFILL_ITEMS[0];
    console.log(`Topic: ${item.topic}\nDate: ${item.date}\n`);
    const res = await generateForTopic(item.topic, {
      dryRun: true,
      date: new Date(item.date),
      targetWords: TARGET_WORDS,
      minBodyChars: MIN_BODY_CHARS,
    });
    console.log(JSON.stringify({ ...res, mdx: res.mdx ? `[${res.mdx.length} bytes]` : undefined }, null, 2));
    if (res.mdx) {
      console.log('\n─── MDX preview (first 2000 chars) ───');
      console.log(res.mdx.slice(0, 2000));
    }
    return;
  }

  await fs.mkdir(POSTS_DIR, { recursive: true });
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    process.stdout.write(`[${i + 1}/${queue.length}] ${item.date.slice(0, 10)} — ${item.topic} … `);

    const res = await generateForTopic(item.topic, {
      dryRun: true,
      date: new Date(item.date),
      targetWords: TARGET_WORDS,
      minBodyChars: MIN_BODY_CHARS,
    });

    if (!res.ok || !res.slug || !res.mdx) {
      console.log(`skip (${res.skipped ?? res.error ?? 'unknown'})`);
      skipped++;
      if (DELAY_MS > 0) await sleep(DELAY_MS);
      continue;
    }

    await fs.writeFile(path.join(POSTS_DIR, `${res.slug}.mdx`), res.mdx, 'utf8');
    log = {
      topics: [
        ...log.topics,
        {
          slug: res.slug,
          title: item.topic,
          url: '',
          publishedAt: item.date,
          signature: signature(item.topic),
        },
      ],
    };
    await saveLocalLog(log); // save after each so an interrupted run is resumable
    written++;
    console.log(`✓ ${res.slug} (${res.mdx.length} bytes)`);

    if (DELAY_MS > 0 && i < queue.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n✓ Done. Wrote ${written} post(s), skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
