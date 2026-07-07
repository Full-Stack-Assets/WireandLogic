import { describe, it, expect } from 'vitest';
import { score, signature, dedupe, pickWinner } from './score';
import type { RawItem, ScoredItem, TopicLog } from './types';

function item(overrides: Partial<RawItem> = {}): RawItem {
  return {
    id: 'x',
    source: 'hackernews',
    title: 'Some interesting story',
    url: 'https://example.com/a',
    publishedAt: new Date().toISOString(),
    upvotes: 10,
    comments: 2,
    ...overrides,
  };
}

describe('score', () => {
  it('never produces NaN, even for a source with no registered weight', () => {
    // @ts-expect-error deliberately an unregistered source, mirroring what
    // happens the moment someone adds a new source and forgets score.ts
    const [result] = score([item({ source: 'brand-new-source' })]);
    expect(Number.isNaN(result.score)).toBe(false);
    expect(Number.isNaN(result.breakdown.popularity)).toBe(false);
  });

  it('gives more recent items a higher recency score', () => {
    const now = new Date().toISOString();
    const oldDate = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const [fresh, stale] = score([
      item({ id: 'fresh', publishedAt: now }),
      item({ id: 'stale', publishedAt: oldDate }),
    ]);
    expect(fresh.breakdown.recency).toBeGreaterThan(stale.breakdown.recency);
  });

  it('never produces a negative recency for a future-dated item (clock skew)', () => {
    const future = new Date(Date.now() + 3600 * 1000).toISOString();
    const [result] = score([item({ publishedAt: future })]);
    expect(result.breakdown.recency).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.recency).toBeLessThanOrEqual(1);
  });
});

describe('signature', () => {
  it('is stable for the same title', () => {
    expect(signature('Hello World Example')).toBe(signature('Hello World Example'));
  });

  it('collapses near-duplicate titles (word order / punctuation) to the same signature', () => {
    const a = signature('Reddit Launches New API Pricing');
    const b = signature('reddit launches new api pricing!!');
    expect(a).toBe(b);
  });

  it('differs for genuinely different titles', () => {
    expect(signature('Reddit API pricing changes')).not.toBe(signature('Completely unrelated headline'));
  });
});

describe('dedupe', () => {
  it('keeps only the highest-scoring item among near-duplicates', () => {
    const items: ScoredItem[] = [
      { ...item({ id: 'a', title: 'Big News Story Today' }), score: 0.4, breakdown: { popularity: 0, engagement: 0, recency: 0 } },
      { ...item({ id: 'b', title: 'Big News Story Today!!' }), score: 0.9, breakdown: { popularity: 0, engagement: 0, recency: 0 } },
    ];
    const result = dedupe(items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });
});

describe('pickWinner', () => {
  it('skips items whose signature is already in the topic log', () => {
    const already = signature('Already Covered Story');
    const log: TopicLog = {
      topics: [{ slug: 'x', title: 'x', url: 'x', publishedAt: 'x', signature: already }],
    };
    const items: ScoredItem[] = [
      { ...item({ title: 'Already Covered Story' }), score: 0.9, breakdown: { popularity: 0, engagement: 0, recency: 0 } },
      { ...item({ title: 'Fresh Uncovered Story' }), score: 0.5, breakdown: { popularity: 0, engagement: 0, recency: 0 } },
    ];
    const winner = pickWinner(items, log);
    expect(winner?.title).toBe('Fresh Uncovered Story');
  });

  it('returns null when every candidate has already been covered', () => {
    const title = 'Only Story Available';
    const log: TopicLog = {
      topics: [{ slug: 'x', title, url: 'x', publishedAt: 'x', signature: signature(title) }],
    };
    const items: ScoredItem[] = [
      { ...item({ title }), score: 0.9, breakdown: { popularity: 0, engagement: 0, recency: 0 } },
    ];
    expect(pickWinner(items, log)).toBeNull();
  });
});
