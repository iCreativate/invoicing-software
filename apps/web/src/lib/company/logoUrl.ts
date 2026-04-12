/**
 * Stored logo paths are Supabase Storage object keys: `<workspace-owner-uuid>/logo.<ext>`
 * Extension comes from the uploaded filename and must match what we allow through the proxy.
 */
const STORAGE_LOGO_PATH_RE = /^[0-9a-fA-F-]{36}\/logo\.[a-z0-9]{1,20}$/i;

export function isStorageLogoObjectPath(path: string): boolean {
  return STORAGE_LOGO_PATH_RE.test(path.trim());
}

/** img src for company logo: http(s) URLs unchanged; storage keys go through the signing proxy. */
export function companyLogoImgSrc(logoPath: string | null | undefined): string | null {
  if (logoPath == null) return null;
  const p = logoPath.trim();
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  return `/api/storage/logo?path=${encodeURIComponent(p)}`;
}
