import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

/**
 * Run auth callbacks without `navigator.locks`. The default Web Locks path
 * conflicts with React Strict Mode (double mount) and concurrent `getUser()`
 * calls, causing "Lock … was released because another request stole it" /
 * AbortError. Server-side refresh still uses cookies as usual.
 *
 * @see https://github.com/supabase/supabase-js/issues/2111
 */
const browserAuthLock: NonNullable<SupabaseClientOptions<any>['auth']>['lock'] = async (
  _name,
  _acquireTimeout,
  fn
) => {
  return fn();
};

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey, {
    auth: {
      lock: browserAuthLock,
    },
  });
}

