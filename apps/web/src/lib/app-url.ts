/**
 * Public origin for auth redirects, share/pay links, and webhooks.
 * Set NEXT_PUBLIC_APP_URL on Netlify to your live URL (no trailing slash) so it matches
 * Supabase → Authentication → URL Configuration → Redirect URLs exactly.
 */

function trimOrigin(raw: string | undefined | null): string {
  return String(raw ?? "").trim().replace(/\/$/, "");
}

/** Browser-safe: prefers env, then window.location.origin. */
export function getPublicAppOrigin(): string {
  const env = trimOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (typeof window !== "undefined") {
    return env || window.location.origin;
  }
  return env;
}

/**
 * Server-side app URL for share/pay/invite/cron links.
 * Production: requires NEXT_PUBLIC_APP_URL (no silent localhost).
 * Development: falls back to http://localhost:3000 when unset.
 */
export function requirePublicAppUrl(): string {
  const env = trimOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (env) return env;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required in production (no trailing slash). Share/pay links cannot use localhost."
    );
  }
  return "http://localhost:3000";
}
