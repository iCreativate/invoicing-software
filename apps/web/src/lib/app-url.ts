/**
 * Public origin for auth redirects (password reset, email confirmation).
 * Set NEXT_PUBLIC_APP_URL on Netlify to your live URL (no trailing slash) so it matches
 * Supabase → Authentication → URL Configuration → Redirect URLs exactly.
 */
export function getPublicAppOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    return env || window.location.origin;
  }
  return env || '';
}
