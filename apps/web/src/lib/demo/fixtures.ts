import type { InvoiceListItem, InvoiceStatus } from '@/features/invoices/types';
import type { ClientListItem, ClientDetail, ClientInvoiceInsights } from '@/features/clients/types';
import type { QuoteListItem, QuoteDetail } from '@/features/quotes/types';
import type { ExpenseRow } from '@/features/expenses/types';
import type { EmployeeListItem } from '@/features/employees/types';
import type { CompanyProfile } from '@/features/company/types';
import { buildDemoDashboardSummary } from '@/lib/dashboard/summary';

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const DEMO_CLIENT_IDS = {
  acme: '10000000-0000-0000-0000-000000000001',
  brightline: '10000000-0000-0000-0000-000000000002',
  sky: '10000000-0000-0000-0000-000000000003',
  evergreen: '10000000-0000-0000-0000-000000000004',
  pulse: '10000000-0000-0000-0000-000000000005',
} as const;

export const DEMO_INVOICE_IDS = {
  ti41: '00000000-0000-0000-0000-000000000001',
  ti42: '00000000-0000-0000-0000-000000000002',
  ti38: '00000000-0000-0000-0000-000000000003',
  ti43: '00000000-0000-0000-0000-000000000004',
} as const;

const DEMO_CLIENTS_BASE: ClientListItem[] = [
  { id: DEMO_CLIENT_IDS.acme, name: 'Acme Studio', email: 'accounts@acmestudio.co.za', companyName: 'Acme Studio (Pty) Ltd' },
  { id: DEMO_CLIENT_IDS.brightline, name: 'Brightline Logistics', email: 'ap@brightline.co.za', companyName: 'Brightline Logistics' },
  { id: DEMO_CLIENT_IDS.sky, name: 'Sky & Co', email: 'hello@skyandco.co.za', companyName: 'Sky & Co' },
  { id: DEMO_CLIENT_IDS.evergreen, name: 'Evergreen Consulting', email: 'billing@evergreen.co.za', companyName: 'Evergreen Consulting' },
  { id: DEMO_CLIENT_IDS.pulse, name: 'Pulse Media', email: 'finance@pulsemedia.co.za', companyName: 'Pulse Media' },
];

/** Session-only clients created from invoice/quote composer in demo mode. */
const demoClientsCreated: ClientListItem[] = [];

export function demoClientsList(): ClientListItem[] {
  return [...DEMO_CLIENTS_BASE, ...demoClientsCreated];
}

export function demoCreateClient(input: {
  name: string;
  email?: string;
  companyName?: string;
}): { id: string } {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `demo-client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  demoClientsCreated.push({
    id,
    name: input.name,
    email: input.email ?? null,
    companyName: input.companyName ?? null,
  });
  return { id };
}

type DemoLineInput = { description: string; quantity: number; unitPrice: number; vatRate: number };

function demoNewId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function demoClientLabel(clientId: string) {
  return demoClientsList().find((c) => c.id === clientId)?.name ?? 'Client';
}

function demoLineTotals(items: DemoLineInput[]) {
  let subtotal = 0;
  let tax = 0;
  const rows = items.map((it) => {
    const line = it.quantity * it.unitPrice;
    const vat = line * (it.vatRate / 100);
    subtotal += line;
    tax += vat;
    return { subtotal: line, tax: vat, total: line + vat };
  });
  return { subtotal, tax, total: subtotal + tax, rows };
}

/** Session-only quotes created from the composer in demo mode. */
const demoQuotesSession: QuoteDetail[] = [];

/** Session-only invoices created from the composer in demo mode. */
type DemoInvoiceSessionRecord = {
  id: string;
  invoice_number: string;
  client_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  template_id: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  notes: string | null;
  public_share_id: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
    catalog_item_id: string | null;
  }>;
};

const demoInvoicesSession: DemoInvoiceSessionRecord[] = [];

function demoOrigin() {
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
  return String(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') || 'http://localhost:3000';
}

export function demoCreateQuote(input: {
  clientId: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  vatRate: number;
  notes?: string;
  quoteNumber?: string | null;
  items: DemoLineInput[];
}): { id: string; quoteNumber: string } {
  const id = demoNewId('demo-quote');
  const quoteNumber =
    input.quoteNumber && String(input.quoteNumber).trim().length
      ? String(input.quoteNumber).trim()
      : `QT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const { subtotal, tax, total } = demoLineTotals(input.items);
  const client = demoClientDetail(input.clientId);
  const quote: QuoteDetail = {
    id,
    quoteNumber,
    status: 'draft',
    issueDate: input.issueDate,
    validUntil: input.validUntil,
    currency: input.currency,
    vatRate: input.vatRate,
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: total,
    notes: input.notes ?? null,
    clientId: input.clientId,
    clientName: client?.name ?? demoClientLabel(input.clientId),
    clientEmail: client?.email ?? null,
    clientPhone: client?.phone ?? null,
    clientAddress: client?.address ?? null,
    clientCompanyName: client?.companyName ?? null,
    convertedInvoiceId: null,
    publicShareId: `demo-quote-${id.slice(0, 8)}`,
    viewedAt: null,
    acceptedAt: null,
    declinedAt: null,
    items: input.items.map((it, idx) => {
      const line = it.quantity * it.unitPrice;
      const vat = line * (it.vatRate / 100);
      return {
        id: `${id}-item-${idx}`,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        lineTotal: line + vat,
      };
    }),
  };
  demoQuotesSession.unshift(quote);
  return { id, quoteNumber };
}

export function demoUpdateQuote(
  id: string,
  input: {
    clientId: string;
    issueDate: string;
    validUntil: string;
    currency: string;
    vatRate: number;
    notes?: string | null;
    quoteNumber?: string | null;
    items: DemoLineInput[];
  }
): { id: string } {
  const idx = demoQuotesSession.findIndex((q) => q.id === id);
  if (idx < 0) throw new Error('Quote not found.');
  const { subtotal, tax, total } = demoLineTotals(input.items);
  const client = demoClientDetail(input.clientId);
  const prev = demoQuotesSession[idx]!;
  demoQuotesSession[idx] = {
    ...prev,
    quoteNumber: input.quoteNumber?.trim() ? String(input.quoteNumber).trim() : prev.quoteNumber,
    issueDate: input.issueDate,
    validUntil: input.validUntil,
    currency: input.currency,
    vatRate: input.vatRate,
    notes: input.notes ?? null,
    clientId: input.clientId,
    clientName: client?.name ?? demoClientLabel(input.clientId),
    clientEmail: client?.email ?? null,
    clientPhone: client?.phone ?? null,
    clientAddress: client?.address ?? null,
    clientCompanyName: client?.companyName ?? null,
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: total,
    items: input.items.map((it, itemIdx) => {
      const line = it.quantity * it.unitPrice;
      const vat = line * (it.vatRate / 100);
      return {
        id: `${id}-item-${itemIdx}`,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        lineTotal: line + vat,
      };
    }),
  };
  return { id };
}

export function demoEnsureQuoteShareLink(quoteId: string): { shareId: string; shareUrl: string } {
  const session = demoQuotesSession.find((q) => q.id === quoteId);
  if (session) {
    if (!session.publicShareId) session.publicShareId = `demo-quote-${quoteId.slice(0, 8)}`;
    if (session.status === 'draft') session.status = 'sent';
    const shareId = session.publicShareId;
    return { shareId, shareUrl: `${demoOrigin()}/quotes/${quoteId}` };
  }
  const q = demoQuoteDetail(quoteId);
  if (!q) throw new Error('Quote not found.');
  const shareId = q.publicShareId ?? `demo-quote-${quoteId.slice(-4)}`;
  return { shareId, shareUrl: `${demoOrigin()}/quote/${shareId}` };
}

export function demoSaveInvoice(input: {
  invoiceId: string | null;
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  templateId: string;
  invoiceNumber: string | null;
  notes?: string | null;
  publicShareId?: string | null;
  items: DemoLineInput[];
}): { id: string; invoiceNumber: string; publicShareId: string } {
  const { subtotal, tax, total } = demoLineTotals(input.items);
  const invoiceNumber =
    input.invoiceNumber && String(input.invoiceNumber).trim().length
      ? String(input.invoiceNumber).trim()
      : `TI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const items = input.items.map((it, idx) => {
    const line = it.quantity * it.unitPrice;
    const vat = line * (it.vatRate / 100);
    return {
      id: `demo-item-${idx}`,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      tax_rate: it.vatRate,
      line_total: line + vat,
      catalog_item_id: null,
    };
  });

  if (input.invoiceId) {
    const idx = demoInvoicesSession.findIndex((inv) => inv.id === input.invoiceId);
    if (idx < 0) throw new Error('Invoice not found.');
    const prev = demoInvoicesSession[idx]!;
    const publicShareId = input.publicShareId?.trim() || prev.public_share_id;
    demoInvoicesSession[idx] = {
      ...prev,
      client_id: input.clientId,
      invoice_number: invoiceNumber,
      issue_date: input.issueDate,
      due_date: input.dueDate,
      currency: input.currency,
      template_id: input.templateId,
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      balance_amount: total - prev.paid_amount,
      notes: input.notes ?? null,
      public_share_id: publicShareId,
      items: items.map((it, itemIdx) => ({ ...it, id: `${input.invoiceId}-item-${itemIdx}` })),
    };
    return { id: input.invoiceId, invoiceNumber, publicShareId };
  }

  const id = demoNewId('demo-invoice');
  const publicShareId = input.publicShareId?.trim() || `demo-share-${id.slice(0, 8)}`;
  demoInvoicesSession.unshift({
    id,
    invoice_number: invoiceNumber,
    client_id: input.clientId,
    status: 'draft',
    issue_date: input.issueDate,
    due_date: input.dueDate,
    currency: input.currency,
    template_id: input.templateId,
    subtotal_amount: subtotal,
    tax_amount: tax,
    total_amount: total,
    paid_amount: 0,
    balance_amount: total,
    notes: input.notes ?? null,
    public_share_id: publicShareId,
    items: items.map((it, itemIdx) => ({ ...it, id: `${id}-item-${itemIdx}` })),
  });
  return { id, invoiceNumber, publicShareId };
}

export function demoSendInvoice(invoiceId: string): { shareId: string; shareUrl: string } {
  const session = demoInvoicesSession.find((inv) => inv.id === invoiceId);
  if (session) {
    session.status = 'sent';
    if (!session.public_share_id) session.public_share_id = `demo-share-${invoiceId.slice(0, 8)}`;
    return {
      shareId: session.public_share_id,
      shareUrl: `${demoOrigin()}/invoices/${invoiceId}`,
    };
  }
  const detail = demoInvoiceDetail(invoiceId);
  const shareId = String(detail.invoice.public_share_id ?? `demo-share-${invoiceId.slice(-4)}`);
  return { shareId, shareUrl: `${demoOrigin()}/invoice/${shareId}` };
}

export function demoClientDetail(id: string): ClientDetail | null {
  const row = demoClientsList().find((c) => c.id === id);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: '+27821234567',
    address: 'Cape Town, South Africa',
    companyName: row.companyName,
    website: null,
    companyRegistration: null,
    vatNumber: '4123456789',
  };
}

export function demoClientInsights(id: string): ClientInvoiceInsights {
  const inv = demoInvoicesList().filter((i) => i.client_id === id);
  const lifetimeBilled = inv.reduce((s, i) => s + i.total_amount, 0);
  const lifetimeCollected = inv.reduce((s, i) => s + i.paid_amount, 0);
  const outstanding = inv.reduce((s, i) => s + i.balance_amount, 0);
  const overdue = inv.filter((i) => i.status === 'overdue');
  return {
    invoiceCount: inv.length || 2,
    lifetimeBilled: lifetimeBilled || 184500,
    lifetimeCollected: lifetimeCollected || 172400,
    outstanding: outstanding || 12100,
    paidCount: inv.filter((i) => i.status === 'paid').length || 1,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + i.balance_amount, 0),
    avgDaysToPay: 17,
    lastPaidAt: daysAgo(4),
  };
}

export function demoInvoicesList(): InvoiceListItem[] {
  const session = demoInvoicesSession.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    client_name: demoClientLabel(inv.client_id),
    client_id: inv.client_id,
    status: inv.status,
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    currency: inv.currency,
    total_amount: inv.total_amount,
    paid_amount: inv.paid_amount,
    balance_amount: inv.balance_amount,
  }));
  const base: InvoiceListItem[] = [
    {
      id: DEMO_INVOICE_IDS.ti41,
      invoice_number: 'TI-00041',
      client_name: 'Acme Studio',
      client_id: DEMO_CLIENT_IDS.acme,
      status: 'partial',
      issue_date: today(),
      due_date: today(),
      currency: 'ZAR',
      total_amount: 12500,
      paid_amount: 5000,
      balance_amount: 7500,
    },
    {
      id: DEMO_INVOICE_IDS.ti42,
      invoice_number: 'TI-00042',
      client_name: 'Brightline Logistics',
      client_id: DEMO_CLIENT_IDS.brightline,
      status: 'sent',
      issue_date: today(),
      due_date: daysFromNow(7),
      currency: 'ZAR',
      total_amount: 8400,
      paid_amount: 0,
      balance_amount: 8400,
    },
    {
      id: DEMO_INVOICE_IDS.ti38,
      invoice_number: 'TI-00038',
      client_name: 'Sky & Co',
      client_id: DEMO_CLIENT_IDS.sky,
      status: 'overdue',
      issue_date: daysAgo(40),
      due_date: daysAgo(12),
      currency: 'ZAR',
      total_amount: 6100,
      paid_amount: 0,
      balance_amount: 6100,
    },
    {
      id: DEMO_INVOICE_IDS.ti43,
      invoice_number: 'TI-00043',
      client_name: 'Evergreen Consulting',
      client_id: DEMO_CLIENT_IDS.evergreen,
      status: 'viewed',
      issue_date: daysAgo(3),
      due_date: daysFromNow(5),
      currency: 'ZAR',
      total_amount: 4200,
      paid_amount: 0,
      balance_amount: 4200,
    },
  ];
  return [...session, ...base];
}

export function demoInvoiceDetail(id: string) {
  const session = demoInvoicesSession.find((inv) => inv.id === id);
  if (session) {
    const client = demoClientDetail(session.client_id)!;
    return {
      invoice: {
        id: session.id,
        owner_id: 'demo-owner',
        client_id: session.client_id,
        invoice_number: session.invoice_number,
        status: session.status,
        issue_date: session.issue_date,
        due_date: session.due_date,
        currency: session.currency,
        template_id: session.template_id,
        vat_rate: 15,
        subtotal_amount: session.subtotal_amount,
        tax_amount: session.tax_amount,
        total_amount: session.total_amount,
        paid_amount: session.paid_amount,
        balance_amount: session.balance_amount,
        paid_date: session.paid_amount > 0 ? today() : null,
        sent_at: session.status !== 'draft' ? daysAgo(0) + 'T10:00:00.000Z' : null,
        notes: session.notes,
        public_share_id: session.public_share_id,
        created_at: today() + 'T10:00:00.000Z',
        updated_at: today() + 'T10:00:00.000Z',
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          company_name: client.companyName,
          website: client.website,
          company_registration: client.companyRegistration,
          vat_number: client.vatNumber,
        },
        items: session.items,
      },
      timeline: [
        { type: 'created', at: today() + 'T10:00:00.000Z', label: 'Invoice created' },
        ...(session.status !== 'draft'
          ? [{ type: 'sent', at: today() + 'T11:00:00.000Z', label: 'Sent to client' }]
          : []),
      ],
    };
  }

  const list = demoInvoicesList().find((i) => i.id === id) ?? demoInvoicesList()[0]!;
  const client = demoClientDetail(list.client_id!)!;
  return {
    invoice: {
      id: list.id,
      owner_id: 'demo-owner',
      client_id: list.client_id,
      invoice_number: list.invoice_number,
      status: list.status,
      issue_date: list.issue_date,
      due_date: list.due_date,
      currency: list.currency,
      template_id: 'modern',
      vat_rate: 15,
      subtotal_amount: Math.round(list.total_amount / 1.15),
      tax_amount: list.total_amount - Math.round(list.total_amount / 1.15),
      total_amount: list.total_amount,
      paid_amount: list.paid_amount,
      balance_amount: list.balance_amount,
      paid_date: list.paid_amount > 0 ? daysAgo(1) : null,
      sent_at: daysAgo(2),
      notes: 'Sample invoice for demo mode.',
      public_share_id: `demo-share-${list.id.slice(-4)}`,
      created_at: daysAgo(3) + 'T10:00:00.000Z',
      updated_at: daysAgo(1) + 'T10:00:00.000Z',
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        company_name: client.companyName,
        website: client.website,
        company_registration: client.companyRegistration,
        vat_number: client.vatNumber,
      },
      items: [
        {
          id: `${list.id}-item-1`,
          description: 'Professional services',
          quantity: 1,
          unit_price: Math.round(list.total_amount / 1.15),
          tax_rate: 15,
          line_total: list.total_amount,
          catalog_item_id: null,
        },
      ],
    },
    timeline: [
      { type: 'created', at: daysAgo(3) + 'T10:00:00.000Z', label: 'Invoice created' },
      { type: 'sent', at: daysAgo(2) + 'T11:00:00.000Z', label: 'Sent to client' },
      ...(list.paid_amount > 0
        ? [{ type: 'payment', at: daysAgo(1) + 'T09:00:00.000Z', label: `Payment of R ${list.paid_amount.toLocaleString('en-ZA')}` }]
        : []),
    ],
  };
}

export function demoQuotesList(): QuoteListItem[] {
  const session = demoQuotesSession.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    status: q.status,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    currency: q.currency,
    totalAmount: q.totalAmount,
    clientName: q.clientName,
    convertedInvoiceId: q.convertedInvoiceId,
  }));
  const base: QuoteListItem[] = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      quoteNumber: 'QT-2026-10021',
      status: 'sent',
      issueDate: daysAgo(5),
      validUntil: daysFromNow(25),
      currency: 'ZAR',
      totalAmount: 18500,
      clientName: 'Acme Studio',
      convertedInvoiceId: null,
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      quoteNumber: 'QT-2026-10018',
      status: 'accepted',
      issueDate: daysAgo(20),
      validUntil: daysAgo(5),
      currency: 'ZAR',
      totalAmount: 9200,
      clientName: 'Pulse Media',
      convertedInvoiceId: DEMO_INVOICE_IDS.ti41,
    },
  ];
  return [...session, ...base];
}

export function demoQuoteDetail(id: string): QuoteDetail | null {
  const session = demoQuotesSession.find((q) => q.id === id);
  if (session) return session;

  const q =
    [
      {
        id: '20000000-0000-0000-0000-000000000001',
        quoteNumber: 'QT-2026-10021',
        status: 'sent',
        issueDate: daysAgo(5),
        validUntil: daysFromNow(25),
        currency: 'ZAR',
        totalAmount: 18500,
        clientName: 'Acme Studio',
        convertedInvoiceId: null,
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        quoteNumber: 'QT-2026-10018',
        status: 'accepted',
        issueDate: daysAgo(20),
        validUntil: daysAgo(5),
        currency: 'ZAR',
        totalAmount: 9200,
        clientName: 'Pulse Media',
        convertedInvoiceId: DEMO_INVOICE_IDS.ti41,
      },
    ].find((x) => x.id === id) ??
    ({
      id: '20000000-0000-0000-0000-000000000001',
      quoteNumber: 'QT-2026-10021',
      status: 'sent',
      issueDate: daysAgo(5),
      validUntil: daysFromNow(25),
      currency: 'ZAR',
      totalAmount: 18500,
      clientName: 'Acme Studio',
      convertedInvoiceId: null,
    } as const);
  const subtotal = Math.round(q.totalAmount / 1.15);
  return {
    id: q.id,
    quoteNumber: q.quoteNumber,
    status: q.status,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    currency: q.currency,
    vatRate: 15,
    subtotalAmount: subtotal,
    taxAmount: q.totalAmount - subtotal,
    totalAmount: q.totalAmount,
    notes: 'Sample quote for demo mode.',
    clientId: DEMO_CLIENT_IDS.acme,
    clientName: q.clientName,
    clientEmail: 'accounts@acme.demo',
    clientPhone: null,
    clientAddress: null,
    clientCompanyName: q.clientName,
    convertedInvoiceId: q.convertedInvoiceId,
    publicShareId: `demo-quote-${q.id.slice(-4)}`,
    viewedAt: daysAgo(2),
    acceptedAt: q.status === 'accepted' ? daysAgo(1) : null,
    declinedAt: null,
    items: [
      {
        id: `${q.id}-1`,
        description: 'Discovery & strategy',
        quantity: 1,
        unitPrice: subtotal,
        vatRate: 15,
        lineTotal: q.totalAmount,
      },
    ],
  };
}

export function demoPayments() {
  return [
    {
      id: '30000000-0000-0000-0000-000000000001',
      invoice_id: DEMO_INVOICE_IDS.ti41,
      invoice_number: 'TI-00041',
      client_name: 'Acme Studio',
      issue_date: today(),
      amount: 5000,
      currency: 'ZAR',
      method: 'eft',
      status: 'completed',
      payment_date: daysAgo(1),
      notes: null,
      provider: null,
      external_reference: null,
      created_at: daysAgo(1) + 'T09:00:00.000Z',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      invoice_id: DEMO_INVOICE_IDS.ti41,
      invoice_number: 'TI-00045',
      client_name: 'Pulse Media',
      issue_date: daysAgo(2),
      amount: 7500,
      currency: 'ZAR',
      method: 'card',
      status: 'completed',
      payment_date: today(),
      notes: null,
      provider: 'payfast',
      external_reference: 'PF-DEMO-1',
      created_at: today() + 'T08:00:00.000Z',
    },
  ];
}

export function demoExpenses(): ExpenseRow[] {
  return [
    {
      id: '40000000-0000-0000-0000-000000000001',
      amount: 2499,
      currency: 'ZAR',
      category: 'software',
      description: 'Design tools subscription',
      receiptPath: null,
      aiCategory: 'software',
      expenseDate: daysAgo(3),
      source: 'manual',
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      amount: 1860,
      currency: 'ZAR',
      category: 'travel',
      description: 'Client meeting — Cape Town',
      receiptPath: null,
      aiCategory: 'travel',
      expenseDate: daysAgo(8),
      source: 'manual',
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      amount: 4200,
      currency: 'ZAR',
      category: 'marketing',
      description: 'Ads — August',
      receiptPath: null,
      aiCategory: 'marketing',
      expenseDate: daysAgo(12),
      source: 'import',
    },
  ];
}

export function demoEmployees(): EmployeeListItem[] {
  return [
    {
      id: '50000000-0000-0000-0000-000000000001',
      name: 'Demo Owner',
      email: 'demo@timelyinvoices.app',
      role: 'Owner',
      status: 'active',
      invitedAt: daysAgo(90),
      permission: 'owner',
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      name: 'Alex Finance',
      email: 'alex@demo.timelyinvoices.app',
      role: 'Bookkeeper',
      status: 'active',
      invitedAt: daysAgo(30),
      permission: 'member',
    },
  ];
}

export function demoCompanyProfile(): CompanyProfile {
  return {
    id: '60000000-0000-0000-0000-000000000001',
    ownerId: 'demo-owner',
    companyName: 'Demo Business',
    email: 'demo@timelyinvoices.app',
    phone: '+27820000000',
    address: 'Cape Town, South Africa',
    website: 'https://timelyinvoices.app',
    vatNumber: '4123456789',
    logoUrl: null,
    bankName: 'Standard Bank',
    accountName: 'Demo Business',
    accountNumber: '123456789',
    branchCode: '051001',
    accountType: 'cheque',
    subscriptionPlan: 'pro',
    preferredLocale: 'en',
    baseCurrency: 'ZAR',
    referralCode: 'DEMO2026',
    referredByCode: null,
    invoiceAccentHex: null,
    invoiceHeaderHex: null,
    emailTemplateInvoice: null,
    emailTemplateReminder: null,
  };
}

export function demoSettingsPayload() {
  return {
    workspace: {
      permission: 'owner',
      canManageTeam: true,
      canEdit: true,
    },
    company: {
      id: demoCompanyProfile().id,
      companyName: demoCompanyProfile().companyName,
      email: demoCompanyProfile().email,
      phone: demoCompanyProfile().phone,
      address: demoCompanyProfile().address,
      website: demoCompanyProfile().website,
      vatNumber: demoCompanyProfile().vatNumber,
      logoUrl: null,
      bankName: demoCompanyProfile().bankName,
      accountName: demoCompanyProfile().accountName,
      accountNumber: demoCompanyProfile().accountNumber,
      branchCode: demoCompanyProfile().branchCode,
      accountType: demoCompanyProfile().accountType,
      subscriptionPlan: 'pro',
      preferredLocale: 'en',
      baseCurrency: 'ZAR',
      referralCode: 'DEMO2026',
      referredByCode: null,
      invoiceAccentHex: null,
      invoiceHeaderHex: null,
      emailTemplateInvoice: null,
      emailTemplateReminder: null,
    },
  };
}

export function demoNotifications() {
  return [
    {
      id: '70000000-0000-0000-0000-000000000001',
      title: 'Payment received',
      body: 'Pulse Media paid R 7,500.00',
      href: '/payments',
      entityType: 'payment',
      entityId: '30000000-0000-0000-0000-000000000002',
      readAt: null,
      createdAt: today() + 'T08:05:00.000Z',
    },
    {
      id: '70000000-0000-0000-0000-000000000002',
      title: 'Invoice overdue',
      body: 'TI-00038 for Sky & Co is 12 days overdue',
      href: '/reminders',
      entityType: 'invoice',
      entityId: DEMO_INVOICE_IDS.ti38,
      readAt: null,
      createdAt: daysAgo(1) + 'T07:00:00.000Z',
    },
    {
      id: '70000000-0000-0000-0000-000000000003',
      title: 'Quote viewed',
      body: 'Acme Studio opened QT-2026-10021',
      href: '/quotes',
      entityType: 'quote',
      entityId: '20000000-0000-0000-0000-000000000001',
      readAt: daysAgo(2),
      createdAt: daysAgo(2) + 'T14:00:00.000Z',
    },
  ];
}

export function demoCollectionsConfig() {
  return {
    automationEnabled: true,
    sequenceId: '80000000-0000-0000-0000-000000000001',
    steps: [
      { id: 's1', offsetDays: 0, channel: 'email', templateKey: 'friendly_nudge' },
      { id: 's2', offsetDays: 3, channel: 'email', templateKey: 'reminder' },
      { id: 's3', offsetDays: 7, channel: 'whatsapp', templateKey: 'firm_followup' },
    ],
  };
}

export function demoReportsPayload() {
  const summary = buildDemoDashboardSummary();
  const to = today();
  const from = daysAgo(365);
  const revenue_monthly = summary.monthlyIncomeVsExpense.map((m, i) => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - (summary.monthlyIncomeVsExpense.length - 1 - i));
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      period,
      invoiced: m.income,
      collected: Math.round(m.income * 0.85),
    };
  });
  return {
    range: { from, to },
    currency_filter: null as string | null,
    mixed_currency: false,
    primary_currency_hint: 'ZAR',
    revenue_monthly,
    revenue_yearly: [{ year: '2026', invoiced: 45200, collected: 31800 }],
    top_clients: [
      {
        client_id: DEMO_CLIENT_IDS.pulse,
        client_name: 'Pulse Media',
        invoiced: 45800,
        paid_on_invoices: 42000,
        invoice_count: 4,
      },
      {
        client_id: DEMO_CLIENT_IDS.acme,
        client_name: 'Acme Studio',
        invoiced: 31200,
        paid_on_invoices: 23700,
        invoice_count: 3,
      },
      {
        client_id: DEMO_CLIENT_IDS.evergreen,
        client_name: 'Evergreen Consulting',
        invoiced: 18400,
        paid_on_invoices: 18400,
        invoice_count: 2,
      },
    ],
    outstanding: demoInvoicesList()
      .filter((i) => i.balance_amount > 0)
      .map((i) => ({
        invoice_id: i.id,
        invoice_number: i.invoice_number,
        client_name: i.client_name,
        status: i.status,
        issue_date: i.issue_date,
        due_date: i.due_date,
        currency: i.currency,
        total_amount: i.total_amount,
        balance_amount: i.balance_amount,
      })),
    tax_summary: {
      invoice_count: 12,
      taxable_subtotal: 39304,
      tax_amount: 5896,
    },
    totals_in_range: {
      invoiced: 45200,
      collected: 31800,
    },
  };
}

export function demoReadOnlyError(): Error {
  return new Error('Sample mode is view-only. Connect a live Supabase project to create or edit records.');
}

export function demoRecurringList() {
  return [
    {
      id: '90000000-0000-0000-0000-000000000001',
      clientId: DEMO_CLIENT_IDS.acme,
      clientName: 'Acme Studio',
      title: 'Monthly retainer',
      lineDescription: 'Ongoing design retainer',
      quantity: 1,
      unitPrice: 12000,
      vatRate: 15,
      currency: 'ZAR',
      frequency: 'monthly',
      nextRunDate: daysFromNow(5),
      reminderDaysBefore: 3,
      remindEmail: true,
      remindWhatsapp: false,
      whatsappPhone: null as string | null,
      active: true,
      lastGeneratedInvoiceId: DEMO_INVOICE_IDS.ti41 as string | null,
    },
  ];
}

export function demoCatalogItems() {
  return [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      itemType: 'service' as const,
      name: 'Brand strategy workshop',
      description: 'Half-day workshop',
      sku: null as string | null,
      unit: 'session' as string | null,
      unitPrice: 8500,
      defaultTaxRate: 15 as number | null,
      stockQuantity: null as number | null,
      costPrice: null as number | null,
      updatedAt: daysAgo(2),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      itemType: 'service' as const,
      name: 'Website maintenance',
      description: 'Monthly care plan',
      sku: 'WEB-CARE',
      unit: 'month',
      unitPrice: 3200,
      defaultTaxRate: 15,
      stockQuantity: null,
      costPrice: null,
      updatedAt: daysAgo(7),
    },
  ];
}

export function demoPayrollRuns() {
  return [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      period: '2026-07',
      payDate: daysAgo(20),
      employeesCount: 2,
      totalAmount: 48500,
      currency: 'ZAR',
      status: 'paid' as const,
    },
  ];
}

export function demoPayrollCompensation() {
  return [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      employeeId: '50000000-0000-0000-0000-000000000002',
      name: 'Alex Finance',
      email: 'alex@demo.timelyinvoices.app',
      baseSalary: 22000,
      bonus: 1500,
      deductions: 800,
      netPay: 22700,
      currency: 'ZAR',
    },
  ];
}
