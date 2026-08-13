import type { SupabaseClient } from '@supabase/supabase-js';
import { hasEntitlement } from '@/lib/billing/entitlements';
import { writeAuditLog } from '@/lib/audit/log';
import { formatZar } from '@/lib/money';
import {
  DEFAULT_COLLECTION_STEPS,
  reminderMessageForStep,
  stepFiresToday,
  todayInJohannesburg,
} from '@/lib/collections/schedule';
import {
  ERR_RESEND_MISSING,
  getResend,
  getResendFromEmail,
} from '@/lib/integrations/messaging';
import { logger } from '@/lib/observability/logger';

export async function ensureDefaultCollectionSequence(admin: SupabaseClient, ownerId: string) {
  const { data: existing } = await admin
    .from('collection_sequences')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const seqId = String(existing.id);
    const { data: steps } = await admin.from('collection_sequence_steps').select('id').eq('sequence_id', seqId).limit(1);
    if (steps && steps.length > 0) return seqId;
    await admin.from('collection_sequence_steps').insert(
      DEFAULT_COLLECTION_STEPS.map((s) => ({ ...s, sequence_id: seqId }))
    );
    return seqId;
  }

  const { data: created, error } = await admin
    .from('collection_sequences')
    .insert({ owner_id: ownerId, name: 'Default collections', active: true })
    .select('id')
    .single();
  if (error) throw error;
  const seqId = String((created as { id: string }).id);
  await admin.from('collection_sequence_steps').insert(
    DEFAULT_COLLECTION_STEPS.map((s) => ({ ...s, sequence_id: seqId }))
  );
  return seqId;
}

export type CollectionsPassResult = {
  workspaces: number;
  considered: number;
  sent: number;
  skipped: number;
  errors: string[];
};

export async function runCollectionsPass(admin: SupabaseClient, now = new Date()): Promise<CollectionsPassResult> {
  const today = todayInJohannesburg(now);
  const result: CollectionsPassResult = { workspaces: 0, considered: 0, sent: 0, skipped: 0, errors: [] };

  const { data: profiles, error: profErr } = await admin
    .from('company_profiles')
    .select('owner_id,subscription_plan,company_name')
    .not('owner_id', 'is', null);
  if (profErr) throw profErr;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  for (const profile of profiles ?? []) {
    const ownerId = String((profile as { owner_id: string }).owner_id);
    const plan = (profile as { subscription_plan?: string }).subscription_plan;
    if (!hasEntitlement(plan, 'collections_sequences')) {
      result.skipped += 1;
      continue;
    }
    result.workspaces += 1;

    let sequenceId: string;
    try {
      sequenceId = await ensureDefaultCollectionSequence(admin, ownerId);
    } catch (e: unknown) {
      result.errors.push(`${ownerId}: seed ${e instanceof Error ? e.message : 'failed'}`);
      continue;
    }

    const { data: steps, error: stepErr } = await admin
      .from('collection_sequence_steps')
      .select('id,offset_days,channel,template_key')
      .eq('sequence_id', sequenceId)
      .order('sort_order', { ascending: true });
    if (stepErr) {
      result.errors.push(`${ownerId}: steps ${stepErr.message}`);
      continue;
    }

    const { data: invoices, error: invErr } = await admin
      .from('invoices')
      .select(
        'id,invoice_number,due_date,balance_amount,currency,status,public_share_id,client:clients(name,email)'
      )
      .eq('owner_id', ownerId)
      .gt('balance_amount', 0)
      .not('status', 'in', '("draft","cancelled")');
    if (invErr) {
      result.errors.push(`${ownerId}: invoices ${invErr.message}`);
      continue;
    }

    for (const inv of invoices ?? []) {
      const row = inv as {
        id: string;
        invoice_number?: string | null;
        due_date?: string | null;
        balance_amount?: number;
        currency?: string;
        public_share_id?: string | null;
        client?: { name?: string | null; email?: string | null } | null;
      };
      const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
      const email = row.client?.email ? String(row.client.email).trim() : '';
      if (!due || !email) {
        result.skipped += 1;
        continue;
      }

      for (const step of steps ?? []) {
        const offsetDays = Number((step as { offset_days: number }).offset_days);
        const channel = String((step as { channel: string }).channel ?? 'email');
        const stepId = String((step as { id: string }).id);
        if (!stepFiresToday(due, offsetDays, today)) continue;
        if (channel !== 'email') {
          result.skipped += 1;
          continue;
        }

        result.considered += 1;

        const { data: existing } = await admin
          .from('reminder_events')
          .select('id')
          .eq('invoice_id', row.id)
          .eq('offset_days', offsetDays)
          .eq('channel', channel)
          .maybeSingle();
        if (existing) {
          result.skipped += 1;
          continue;
        }

        const viewUrl = row.public_share_id ? `${appUrl}/invoice/${row.public_share_id}` : undefined;
        const message = reminderMessageForStep({
          offsetDays,
          invoiceNumber: String(row.invoice_number ?? row.id.slice(0, 8)),
          clientName: String(row.client?.name ?? 'there'),
          amountLabel: formatZar(Number(row.balance_amount ?? 0)),
          dueDate: due,
          viewUrl,
        });

        try {
          const resend = await getResend();
          if (!resend) throw new Error(ERR_RESEND_MISSING);
          await resend.emails.send({
            from: getResendFromEmail(),
            to: [email],
            subject: `Payment reminder — ${row.invoice_number ?? 'invoice'}`,
            html: `<p>${message.replaceAll('\n', '<br/>')}</p>`,
          });

          await admin.from('reminder_events').insert({
            invoice_id: row.id,
            channel,
            offset_days: offsetDays,
            sequence_step_id: stepId,
            owner_id: ownerId,
          });

          await writeAuditLog(admin, {
            ownerId,
            actorUserId: null,
            action: 'reminder.sent',
            entityType: 'invoice',
            entityId: row.id,
            meta: { offsetDays, channel, automated: true },
          });

          await admin.from('notifications').insert({
            owner_id: ownerId,
            title: 'Reminder sent',
            body: `Automated reminder for ${row.invoice_number ?? 'invoice'} (${offsetDays >= 0 ? '+' : ''}${offsetDays}d).`,
            href: `/invoices/${row.id}`,
            entity_type: 'invoice',
            entity_id: row.id,
          });

          result.sent += 1;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'send failed';
          result.errors.push(`${row.id}: ${msg}`);
          logger.warn('collections.send_failed', { invoiceId: row.id, message: msg });
        }
      }
    }
  }

  return result;
}
