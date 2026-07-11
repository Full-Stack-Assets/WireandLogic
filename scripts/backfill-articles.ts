#!/usr/bin/env tsx
/**
 * One-time backfill: 18 evergreen engineering explainers, each pinned to a
 * historical day in June 2026 so the catalog reads as a steady daily archive
 * instead of a lopsided posting history.
 *
 * This repo's pipeline has no topic-driven entrypoint (scripts/seed.ts loops
 * runPipeline() over live trending sources), so this script composes the same
 * stages the pipeline uses — research() → generate() → pickImage() →
 * serialize() — around a synthetic "winner" built from an explicit evergreen
 * topic string. The topic has no source URL, so research relies entirely on
 * Brave web search; generate() produces the site's standard-length post (this
 * engine's generate() takes no length options).
 *
 * serialize() always stamps `date: now`, so the pinned historical date is
 * patched into the frontmatter before the file is written.
 *
 * NEVER commits via Octokit: posts are written to content/posts/ and the local
 * content/.topic-log.json is updated, exactly like seed.ts. The companion
 * workflow (.github/workflows/backfill-articles.yml) commits the result.
 * Idempotent — an item whose signature is already in the log is skipped, and
 * the log is saved after each item, so a partial/interrupted run can simply
 * be re-dispatched.
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
import { research } from '../src/lib/orchestrator/research';
import { generate } from '../src/lib/orchestrator/generate';
import { pickImage } from '../src/lib/orchestrator/image';
import { serialize } from '../src/lib/orchestrator/serialize';
import { signature } from '../src/lib/orchestrator/score';
import type { ScoredItem, TopicLog } from '../src/lib/orchestrator/types';
import { siteConfig } from '../src/site.config';

const LOG_PATH = path.join(process.cwd(), 'content', '.topic-log.json');
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

const DELAY_MS = 2000;

interface BackfillItem {
  topic: string;
  date: string; // ISO
}

// Chronological, one per day around June 2026 at 12:00Z. Evergreen
// engineering explainers for this site's developer/builder audience — the
// kind of fundamentals piece a reader actually searches for.
const BACKFILL_ITEMS: BackfillItem[] = [
  { topic: 'How DNS actually works: from typed URL to IP address', date: '2026-06-03T12:00:00.000Z' },
  { topic: 'What a container actually is: namespaces, cgroups, and images', date: '2026-06-04T12:00:00.000Z' },
  { topic: 'SQL vs NoSQL: how to choose a database and the real tradeoffs', date: '2026-06-05T12:00:00.000Z' },
  { topic: 'How a TLS handshake works and what HTTPS actually protects', date: '2026-06-06T12:00:00.000Z' },
  { topic: 'CI/CD fundamentals: pipelines, stages, and deployment strategies', date: '2026-06-07T12:00:00.000Z' },
  { topic: 'How Git works under the hood: objects, branches, and commits', date: '2026-06-08T12:00:00.000Z' },
  { topic: 'REST vs GraphQL vs gRPC: choosing an API style', date: '2026-06-09T12:00:00.000Z' },
  { topic: 'How HTTP caching works: Cache-Control, ETags, and CDNs', date: '2026-06-10T12:00:00.000Z' },
  { topic: 'OAuth 2.0 and OpenID Connect explained for developers', date: '2026-06-11T12:00:00.000Z' },
  { topic: 'How database indexes work and when they slow you down', date: '2026-06-12T12:00:00.000Z' },
  { topic: 'Message queues explained: Kafka, RabbitMQ, and event-driven architecture', date: '2026-06-13T12:00:00.000Z' },
  { topic: 'How the browser renders a web page: the critical rendering path', date: '2026-06-15T12:00:00.000Z' },
  { topic: 'Load balancing strategies: round robin, least connections, and consistent hashing', date: '2026-06-16T12:00:00.000Z' },
  { topic: 'How SSH works: keys, agents, and tunnels explained', date: '2026-06-17T12:00:00.000Z' },
  { topic: 'Stack vs heap and how garbage collection actually works', date: '2026-06-19T12:00:00.000Z' },
  { topic: 'Rate limiting algorithms: token bucket, leaky bucket, and sliding windows', date: '2026-06-20T12:00:00.000Z' },
  { topic: 'Webhooks vs polling: designing systems that react to events', date: '2026-06-22T12:00:00.000Z' },
  { topic: 'Compilers, interpreters, and JITs: how your code actually runs', date: '2026-06-23T12:00:00.000Z' },
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

/**
 * serialize() stamps `date: now` in the frontmatter (it takes no date
 * parameter in this repo). Rewrite that one line inside the frontmatter block
 * so the post lands on its pinned historical day.
 */
export function pinDate(mdx: string, isoDate: string): string {
  const fmEnd = mdx.indexOf('\n---', 3);
  if (fmEnd === -1) return mdx;
  const frontmatter = mdx.slice(0, fmEnd).replace(/^date: ".*"$/m, `date: "${isoDate}"`);
  return frontmatter + mdx.slice(fmEnd);
}

interface TopicResult {
  ok: boolean;
  slug?: string;
  mdx?: string;
  skipped?: string;
  error?: string;
}

/** The same research → generate → image → serialize path runPipeline() uses,
 *  but seeded from an explicit topic instead of a scored trending winner. */
async function generateForBackfillTopic(topic: string, isoDate: string): Promise<TopicResult> {
  try {
    const title = topic.trim();

    // A synthetic winner: no source URL, neutral breakdown. research() will
    // Brave-search the title and scrape real articles to back the post.
    const winner: ScoredItem = {
      id: `backfill:${signature(title)}`,
      source: 'bravenews',
      title,
      url: '',
      publishedAt: isoDate,
      score: 1,
      breakdown: { popularity: 0, engagement: 0, recency: 1 },
    };

    const bundle = await research(winner, []);
    if (bundle.articles.length === 0 && bundle.transcripts.length === 0) {
      return { ok: false, skipped: `no research content scrapable for: ${title}` };
    }

    const post = await generate(bundle);
    post.heroImage = await pickImage(post);
    const mdx = pinDate(serialize(post), isoDate);

    return { ok: true, slug: post.slug, mdx };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
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
      `→ ${dryRun ? 'DRY RUN (1 item, nothing written)' : `generating ${queue.length}`}…\n`
  );

  if (dryRun) {
    const item = queue[0] ?? BACKFILL_ITEMS[0];
    console.log(`Topic: ${item.topic}\nDate: ${item.date}\n`);
    const res = await generateForBackfillTopic(item.topic, item.date);
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

    const res = await generateForBackfillTopic(item.topic, item.date);

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
