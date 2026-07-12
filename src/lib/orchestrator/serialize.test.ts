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

  it('moves inline content off a block opening tag when the closing tag is on a later line', () => {
    const body = `<Callout type="takeaway">Leaded gasoline was a known poison.\n</Callout>`;
    expect(sanitizeBody(body)).toBe(
      `<Callout type="takeaway">\nLeaded gasoline was a known poison.\n</Callout>`
    );
  });

  it('leaves a single-line block element untouched', () => {
    const body = `<Callout type="warning">All on one line.</Callout>`;
    expect(sanitizeBody(body)).toBe(body);
  });

  it('leaves the well-formed flow shape untouched', () => {
    const body = `<Callout type="takeaway">\nText on its own line.\n</Callout>`;
    expect(sanitizeBody(body)).toBe(body);
  });

  it('leaves a single-line Question inside a FAQ untouched but splits an inline FAQ open', () => {
    const body = `<FAQ><Question q="One?">A.</Question>\n<Question q="Two?">B.</Question>\n</FAQ>`;
    expect(sanitizeBody(body)).toBe(
      `<FAQ>\n<Question q="One?">A.</Question>\n<Question q="Two?">B.</Question>\n</FAQ>`
    );
  });

  it('unwraps invented components not in the contract, keeping their content', () => {
    const body = `<Question q="Legal?"><Answer>No, jamming is illegal.</Answer></Question>`;
    expect(sanitizeBody(body)).toBe(`<Question q="Legal?">No, jamming is illegal.</Question>`);
  });

  it('leaves capitalized tags inside code fences and inline code alone', () => {
    const body =
      '```jsx\n<Button onClick={fn}>Click</Button>\n```\n\nUse `<Widget>` for embeds.';
    expect(sanitizeBody(body)).toBe(body);
  });

  it('removes a self-closing unknown component', () => {
    const body = 'Before <Divider /> after.';
    expect(sanitizeBody(body)).toBe('Before  after.');
  });

  it('strips backslash escapes that leak into JSX from double-escaped JSON', () => {
    const body = `<Callout type=\\"takeaway\\">The point.\\</Callout>`;
    expect(sanitizeBody(body)).toBe(`<Callout type="takeaway">The point.</Callout>`);
  });

  it('leaves backslash escapes inside code fences alone', () => {
    const body = '```json\n{"a": "he said \\"hi\\""}\n```';
    expect(sanitizeBody(body)).toBe(body);
  });

  it('heals an indented inline-open Question whose closing tag is on the next line', () => {
    const body = `<FAQ>\n  <Question q="Secure?">Use HTTPS and signatures.\n  </Question>\n</FAQ>`;
    expect(sanitizeBody(body)).toBe(
      `<FAQ>\n  <Question q="Secure?">\nUse HTTPS and signatures.\n  </Question>\n</FAQ>`
    );
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
