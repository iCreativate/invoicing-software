import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { admin } = gate.ctx;

    const [
      workspacesRes,
      pendingRes,
      activeRes,
      suspendedRes,
      terminatedRes,
      recentRes,
    ] = await Promise.all([
      admin.from('company_profiles').select('id', { count: 'exact', head: true }),
      admin.from('eft_payment_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      admin.from('platform_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('company_profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'suspended'),
      admin.from('company_profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'terminated'),
      admin
        .from('company_profiles')
        .select('owner_id,company_name,email,subscription_plan,account_status,created_at')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const recentSignups = (recentRes.data ?? []).map((r: any) => ({
      ownerId: String(r.owner_id),
      companyName: r.company_name != null ? String(r.company_name) : null,
      email: r.email != null ? String(r.email) : null,
      subscriptionPlan: r.subscription_plan != null ? String(r.subscription_plan) : 'free',
      accountStatus: r.account_status != null ? String(r.account_status) : 'active',
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        workspaces: workspacesRes.count ?? 0,
        pendingEfts: pendingRes.count ?? 0,
        activeSubscriptions: activeRes.count ?? 0,
        suspendedAccounts: suspendedRes.count ?? 0,
        terminatedAccounts: terminatedRes.count ?? 0,
        recentSignups,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Overview failed' }, { status: 500 });
  }
}
