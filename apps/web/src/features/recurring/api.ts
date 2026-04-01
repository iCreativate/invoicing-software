import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';

export type RecurringScheduleRow = {
  id: string;
  clientId: string;
  clientName?: string | null;
  title: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  currency: string;
  frequency: string;
  nextRunDate: string;
  reminderDaysBefore: number;
  remindEmail: boolean;
  remindWhatsapp: boolean;
  whatsappPhone: string | null;
  active: boolean;
  lastGeneratedInvoiceId: string | null;
};

export async function fetchRecurringList(): Promise<RecurringScheduleRow[]> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('recurring_schedules')
    .select(
      'id,client_id,title,line_description,quantity,unit_price,vat_rate,currency,frequency,next_run_date,reminder_days_before,remind_email,remind_whatsapp,whatsapp_phone,active,last_generated_invoice_id,client:clients(name)'
    )
    .eq('owner_id', ownerId)
    .order('next_run_date', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    clientId: String(r.client_id),
    clientName: r.client?.name ? String(r.client.name) : null,
    title: String(r.title ?? ''),
    lineDescription: String(r.line_description ?? ''),
    quantity: Number(r.quantity ?? 1),
    unitPrice: Number(r.unit_price ?? 0),
    vatRate: Number(r.vat_rate ?? 15),
    currency: String(r.currency ?? 'ZAR'),
    frequency: String(r.frequency ?? 'monthly'),
    nextRunDate: String(r.next_run_date ?? ''),
    reminderDaysBefore: Number(r.reminder_days_before ?? 3),
    remindEmail: Boolean(r.remind_email),
    remindWhatsapp: Boolean(r.remind_whatsapp),
    whatsappPhone: r.whatsapp_phone ? String(r.whatsapp_phone) : null,
    active: Boolean(r.active),
    lastGeneratedInvoiceId: r.last_generated_invoice_id ? String(r.last_generated_invoice_id) : null,
  }));
}

export async function createRecurringSchedule(input: {
  clientId: string;
  title: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  currency: string;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextRunDate: string;
  reminderDaysBefore: number;
  remindEmail: boolean;
  remindWhatsapp: boolean;
  whatsappPhone?: string | null;
}): Promise<{ id: string }> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('recurring_schedules')
    .insert({
      owner_id: ownerId,
      client_id: input.clientId,
      title: input.title,
      line_description: input.lineDescription,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      vat_rate: input.vatRate,
      currency: input.currency,
      frequency: input.frequency,
      next_run_date: input.nextRunDate,
      reminder_days_before: input.reminderDaysBefore,
      remind_email: input.remindEmail,
      remind_whatsapp: input.remindWhatsapp,
      whatsapp_phone: input.whatsappPhone ?? null,
      active: true,
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: String((data as any).id) };
}

export async function setRecurringActive(id: string, active: boolean) {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { error } = await supabase.from('recurring_schedules').update({ active }).eq('id', id).eq('owner_id', ownerId);
  if (error) throw error;
}
