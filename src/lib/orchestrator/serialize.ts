import type { GeneratedPost } from './types';

/**
 * Serialize a GeneratedPost into a complete MDX file with YAML frontmatter.
 * The shape matches the TinaCMS schema in tina/config.ts.
 */
export function serialize(post: GeneratedPost): string {
  const fm = {
    title: post.title,
    description: post.description,
    date: new Date().toISOString(),
    category: post.category,
    tags: post.tags,
    hero: {
      url: post.heroImage.url,
      alt: post.heroImage.alt,
      credit: post.heroImage.credit,
      creditUrl: post.heroImage.creditUrl,
    },
    sources: post.sources,
  };

  const yaml = toYaml(fm);
  return `---\n${yaml}---\n\n${sanitizeBody(post.body).trim()}\n`;
}

/**
 * Make the LLM-written MDX body safe to prerender. The model occasionally emits
 * unescaped double quotes inside a <Question q="..."> attribute (e.g. q="the
 * "limited" plan"), which breaks MDX parsing and fails the whole build. Replace
 * the inner double quotes with single quotes so the attribute stays well-formed.
 *
 * It also sometimes opens a block component inline with its content but closes
 * it on a later line:
 *
 *   <Callout type="takeaway">Some text.
 *   </Callout>
 *
 * MDX parses that opening tag as an *inline* element inside a paragraph, and the
 * `</Callout>` line interrupts the paragraph, leaving the element unclosed — a
 * hard parse error at build time (broke the 2026-07-12 hourly run). Moving the
 * content onto its own line turns it into a well-formed flow element, the shape
 * every healthy post already uses.
 *
 * The model also sometimes invents components outside the contract (e.g.
 * wrapping FAQ answers in <Answer>). Any capitalized JSX tag with no registered
 * component fails the render ("Expected component `Answer` to be defined"), so
 * unknown component tags are unwrapped — tags removed, inner content kept.
 *
 * Finally, a double-JSON-escaped body leaks literal backslashes into the JSX
 * (`<Callout type=\"takeaway\">`, `\</Callout>`), which is a parse error; those
 * escapes are stripped where they touch tag syntax.
 *
 * All tag-level heals skip code fences and inline code.
 */
const BLOCK_TAG_OPEN = /^([ \t]*<(Callout|ProsCons|Pros|Cons|FAQ|Question)(?:\s[^>\n]*)?>)[ \t]*(\S[^\n]*)$/gm;

const KNOWN_COMPONENTS = new Set(['Callout', 'ProsCons', 'Pros', 'Cons', 'FAQ', 'Question']);

/** Apply a transform to the body, skipping code fences and inline code. */
function outsideCode(body: string, transform: (segment: string) => string): string {
  return body
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((segment, i) => (i % 2 === 1 ? segment : transform(segment)))
    .join('');
}

function healTags(body: string): string {
  return outsideCode(body, (segment) =>
    segment
      .replace(/=\\"/g, '="')
      .replace(/\\">/g, '">')
      .replace(/\\(<\/?[A-Z])/g, '$1')
      .replace(/<\/?([A-Z][A-Za-z0-9]*)(?:\s[^<>\n]*)?\/?>/g, (match, tag: string) =>
        KNOWN_COMPONENTS.has(tag) ? match : ''
      )
  );
}

export function sanitizeBody(body: string): string {
  return healTags(body)
    .replace(
      /(<Question\s+q=")([^\n]*?)(">)/g,
      (_match, open: string, question: string, close: string) =>
        `${open}${question.replace(/"/g, "'")}${close}`
    )
    .replace(BLOCK_TAG_OPEN, (match, open: string, tag: string, rest: string) =>
      rest.includes(`</${tag}>`) ? match : `${open}\n${rest}`
    );
}

function toYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null';

  if (typeof obj === 'string') return quoteIfNeeded(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return (
      '\n' +
      obj
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            const first = entries[0];
            const rest = entries.slice(1);
            const firstLine = `${pad}- ${first[0]}: ${toYaml(first[1], indent + 1)}`;
            const restLines = rest
              .map(([k, v]) => `${pad}  ${k}: ${toYaml(v, indent + 1)}`)
              .join('\n');
            return restLines ? `${firstLine}\n${restLines}` : firstLine;
          }
          return `${pad}- ${toYaml(item, indent + 1)}`;
        })
        .join('\n')
    );
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    if (indent === 0) {
      return entries.map(([k, v]) => `${k}: ${toYaml(v, indent + 1)}`).join('\n') + '\n';
    }
    return (
      '\n' +
      entries.map(([k, v]) => `${pad}${k}: ${toYaml(v, indent + 1)}`).join('\n')
    );
  }

  return '';
}

function quoteIfNeeded(s: string): string {
  // Always quote for safety — dates, colons, leading dashes, etc. all need it
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}
