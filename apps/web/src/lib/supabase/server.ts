import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

/**
 * Server Supabase client. Pass the incoming `Request` from a Route Handler so native
 * apps can authenticate with `Authorization: Bearer <supabase_access_token>` (cookie
 * sessions are used when the header is absent).
 */
export async function createSupabaseServerClient(request?: Request): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseEnv();

  if (request) {
    const auth = request.headers.get('authorization') ?? request.headers.get('Authorization') ?? '';
    const m = auth.match(/^Bearer\s+(\S+)/i);
    if (m?.[1]) {
      return createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${m[1]}` } },
      });
    }
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies; middleware/route handlers can.
        }
      },
    },
  });
}

