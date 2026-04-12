/**
 * Stored logo paths are Supabase Storage object keys: `<workspace-id>/logo.<ext>`
 * Workspace id is a standard UUID or a 32-char hex id (no hyphens).
 */
const STORAGE_LOGO_PATH_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32})\/logo\.[a-z0-9]{1,20}$/i;

export function isStorageLogoObjectPath(path: string): boolean {
  return STORAGE_LOGO_PATH_RE.test(path.trim());
}

/** Used when Storage returns an untyped Blob so browsers still render <img> correctly. */
export function guessLogoContentType(path: string): string {
  const ext = path.trim().split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    avif: 'image/avif',
    bmp: 'image/bmp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext] ?? 'application/octet-stream';
}

/** img src for company logo: http(s) URLs unchanged; storage keys go through the signing proxy. */
export function companyLogoImgSrc(logoPath: string | null | undefined): string | null {
  if (logoPath == null) return null;
  const p = logoPath.trim();
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  return `/api/storage/logo?path=${encodeURIComponent(p)}`;
}
