import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { canManageTeam } from '@/lib/permissions/team';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    if (ctx.permission !== 'owner' && !canManageTeam(ctx.permission)) {
      return NextResponse.json({ success: false, error: 'Only owners/admins can cancel billing.' }, { status: 403 });
    }

    const { data: sub } = await supabase
      .from('platform_subscriptions')
      .select('id,status,payfast_token,current_period_end')
      .eq('owner_id', ctx.workspaceOwnerId)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ success: false, error: 'No subscription found.' }, { status: 404 });
    }

    await supabase
      .from('platform_subscriptions')
      .update({
        cancel_at_period_end: true,
        status: 'cancel_at_period_end',
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', ctx.workspaceOwnerId);

    // Soft-downgrade at period end is handled by reading cancel_at_period_end + period_end.
    // Immediate plan stays until period ends; do not wipe subscription_plan yet.

    await writeAuditLog(supabase, {
      ownerId: ctx.workspaceOwnerId,
      actorUserId: ctx.actorUserId,
      action: 'settings.updated',
      entityType: 'platform_subscription',
      entityId: ctx.workspaceOwnerId,
      meta: { event: 'cancel_requested' },
    });

    return NextResponse.json({
      success: true,
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: (sub as any).current_period_end ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Cancel failed' }, { status: 500 });
  }
}
