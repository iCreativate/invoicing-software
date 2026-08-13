import type { SupabaseClient } from '@supabase/supabase-js';
import { canEditRecords, canManageTeam } from '@/lib/permissions/team';
import { withTimeout } from '@/lib/demo/server';

export type WorkspaceContext = {
  actorUserId: string;
  actorEmail: string | null;
  /** Business owner user id (invoices/quotes/expenses are scoped to this). */
  workspaceOwnerId: string;
  permission: string;
};

/**
 * Resolves workspace: solo user acts as owner; invited team members use employees.owner_id.
 * Prefers active membership; scopes by lower(email) to avoid ambiguous matches.
 */
export async function getWorkspaceContext(supabase: SupabaseClient): Promise<WorkspaceContext | null> {
  let user: { id: string; email?: string | null } | null = null;
  try {
    const result = await withTimeout(supabase.auth.getUser(), 10000);
    user = result.data.user;
  } catch {
    return null;
  }
  if (!user?.id) return null;

  const actorUserId = user.id;
  const actorEmail = user.email ?? null;
  const email = (actorEmail ?? '').trim().toLowerCase();

  if (email) {
    try {
      const empRes = await withTimeout(
        supabase
          .from('employees')
          .select('owner_id,permission,status')
          .ilike('email', email)
          .neq('status', 'inactive')
          .limit(5),
        10000
      );
      const { data: empRows, error } = empRes;

      if (error) {
        const msg = String((error as { message?: string }).message ?? '').toLowerCase();
        if (!msg.includes('permission') && !msg.includes('column') && !msg.includes('does not exist')) {
          throw error;
        }
      } else {
        const rows = (empRows ?? []) as { owner_id?: string | null; permission?: string | null; status?: string | null }[];
        // Prefer membership where this user is not the owner row ambiguity: if multiple, prefer active then first.
        const active = rows.find((r) => String(r.status ?? '').toLowerCase() === 'active') ?? rows[0];
        if (active?.owner_id && String(active.owner_id) !== actorUserId) {
          return {
            actorUserId,
            actorEmail,
            workspaceOwnerId: String(active.owner_id),
            permission: String(active.permission ?? 'member'),
          };
        }
        // If employee row points at self as owner, treat as owner.
        if (active?.owner_id && String(active.owner_id) === actorUserId) {
          return {
            actorUserId,
            actorEmail,
            workspaceOwnerId: actorUserId,
            permission: 'owner',
          };
        }
      }
    } catch {
      // Unreachable DB — treat as solo owner below.
    }
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
