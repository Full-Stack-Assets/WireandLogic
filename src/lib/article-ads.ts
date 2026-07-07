/**
 * Split an MDX post body into segments so in-article ad units can be placed at
 * natural editorial boundaries without touching the content files:
 *
 *   [intro]  — lead paragraph + takeaway callout (everything before the first
 *              `## ` heading)   → "article top" ad goes after this
 *   [middle] — the body sections                → "article mid" ad goes after this
 *   [outro]  — the `## FAQ` section (when present)
 *
 * Splits happen only at top-level `## ` headings, and the scan is code-fence
 * aware so a `## comment` inside a ``` block can never split the document.
 * Each segment is complete block-level MDX (the post contract's components —
 * Callout/ProsCons/FAQ — never span a `## ` boundary), so each renders safely
 * through its own MDXRemote pass. Anything unexpected (no headings, no FAQ)
 * degrades to fewer segments — never a broken article.
 */

export interface BodySegments {
  intro: string;
  middle: string;
  outro: string;
}

/** Offsets (line starts) of top-level `## ` headings, ignoring code fences. */
function headingOffsets(body: string): number[] {
  const offsets: number[] = [];
  let inFence = false;
  let pos = 0;
  for (const line of body.split('\n')) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFence = !inFence;
    } else if (!inFence && /^##\s/.test(line)) {
      offsets.push(pos);
    }
    pos += line.length + 1; // +1 for the newline
  }
  return offsets;
}

export function splitForInArticleAds(body: string): BodySegments {
  const offsets = headingOffsets(body);
  if (offsets.length === 0) {
    return { intro: body, middle: '', outro: '' };
  }

  const first = offsets[0];
  // The FAQ is the natural late-article boundary; fall back to the last heading.
  const faqOffset = offsets.find((o) => /^##\s*FAQ\b/i.test(body.slice(o, o + 12)));
  const last = faqOffset ?? offsets[offsets.length - 1];

  // Degenerate case: only one heading — split into intro + middle only.
  if (last <= first) {
    return { intro: body.slice(0, first).trim(), middle: body.slice(first).trim(), outro: '' };
  }

  return {
    intro: body.slice(0, first).trim(),
    middle: body.slice(first, last).trim(),
    outro: body.slice(last).trim(),
  };
}
