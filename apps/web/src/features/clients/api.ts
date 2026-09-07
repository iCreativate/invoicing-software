import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { isDemoUiActive } from '@/lib/demo/accounts';
import {
  demoClientDetail,
  demoClientInsights,
  demoClientsList,
  demoCreateClient,
  demoInvoicesList,
  demoPayments,
  demoReadOnlyError,
} from '@/lib/demo/fixtures';
import type { ClientDetail, ClientInvoiceInsights, ClientListItem } from './types';
import {
  buildClientDirectory,
  type ClientDirectoryRow,
  type ClientInvoiceRollup,
} from '@/lib/clients/directory';
import type { PaymentMethod, PaymentStatus, WorkspacePaymentListRow } from '@/features/payments/types';

export async function fetchClientsList(): Promise<ClientListItem[]> {
  if (isDemoUiActive()) return demoClientsList();
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email,company_name')
    .eq('owner_id', ownerId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name ?? ''),
    email: c.email ? String(c.email) : null,
    companyName: c.company_name ? String(c.company_name) : null,
  }));
}

export async function searchClients(query: string): Promise<ClientListItem[]> {
  if (isDemoUiActive()) {
    const q = query.trim().toLowerCase();
    if (!q) return demoClientsList();
    return demoClientsList().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.companyName ?? '').toLowerCase().includes(q)
    );
  }
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const q = query.trim();
  if (!q) return fetchClientsList();

  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email,company_name')
    .eq('owner_id', ownerId)
    .or(`name.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name ?? ''),
    email: c.email ? String(c.email) : null,
    companyName: c.company_name ? String(c.company_name) : null,
  }));
}

export async function createClient(input: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  website?: string;
  companyRegistration?: string;
  vatNumber?: string;
}) {
  if (isDemoUiActive()) {
    return demoCreateClient({
      name: input.name,
      email: input.email,
      companyName: input.companyName,
    });
  }
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
      company_name: input.companyName ?? null,
      website: input.website ?? null,
      company_registration: input.companyRegistration ?? null,
      vat_number: input.vatNumber ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: String(data.id) };
}

export async function fetchClientDetail(id: string): Promise<ClientDetail> {
  if (isDemoUiActive()) {
    const d = demoClientDetail(id);
    if (!d) throw new Error('Client not found.');
    return d;
  }
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,email,phone,address,company_name,website,company_registration,vat_number')
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
    companyName: (data as any).company_name ? String((data as any).company_name) : null,
    website: (data as any).website ? String((data as any).website) : null,
    companyRegistration: (data as any).company_registration ? String((data as any).company_registration) : null,
    vatNumber: (data as any).vat_number ? String((data as any).vat_number) : null,
  };
}

export async function updateClient(input: {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  website?: string;
  companyRegistration?: string;
  vatNumber?: string;
}) {
  if (isDemoUiActive()) throw demoReadOnlyError();
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { error } = await supabase
    .from('clients')
    .update({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      company_name: input.companyName ?? null,
      website: input.website ?? null,
      company_registration: input.companyRegistration ?? null,
      vat_number: input.vatNumber ?? null,
    })
    .eq('id', input.id)
    .eq('owner_id', ownerId);
  if (error) throw error;
  return { id: input.id };
}

export async function fetchClientInvoiceInsights(clientId: string): Promise<ClientInvoiceInsights> {
  if (isDemoUiActive()) return demoClientInsights(clientId);
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
  let overdueAmount = 0;
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
    if (st === 'overdue') {
      overdueCount += 1;
      overdueAmount += bal;
    }
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
    overdueAmount,
    avgDaysToPay,
    lastPaidAt,
  };
}

/** Invoices for a single client (list view on client profile). */
export async function fetchClientInvoicesList(clientId: string) {
  if (isDemoUiActive()) {
    return demoInvoicesList()
      .filter((i) => i.client_id === clientId)
      .map((r) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        status: r.status,
        issue_date: r.issue_date,
        due_date: r.due_date,
        total_amount: r.total_amount,
        paid_amount: r.paid_amount,
        balance_amount: r.balance_amount,
        currency: r.currency,
      }));
  }
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('id,invoice_number,status,issue_date,due_date,total_amount,paid_amount,balance_amount,currency')
    .eq('client_id', clientId)
    .eq('owner_id', ownerId)
    .order('issue_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    invoice_number: String(r.invoice_number ?? ''),
    status: String(r.status ?? 'draft'),
    issue_date: String(r.issue_date ?? ''),
    due_date: String(r.due_date ?? ''),
    total_amount: Number(r.total_amount ?? 0),
    paid_amount: Number(r.paid_amount ?? 0),
    balance_amount: Number(r.balance_amount ?? 0),
    currency: String(r.currency ?? 'ZAR'),
  }));
}

/** Quotes for a single client (list view on client profile). */
export async function fetchClientQuotesList(clientId: string) {
  if (isDemoUiActive()) {
    const { demoQuotesList } = await import('@/lib/demo/fixtures');
    const name = demoClientDetail(clientId)?.name ?? '';
    return demoQuotesList()
      .filter((q) => !name || q.clientName === name)
      .map((q) => ({
        id: q.id,
        quote_number: q.quoteNumber ?? '',
        status: q.status,
        issue_date: q.issueDate,
        total_amount: q.totalAmount,
        currency: q.currency,
      }));
  }
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('id,quote_number,status,issue_date,total_amount,currency')
    .eq('client_id', clientId)
    .eq('owner_id', ownerId)
    .order('issue_date', { ascending: false });
  if (error) {
    const msg = String((error as any).message ?? '').toLowerCase();
    if (msg.includes('does not exist') || msg.includes('quotes')) return [];
    throw error;
  }
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    quote_number: String(r.quote_number ?? ''),
    status: String(r.status ?? 'draft'),
    issue_date: String(r.issue_date ?? ''),
    total_amount: Number(r.total_amount ?? 0),
    currency: String(r.currency ?? 'ZAR'),
  }));
}

/** Raw invoice rows for Timely Payment Score™. */
export async function fetchClientInvoicesForScore(clientId: string) {
  if (isDemoUiActive()) {
    return demoInvoicesList()
      .filter((i) => i.client_id === clientId)
      .map((r) => ({
        status: r.status,
        issue_date: r.issue_date,
        due_date: r.due_date,
        paid_date: r.paid_amount > 0 ? r.issue_date : null,
        total_amount: r.total_amount,
        balance_amount: r.balance_amount,
        paid_amount: r.paid_amount,
      }));
  }
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data: rows, error } = await supabase
    .from('invoices')
    .select('status,issue_date,due_date,paid_date,total_amount,balance_amount,paid_amount')
    .eq('client_id', clientId)
    .eq('owner_id', ownerId);
  if (error) throw error;
  return (rows ?? []).map((r: any) => ({
    status: String(r.status ?? ''),
    issue_date: r.issue_date ? String(r.issue_date) : null,
    due_date: r.due_date ? String(r.due_date) : null,
    paid_date: r.paid_date ? String(r.paid_date) : null,
    total_amount: Number(r.total_amount ?? 0),
    balance_amount: Number(r.balance_amount ?? 0),
    paid_amount: Number(r.paid_amount ?? 0),
  }));
}

function invoiceRollupsFromDemo(): ClientInvoiceRollup[] {
  return demoInvoicesList().map((r) => ({
    clientId: String(r.client_id ?? ''),
    status: r.status,
    balance: r.balance_amount,
    paid: r.paid_amount,
    paidDate: r.paid_amount > 0 ? r.issue_date : null,
    dueDate: r.due_date,
    currency: r.currency,
  }));
}

export async function fetchClientDirectory(): Promise<ClientDirectoryRow[]> {
  const clients = await fetchClientsList();
  if (isDemoUiActive()) return buildClientDirectory(clients, invoiceRollupsFromDemo());

  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const first = await supabase
    .from('invoices')
    .select('client_id,status,balance_amount,paid_amount,paid_date,due_date,currency')
    .eq('owner_id', ownerId);
  let data: any[] | null = first.data ?? null;
  let error = first.error;
  if (error) {
    const msg = String((error as { message?: string }).message ?? '').toLowerCase();
    if (msg.includes('paid_date') || msg.includes('column')) {
      const retry = await supabase
        .from('invoices')
        .select('client_id,status,balance_amount,paid_amount,due_date,currency')
        .eq('owner_id', ownerId);
      data = retry.data ?? null;
      error = retry.error;
    }
  }
  if (error) throw error;

  const invoices: ClientInvoiceRollup[] = (data ?? []).map((r: any) => ({
    clientId: String(r.client_id ?? ''),
    status: String(r.status ?? 'draft'),
    balance: Number(r.balance_amount ?? 0),
    paid: Number(r.paid_amount ?? 0),
    paidDate: r.paid_date ? String(r.paid_date).slice(0, 10) : null,
    dueDate: r.due_date ? String(r.due_date).slice(0, 10) : null,
    currency: String(r.currency ?? 'ZAR'),
  }));
  return buildClientDirectory(clients, invoices);
}

function asPaymentMethod(v: unknown): PaymentMethod {
  const s = String(v ?? 'bank_transfer').toLowerCase();
  const allowed: PaymentMethod[] = [
    'bank_transfer',
    'card',
    'cash',
    'cheque',
    'mobile_money',
    'paystack',
    'flutterwave',
  ];
  return allowed.includes(s as PaymentMethod) ? (s as PaymentMethod) : 'bank_transfer';
}

function asPaymentStatus(v: unknown): PaymentStatus {
  const s = String(v ?? 'completed').toLowerCase();
  const allowed: PaymentStatus[] = ['pending', 'processing', 'completed', 'failed', 'refunded'];
  return allowed.includes(s as PaymentStatus) ? (s as PaymentStatus) : 'completed';
}

export async function fetchClientPayments(clientId: string): Promise<WorkspacePaymentListRow[]> {
  if (isDemoUiActive()) {
    const name = demoClientDetail(clientId)?.name ?? '';
    const invoiceIds = new Set(
      demoInvoicesList().filter((i) => i.client_id === clientId).map((i) => i.id)
    );
    return demoPayments()
      .filter((p) => invoiceIds.has(String(p.invoice_id)) || p.client_name === name)
      .map((p) => ({
        id: String(p.id),
        invoiceId: String(p.invoice_id),
        invoiceNumber: p.invoice_number != null ? String(p.invoice_number) : null,
        clientName: p.client_name != null ? String(p.client_name) : null,
        issueDate: p.issue_date != null ? String(p.issue_date).slice(0, 10) : null,
        amount: Number(p.amount ?? 0),
        currency: String(p.currency ?? 'ZAR'),
        method: asPaymentMethod(p.method),
        status: asPaymentStatus(p.status),
        payment_date: String(p.payment_date ?? ''),
        notes: p.notes != null ? String(p.notes) : null,
        provider: p.provider != null ? String(p.provider) : null,
        externalReference: p.external_reference != null ? String(p.external_reference) : null,
      }));
  }

  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      invoice_id,
      amount,
      currency,
      method,
      status,
      payment_date,
      notes,
      provider,
      external_reference,
      invoices!inner(
        owner_id,
        client_id,
        invoice_number,
        issue_date,
        client:clients(name)
      )
    `
    )
    .eq('invoices.owner_id', ownerId)
    .eq('invoices.client_id', clientId)
    .order('payment_date', { ascending: false });
  if (error) {
    const msg = String((error as { message?: string }).message ?? '').toLowerCase();
    if (msg.includes('does not exist') || msg.includes('payments')) return [];
    throw error;
  }

  return (data ?? []).map((p: any) => {
    const inv = p.invoices ?? {};
    return {
      id: String(p.id),
      invoiceId: String(p.invoice_id),
      invoiceNumber: inv.invoice_number != null ? String(inv.invoice_number) : null,
      clientName: inv.client?.name != null ? String(inv.client.name) : null,
      issueDate: inv.issue_date != null ? String(inv.issue_date).slice(0, 10) : null,
      amount: Number(p.amount ?? 0),
      currency: String(p.currency ?? 'ZAR'),
      method: asPaymentMethod(p.method),
      status: asPaymentStatus(p.status),
      payment_date: String(p.payment_date ?? ''),
      notes: p.notes != null ? String(p.notes) : null,
      provider: p.provider != null ? String(p.provider) : null,
      externalReference: p.external_reference != null ? String(p.external_reference) : null,
    };
  });
}
