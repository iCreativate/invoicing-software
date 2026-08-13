import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Postgres sliding-window rate limit (multi-instance safe via service role).
 * Falls open (allows) if the table is missing so local/dev without migration still works.
 */
export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<RateLimitResult> {
  const windowMs = Math.max(1, input.windowSec) * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

  try {
    const admin = createSupabaseAdminClient();
    const { data: existing, error: selErr } = await admin
      .from('rate_limit_buckets')
      .select('count')
      .eq('key', input.key)
      .eq('window_start', windowStart)
      .maybeSingle();

    if (selErr) {
      const msg = String((selErr as { message?: string }).message ?? '').toLowerCase();
      if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('schema cache')) {
        return { ok: true, remaining: input.limit, retryAfterSec: input.windowSec };
      }
      throw selErr;
    }

    const count = Number((existing as { count?: number } | null)?.count ?? 0);
    if (count >= input.limit) {
      const elapsed = Date.now() - new Date(windowStart).getTime();
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
      return { ok: false, remaining: 0, retryAfterSec };
    }

    if (existing) {
      await admin
        .from('rate_limit_buckets')
        .update({ count: count + 1 })
        .eq('key', input.key)
        .eq('window_start', windowStart);
    } else {
      await admin.from('rate_limit_buckets').insert({
        key: input.key,
        window_start: windowStart,
        count: 1,
      });
    }

    return { ok: true, remaining: Math.max(0, input.limit - count - 1), retryAfterSec: input.windowSec };
  } catch {
    return { ok: true, remaining: input.limit, retryAfterSec: input.windowSec };
  }
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSec),
    },
  });
}

export function clientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
