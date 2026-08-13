'use client';

import { useEffect, useRef } from 'react';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { purgeBrowserSupabaseAuth, shouldUseInertSupabaseBrowserClient } from '@/lib/supabase/browser';

/** Runs once per full page load to attach referral attribution from signup metadata. */
export function ProfileBootstrap() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    // Sample / unreachable modes must not leave GoTrue trying to refresh stale tokens.
    if (isDemoUiActive() || shouldUseInertSupabaseBrowserClient()) {
      purgeBrowserSupabaseAuth();
      return;
    }
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
