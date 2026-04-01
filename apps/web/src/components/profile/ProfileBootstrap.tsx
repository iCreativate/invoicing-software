'use client';

import { useEffect, useRef } from 'react';

/** Runs once per full page load to attach referral attribution from signup metadata. */
export function ProfileBootstrap() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        await fetch('/api/profile/sync-referral', { method: 'POST' });
        await fetch('/api/profile/apply-signup-metadata', { method: 'POST' });
      } catch {
        // ignore
      }
    })();
  }, []);
  return null;
}
