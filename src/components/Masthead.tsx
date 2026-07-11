import { siteConfig } from '@/site.config';

/** Homepage chrome shared between page 1 (`/`) and paginated pages (`/page/N`). */
export function Masthead() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const issue = Math.floor((Date.now() - new Date('2025-01-01').getTime()) / 86400000) + 1;
  return (
    <div className="mb-16 flex flex-col gap-4 border-b border-ink pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-deep">
          Vol. 1 · Issue {issue}
        </div>
        <h1 className="mt-3 max-w-2xl font-display text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
          <span className="text-gradient">{siteConfig.name}</span><span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          {siteConfig.description}
        </p>
      </div>
      <div className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted sm:text-right">
        {today}
      </div>
    </div>
  );
}

export function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 rule-gradient" style={{ transform: 'scaleX(-1)' }} />
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">{label}</span>
      <div className="h-px flex-1 rule-gradient" />
    </div>
  );
}
