/** Client-readable flags set by `/api/demo` (pairs with httpOnly `ti_demo`). */
export function isDemoUiActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => {
    const t = c.trim();
    return t.startsWith('ti_demo_ui=1') || t.startsWith('ti_supabase_down=1');
  });
}

/** Sample-dashboard fallback when Supabase is unreachable. Off in production unless explicitly enabled. */
export function demoLoginsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === '1') return true;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

export function friendlyAuthNetworkError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const m = raw.toLowerCase();
  if (
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('fetch failed') ||
    m.includes('authretryable')
  ) {
    return 'Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and try again.';
  }
  return raw || 'Sign in failed';
}
