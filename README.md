# Wire and Logic

A self-hosted, zero-cost trend blog. A scheduled job runs every hour, picks the highest-signal story from seven sources, researches it, writes a structured MDX post, and commits it to GitHub. The Next.js site can redeploy from those commits using the host configured for the repository.

**Stack:** Next.js 15 · TinaCMS · Groq (free tier) · Brave Search · Pexels · GitHub Contents API · Cloudflare/self-hosted deployment.

**Monthly cost at steady state:** $0 when the selected services remain within their free tiers.

---

## How it works

```
 ┌─ Reddit ─┐
 │ HN      │
 │ DEV.to  │──▶ score ──▶ dedup ──▶ winner ──▶ research ──▶ Groq ──▶ MDX ──▶ git commit ──▶ deploy
 │ RSS     │   (pop + engagement + recency)    (Brave + scrape     (strict JSON
 │ YouTube │                                    + YT transcripts)   contract)
 └─ Brave ─┘
```

Each stage is its own module in `src/lib/orchestrator/` and can be tested independently. The `pipeline.ts` runner wires them together with per-stage timings and graceful fallbacks. A flaky source does not kill the run.

---

## Setup

### 1. Prereqs

- Node 20+
- `npm` (the repo ships `package-lock.json`; CI uses `npm ci`)
- A GitHub repo to commit posts into (can be this same repo)

### 2. Install

```bash
npm install
cp .env.example .env.local
```

### 3. Get the free API keys

| Key | Where | Free tier |
|---|---|---|
| `GROQ_API_KEY` | https://console.groq.com/keys | Generous rate limits, ~30 RPM on llama-3.3-70b |
| `BRAVE_API_KEY` | https://api.search.brave.com/app/keys | 2,000 queries/month on the free plan |
| `PEXELS_API_KEY` | https://www.pexels.com/api/new/ | Unlimited for dev use |
| `GITHUB_TOKEN` | github.com → Settings → Developer settings → Fine-grained PAT | Scope: **Contents: Read/Write** on the blog repo only |
| `CRON_SECRET` | `openssl rand -hex 32` | n/a |

Fill them into `.env.local` along with `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH`.

> **Security note:** Never commit `.env.local` or any file containing real API keys to version control. The `.env.local` file is already in `.gitignore` to prevent accidental commits. Always use `.env.example` as a template with placeholder values only.

### 4. Test locally

```bash
# Dry run: prints the generated post, does not write anything
npm run generate -- --dry

# Real run: writes MDX to content/posts/ and updates content/.topic-log.json
npm run generate

# Start the dev server
npm run dev
```

Open http://localhost:3000. The seed post is visible out of the box; new posts show up as soon as `npm run generate` writes them.

---

## Deploy

### Scheduling: GitHub Actions

The hourly schedule lives in **`.github/workflows/generate.yml`**, which runs at the top of every hour (`cron: '0 * * * *'`), executes the pipeline with `npx tsx scripts/run-local.ts`, and commits any new post straight to the repo. The push can then trigger whichever hosting path is configured for the project.

Add the pipeline secrets (`GROQ_API_KEY`, `BRAVE_API_KEY`, `PEXELS_API_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`) under **Settings → Secrets and variables → Actions**. The workflow has `contents: write` and a `concurrency` group so a slow run never overlaps the next tick. Use the **Run workflow** button (`workflow_dispatch`) to trigger a one-off run.

Keep scheduling in one place. If you later attach another scheduler to `/api/cron/generate`, disable the GitHub Actions tick first so the pipeline cannot generate duplicate posts.

### Hosting: Cloudflare Pages

If the repository's current Next.js output is compatible with the selected Pages setup, use Cloudflare for the site while leaving content generation in GitHub Actions. Do not move the 30–90 second generation pipeline into an edge function with a shorter CPU budget.

### Self-host

`npm run build && npm start` and point a reverse proxy at port 3000. The GitHub Action still drives generation; to trigger the route manually, use your configured public origin:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/generate
```

No production hostname is hard-coded by this repository.

---

## TinaCMS editor (optional)

The schema in `tina/config.ts` matches the frontmatter the pipeline emits. Start the editor with:

```bash
npm run dev   # Tina runs alongside Next via the `tinacms dev` wrapper
```

Then visit http://localhost:3000/admin/index.html. You can fix typos, tweak tags, or hand-write posts that follow the same structure.

**Self-hosted mode (default):** TinaCMS works in local filesystem mode without any cloud credentials. The build script (`scripts/build.sh`) automatically handles this by setting placeholder values during build if credentials are not provided.

**Hosted editing:** For non-local contributors, sign up at tina.io for the free tier and fill in `NEXT_PUBLIC_TINA_CLIENT_ID` + `TINA_TOKEN` in your deployment environment variables. These are optional for local development.

---

## The MDX contract

Every generated post follows this exact shape. The system prompt in `src/lib/orchestrator/generate.ts` enforces it, and the zod schema validates the JSON before writing:

1. **Lead paragraph** (no heading, 3–5 sentences)
2. `<Callout type="takeaway">` with a one-sentence synthesis
3. `## What happened`
4. `## Why it matters`
5. `<ProsCons>` block with 3+ items per side
6. `## How to think about it`
7. `<Callout type="warning">` when warranted
8. `## FAQ` with exactly 3 `<Question>` entries

All components are implemented in `src/components/mdx/index.tsx` and styled via `globals.css`'s `.prose-editorial` rules.

---

## Scoring

From `src/lib/orchestrator/score.ts`:

```
score = 0.5·popularity + 0.2·engagement + 0.3·recency
```

- **popularity**: log-scaled upvotes, normalized per source, then weighted by source.
- **engagement**: comments-to-upvotes ratio, capped at 1.0.
- **recency**: exponential decay with a 24-hour half-life.

Dedup uses a sorted-token fingerprint of the title. The topic log (`content/.topic-log.json`) is checked on every run and capped at 500 entries.

---

## Troubleshooting

**"no items from any source"**: all sources failed. Check logs and retry after the upstream services recover.

**"all top candidates already covered"**: the scorer found winners, but their signatures already exist in the topic log.

**"no research content scrapable"**: the winner's URL and the research fallbacks could not be scraped. The pipeline skips gracefully.

**Groq rate limit**: the free tier resets on its own cadence. One post/hour is intentionally conservative.

**Hosting timeout**: keep the long-running generation pipeline in GitHub Actions rather than moving it into a short-lived edge request.

---

## Extending

- **Add a source:** drop a new file in `src/lib/sources/`, export a function returning `RawItem[]`, and add it to the `Promise.all` in `pipeline.ts`.
- **Tune the tone:** edit `SYSTEM_PROMPT` in `generate.ts`. The zod schema catches structurally invalid output.
- **Change the niche:** adjust `SUBREDDITS` in `reddit.ts`, `BRAVE_QUERIES` in `bravenews.ts`, and `DEFAULT_FEEDS` in `rss.ts`.
- **Change the cadence:** edit the `cron` in `.github/workflows/generate.yml`.

---

## License

MIT.
