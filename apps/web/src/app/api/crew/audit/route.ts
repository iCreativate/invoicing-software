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
    const limitRaw = Number(url.searchParams.get('limit') ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 50;

    const { data, error } = await admin
      .from('crew_audit_log')
      .select('id,actor_user_id,actor_email,action,target_owner_id,entity_type,entity_id,meta,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    const items = (data ?? []).map((r: any) => ({
      id: String(r.id),
      actorUserId: r.actor_user_id != null ? String(r.actor_user_id) : null,
      actorEmail: r.actor_email != null ? String(r.actor_email) : null,
      action: String(r.action),
      targetOwnerId: r.target_owner_id != null ? String(r.target_owner_id) : null,
      entityType: r.entity_type != null ? String(r.entity_type) : null,
      entityId: r.entity_id != null ? String(r.entity_id) : null,
      meta: r.meta ?? {},
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, data: { items } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Audit list failed' }, { status: 500 });
  }
}
