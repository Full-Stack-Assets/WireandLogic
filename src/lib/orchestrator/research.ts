import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
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
const MAX_REDIRECTS = 5;
const MAX_ARTICLE_BYTES = 2 * 1024 * 1024;

function parseIpv6Bytes(address: string): number[] | null {
  let input = address.toLowerCase();

  if (input.includes('.')) {
    const lastColon = input.lastIndexOf(':');
    if (lastColon < 0) return null;
    const octets = input.slice(lastColon + 1).split('.').map((part) => Number(part));
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      return null;
    }
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    input = `${input.slice(0, lastColon)}:${high}:${low}`;
  }

  const halves = input.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;

  const groups = [...left, ...Array.from({ length: missing }, () => '0'), ...right];
  if (groups.length !== 8) return null;

  const bytes: number[] = [];
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    const value = Number.parseInt(group, 16);
    bytes.push((value >> 8) & 0xff, value & 0xff);
  }
  return bytes;
}

function matchesIpv6Prefix(address: number[], prefix: number[], bits: number): boolean {
  const fullBytes = Math.floor(bits / 8);
  const remainder = bits % 8;
  for (let index = 0; index < fullBytes; index += 1) {
    if (address[index] !== (prefix[index] ?? 0)) return false;
  }
  if (remainder === 0) return true;
  const mask = (0xff << (8 - remainder)) & 0xff;
  return (address[fullBytes] & mask) === ((prefix[fullBytes] ?? 0) & mask);
}

export function isPrivateIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split('.').map((part) => Number(part));
    if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a, b, c] = octets;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
    if (a === 192 && b === 88 && c === 99) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    if (a >= 224) return true;
    return false;
  }

  if (version === 6) {
    const bytes = parseIpv6Bytes(address);
    if (!bytes) return true;

    const isMappedIpv4 = bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
    if (isMappedIpv4) {
      return isPrivateIpAddress(`${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`);
    }

    const blockedPrefixes: Array<{ prefix: number[]; bits: number }> = [
      { prefix: Array.from({ length: 12 }, () => 0), bits: 96 },
      { prefix: [0x00, 0x64, 0xff, 0x9b, 0, 0, 0, 0, 0, 0, 0, 0], bits: 96 },
      { prefix: [0x00, 0x64, 0xff, 0x9b, 0x00, 0x01], bits: 48 },
      { prefix: [0x01, 0x00, 0, 0, 0, 0, 0, 0], bits: 64 },
      { prefix: [0x20, 0x01, 0x00], bits: 23 },
      { prefix: [0x20, 0x01, 0x0d, 0xb8], bits: 32 },
      { prefix: [0x20, 0x02], bits: 16 },
      { prefix: [0x3f, 0xff, 0x00], bits: 20 },
      { prefix: [0x5f, 0x00], bits: 16 },
      { prefix: [0xfc], bits: 7 },
      { prefix: [0xfe, 0x80], bits: 10 },
      { prefix: [0xfe, 0xc0], bits: 10 },
      { prefix: [0xff], bits: 8 },
    ];

    return blockedPrefixes.some(({ prefix, bits }) => matchesIpv6Prefix(bytes, prefix, bits));
  }

  return true;
}

function normalizedHostname(parsed: URL): string {
  const host = parsed.hostname.toLowerCase();
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
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
  const host = normalizedHostname(parsed);
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return false;
  if (isIP(host) && isPrivateIpAddress(host)) return false;
  return true;
}

async function resolvePublicAddress(host: string): Promise<{ address: string; family: 4 | 6 } | null> {
  if (isIP(host)) {
    const family = isIP(host) as 4 | 6;
    return isPrivateIpAddress(host) ? null : { address: host, family };
  }

  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (addresses.length === 0 || addresses.some((entry) => isPrivateIpAddress(entry.address))) return null;
    const selected = addresses[0];
    return { address: selected.address, family: selected.family as 4 | 6 };
  } catch {
    return null;
  }
}

type PinnedLookupCallback =
  | ((err: NodeJS.ErrnoException | null, address: string, family: number) => void)
  | ((err: NodeJS.ErrnoException | null, addresses: Array<{ address: string; family: number }>) => void);

export function createPinnedLookup(address: string, family: 4 | 6) {
  return (
    _hostname: string,
    options: { all?: boolean },
    callback: PinnedLookupCallback
  ): void => {
    if (options?.all) {
      (callback as (err: NodeJS.ErrnoException | null, addresses: Array<{ address: string; family: number }>) => void)(
        null,
        [{ address, family }]
      );
      return;
    }
    (callback as (err: NodeJS.ErrnoException | null, address: string, family: number) => void)(null, address, family);
  };
}

export async function fetchWithSsrfProtection(
  input: string,
  redirectsRemaining = MAX_REDIRECTS
): Promise<Response | null> {
  if (!isSafeUrlCandidate(input)) return null;

  const url = new URL(input);
  const host = normalizedHostname(url);
  const resolved = await resolvePublicAddress(host);
  if (!resolved) return null;

  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
  const result = await new Promise<Response | null>((resolve) => {
    const req = request(
      url,
      {
        method: 'GET',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; trendblog/0.1)' },
        lookup: createPinnedLookup(resolved.address, resolved.family),
        signal: AbortSignal.timeout(8000),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location) {
          res.resume();
          if (redirectsRemaining <= 0) {
            resolve(null);
            return;
          }
          const next = new URL(location, url).toString();
          void fetchWithSsrfProtection(next, redirectsRemaining - 1).then(resolve);
          return;
        }

        if (status < 200 || status >= 300) {
          res.resume();
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_ARTICLE_BYTES) {
            req.destroy(new Error('Response too large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve(
            new Response(body, {
              status,
              headers: Object.entries(res.headers).flatMap(([key, value]) =>
                value === undefined ? [] : [[key, Array.isArray(value) ? value.join(', ') : value]]
              ),
            })
          );
        });
      }
    );
    req.on('error', () => resolve(null));
    req.end();
  });

  return result;
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
    const res = await fetchWithSsrfProtection(url);
    if (!res) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, aside, iframe, .advertisement, .ad, [role=navigation]').remove();

    const title = $('meta[property="og:title"]').attr('content') ?? $('title').text() ?? '';
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
  const query = winner.title.replace(/[^\w\s]/g, ' ').split(/\s+/).slice(0, 10).join(' ');

  const searchResults = await braveWebSearch(query);

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

  if (winner.source !== 'youtube') {
    const w = await scrapeArticle(winner.url);
    if (w) articles.unshift({ url: winner.url, title: w.title || winner.title, content: w.content });
  }

  const videoIds = new Set<string>();
  if (winner.source === 'youtube') {
    const id = extractVideoId(winner.url);
    if (id) videoIds.add(id);
  }
  for (const it of allItems) {
    if (it.source !== 'youtube') continue;
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
