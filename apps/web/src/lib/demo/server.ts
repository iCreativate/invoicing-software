/** Server/edge helpers for cookie demo mode (no Supabase). */

export function cookieHeaderHasDemo(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return (
    /(?:^|;\s*)ti_demo=1(?:;|$)/.test(cookieHeader) ||
    /(?:^|;\s*)ti_demo_ui=1(?:;|$)/.test(cookieHeader) ||
    /(?:^|;\s*)ti_supabase_down=1(?:;|$)/.test(cookieHeader)
  );
}

export function requestIsDemo(request: Request): boolean {
  return cookieHeaderHasDemo(request.headers.get('cookie'));
}

/** True when any Supabase auth cookie is present (avoids pointless getUser network calls). */
export function hasSupabaseAuthCookie(
  cookies: { name: string; value: string }[] | Iterable<{ name: string; value: string }>
): boolean {
  for (const c of cookies) {
    const n = c.name;
    if (n.startsWith('sb-') && (n.includes('auth-token') || n.endsWith('-auth-token'))) return true;
    if (n.includes('supabase') && n.includes('auth')) return true;
  }
  return false;
}

export async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  const pending = Promise.resolve(promise);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      pending,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    // If we timed out first, swallow a late rejection so it is not an unhandledRejection.
    void pending.catch(() => undefined);
  }
}

export function isTransientDbError(err: unknown): boolean {
  const m = `${(err as { message?: string })?.message ?? ''} ${String(err ?? '')}`.toLowerCase();
  return (
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('enotfound') ||
    m.includes('econnrefused') ||
    m.includes('network') ||
    m.includes('authretryable') ||
    m.includes('503') ||
    m.includes('connection') && m.includes('database')
  );
}

export function isMissingRelationError(err: unknown): boolean {
  const m = `${(err as { message?: string; code?: string })?.message ?? ''} ${(err as { code?: string })?.code ?? ''} ${String(err ?? '')}`.toLowerCase();
  return m.includes('schema cache') || m.includes('pgrst205') || m.includes('does not exist') || m.includes('42p01');
}

export async function withTimeoutRetry<T>(run: () => PromiseLike<T>, ms: number, retries = 1): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await withTimeout(run(), ms);
    } catch (e) {
      last = e;
      if (!isTransientDbError(e) || i === retries) throw e;
    }
  }
  throw last;
}
