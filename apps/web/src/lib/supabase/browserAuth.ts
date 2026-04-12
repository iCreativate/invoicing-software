import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from './browser';

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

/**
 * Resolves the current user from Supabase. If cookies hold a dead session (common after
 * env/project changes or revoked sessions), clears storage via signOut so the client stops
 * throwing AuthApiError on every getUser/refresh.
 */
export async function getBrowserUserSafe(): Promise<User | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isStaleSessionError(error)) {
      await supabase.auth.signOut();
    }
    return null;
  }
  return data.user ?? null;
}
