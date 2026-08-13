/** Supabase dashboard → Project Settings → API (URL + anon public key). */
export const SUPABASE_API_SETTINGS =
  'https://supabase.com/dashboard/project/_/settings/api' as const;

/**
 * URL and anon key for browser + server. Required in `.env.local` and on your host (Netlify env vars).
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      [
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.',
        `Get them from ${SUPABASE_API_SETTINGS}`,
        'Local: copy apps/web/.env.example to apps/web/.env.local and fill in values.',
        'Netlify: Site configuration → Environment variables → add both (scope: same for Builds and Runtime).',
      ].join(' ')
    );
  }

  // Fail fast on common misconfigurations that otherwise surface as `Failed to fetch`
  // inside supabase-auth refresh flows.
  if (!/^https:\/\/.+/i.test(url)) {
    throw new Error(
      [
        'NEXT_PUBLIC_SUPABASE_URL must be an https URL (e.g. https://YOUR_PROJECT.supabase.co).',
        `Get it from ${SUPABASE_API_SETTINGS}`,
        `Received: ${JSON.stringify(url)}`,
      ].join(' ')
    );
  }
  if (!/\.supabase\.co\/?$/i.test(url)) {
    throw new Error(
      [
        'NEXT_PUBLIC_SUPABASE_URL looks incorrect (expected *.supabase.co).',
        `Get it from ${SUPABASE_API_SETTINGS}`,
        `Received: ${JSON.stringify(url)}`,
      ].join(' ')
    );
  }

  return { url, anonKey };
}
