import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/site.config';

export const metadata: Metadata = {
  title: 'The engine',
  description:
    'Launch a self-running niche blog in a weekend. The hourly auto-blog engine that powers this site — yours to own, near-zero cost.',
};

const host = (() => {
  try {
    return new URL(siteConfig.url).host.replace(/^www\./, '');
  } catch {
    return 'example.com';
  }
})();
const contact = `hello@${host}`;

const features = [
  { t: 'Hands-off', d: 'A scheduled job pulls trending stories, scores them, researches the winner, writes a structured post, and commits it — every hour.' },
  { t: 'One file to re-skin', d: 'Change branding, niche, sources, and voice in a single config file. The same engine runs any niche.' },
  { t: 'Near-zero cost', d: 'Runs on the free tiers of every dependency — static hosting plus a free LLM key. No database, no servers to babysit.' },
  { t: 'You own it', d: 'It’s your repo, your domain, your content. No platform lock-in, no per-seat SaaS bill, no rug-pull.' },
  { t: 'SEO-ready', d: 'Structured data, sitemaps, RSS, scheduled publishing, and clean semantic markup out of the box.' },
  { t: 'Monetization built in', d: 'AdSense slots, a topic-matched affiliate unit, and a newsletter with sponsorship hooks — wired and ready.' },
];

const tiers = [
  {
    name: 'DIY template',
    price: 'from $99',
    cadence: 'one-time',
    blurb: 'The full repo plus setup docs. You configure, deploy, and own it.',
    features: ['Complete source + license', 'Step-by-step setup guide', 'Deploy to Vercel in an afternoon'],
    featured: false,
  },
  {
    name: 'Done-for-you',
    price: 'from $499',
    cadence: 'one-time',
    blurb: 'Tell us the niche; we stand up the whole site for you.',
    features: ['Niche config + sources tuned', 'Domain, secrets & deploy handled', 'Live and generating before handoff'],
    featured: true,
  },
  {
    name: 'Managed',
    price: 'from $39',
    cadence: 'per month',
    blurb: 'We host and run it. You just pick the niche and watch it publish.',
    features: ['Hosting + generation managed', 'Updates & monitoring included', 'Cancel anytime'],
    featured: false,
  },
];

export default function EnginePage() {
  const mailto = (subject: string) => `mailto:${contact}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
      {/* Hero */}
      <header className="max-w-2xl">
        <div className="mb-4 text-xs uppercase tracking-[0.3em] text-muted">The engine</div>
        <h1 className="font-display text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight">
          Launch a self-running niche blog in a weekend.
        </h1>
        <p className="mt-6 font-display text-xl sm:text-2xl font-normal leading-snug text-ink/70">
          The hourly auto-blog engine behind this site — pick a niche, change one config file,
          deploy for about $0/month. Yours to own.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={mailto(`I want the ${siteConfig.name} engine`)}
            className="inline-block border border-accent bg-accent px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-transparent hover:text-accent"
          >
            Get the engine →
          </a>
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            See it live — you&rsquo;re on it →
          </Link>
        </div>
      </header>

      {/* Live demo note */}
      <section className="mt-16 border-l-2 border-accent bg-accent/[0.04] p-6">
        <p className="leading-relaxed text-ink/80">
          <span className="font-display font-bold text-ink">This site is the demo.</span>{' '}
          Every post here was generated, researched, and published by the engine — unattended.
          The same codebase runs unmodified across entirely different niches; only the config
          changes.
        </p>
      </section>

      {/* Features */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-black tracking-tight">What you get</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.t}>
              <div className="font-display text-lg font-bold">{f.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-black tracking-tight">Ways to get it</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col p-6 ${t.featured ? 'border-2 border-accent' : 'border border-ink/20'}`}
            >
              {t.featured && (
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  Most popular
                </div>
              )}
              <div className="font-display text-lg font-bold">{t.name}</div>
              <div className="mt-1">
                <span className="font-display text-2xl font-black">{t.price}</span>{' '}
                <span className="text-xs text-muted">{t.cadence}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{t.blurb}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink/80">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={mailto(`${siteConfig.name} engine — ${t.name}`)}
                className={`mt-6 inline-block border px-4 py-2 text-center text-sm font-semibold transition-colors ${
                  t.featured
                    ? 'border-accent bg-accent text-paper hover:bg-transparent hover:text-accent'
                    : 'border-ink/30 hover:border-accent hover:text-accent'
                }`}
              >
                Choose {t.name}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Honest note */}
      <section className="mt-16 max-w-2xl text-sm leading-relaxed text-muted">
        <p>
          Straight talk: this is a content engine you own, not a passive money printer. Search
          engines reward genuinely useful, well-curated content — so treat the output as a strong
          first draft for a niche you care about, keep a human in the loop, and it compounds.
          Run it as a spam farm and it won&rsquo;t last. We&rsquo;ll tell you the same before you buy.
        </p>
      </section>

      {/* CTA */}
      <section className="mt-16 border-t-2 border-ink pt-10">
        <h2 className="font-display text-3xl font-black tracking-tight">Ready to launch?</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/80">
          Email us with your niche and we&rsquo;ll point you to the right option.
        </p>
        <div className="mt-6">
          <a
            href={mailto(`I want the ${siteConfig.name} engine`)}
            className="inline-block border border-accent bg-accent px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-transparent hover:text-accent"
          >
            {contact}
          </a>
        </div>
      </section>
    </div>
  );
}
