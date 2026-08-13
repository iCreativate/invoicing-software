import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditAction =
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.sent'
  | 'invoice.viewed'
  | 'invoice.marked_paid'
  | 'payment.recorded'
  | 'payment.webhook'
  | 'quote.created'
  | 'quote.accepted'
  | 'quote.declined'
  | 'quote.converted'
  | 'client.updated'
  | 'settings.updated'
  | 'team.invited'
  | 'reminder.sent';

export type AuditEntry = {
  ownerId: string;
  actorUserId: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Best-effort audit write. Never throws to callers — audit must not break primary flows.
 * Requires `audit_logs` table (see supabase migrations).
 */
export async function writeAuditLog(supabase: SupabaseClient, entry: AuditEntry): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      owner_id: entry.ownerId,
      actor_user_id: entry.actorUserId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      meta: entry.meta ?? {},
    });
  } catch {
    // ignore
  }
}
