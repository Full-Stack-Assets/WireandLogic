# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

A self-hosted, near-zero-cost **auto-blog engine**. A scheduled job runs every
hour, pulls trending stories from seven sources, scores them, researches the
winner, writes a structured MDX post with an LLM, and commits it to GitHub. A
Next.js 15 site renders the `content/posts/*.mdx` files and auto-deploys on each
push. Steady-state cost is ~$0 (free tiers of every dependency).

The engine is **niche-agnostic and template-driven**: everything that makes it
*this* site lives in `src/site.config.ts`. Change that one file (plus secrets and
a deploy target) and the same engine runs a different site. See `CREATE-A-SITE.md`.

### This repo is the upstream template

`src/site.config.ts` is configured for **Wire and Logic** — a *tech / developer
news* niche (`url: https://wireandlogic.com`, `audience: a developer and builder
audience`). **This is the original engine** that the sibling sites
(AstroKobi, Movies Rule, NextGen Gear, The Tuner Depot) are re-skinned from. The
internal npm package name `trendblog` is the engine's origin name and is shared
across all instances.

Because this is the source template, branding and content are *already*
on-niche: the `content/posts/` are real tech/AI articles and align with
`siteConfig.categories`. (In the re-skinned siblings the same posts are
off-niche leftovers; here they are the intended content.)

**Rule going forward: read branding/niche from `siteConfig` — never hardcode a
site name, URL, or niche.** That keeps the engine portable (see
`CREATE-A-SITE.md`). A few **internal** identifiers intentionally keep the
`trendblog` engine name (not user-facing): the `trendblog-bot` git commit
identity in `.github/workflows/generate.yml`, the Reddit user-agent in
`src/lib/sources/reddit.ts` (`trendblog:v0.1.0 (by /u/trendblog)`), and the
scraper UA in `src/lib/orchestrator/research.ts`
(`Mozilla/5.0 (compatible; trendblog/0.1)`).

## Tech stack

- **Next.js 15** (App Router, React 19, RSC) — static-ish blog with ISR.
- **TypeScript** throughout, `strict: true`. Path alias `@/*` → `src/*`,
  `@/content/*` → `content/*`.
- **TailwindCSS 3** + a custom `.prose-editorial` style in `globals.css`.
- **TinaCMS** — optional visual editor at `/admin/index.html`; schema in
  `tina/config.ts` mirrors the post frontmatter (its category dropdown is
  derived from `siteConfig.categories`).
- **MDX** via `next-mdx-remote` (RSC mode); custom components in
  `src/components/mdx/index.tsx`.
- **Content as data**: posts are flat `.mdx` files with YAML frontmatter under
  `content/posts/`. There is **no database**. The "topic log"
  (`content/.topic-log.json`) is the only piece of mutable state.
- **Zod** validates the LLM's JSON output.
- **LLM writer**: OpenAI-compatible endpoint; default **Groq**
  (`openai/gpt-oss-120b`, with `meta-llama/llama-4-scout-17b-16e-instruct` as
  the in-run fallback model on the same key — Scout's 30K-TPM free tier gives
  failover real headroom over the primary's 8K-TPM cap). Groq replaced Gemini,
  whose free tier kept returning 503 "model overloaded" and failing the hourly
  run. Any OpenAI-compatible provider works via `site.config.ts`.
- Package manager: the repo ships `package-lock.json`, and CI uses `npm ci`.
  **Use `npm`.** Node 20+.

## Commands

```bash
npm install              # install deps
npm run dev              # TinaCMS + `next dev` on :3000 (editor at /admin/index.html)
npm run build            # scripts/build.sh → optional tina build + `next build`
npm start                # serve the production build
npm run lint             # next lint (eslint)
npm run typecheck        # tsc --noEmit
npm test                 # vitest run — unit tests for the pure/critical logic

npm run generate         # tsx scripts/run-local.ts — run the pipeline, WRITE mdx to disk (no commit)
npm run generate -- --dry  # dry run: print the post, write nothing
npm run digest           # tsx scripts/newsletter-digest.ts — send the weekly digest
npx tsx scripts/smoke-test.ts   # hit every source fetcher against live APIs
```

> **Backfill:** `scripts/seed.ts` ships and works (`npm run seed`); it's driven by
> `.github/workflows/seed.yml`, with `scripts/reimage.ts` / `reimage.yml` to
> re-fetch hero images. Use these to backfill or refresh content in bulk.

`npm run build` goes through **`scripts/build.sh`**, which skips the TinaCMS
cloud build when `NEXT_PUBLIC_TINA_CLIENT_ID` / `TINA_TOKEN` are unset
(self-hosted/local-filesystem mode) and then runs `next build`. Don't replace it
with a bare `next build` — Vercel's `buildCommand` (`vercel.json`) calls
`npm run build` on purpose.

**Vitest** covers the pure/high-risk logic (`src/**/*.test.ts`, colocated with
the code they test): `PostSchema`'s self-healing transforms and its
balanced-custom-tag check, `score.ts`'s scoring/dedupe/winner-picking,
`pagination.ts`, `structured-data.ts`'s JSON-LD + FAQ extraction, and
`serialize.ts`'s quote-sanitization. `.github/workflows/ci.yml` runs typecheck +
tests + a full `next build` on every PR and push to `main` — this is the
independent guard against the 2026-07-03 incident class (a malformed hourly
post broke `next build`, and `scripts/build.sh` silently reported success
anyway; that script now has `set -e`, but CI is a second, PR-time check that
catches it before merge regardless).

`scripts/smoke-test.ts` remains the closest thing to integration testing (it
hits every source fetcher against live APIs); it isn't run in CI since it needs
live secrets. Verify changes via `npm run generate -- --dry`, `npm run lint`,
`npm test`, and `npm run build`.

## Architecture: the generation pipeline

All in `src/lib/orchestrator/`. The runner is **`pipeline.ts` → `runPipeline()`**,
a 5-stage flow with per-stage timings and graceful per-source fallbacks (a flaky
source returns `[]` instead of killing the run):

1. **Gather** — `src/lib/sources/*` fetch `RawItem[]` in parallel
   (`Promise.all`): `reddit`, `hackernews`, `devto`, `rss`, `youtube`,
   `bravenews`, `googletrends`. Each `.catch()`es to `[]`.
2. **Score & pick** — `score.ts`:
   `score = 0.5·popularity + 0.2·engagement + 0.3·recency`. Popularity is
   log-scaled upvotes normalized per-source and source-weighted; engagement is
   comments/upvotes (capped 1.0); recency is exponential decay with a 24h
   half-life. `dedupe()` collapses near-duplicate titles via a sorted-token SHA1
   `signature()`. `pickWinner()` skips any signature already in the topic log.
3. **Research** — `research.ts`: Brave web search on the winner's title, scrape
   the top unique domains + the winner URL with Cheerio (timeout-guarded), and
   pull YouTube transcripts via `youtubei.js`. Returns a `ResearchBundle`. If
   nothing scrapes, the run skips gracefully.
4. **Generate** — `generate.ts`: calls the configured **OpenAI-compatible** LLM
   endpoint with a strict `SYSTEM_PROMPT`, parses JSON, validates with
   `PostSchema` (zod), retries up to 3× feeding the exact validation error back.
   Then `image.ts` picks a hero image (Pexels → Openverse → none) and
   `serialize.ts` writes the MDX + YAML frontmatter.
5. **Commit** — `github.ts`: commits the post and the updated topic log via the
   GitHub Contents API (`@octokit/rest`). On a local `npm run generate`, this is
   bypassed — the post is written to disk by `scripts/run-local.ts` instead.

`scripts/run-local.ts` always calls `runPipeline({ dryRun: true })` (so it never
commits via Octokit), writes the MDX itself, updates the **local**
`content/.topic-log.json`, then best-effort syndicates (non-fatal).

### Key data shapes (`orchestrator/types.ts`)

`RawItem` → `ScoredItem` (adds `score` + `breakdown`) → `ResearchBundle` →
`GeneratedPost` → serialized MDX. `TopicLog` is `{ topics: [{ slug, title, url,
publishedAt, signature }] }`, capped at 500 entries.

## The MDX contract

Every generated post follows this exact shape — `SYSTEM_PROMPT` in `generate.ts`
prescribes it, `PostSchema` (zod) validates it, and the components live in
`src/components/mdx/index.tsx` (registered as `mdxComponents`):

1. Lead paragraph (no heading, 3–5 sentences)
2. `<Callout type="takeaway">` — one-sentence synthesis
3. `## What happened`
4. `## Why it matters`
5. `<ProsCons><Pros><li>…</li></Pros><Cons><li>…</li></Cons></ProsCons>` (3+ each)
6. `## How to think about it`
7. `<Callout type="warning">` — *optional*, only when warranted
8. `## FAQ` → `<FAQ>` with exactly 3 `<Question q="…">…</Question>`

`PostSchema` is **self-healing**: clampable overshoots (too-long
title/description, messy slug, too-many/dirty tags) are repaired by zod
`.transform()`s rather than thrown; only genuinely unmeetable constraints (body
`< 800` chars, fewer than 2 tags, malformed JSON) drive a retry. **Don't add a
`.max()` before a transform** — it fires first and defeats the heal. If you
change the contract, change all four of: the prompt, the schema, the MDX
components, **and** the TinaCMS templates in `tina/config.ts`.
`serialize.ts#sanitizeBody` also patches a known MDX-parse hazard (unescaped
quotes inside `<Question q="...">`).

## Frontmatter / post format

Posts are `content/posts/<slug>.mdx`. Frontmatter (see `src/lib/posts.ts`
`PostFrontmatter` and `serialize.ts`):

```yaml
title, description, date (ISO), category, tags[],
hero: { url, alt, credit, creditUrl },
sources: [{ title, url }]
```

- **Scheduled publishing is built in**: a post with a future `date` is hidden
  from every listing (home, categories, tags, feed, sitemap) and 404s on direct
  URL until its time passes (`listPosts()` filters; `blog/[slug]/page.tsx`
  re-checks). An unparseable date is treated as published.
- `category` should be one of `siteConfig.categories`; `relatedPosts()` ranks by
  shared tags → same category → recency.

## Site rendering (`src/app/`)

App Router. Notable routes:

- `page.tsx` — home / latest. `blog/[slug]/page.tsx` — article (JSON-LD,
  related posts, sources, ads). `categories/[category]`, `tags/[tag]` — taxonomy.
- `about`, `stats` (reads the topic log), `vaporloop` (a standalone demo page).
- `feed.xml/route.ts` (RSS), `sitemap.ts`, `robots.ts`, `ads.txt/route.ts`.
- `api/cron/generate/route.ts` — `GET`/`POST` that runs the pipeline; authorized
  via `Authorization: Bearer $CRON_SECRET` (or `?secret=`). `nodejs` runtime,
  `maxDuration = 300`. This is the serverless alternative to the GitHub Action.
- `api/subscribe/route.ts` — newsletter signup (per-instance in-memory rate
  limit, origin check).

Other libs: `src/lib/syndicate/` (Bluesky/Mastodon/DEV.to cross-posting),
`src/lib/newsletter/` (Buttondown digest), `src/lib/ads.ts`. Branding/SEO derive
from `siteConfig` via `src/lib/structured-data.ts`
(`SITE_URL`/`SITE_NAME`/`SITE_DESCRIPTION`, with `NEXT_PUBLIC_SITE_URL`
override — note the empty-string guard, since unset CI secrets arrive as `""`).

## Scheduling & deploy

- **`.github/workflows/generate.yml`** is the real scheduler: hourly cron
  (`0 * * * *`) + `workflow_dispatch`, verifies the Groq secret, runs
  `npm ci` and `npx tsx scripts/run-local.ts`, then commits & pushes with a
  rebase-retry loop as `trendblog-bot`. It registers a **union merge driver**
  (`scripts/merge-topic-log.mjs`, mapped in `.gitattributes`) so concurrent
  appends to `content/.topic-log.json` auto-merge instead of conflicting. A
  `concurrency` group prevents overlapping ticks. Optional
  `VERCEL_DEPLOY_HOOK_URL` fires a redeploy.
- **`.github/workflows/newsletter.yml`** runs the weekly digest.
- Hosting: Vercel (auto-deploys on push) or Cloudflare Pages as a static host.
  **Do not run the pipeline inside a Cloudflare Pages Function** — its ~30s CPU
  limit is below the pipeline's 30–90s runtime; let the Action generate.

## Configuration & secrets

- **`src/site.config.ts`** — the one file that defines the site: branding,
  `audience` (goes into the writer prompt), `categories`/`navCategories`,
  `sources` (subreddits / RSS feeds / Brave queries), `adsenseClient`, the `llm`
  block (OpenAI-compatible `endpoint` + `model` + `apiKeyEnv`; default
  **Groq**), and `imageProvider` (`pexels` | `openverse` | `none`).
- **Secrets** live in `.env.local` locally and GitHub Actions secrets in CI.
  `.env.example` is the full annotated list. The LLM key name **must match**
  `siteConfig.llm.apiKeyEnv` (default `GROQ_API_KEY`). Most source/integration
  keys are optional — an unset one is skipped, not fatal.
- **Never commit real keys.** `.env*` is gitignored; `.env.example` holds
  placeholders only.

## Conventions & gotchas

- **Fail soft, never crash the run.** Every external call (sources, scrape,
  image, syndication, deploy hook) is wrapped so a single failure degrades
  gracefully. Preserve this — a flaky API must never fail the whole hourly run.
- **Empty-string env vars.** Unset GitHub Actions secrets are passed through as
  `""`, not `undefined`. Guard with explicit length/`trim()` checks (as
  `structured-data.ts` already does), not just `??`.
- **Read config, don't hardcode.** Pull branding/niche from `siteConfig` (or the
  `SITE_NAME`/`SITE_URL`/`SITE_DESCRIPTION` re-exports in `structured-data.ts`)
  so the template stays portable.
- Keep the four MDX-contract definitions in sync (prompt, schema, components,
  Tina templates).
- The topic log is append-only and merge-driver-managed; don't restructure it
  casually. It's capped at 500 entries (`github.ts`).
- **Adding a source:** create `src/lib/sources/<name>.ts` exporting
  `fetch<Name>(): Promise<RawItem[]>`, add it to the `Promise.all` in
  `pipeline.ts` (wrapped in `.catch(() => [])`), and add its weight in `score.ts`.
- No DB. CI (`.github/workflows/ci.yml`) runs typecheck + `npm test` + `npm run
  build` on every PR/push to `main`. Also validate locally with `--dry` runs
  and `lint`.

## Git workflow for this environment

- Develop on the branch you were assigned (`claude/claude-md-docs-a680mc`);
  create it locally if missing.
- Commit with clear messages; push with `git push -u origin <branch>` (retry with
  exponential backoff on network errors).
- Do not push to `main` without explicit permission. The hourly bot commits to
  `main` as `trendblog-bot`; human/agent changes should go on a feature branch.
