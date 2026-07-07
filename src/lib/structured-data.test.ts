import { describe, it, expect } from 'vitest';
import { articleJsonLd, extractFaq } from './structured-data';
import type { Post } from './posts';

function post(overrides: Partial<Post['frontmatter']> = {}): Post {
  return {
    slug: 'test-post',
    body: '',
    readingTimeMin: 3,
    frontmatter: {
      title: 'A Test Post',
      description: 'A description.',
      date: '2026-01-01T00:00:00.000Z',
      category: 'news',
      tags: ['a', 'b'],
      hero: { url: '', alt: '', credit: '', creditUrl: '' },
      sources: [],
      ...overrides,
    },
  };
}

describe('articleJsonLd', () => {
  it('produces a valid ISO datePublished for a normal post', () => {
    const schema = articleJsonLd(post());
    expect(schema.datePublished).toBe('2026-01-01T00:00:00.000Z');
  });

  it('does not throw on an unparseable frontmatter date (falls back instead of crashing)', () => {
    // Regression test: this previously threw RangeError from
    // `new Date(badDate).toISOString()`, crashing the article page render.
    expect(() => articleJsonLd(post({ date: 'not-a-real-date' }))).not.toThrow();
    const schema = articleJsonLd(post({ date: 'not-a-real-date' }));
    expect(typeof schema.datePublished).toBe('string');
    expect(() => new Date(schema.datePublished as string).toISOString()).not.toThrow();
  });
});

describe('extractFaq', () => {
  it('extracts question/answer pairs from Question blocks', () => {
    const body = '<FAQ><Question q="What is X?">X is a thing.</Question></FAQ>';
    expect(extractFaq(body)).toEqual([{ question: 'What is X?', answer: 'X is a thing.' }]);
  });

  it('strips markdown/MDX markup from the answer text', () => {
    const body = '<Question q="Q?">Some **bold** and a [link](https://example.com) here.</Question>';
    const [faq] = extractFaq(body);
    expect(faq.answer).toBe('Some bold and a link here.');
  });

  it('returns an empty array when there are no Question blocks', () => {
    expect(extractFaq('## Just a heading, no FAQ here.')).toEqual([]);
  });

  it('decodes HTML entities in both question and answer', () => {
    const body = '<Question q="A &amp; B?">Uses &quot;quotes&quot; and &amp; ampersands.</Question>';
    const [faq] = extractFaq(body);
    expect(faq.question).toBe('A & B?');
    expect(faq.answer).toBe('Uses "quotes" and & ampersands.');
  });
});
