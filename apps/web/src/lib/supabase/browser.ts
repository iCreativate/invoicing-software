import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { getSupabaseEnv } from './env';

/**
 * Run auth callbacks without `navigator.locks`. The default Web Locks path
 * conflicts with React Strict Mode (double mount) and concurrent `getUser()`
 * calls, causing "Lock … was released because another request stole it" /
 * AbortError. Server-side refresh still uses cookies as usual.
 *
 * @see https://github.com/supabase/supabase-js/issues/2111
 */
const browserAuthLock: NonNullable<SupabaseClientOptions<'public'>['auth']>['lock'] = async (
  _name,
  _acquireTimeout,
  fn
) => {
  return fn();
};

const noopAuthStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

const INERT_FLAG = 'ti_supabase_inert';
const DOWN_COOKIE = 'ti_supabase_down=1';

let cachedBrowserClient: SupabaseClient | null = null;
let cachedBrowserMode: 'live' | 'inert' | null = null;

function resetBrowserClientCache() {
  cachedBrowserClient = null;
  cachedBrowserMode = null;
}

function hasCookiePrefix(prefix: string): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(prefix));
}

/** True only for explicit sample-dashboard cookies. Live Supabase must send the user JWT. */
export function shouldUseInertSupabaseBrowserClient(): boolean {
  if (typeof document === 'undefined') return false;
  return isDemoUiActive() && hasCookiePrefix('ti_demo_ui=1');
}

export function markSupabaseBrowserInert(): void {
  if (typeof document === 'undefined') return;
  resetBrowserClientCache();
  try {
    sessionStorage.setItem(INERT_FLAG, '1');
  } catch {
    // ignore
  }
  document.cookie = `${DOWN_COOKIE}; path=/; max-age=${60 * 60 * 6}; samesite=lax`;
}

export function clearSupabaseBrowserInert(): void {
  if (typeof document === 'undefined') return;
  resetBrowserClientCache();
  try {
    sessionStorage.removeItem(INERT_FLAG);
  } catch {
    // ignore
  }
  document.cookie = 'ti_supabase_down=; path=/; max-age=0; samesite=lax';
}

/** Drop persisted GoTrue session material so auth-js will not call /token?grant_type=refresh_token. */
export function purgeBrowserSupabaseAuth(): void {
  if (typeof document === 'undefined') return;
  resetBrowserClientCache();

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const k of keys) {
      if (k.startsWith('sb-') || k.includes('supabase')) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }

  try {
    const raw = document.cookie || '';
    for (const part of raw.split(';')) {
      const name = part.trim().split('=')[0];
      if (!name) continue;
      if (name.startsWith('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
      }
    }
  } catch {
    // ignore
  }
}

function createInertBrowserClient(url: string, anonKey: string): SupabaseClient {
  purgeBrowserSupabaseAuth();
  // Use supabase-js directly — @supabase/ssr's createBrowserClient overwrites
  // autoRefreshToken/persistSession and always wires cookie storage.
  return createClient(url, anonKey, {
    auth: {
      lock: browserAuthLock,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: noopAuthStorage,
    },
  });
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  const inert = shouldUseInertSupabaseBrowserClient();
  const mode: 'live' | 'inert' = inert ? 'inert' : 'live';

  if (typeof window !== 'undefined' && cachedBrowserClient && cachedBrowserMode === mode) {
    return cachedBrowserClient;
  }

  const client = inert
    ? createInertBrowserClient(url, anonKey)
    : createBrowserClient(url, anonKey, {
        auth: {
          lock: browserAuthLock,
        },
      });

  if (typeof window !== 'undefined') {
    cachedBrowserClient = client;
    cachedBrowserMode = mode;
  }

  return client;
}
