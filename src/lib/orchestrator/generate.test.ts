import { describe, it, expect } from 'vitest';
import { clampMeta, slugify, normalizeTags, PostSchema } from './generate';

describe('clampMeta', () => {
  it('leaves short strings untouched (after whitespace collapse)', () => {
    expect(clampMeta('  Hello   world  ', 200)).toBe('Hello world');
  });

  it('truncates at a word boundary and appends an ellipsis', () => {
    const long = 'word '.repeat(100).trim();
    const result = clampMeta(long, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/); // no dangling space before the ellipsis
  });
});

describe('slugify', () => {
  it('produces a clean kebab-case slug', () => {
    expect(slugify('Hello, World! This Is A Test')).toBe('hello-world-this-is-a-test');
  });

  it('matches the schema-required pattern for messy input', () => {
    const result = slugify('  --Weird__Input!! 123  ');
    expect(result).toMatch(/^[a-z0-9-]+$/);
  });

  it('caps length at 60 chars without a trailing hyphen', () => {
    const result = slugify('word '.repeat(30));
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith('-')).toBe(false);
  });
});

describe('normalizeTags', () => {
  it('lowercases, trims, dedupes, and caps at 6', () => {
    const result = normalizeTags([' AI ', 'ai', 'Tools', 'tools', 'a', 'b', 'c', 'd', 'e']);
    expect(result).toEqual(['ai', 'tools', 'a', 'b', 'c', 'd']);
  });

  it('drops blank entries', () => {
    expect(normalizeTags(['', '  ', 'real-tag'])).toEqual(['real-tag']);
  });
});

// A realistic, schema-valid body: every custom tag's contract is satisfied.
function validBody(): string {
  return (
    'Lead paragraph. '.repeat(20) +
    '\n\n<Callout type="takeaway">Point.</Callout>\n\n' +
    '## What happened\n' +
    'Paragraph. '.repeat(40) +
    '\n\n## Why it matters\n' +
    'Paragraph. '.repeat(40) +
    '\n\n<ProsCons><Pros><li>a</li></Pros><Cons><li>b</li></Cons></ProsCons>\n\n' +
    '## How to think about it\n' +
    'Paragraph. '.repeat(20) +
    '\n\n## FAQ\n<FAQ>' +
    '<Question q="Q1?">A1.</Question>' +
    '<Question q="Q2?">A2.</Question>' +
    '<Question q="Q3?">A3.</Question>' +
    '</FAQ>'
  );
}

function baseFields() {
  return {
    title: 'A sufficiently long and specific title for the post',
    description: 'A one-sentence summary.',
    slug: 'a-post-slug',
    category: 'news',
    tags: ['one', 'two'],
  };
}

describe('PostSchema', () => {
  it('accepts a well-formed post', () => {
    const result = PostSchema.safeParse({ ...baseFields(), body: validBody() });
    expect(result.success).toBe(true);
  });

  it('rejects a body with an unclosed <Question> tag (the truncated-generation incident)', () => {
    // Mirrors the real 2026-07-03 production incident: an LLM response cut off
    // mid-FAQ, missing the closing </Question></FAQ>. This must fail validation
    // (and therefore retry) rather than ever reach content/posts/.
    const truncated = validBody().replace('<Question q="Q3?">A3.</Question></FAQ>', '<Question q="Q3?">A3.');
    const result = PostSchema.safeParse({ ...baseFields(), body: truncated });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => /unbalanced/i.test(i.message))).toBe(true);
    }
  });

  it('rejects a body that is too short, even if structurally balanced', () => {
    const result = PostSchema.safeParse({ ...baseFields(), body: '<Callout type="x">short</Callout>' });
    expect(result.success).toBe(false);
  });

  it('heals an over-long title instead of rejecting it', () => {
    const longTitle = 'A '.repeat(100) + 'title';
    const result = PostSchema.safeParse({ ...baseFields(), title: longTitle, body: validBody() });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title.length).toBeLessThanOrEqual(120);
  });

  it('rejects fewer than 2 tags rather than fabricating one', () => {
    const result = PostSchema.safeParse({ ...baseFields(), tags: ['only-one'], body: validBody() });
    expect(result.success).toBe(false);
  });
});
