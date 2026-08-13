import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import {
  canEditRecords,
  canManageBilling,
  canManageTeam,
  canRecordPayments,
} from '@/lib/permissions/team';
import { demoSuccessResponse } from '@/lib/demo/apiGate';

export async function GET(request: Request) {
  try {
    const demo = demoSuccessResponse(request, {
      workspaceOwnerId: 'demo-owner',
      permission: 'owner',
      actorUserId: 'demo-owner',
      canEdit: true,
      canManageTeam: true,
      canManageBilling: true,
      canRecordPayments: true,
    });
    if (demo) return demo;

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    const permission = ctx.permission;
    return NextResponse.json({
      success: true,
      data: {
        workspaceOwnerId: ctx.workspaceOwnerId,
        permission,
        actorUserId: ctx.actorUserId,
        canEdit: canEditRecords(permission),
        canManageTeam: canManageTeam(permission),
        canManageBilling: canManageBilling(permission),
        canRecordPayments: canRecordPayments(permission),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed' }, { status: 500 });
  }
}
