import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import type { ClientDetail, ClientInvoiceInsights, ClientListItem } from './types';

export async function fetchClientsList(): Promise<ClientListItem[]> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email')
    .eq('owner_id', ownerId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name ?? ''),
    email: c.email ? String(c.email) : null,
  }));
}

export async function searchClients(query: string): Promise<ClientListItem[]> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const q = query.trim();
  if (!q) return fetchClientsList();

  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email')
    .eq('owner_id', ownerId)
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name ?? ''),
    email: c.email ? String(c.email) : null,
  }));
}

export async function createClient(input: { name: string; email?: string; phone?: string; address?: string }) {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      owner_id: ownerId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: String(data.id) };
}

export async function fetchClientDetail(id: string): Promise<ClientDetail> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email,phone,address')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single();
  if (error) throw error;
  return {
    id: String((data as any).id),
    name: String((data as any).name ?? ''),
    email: (data as any).email ? String((data as any).email) : null,
    phone: (data as any).phone ? String((data as any).phone) : null,
    address: (data as any).address ? String((data as any).address) : null,
  };
}

export async function updateClient(input: { id: string; name: string; email?: string; phone?: string; address?: string }) {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { error } = await supabase
    .from('clients')
    .update({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
    })
    .eq('id', input.id)
    .eq('owner_id', ownerId);
  if (error) throw error;
  return { id: input.id };
}

export async function fetchClientInvoiceInsights(clientId: string): Promise<ClientInvoiceInsights> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data: rows, error } = await supabase
    .from('invoices')
    .select('id,status,total_amount,paid_amount,balance_amount,issue_date,due_date,paid_date')
    .eq('client_id', clientId)
    .eq('owner_id', ownerId);
  if (error) throw error;

  const list = rows ?? [];
  let lifetimeBilled = 0;
  let lifetimeCollected = 0;
  let outstanding = 0;
  let paidCount = 0;
  let overdueCount = 0;
  const daysSamples: number[] = [];
  let lastPaidAt: string | null = null;

  for (const r of list as any[]) {
    const total = Number(r.total_amount ?? 0);
    const paid = Number(r.paid_amount ?? 0);
    const bal = Number(r.balance_amount ?? 0);
    lifetimeBilled += total;
    lifetimeCollected += paid;
    outstanding += bal;
    const st = String(r.status ?? '');
    if (st === 'paid' || bal <= 0) paidCount += 1;
    if (st === 'overdue') overdueCount += 1;
    if (r.paid_date && r.issue_date) {
      const a = new Date(String(r.issue_date)).getTime();
      const b = new Date(String(r.paid_date)).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
        daysSamples.push(Math.round((b - a) / 864e5));
        if (!lastPaidAt || String(r.paid_date) > lastPaidAt) lastPaidAt = String(r.paid_date);
      }
    }
  }

  const avgDaysToPay =
    daysSamples.length > 0 ? Math.round(daysSamples.reduce((s, n) => s + n, 0) / daysSamples.length) : null;

  return {
    invoiceCount: list.length,
    lifetimeBilled,
    lifetimeCollected,
    outstanding,
    paidCount,
    overdueCount,
    avgDaysToPay,
    lastPaidAt,
  };
}

