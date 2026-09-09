import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';
import { writeCrewAudit } from '@/lib/crew/audit';
import { normalizePlanId } from '@/lib/billing/entitlements';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { ctx } = gate;
    const admin = ctx.admin;

    const { data: claim, error: claimErr } = await admin
      .from('eft_payment_claims')
      .select('id,owner_id,plan,amount_cents,reference,status')
      .eq('id', id)
      .maybeSingle();
    if (claimErr) throw claimErr;
    if (!claim) return NextResponse.json({ success: false, error: 'Claim not found.' }, { status: 404 });
    if (String((claim as any).status) !== 'pending') {
      return NextResponse.json({ success: false, error: 'Claim is not pending.' }, { status: 409 });
    }

    const ownerId = String((claim as any).owner_id);
    const plan = normalizePlanId((claim as any).plan);
    if (plan !== 'pro' && plan !== 'business') {
      return NextResponse.json({ success: false, error: 'Invalid plan on claim.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const periodEnd = new Date();
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

    const { error: updClaimErr } = await admin
      .from('eft_payment_claims')
      .update({
        status: 'approved',
        reviewed_at: now,
        reviewed_by: ctx.userId,
        note: null,
      })
      .eq('id', id)
      .eq('status', 'pending');
    if (updClaimErr) throw updClaimErr;

    await admin.from('platform_subscriptions').upsert(
      {
        owner_id: ownerId,
        plan,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        suspended_at: null,
        terminated_at: null,
        updated_at: now,
        meta: {
          activated_via: 'eft',
          eft_claim_id: id,
          reference: (claim as any).reference,
        },
      },
      { onConflict: 'owner_id' }
    );

    await admin
      .from('company_profiles')
      .update({
        subscription_plan: plan,
        account_status: 'active',
        suspended_at: null,
        terminated_at: null,
        updated_at: now,
      })
      .eq('owner_id', ownerId);

    await admin.from('notifications').insert({
      owner_id: ownerId,
      title: 'Plan activated (EFT)',
      body: `Your TimelyInvoices ${plan} subscription is active after EFT confirmation.`,
      href: '/settings/billing',
      entity_type: 'billing',
      entity_id: ownerId,
    });

    await writeCrewAudit(admin, {
      actorUserId: ctx.userId,
      actorEmail: ctx.email,
      action: 'eft.approve',
      targetOwnerId: ownerId,
      entityType: 'eft_payment_claim',
      entityId: id,
      meta: { plan, reference: (claim as any).reference },
    });

    return NextResponse.json({ success: true, data: { id, plan, ownerId } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Approve failed' }, { status: 500 });
  }
}
