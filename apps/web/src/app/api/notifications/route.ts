import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { demoSuccessResponse } from '@/lib/demo/apiGate';
import { demoNotifications } from '@/lib/demo/fixtures';

export async function GET(request: Request) {
  try {
    const demo = demoSuccessResponse(request, demoNotifications());
    if (demo) return demo;

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, href, entity_type, entity_id, read_at, created_at, user_id')
      .eq('owner_id', ctx.workspaceOwnerId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      const msg = String((error as { message?: string }).message ?? '').toLowerCase();
      if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('schema cache')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const rows = (data ?? []).map((row: any) => ({
      id: String(row.id),
      title: String(row.title ?? ''),
      body: row.body != null ? String(row.body) : null,
      href: row.href != null ? String(row.href) : null,
      entityType: row.entity_type != null ? String(row.entity_type) : null,
      entityId: row.entity_id != null ? String(row.entity_id) : null,
      readAt: row.read_at != null ? String(row.read_at) : null,
      createdAt: String(row.created_at ?? ''),
    }));

    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load notifications.' }, { status: 500 });
  }
}
