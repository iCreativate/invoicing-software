import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { admin } = gate.ctx;

    const [pendingRes, activeRes, suspendedRes, terminatedRes] = await Promise.all([
      admin.from('eft_payment_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      admin.from('platform_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('company_profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'suspended'),
      admin.from('company_profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'terminated'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingEfts: pendingRes.count ?? 0,
        activeSubscriptions: activeRes.count ?? 0,
        suspendedAccounts: suspendedRes.count ?? 0,
        terminatedAccounts: terminatedRes.count ?? 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Overview failed' }, { status: 500 });
  }
}
