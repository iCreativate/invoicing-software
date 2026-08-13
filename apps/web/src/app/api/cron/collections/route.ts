import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { runCollectionsPass } from '@/lib/collections/runner';
import { logger } from '@/lib/observability/logger';
import { checkRateLimit, clientIp, rateLimitResponse } from '@/lib/security/rateLimit';

function requireCronSecret(request: Request) {
  if (process.env.VERCEL && request.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const reqUrl = new URL(request.url);
  if (reqUrl.searchParams.get('secret') === secret) return true;
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  return bearer === secret;
}

export async function GET(request: Request) {
  if (!requireCronSecret(request)) {
    if (!process.env.CRON_SECRET && !(process.env.VERCEL && request.headers.get('x-vercel-cron') === '1')) {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET is not configured.' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `cron:collections:${clientIp(request)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  try {
    const admin = createSupabaseAdminClient();
    const result = await runCollectionsPass(admin);
    logger.info('collections.cron.complete', result as unknown as Record<string, unknown>);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Collections cron failed';
    logger.error('collections.cron.failed', { message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
