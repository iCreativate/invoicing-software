import type { User } from '@supabase/supabase-js';
import { isDemoUiActive } from '@/lib/demo/accounts';
import {
  createSupabaseBrowserClient,
  markSupabaseBrowserInert,
  purgeBrowserSupabaseAuth,
} from './browser';

function isStaleSessionError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const m = (err.message ?? '').toLowerCase();
  const c = String(err.code ?? '').toLowerCase();
  return (
    m.includes('refresh token') ||
    m.includes('invalid refresh token') ||
    m.includes('jwt expired') ||
    m.includes('invalid jwt') ||
    c.includes('refresh') ||
    c === 'refresh_token_not_found'
  );
}

function isNetworkish(err: unknown): boolean {
  const m = String(err instanceof Error ? err.message : err ?? '').toLowerCase();
  return m.includes('failed to fetch') || m.includes('network') || m.includes('fetch failed') || m.includes('authretryable');
}

function neutralizeDeadSession(): void {
  try {
    purgeBrowserSupabaseAuth();
    markSupabaseBrowserInert();
  } catch {
    // ignore
  }
}

/**
 * Resolves the current user from Supabase. If cookies hold a dead session (common after
 * env/project changes or revoked sessions), clears storage so the client stops trying to
 * refresh against an unreachable host.
 *
 * Never throws — network / dead project / demo cookie all return null.
 */
export async function getBrowserUserSafe(): Promise<User | null> {
  if (isDemoUiActive()) return null;

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isStaleSessionError(error) || isNetworkish(error)) {
        neutralizeDeadSession();
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // ignore
        }
      }
      return null;
    }
    return data.user ?? null;
  } catch (err) {
    neutralizeDeadSession();
    if (!isNetworkish(err)) {
      console.warn('[auth] getBrowserUserSafe', err);
    }
    return null;
  }
}
