import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    return NextResponse.json({
      success: true,
      data: {
        workspaceOwnerId: ctx.workspaceOwnerId,
        permission: ctx.permission,
        actorUserId: ctx.actorUserId,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed' }, { status: 500 });
  }
}
