'use client';

import { useEffect, useRef } from 'react';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * A single AdSense ad unit. Renders nothing unless both the publisher client id
 * (NEXT_PUBLIC_ADSENSE_CLIENT) and a slot id are configured, so the site is
 * ad-free and unaffected until AdSense is set up.
 */
export function AdSlot({
  slot,
  format = 'auto',
  layout,
  className = '',
}: {
  slot?: string;
  format?: string;
  layout?: string;
  className?: string;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not ready or blocked — leave the slot empty.
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout ? { 'data-ad-layout': layout } : {})}
      aria-label="Advertisement"
    />
  );
}
