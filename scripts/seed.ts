#!/usr/bin/env tsx
/**
 * Bulk backfill — runs the pipeline repeatedly until N unique posts are written.
 *
 * Usage:
 *   npm run seed                  # write 30 new posts (default)
 *   npm run seed -- --count 10    # write 10 new posts
 *   npm run seed -- --dry         # dry run: one pipeline pass, write nothing
 *
 * Syndication is skipped during bulk seed to avoid spamming social platforms.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runPipeline } from '../src/lib/orchestrator/pipeline';
import type { TopicLog } from '../src/lib/orchestrator/types';
import { signature } from '../src/lib/orchestrator/score';

const LOG_PATH = path.join(process.cwd(), 'content', '.topic-log.json');
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const DRY = process.argv.includes('--dry');

function parseCount(): number {
  const idx = process.argv.indexOf('--count');
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 30;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadLocalLog(): Promise<TopicLog> {
  try {
    const raw = await fs.readFile(LOG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { topics: [] };
  }
}

async function saveLocalLog(log: TopicLog): Promise<void> {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

async function main() {
  const target = parseCount();
  const maxAttempts = target * 4;

  let topicLog = await loadLocalLog();
  let created = 0;
  let attempts = 0;
  let skipped = 0;
  let failed = 0;

  console.log(
    `→ Seeding ${DRY ? '(DRY RUN) ' : ''}up to ${target} new posts (topic log: ${topicLog.topics.length} entries)\n`
  );

  while (created < target && attempts < maxAttempts) {
    attempts++;
    console.log(`\n── Attempt ${attempts} (${created}/${target} created) ──`);

    const result = await runPipeline({ dryRun: true, topicLog });

    if (!result.ok) {
      if (result.skipped) {
        skipped++;
        console.log(`  skipped: ${result.skipped}`);
      } else {
        failed++;
        console.warn(`  failed: ${result.error ?? 'unknown'}`);
      }
      await sleep(8000);
      continue;
    }

    if (!result.slug || !result.mdx || !result.winner) {
      failed++;
      console.warn('  failed: pipeline returned ok but missing slug/mdx/winner');
      await sleep(8000);
      continue;
    }

    if (DRY) {
      console.log(`  ✓ Would write ${result.slug} — "${result.winner.title}"`);
      console.log('\n── Dry run preview (first 1500 chars) ──');
      console.log(result.mdx.slice(0, 1500));
      return;
    }

    await fs.mkdir(POSTS_DIR, { recursive: true });
    const filePath = path.join(POSTS_DIR, `${result.slug}.mdx`);
    await fs.writeFile(filePath, result.mdx, 'utf8');
    console.log(`  ✓ Wrote ${result.slug} — "${result.winner.title}"`);

    topicLog = {
      topics: [
        ...topicLog.topics,
        {
          slug: result.slug,
          title: result.winner.title,
          url: result.winner.url,
          publishedAt: new Date().toISOString(),
          signature: signature(result.winner.title),
        },
      ],
    };
    await saveLocalLog(topicLog);
    created++;

    // Pause between successes to stay within free-tier LLM/image rate limits.
    await sleep(12000);
  }

  console.log('\n── Seed complete ──');
  console.log(
    `  created: ${created}, skipped: ${skipped}, failed: ${failed}, attempts: ${attempts}`
  );

  if (created === 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
