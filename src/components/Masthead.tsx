/** Homepage chrome shared between page 1 (`/`) and paginated pages (`/page/N`). */
export function Masthead() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <div className="mb-16 flex flex-col gap-3 border-b-2 border-ink pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Vol. 1 · Issue {Math.floor((Date.now() - new Date('2025-01-01').getTime()) / 86400000) + 1}</div>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl font-black leading-none tracking-tight">
          What shipped.<br /><span className="text-accent">What matters.</span>
        </h1>
      </div>
      <div className="text-right text-xs uppercase tracking-widest text-muted">
        {today}
      </div>
    </div>
  );
}

export function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-ink/20" />
      <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-muted">{label}</span>
      <div className="h-px flex-1 bg-ink/20" />
    </div>
  );
}
