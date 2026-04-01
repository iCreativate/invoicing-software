import type { SupabaseClient } from '@supabase/supabase-js';
import { canEditRecords, canManageTeam } from '@/lib/permissions/team';

export type WorkspaceContext = {
  actorUserId: string;
  actorEmail: string | null;
  /** Business owner user id (invoices/quotes/expenses are scoped to this). */
  workspaceOwnerId: string;
  permission: string;
};

/**
 * Resolves workspace: solo user acts as owner; invited team members use employees.owner_id.
 */
export async function getWorkspaceContext(supabase: SupabaseClient): Promise<WorkspaceContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const actorUserId = user.id;
  const actorEmail = user.email ?? null;
  const email = actorEmail ?? '';

  const { data: emp, error } = await supabase.from('employees').select('owner_id,permission').eq('email', email).maybeSingle();

  if (error) {
    const msg = String((error as any).message ?? '').toLowerCase();
    if (!msg.includes('permission') && !msg.includes('column') && !msg.includes('does not exist')) {
      throw error;
    }
  }

  const empRow = emp as { owner_id?: string | null; permission?: string | null } | null;
  if (empRow?.owner_id) {
    return {
      actorUserId,
      actorEmail,
      workspaceOwnerId: String(empRow.owner_id),
      permission: String(empRow.permission ?? 'member'),
    };
  }

  return {
    actorUserId,
    actorEmail,
    workspaceOwnerId: actorUserId,
    permission: 'owner',
  };
}

export function assertCanEdit(ctx: WorkspaceContext) {
  if (!canEditRecords(ctx.permission)) {
    throw new Error('You do not have permission to edit records.');
  }
}

export function assertCanManageTeam(ctx: WorkspaceContext) {
  if (!canManageTeam(ctx.permission)) {
    throw new Error('You do not have permission to manage team members.');
  }
}

export function assertRowOwnedByWorkspace(rowOwnerId: string | null | undefined, ctx: WorkspaceContext) {
  if (!rowOwnerId || String(rowOwnerId) !== ctx.workspaceOwnerId) {
    throw new Error('Not allowed for this workspace.');
  }
}
