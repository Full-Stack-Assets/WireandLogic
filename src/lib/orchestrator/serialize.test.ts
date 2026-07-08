import { describe, it, expect } from 'vitest';
import { sanitizeBody, serialize } from './serialize';
import type { GeneratedPost } from './types';

describe('sanitizeBody', () => {
  it('replaces unescaped inner double quotes in a Question q attribute with single quotes', () => {
    const body = `<Question q="the "limited" plan">Answer here.</Question>`;
    const result = sanitizeBody(body);
    expect(result).toBe(`<Question q="the 'limited' plan">Answer here.</Question>`);
  });

  it('leaves an already-clean Question tag untouched', () => {
    const body = `<Question q="What is this?">An answer.</Question>`;
    expect(sanitizeBody(body)).toBe(body);
  });

  it('leaves non-Question content untouched', () => {
    const body = '## Heading\n\nSome prose with "regular quotes" in it.';
    expect(sanitizeBody(body)).toBe(body);
  });
});

describe('serialize', () => {
  function post(): GeneratedPost {
    return {
      slug: 'my-post',
      title: 'My Post',
      description: 'A description',
      tags: ['a', 'b'],
      category: 'news',
      heroImage: { url: 'https://example.com/x.jpg', alt: 'alt text', credit: 'me', creditUrl: 'https://example.com' },
      body: '## What happened\n\nSome content.',
      sources: [{ title: 'Source', url: 'https://example.com/source' }],
    };
  }

  it('produces frontmatter delimited by --- and includes the body', () => {
    const mdx = serialize(post());
    expect(mdx.startsWith('---\n')).toBe(true);
    expect(mdx).toContain('title:');
    expect(mdx).toContain('## What happened');
  });

  it('sanitizes a broken Question tag in the body before writing it out', () => {
    const p = post();
    p.body = `## FAQ\n<FAQ><Question q="A "tricky" one">Answer.</Question></FAQ>`;
    const mdx = serialize(p);
    expect(mdx).toContain(`q="A 'tricky' one"`);
  });
});
