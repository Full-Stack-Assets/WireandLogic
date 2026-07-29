import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Innertube } from 'youtubei.js';
import type { ScoredItem, ResearchBundle, RawItem } from './types';

interface BraveWebResult {
  url: string;
  title: string;
  description: string;
}

const BLOCKED_HOSTNAMES = new Set(['localhost']);
const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost'];

export function isPrivateIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split('.').map((part) => Number(part));
    if ([a, b].some((n) => Number.isNaN(n))) return true;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (version === 6) {
    const lower = address.toLowerCase();
    return (
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb') ||
      lower.startsWith('::ffff:127.')
    );
  }
  return true;
}

export function isSafeUrlCandidate(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (!parsed.hostname) return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return false;
  if (isIP(host) && isPrivateIpAddress(host)) return false;
  return true;
}

async function canFetchUrl(url: string): Promise<boolean> {
  if (!isSafeUrlCandidate(url)) return false;
  const host = new URL(url).hostname;
  if (isIP(host)) return true;
  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (addresses.length === 0) return false;
    return addresses.every((entry) => !isPrivateIpAddress(entry.address));
  } catch {
    return false;
  }
}

async function braveWebSearch(query: string): Promise<BraveWebResult[]> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) return [];

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', '8');

  const res = await fetch(url, {
    headers: { 'x-subscription-token': key, accept: 'application/json' },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { web?: { results?: BraveWebResult[] } };
  return json.web?.results ?? [];
}

async function scrapeArticle(url: string): Promise<{ title: string; content: string } | null> {
  try {
    if (!(await canFetchUrl(url))) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; trendblog/0.1)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Strip noise
    $('script, style, nav, footer, aside, iframe, .advertisement, .ad, [role=navigation]').remove();

    const title = $('meta[property="og:title"]').attr('content') ?? $('title').text() ?? '';

    // Prefer article tags, fall back to main, then body paragraphs
    const paragraphs: string[] = [];
    const container = $('article').length ? $('article') : $('main').length ? $('main') : $('body');
    container.find('p, h2, h3, li').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) paragraphs.push(text);
    });

    const content = paragraphs.join('\n\n').slice(0, 6000);
    return { title: title.trim(), content };
  } catch {
    return null;
  }
}

async function fetchTranscript(videoId: string): Promise<{ title: string; text: string } | null> {
  try {
    const yt = await Innertube.create({ retrieve_player: false });
    const info = await yt.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    const text = transcriptData.transcript.content?.body?.initial_segments
      ?.map((s) => s.snippet.text)
      .join(' ')
      .slice(0, 5000);
    if (!text) return null;
    return { title: info.basic_info.title ?? '', text };
  } catch {
    return null;
  }
}

function extractVideoId(url: string): string | null {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ?? url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export async function research(
  winner: ScoredItem,
  allItems: RawItem[]
): Promise<ResearchBundle> {
  // Build a search query from the winner's title, stripping common filler
  const query = winner.title.replace(/[^\w\s]/g, ' ').split(/\s+/).slice(0, 10).join(' ');

  const searchResults = await braveWebSearch(query);

  // Scrape top 3 unique domains, excluding the winner's own URL
  const winnerHost = (() => {
    try { return new URL(winner.url).hostname; } catch { return ''; }
  })();
  const seenHosts = new Set<string>([winnerHost]);
  const toScrape = searchResults
    .filter((r) => {
      try {
        const h = new URL(r.url).hostname;
        if (seenHosts.has(h)) return false;
        seenHosts.add(h);
        return true;
      } catch { return false; }
    })
    .slice(0, 3);

  const articles = (
    await Promise.all(
      toScrape.map(async (r) => {
        const s = await scrapeArticle(r.url);
        return s ? { url: r.url, title: s.title || r.title, content: s.content } : null;
      })
    )
  ).filter((a): a is NonNullable<typeof a> => a !== null);

  // If winner itself is non-YouTube, also try to scrape it
  if (winner.source !== 'youtube') {
    const w = await scrapeArticle(winner.url);
    if (w) articles.unshift({ url: winner.url, title: w.title || winner.title, content: w.content });
  }

  // Pull transcripts from any related YouTube items (and the winner if it's YT)
  const videoIds = new Set<string>();
  if (winner.source === 'youtube') {
    const id = extractVideoId(winner.url);
    if (id) videoIds.add(id);
  }
  for (const it of allItems) {
    if (it.source !== 'youtube') continue;
    // Require a meaningful shared word (len>3): includes('') is always true and
    // 1-3 char tokens match spuriously, pulling in unrelated videos.
    const q = query.toLowerCase();
    if (!it.title.toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w))) continue;
    const id = extractVideoId(it.url);
    if (id) videoIds.add(id);
    if (videoIds.size >= 2) break;
  }

  const transcripts = (
    await Promise.all(
      [...videoIds].map(async (id) => {
        const t = await fetchTranscript(id);
        return t ? { videoId: id, title: t.title, text: t.text } : null;
      })
    )
  ).filter((t): t is NonNullable<typeof t> => t !== null);

  // Keep a handful of "related" headlines for context
  const related = allItems
    .filter((it) => it.id !== winner.id)
    .filter((it) => {
      const a = new Set(it.title.toLowerCase().split(/\s+/));
      const b = new Set(winner.title.toLowerCase().split(/\s+/));
      let overlap = 0;
      for (const w of a) if (b.has(w) && w.length > 3) overlap++;
      return overlap >= 2;
    })
    .slice(0, 5);

  return { winner, articles, transcripts, related };
}
