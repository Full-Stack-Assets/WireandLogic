import { SubscribeForm } from './SubscribeForm';

/**
 * Prominent end-of-post subscribe call-to-action. Reuses the shared
 * SubscribeForm (which posts to /api/subscribe), so there's one source of truth
 * for the signup logic.
 */
export function SubscribeCTA() {
  return (
    <section className="mt-16 border-2 border-accent bg-accent/[0.04] p-8">
      <div className="font-display text-2xl font-black leading-tight tracking-tight">
        Get the weekly dispatch
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/70">
        The week&rsquo;s highest-signal tech and AI stories, synthesized into a five-minute
        read. One email a week, no spam, unsubscribe anytime.
      </p>
      <div className="mt-5">
        <SubscribeForm />
      </div>
    </section>
  );
}
