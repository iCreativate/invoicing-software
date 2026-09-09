import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';
import { writeCrewAudit } from '@/lib/crew/audit';

type Params = { params: Promise<{ ownerId: string }> };

const ACTIONS = new Set(['suspend', 'reinstate', 'terminate']);

export async function POST(request: Request, { params }: Params) {
  try {
    const { ownerId: rawOwnerId } = await params;
    const ownerId = String(rawOwnerId ?? '').trim();
    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'Missing owner id.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { ctx } = gate;
    const admin = ctx.admin;

    const body = await request.json().catch(() => null);
    const action = String(body?.action ?? '').toLowerCase();
    if (!ACTIONS.has(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be suspend | reinstate | terminate' },
        { status: 400 }
      );
    }
    const note = body?.note != null ? String(body.note).slice(0, 500) : null;

    const { data: company, error: coErr } = await admin
      .from('company_profiles')
      .select('owner_id,company_name,account_status')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (coErr) throw coErr;
    if (!company) {
      return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let accountStatus = 'active';
    let companyPatch: Record<string, unknown> = { updated_at: now };
    let subPatch: Record<string, unknown> = { updated_at: now };

    if (action === 'suspend') {
      accountStatus = 'suspended';
      companyPatch = {
        ...companyPatch,
        account_status: 'suspended',
        suspended_at: now,
        terminated_at: null,
      };
      subPatch = { ...subPatch, suspended_at: now, terminated_at: null };
    } else if (action === 'reinstate') {
      accountStatus = 'active';
      companyPatch = {
        ...companyPatch,
        account_status: 'active',
        suspended_at: null,
        terminated_at: null,
      };
      subPatch = { ...subPatch, suspended_at: null, terminated_at: null };
    } else if (action === 'terminate') {
      // Soft terminate: mark cancelled + flag; do not hard-delete data.
      accountStatus = 'terminated';
      companyPatch = {
        ...companyPatch,
        account_status: 'terminated',
        terminated_at: now,
        suspended_at: null,
        subscription_plan: 'free',
      };
      subPatch = {
        ...subPatch,
        status: 'cancelled',
        cancel_at_period_end: false,
        terminated_at: now,
        suspended_at: null,
        plan: 'free',
      };
    }

    const { error: updCoErr } = await admin.from('company_profiles').update(companyPatch).eq('owner_id', ownerId);
    if (updCoErr) throw updCoErr;

    await admin.from('platform_subscriptions').update(subPatch).eq('owner_id', ownerId);

    await writeCrewAudit(admin, {
      actorUserId: ctx.userId,
      actorEmail: ctx.email,
      action: `account.${action}`,
      targetOwnerId: ownerId,
      entityType: 'company_profile',
      entityId: ownerId,
      meta: { note, accountStatus, companyName: (company as any).company_name },
    });

    return NextResponse.json({
      success: true,
      data: { ownerId, action, accountStatus },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Action failed' }, { status: 500 });
  }
}
