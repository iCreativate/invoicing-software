import type { SupabaseClient } from '@supabase/supabase-js';

export type CrewAuditEntry = {
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  targetOwnerId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  meta?: Record<string, unknown>;
};

/** Best-effort crew audit — never throws. Uses service-role client. */
export async function writeCrewAudit(admin: SupabaseClient, entry: CrewAuditEntry): Promise<void> {
  try {
    await admin.from('crew_audit_log').insert({
      actor_user_id: entry.actorUserId,
      actor_email: entry.actorEmail,
      action: entry.action,
      target_owner_id: entry.targetOwnerId ?? null,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      meta: entry.meta ?? {},
    });
  } catch {
    // ignore
  }
}
