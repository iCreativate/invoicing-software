import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { canManageTeam } from '@/lib/permissions/team';
import { getPlan, normalizePlanId, type PlanId } from '@/lib/billing/entitlements';
import { buildPayFastPaymentUrl } from '@/lib/payments/payfast';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    if (!canManageTeam(ctx.permission) && ctx.permission !== 'owner') {
      // owner or admin only for SaaS billing
      if (ctx.permission !== 'admin') {
        return NextResponse.json({ success: false, error: 'Only owners/admins can manage billing.' }, { status: 403 });
      }
    }

    const rl = await checkRateLimit({
      key: `billing:checkout:${ctx.actorUserId}`,
      limit: 10,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const body = await request.json().catch(() => null);
    const plan = normalizePlanId(body?.plan);
    if (plan !== 'pro' && plan !== 'business') {
      return NextResponse.json({ success: false, error: 'Choose pro or business.' }, { status: 400 });
    }

    const def = getPlan(plan);
    if (def.priceZarMonthly <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid plan amount.' }, { status: 400 });
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    const sandbox = process.env.PAYFAST_SANDBOX === '1';
    if (!merchantId || !merchantKey) {
      return NextResponse.json(
        { success: false, error: 'PayFast is not configured (PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY).' },
        { status: 503 }
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const mPaymentId = crypto.randomUUID();

    const { error: upsertErr } = await supabase.from('platform_subscriptions').upsert(
      {
        owner_id: ctx.workspaceOwnerId,
        plan,
        status: 'inactive',
        m_payment_id: mPaymentId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' }
    );
    if (upsertErr) {
      const msg = String((upsertErr as any).message ?? '').toLowerCase();
      if (msg.includes('relation') || msg.includes('does not exist')) {
        return NextResponse.json(
          { success: false, error: 'Billing tables not migrated yet. Apply the hardening SQL migration.' },
          { status: 503 }
        );
      }
      throw upsertErr;
    }

    const pf = buildPayFastPaymentUrl({
      config: {
        merchantId,
        merchantKey,
        passphrase,
        sandbox,
        returnUrl: `${appUrl}/billing?upgraded=1`,
        cancelUrl: `${appUrl}/billing?cancelled=1`,
        notifyUrl: `${appUrl}/api/billing/webhook/payfast`,
      },
      mPaymentId,
      amount: def.priceZarMonthly,
      itemName: `TimelyInvoices ${def.label}`,
      itemDescription: `Monthly subscription — ${def.label}`,
      emailAddress: ctx.actorEmail ?? undefined,
      subscription: { frequency: 3, cycles: 0 },
    });

    await writeAuditLog(supabase, {
      ownerId: ctx.workspaceOwnerId,
      actorUserId: ctx.actorUserId,
      action: 'settings.updated',
      entityType: 'platform_subscription',
      entityId: ctx.workspaceOwnerId,
      meta: { event: 'checkout_started', plan },
    });

    return NextResponse.json({ success: true, data: { redirectUrl: pf.url, plan } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Checkout failed' }, { status: 500 });
  }
}
