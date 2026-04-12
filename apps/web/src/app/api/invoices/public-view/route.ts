import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isTimelineTableUnavailable, logInvoiceTimelineEvent } from '@/lib/invoices/timelineServer';

/** Record a public "view" for the shared invoice (no auth). Throttled to once per hour per invoice. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shareId = String(body.shareId ?? '').trim();
    if (!shareId) return NextResponse.json({ success: false, error: 'shareId required' }, { status: 400 });

    const supabase = await createSupabaseServerClient(request);

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id')
      .eq('public_share_id', shareId)
      .maybeSingle();

    if (invErr || !inv) {
      return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 });
    }

    const invoiceId = String((inv as any).id);

    const { data: last, error: lastErr } = await supabase
      .from('invoice_timeline_events')
      .select('occurred_at')
      .eq('invoice_id', invoiceId)
      .eq('event_type', 'viewed')
      .order('occurred_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr && isTimelineTableUnavailable(lastErr)) {
      return NextResponse.json({ success: true, data: { skipped: true } });
    }

    if (last?.occurred_at) {
      const delta = Date.now() - new Date(String(last.occurred_at)).getTime();
      if (delta < 3600e3) {
        return NextResponse.json({ success: true, data: { skipped: true } });
      }
    }

    await logInvoiceTimelineEvent(supabase, invoiceId, 'viewed', { via: 'public_share' });

    return NextResponse.json({ success: true, data: { logged: true } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed.' }, { status: 500 });
  }
}
