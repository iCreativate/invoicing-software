import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyPayFastSignature } from '@/lib/payments/payfast';
import { normalizePlanId } from '@/lib/billing/entitlements';
import { writeAuditLog } from '@/lib/audit/log';
import { checkRateLimit, clientIp, rateLimitResponse } from '@/lib/security/rateLimit';
import { logger } from '@/lib/observability/logger';

function asStringMap(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj ?? {})) out[k] = String(v ?? '');
  return out;
}

export async function POST(request: Request) {
  try {
    const rl = await checkRateLimit({
      key: `billing:webhook:${clientIp(request)}`,
      limit: 120,
      windowSec: 60,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const text = await request.text();
    const params = new URLSearchParams(text);
    const body: Record<string, string> = {};
    params.forEach((v, k) => (body[k] = v));

    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    const sig = verifyPayFastSignature(asStringMap(body), passphrase);
    if (!sig.ok) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const mPaymentId = String(body.m_payment_id ?? '');
    const paymentStatus = String(body.payment_status ?? '').toUpperCase();
    const token = body.token ? String(body.token) : null;
    const externalEventId = body.pf_payment_id
      ? `saas_pf:${body.pf_payment_id}`
      : `saas_pf_session:${mPaymentId}:${paymentStatus}`;

    const admin = createSupabaseAdminClient();

    const { error: evtErr } = await admin.from('payment_events').insert({
      provider: 'payfast_saas',
      external_event_id: externalEventId,
      event_type: paymentStatus || 'notify',
      payload: body,
    });
    if (evtErr) {
      const msg = String((evtErr as any).message ?? '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return NextResponse.json({ success: true, data: { duplicate: true } });
      }
    }

    const { data: sub, error: subErr } = await admin
      .from('platform_subscriptions')
      .select('id,owner_id,plan')
      .eq('m_payment_id', mPaymentId)
      .maybeSingle();

    if (subErr || !sub) {
      logger.warn('billing.webhook.unknown_payment', { mPaymentId });
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }

    const ownerId = String((sub as any).owner_id);
    const plan = normalizePlanId((sub as any).plan);

    if (paymentStatus === 'COMPLETE') {
      const periodEnd = new Date();
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

      await admin
        .from('platform_subscriptions')
        .update({
          status: 'active',
          plan,
          payfast_token: token,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
          meta: body,
        })
        .eq('owner_id', ownerId);

      await admin
        .from('company_profiles')
        .update({ subscription_plan: plan, updated_at: new Date().toISOString() })
        .eq('owner_id', ownerId);

      await writeAuditLog(admin, {
        ownerId,
        actorUserId: null,
        action: 'settings.updated',
        entityType: 'platform_subscription',
        entityId: ownerId,
        meta: { event: 'activated', plan, provider: 'payfast_saas' },
      });

      await admin.from('notifications').insert({
        owner_id: ownerId,
        title: 'Plan upgraded',
        body: `Your TimelyInvoices ${plan} subscription is active.`,
        href: '/billing',
        entity_type: 'billing',
        entity_id: ownerId,
      });
    } else if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
      await admin
        .from('platform_subscriptions')
        .update({
          status: paymentStatus === 'CANCELLED' ? 'cancelled' : 'past_due',
          updated_at: new Date().toISOString(),
          meta: body,
        })
        .eq('owner_id', ownerId);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('billing.webhook.failed', { message: e?.message });
    return NextResponse.json({ success: false, error: e?.message ?? 'Webhook error' }, { status: 500 });
  }
}
