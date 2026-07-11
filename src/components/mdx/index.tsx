import type { ReactNode } from 'react';

type CalloutType = 'takeaway' | 'warning' | 'note';

const CALLOUT_CONFIG: Record<CalloutType, { label: string; bg: string; border: string; accent: string }> = {
  takeaway: { label: 'Takeaway', bg: 'bg-gradient-to-r from-accent/[0.08] to-lime-bright/[0.05]', border: 'border-accent', accent: 'text-accent-deep' },
  warning:  { label: 'Watch out', bg: 'bg-amber-500/[0.07]', border: 'border-amber-600', accent: 'text-amber-700' },
  note:     { label: 'Note', bg: 'bg-ink/[0.03]', border: 'border-muted', accent: 'text-muted' },
};

export function Callout({ type = 'note', children }: { type?: CalloutType; children: ReactNode }) {
  const c = CALLOUT_CONFIG[type];
  return (
    <aside className={`my-8 rounded-r-md border-l-2 ${c.border} ${c.bg} py-4 pl-5 pr-5`}>
      <div className={`mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${c.accent}`}>
        {c.label}
      </div>
      <div className="text-[1.0625rem] font-medium leading-relaxed text-ink">{children}</div>
    </aside>
  );
}

export function ProsCons({ children }: { children: ReactNode }) {
  return (
    <div className="my-10 grid gap-0 overflow-hidden rounded-md border border-rule bg-white sm:grid-cols-2">
      {children}
    </div>
  );
}

export function Pros({ children }: { children: ReactNode }) {
  return (
    <div className="border-t-2 border-accent p-6 max-sm:border-b max-sm:border-b-rule sm:border-r sm:border-r-rule">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent-deep">
        <span className="text-base leading-none">+</span> Pros
      </div>
      <ul className="space-y-2 text-base">{children}</ul>
    </div>
  );
}

export function Cons({ children }: { children: ReactNode }) {
  return (
    <div className="border-t-2 border-ink p-6">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-ink">
        <span className="text-base leading-none">–</span> Cons
      </div>
      <ul className="space-y-2 text-base">{children}</ul>
    </div>
  );
}

export function FAQ({ children }: { children: ReactNode }) {
  return (
    <div className="my-10 divide-y divide-rule border-t border-b border-rule">
      {children}
    </div>
  );
}

export function Question({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
        <span className="font-display text-lg font-semibold leading-snug tracking-tight">{q}</span>
        <span className="mt-1 shrink-0 font-mono text-xl leading-none text-accent-deep transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3 leading-relaxed text-ink/80">{children}</div>
    </details>
  );
}

export const mdxComponents = {
  Callout,
  ProsCons,
  Pros,
  Cons,
  FAQ,
  Question,
};
