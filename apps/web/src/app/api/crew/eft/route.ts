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
    const status = String(url.searchParams.get('status') ?? 'pending').toLowerCase();
    const allowed = new Set(['pending', 'approved', 'rejected', 'all']);
    const filter = allowed.has(status) ? status : 'pending';

    let q = admin
      .from('eft_payment_claims')
      .select('id,owner_id,plan,amount_cents,reference,status,note,created_at,reviewed_at,reviewed_by')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') q = q.eq('status', filter);

    const { data: claims, error } = await q;
    if (error) throw error;

    const ownerIds = Array.from(new Set((claims ?? []).map((c: any) => String(c.owner_id))));
    let companies: Record<string, { companyName: string | null; email: string | null }> = {};
    if (ownerIds.length) {
      const { data: rows } = await admin
        .from('company_profiles')
        .select('owner_id,company_name,email')
        .in('owner_id', ownerIds);
      for (const r of rows ?? []) {
        companies[String((r as any).owner_id)] = {
          companyName: (r as any).company_name != null ? String((r as any).company_name) : null,
          email: (r as any).email != null ? String((r as any).email) : null,
        };
      }
    }

    const items = (claims ?? []).map((c: any) => ({
      id: String(c.id),
      ownerId: String(c.owner_id),
      plan: String(c.plan),
      amountCents: Number(c.amount_cents),
      reference: String(c.reference),
      status: String(c.status),
      note: c.note != null ? String(c.note) : null,
      createdAt: c.created_at,
      reviewedAt: c.reviewed_at,
      reviewedBy: c.reviewed_by,
      company: companies[String(c.owner_id)] ?? null,
    }));

    return NextResponse.json({ success: true, data: { items } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'List failed' }, { status: 500 });
  }
}
