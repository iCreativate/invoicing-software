import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { admin } = gate.ctx;

    const url = new URL(request.url);
    const q = String(url.searchParams.get('q') ?? '').trim().replace(/[%_,]/g, '');
    const pageRaw = parseInt(String(url.searchParams.get('page') ?? '1'), 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const sizeRaw = parseInt(String(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE)), 10);
    const pageSize = Number.isFinite(sizeRaw)
      ? Math.min(MAX_PAGE_SIZE, Math.max(1, sizeRaw))
      : DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const selectCols =
      'owner_id,company_name,email,subscription_plan,account_status,suspended_at,terminated_at,created_at,updated_at';

    let query = admin
      .from('company_profiles')
      .select(selectCols, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Empty/missing query → all accounts (paginated). Present query → filter.
    if (q.length > 0) {
      query = query.or(`email.ilike.%${q}%,company_name.ilike.%${q}%`);
    }

    const { data: companies, error, count } = await query;
    if (error) throw error;

    const ownerIds = (companies ?? []).map((c: any) => String(c.owner_id)).filter(Boolean);
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

    const items = (companies ?? []).map((c: any) => {
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
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        subscription: sub
          ? {
              plan: String(sub.plan),
              status: String(sub.status),
              currentPeriodEnd: sub.current_period_end,
            }
          : null,
      };
    });

    const total = typeof count === 'number' ? count : items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Search failed' }, { status: 500 });
  }
}
