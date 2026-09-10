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
    const status = String(url.searchParams.get('status') ?? 'all').toLowerCase();
    const allowed = new Set(['active', 'inactive', 'past_due', 'cancelled', 'cancel_at_period_end', 'all']);
    const filter = allowed.has(status) ? status : 'all';

    let q = admin
      .from('platform_subscriptions')
      .select(
        'id,owner_id,plan,status,current_period_end,cancel_at_period_end,suspended_at,terminated_at,created_at,updated_at,meta'
      )
      .order('updated_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') q = q.eq('status', filter);

    const { data: subs, error } = await q;
    if (error) throw error;

    const ownerIds = Array.from(new Set((subs ?? []).map((s: any) => String(s.owner_id))));
    let companies: Record<string, { companyName: string | null; email: string | null; accountStatus: string }> = {};
    if (ownerIds.length) {
      const { data: rows } = await admin
        .from('company_profiles')
        .select('owner_id,company_name,email,account_status')
        .in('owner_id', ownerIds);
      for (const r of rows ?? []) {
        companies[String((r as any).owner_id)] = {
          companyName: (r as any).company_name != null ? String((r as any).company_name) : null,
          email: (r as any).email != null ? String((r as any).email) : null,
          accountStatus: (r as any).account_status != null ? String((r as any).account_status) : 'active',
        };
      }
    }

    const items = (subs ?? []).map((s: any) => ({
      id: String(s.id),
      ownerId: String(s.owner_id),
      plan: String(s.plan),
      status: String(s.status),
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
      suspendedAt: s.suspended_at,
      terminatedAt: s.terminated_at,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      company: companies[String(s.owner_id)] ?? null,
    }));

    return NextResponse.json({ success: true, data: { items } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'List failed' }, { status: 500 });
  }
}
