import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { canManageTeam } from '@/lib/permissions/team';
import { writeAuditLog } from '@/lib/audit/log';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import {
  buildEftReference,
  eftAmountCentsForPlan,
  getEftBankDetailsFromEnv,
  isPaidEftPlan,
} from '@/lib/billing/eft';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    if (ctx.permission !== 'owner' && !canManageTeam(ctx.permission) && ctx.permission !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only owners/admins can claim EFT payments.' }, { status: 403 });
    }

    const bank = getEftBankDetailsFromEnv();
    if (!bank.configured) {
      return NextResponse.json(
        { success: false, error: 'Pay by EFT is not configured yet. Contact support.' },
        { status: 503 }
      );
    }

    const rl = await checkRateLimit({
      key: `billing:eft-claim:${ctx.actorUserId}`,
      limit: 10,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const body = await request.json().catch(() => null);
    if (!isPaidEftPlan(body?.plan)) {
      return NextResponse.json({ success: false, error: 'Choose pro or business.' }, { status: 400 });
    }
    const plan = body.plan as 'pro' | 'business';
    const amountCents = eftAmountCentsForPlan(plan);
    if (!amountCents) {
      return NextResponse.json({ success: false, error: 'Invalid plan amount.' }, { status: 400 });
    }

    const reference = buildEftReference(ctx.workspaceOwnerId);

    const { data, error } = await supabase
      .from('eft_payment_claims')
      .insert({
        owner_id: ctx.workspaceOwnerId,
        plan,
        amount_cents: amountCents,
        reference,
        status: 'pending',
      })
      .select('id,plan,amount_cents,reference,status,created_at')
      .single();

    if (error) {
      const msg = String((error as any).message ?? '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return NextResponse.json(
          { success: false, error: 'You already have a pending EFT claim for this plan.' },
          { status: 409 }
        );
      }
      if (msg.includes('relation') || msg.includes('does not exist')) {
        return NextResponse.json(
          { success: false, error: 'EFT tables not migrated yet. Apply the EFT/crew SQL migration.' },
          { status: 503 }
        );
      }
      throw error;
    }

    await writeAuditLog(supabase, {
      ownerId: ctx.workspaceOwnerId,
      actorUserId: ctx.actorUserId,
      action: 'settings.updated',
      entityType: 'eft_payment_claim',
      entityId: String((data as any).id),
      meta: { event: 'eft_claim_created', plan, reference, amountCents },
    });

    return NextResponse.json({
      success: true,
      data: {
        claim: data,
        message: 'Thanks — we will activate your plan once we confirm the EFT.',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Claim failed' }, { status: 500 });
  }
}
