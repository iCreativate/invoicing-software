import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, clientIp, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const rl = await checkRateLimit({
      key: `quote:view:${clientIp(request)}`,
      limit: 120,
      windowSec: 60,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const body = await request.json().catch(() => null);
    const shareId = String(body?.shareId ?? '').trim();
    if (!shareId) return NextResponse.json({ success: false, error: 'shareId required' }, { status: 400 });

    const admin = createSupabaseAdminClient();
    const { data: quote, error } = await admin
      .from('quotes')
      .select('id,status,viewed_at')
      .eq('public_share_id', shareId)
      .maybeSingle();
    if (error || !quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });

    const status = String((quote as any).status ?? '');
    if (status === 'draft' || status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Quote not available' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if (!(quote as any).viewed_at) patch.viewed_at = new Date().toISOString();
    if (status === 'sent') patch.status = 'viewed';
    if (Object.keys(patch).length) {
      await admin.from('quotes').update(patch).eq('id', (quote as any).id);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed' }, { status: 500 });
  }
}
