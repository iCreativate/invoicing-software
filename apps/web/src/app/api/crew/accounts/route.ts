import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { admin } = gate.ctx;

    const url = new URL(request.url);
    const q = String(url.searchParams.get('q') ?? '').trim().replace(/[%_,]/g, '');
    if (q.length < 2) {
      return NextResponse.json({ success: true, data: { items: [] } });
    }

    const pattern = `%${q}%`;
    const [byEmail, byCompany] = await Promise.all([
      admin
        .from('company_profiles')
        .select(
          'owner_id,company_name,email,subscription_plan,account_status,suspended_at,terminated_at,updated_at'
        )
        .ilike('email', pattern)
        .limit(25),
      admin
        .from('company_profiles')
        .select(
          'owner_id,company_name,email,subscription_plan,account_status,suspended_at,terminated_at,updated_at'
        )
        .ilike('company_name', pattern)
        .limit(25),
    ]);
    if (byEmail.error) throw byEmail.error;
    if (byCompany.error) throw byCompany.error;

    const merged = new Map<string, any>();
    for (const r of [...(byEmail.data ?? []), ...(byCompany.data ?? [])]) {
      merged.set(String((r as any).owner_id), r);
    }
    const companies = Array.from(merged.values()).slice(0, 40);

    const ownerIds = companies.map((c: any) => String(c.owner_id)).filter(Boolean);
    let subsByOwner: Record<string, any> = {};
    if (ownerIds.length) {
      const { data: subs } = await admin
        .from('platform_subscriptions')
        .select('owner_id,plan,status,current_period_end,suspended_at,terminated_at')
        .in('owner_id', ownerIds);
      for (const s of subs ?? []) {
        subsByOwner[String((s as any).owner_id)] = s;
      }
    }

    const items = companies.map((c: any) => {
      const ownerId = String(c.owner_id);
      const sub = subsByOwner[ownerId];
      return {
        ownerId,
        companyName: c.company_name != null ? String(c.company_name) : null,
        email: c.email != null ? String(c.email) : null,
        subscriptionPlan: c.subscription_plan != null ? String(c.subscription_plan) : 'free',
        accountStatus: c.account_status != null ? String(c.account_status) : 'active',
        suspendedAt: c.suspended_at,
        terminatedAt: c.terminated_at,
        subscription: sub
          ? {
              plan: String(sub.plan),
              status: String(sub.status),
              currentPeriodEnd: sub.current_period_end,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: { items } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Search failed' }, { status: 500 });
  }
}
