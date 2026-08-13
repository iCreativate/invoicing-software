import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/audit/log';
import { getResend, getResendFromEmail, isResendConfigured } from '@/lib/integrations/messaging';
import { checkRateLimit, clientIp, rateLimitResponse } from '@/lib/security/rateLimit';
import { logger } from '@/lib/observability/logger';

export async function POST(request: Request) {
  try {
    const rl = await checkRateLimit({
      key: `quote:respond:${clientIp(request)}`,
      limit: 30,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const body = await request.json().catch(() => null);
    const shareId = String(body?.shareId ?? '').trim();
    const action = String(body?.action ?? '').toLowerCase();
    if (!shareId) return NextResponse.json({ success: false, error: 'shareId required' }, { status: 400 });
    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ success: false, error: 'action must be accept|decline' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: quote, error } = await admin
      .from('quotes')
      .select(
        'id,owner_id,status,quote_number,total_amount,currency,accepted_at,declined_at,client:clients(name)'
      )
      .eq('public_share_id', shareId)
      .maybeSingle();
    if (error || !quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });

    const status = String((quote as any).status ?? '');
    if (['converted', 'declined', 'accepted'].includes(status) || (quote as any).accepted_at || (quote as any).declined_at) {
      return NextResponse.json({
        success: true,
        data: { status, alreadyFinal: true },
      });
    }
    if (status === 'draft' || status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Quote not available' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const ownerId = String((quote as any).owner_id);
    const patch =
      action === 'accept'
        ? { status: 'accepted', accepted_at: now, viewed_at: now }
        : { status: 'declined', declined_at: now, viewed_at: now };

    const { error: updErr } = await admin.from('quotes').update(patch).eq('id', (quote as any).id);
    if (updErr) throw updErr;

    await writeAuditLog(admin, {
      ownerId,
      actorUserId: null,
      action: action === 'accept' ? 'quote.accepted' : 'quote.declined',
      entityType: 'quote',
      entityId: String((quote as any).id),
      meta: { shareId },
    });

    await admin.from('notifications').insert({
      owner_id: ownerId,
      title: action === 'accept' ? 'Quote accepted' : 'Quote declined',
      body: `${(quote as any).quote_number ?? 'Quote'} was ${action}ed by the client.`,
      href: `/quotes/${(quote as any).id}`,
      entity_type: 'quote',
      entity_id: (quote as any).id,
    });

    if (isResendConfigured()) {
      try {
        const { data: profile } = await admin
          .from('company_profiles')
          .select('email,company_name')
          .eq('owner_id', ownerId)
          .maybeSingle();
        const to = (profile as any)?.email ? String((profile as any).email) : null;
        if (to) {
          const resend = await getResend();
          if (resend) {
            await resend.emails.send({
              from: getResendFromEmail(),
              to: [to],
              subject: `Quote ${(quote as any).quote_number ?? ''} ${action}ed`,
              html: `<p>Your quote <strong>${(quote as any).quote_number ?? ''}</strong> was <strong>${action}ed</strong>.</p>
                     <p>Open TimelyInvoices to convert it to an invoice if accepted.</p>`,
            });
          }
        }
      } catch (e: unknown) {
        logger.warn('quote.respond.notify_failed', {
          message: e instanceof Error ? e.message : 'notify failed',
        });
      }
    }

    return NextResponse.json({ success: true, data: { status: action === 'accept' ? 'accepted' : 'declined' } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed' }, { status: 500 });
  }
}
