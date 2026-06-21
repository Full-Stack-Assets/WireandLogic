// Serves /ads.txt, required by ad networks to authorize sellers. The line is
// derived from the configured AdSense publisher id; returns 404 until set.
export const dynamic = 'force-dynamic';

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) {
    return new Response('Not found', { status: 404 });
  }
  // "ca-pub-1234..." -> "pub-1234..."; f08c47fec0942fa0 is Google's fixed cert id.
  const publisherId = client.replace(/^ca-/, '');
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
