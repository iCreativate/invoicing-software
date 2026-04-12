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

function extractLogosKeyFromStoragePathname(pathname: string): string | null {
  const m = pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/logos\/(.+)$/);
  if (!m) return null;
  try {
    const key = decodeURIComponent(m[1]);
    return isStorageLogoObjectPath(key) ? key : null;
  } catch {
    return null;
  }
}

/**
 * Resolves `company_profiles.logo_url` to the Storage object key our API expects.
 * Handles plain keys, leading slashes, and full Supabase Storage URLs (private buckets
 * must not be loaded as raw https in <img> — they 403).
 */
export function resolveLogosObjectKey(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (!s) return null;
  s = s.replace(/^\/+/, '');

  if (isStorageLogoObjectPath(s)) return s;

  try {
    const u = new URL(s);
    const key = extractLogosKeyFromStoragePathname(u.pathname);
    if (key) return key;
  } catch {
    // not an absolute URL
  }

  if (s.includes('/storage/v1/object/')) {
    const pathOnly = s.startsWith('/') ? s : `/${s}`;
    const key = extractLogosKeyFromStoragePathname(pathOnly);
    if (key) return key;
  }

  return null;
}

/** img src for company logo: Supabase keys go through the signing proxy; other https URLs as-is. */
export function companyLogoImgSrc(logoPath: string | null | undefined): string | null {
  if (logoPath == null) return null;
  const raw = logoPath.trim();
  if (!raw) return null;

  const key = resolveLogosObjectKey(raw);
  if (key) {
    return `/api/storage/logo?path=${encodeURIComponent(key)}`;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return null;
}
