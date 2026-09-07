import { describe, expect, it } from 'vitest';
import { resolveCommand, resolveLocalCommand, type CommandSnapshot } from './commandLayer';

const snapshot: CommandSnapshot = {
  currency: 'ZAR',
  outstandingAmount: 20900,
  outstandingInvoiceCount: 4,
  overdueAmount: 6100,
  overdueInvoiceCount: 1,
  paidThisMonth: 31800,
  expensesThisMonth: 11200,
  lastMonthIncome: 26400,
  lastMonthExpense: 9800,
  lastMonthLabel: 'Jul 26',
  featured: {
    happening: 'Revenue is stable, but cashflow is under pressure because R 6,100.00 remains overdue.',
    why: '1 invoice is past due — that cash is invoiced but not in the bank.',
    next: 'Follow up with your 1 overdue client.',
    actionLabel: 'View overdue invoices',
    href: '/reminders',
  },
  overdueClients: [{ name: 'Sky & Co', amount: 6100 }],
  knownClients: [{ id: 'c1', name: 'ABC Construction' }],
};

describe('Ask Timely command layer', () => {
  it('opens collections for overdue invoices', () => {
    const r = resolveLocalCommand('Show me overdue invoices.');
    expect(r?.intent).toBe('overdue_invoices');
    expect(r?.autoNavigate).toBe(true);
    expect(r?.actions[0]?.href).toBe('/reminders');
  });

  it('returns outstanding balance', () => {
    const r = resolveCommand('How much money am I owed?', snapshot);
    expect(r.intent).toBe('outstanding');
    expect(r.reply).toContain('R');
    expect(r.reply).toMatch(/20[,\s]?900/);
  });

  it('lists overdue clients', () => {
    const r = resolveCommand("Which clients haven't paid?", snapshot);
    expect(r.intent).toBe('unpaid_clients');
    expect(r.reply).toContain('Sky & Co');
    expect(r.actions[0]?.href).toContain('/clients?status=overdue');
  });

  it('returns last month revenue with insights', () => {
    const r = resolveCommand('How much did I make last month?', snapshot);
    expect(r.intent).toBe('last_month_revenue');
    expect(r.reply).toMatch(/26[,\s]?400/);
    expect(r.actions.some((a) => a.href === '/insights')).toBe(true);
  });

  it('starts an invoice with client and amount', () => {
    const r = resolveLocalCommand('Create an invoice for ABC Construction for R15,000.', snapshot.knownClients);
    expect(r?.intent).toBe('create_invoice');
    expect(r?.autoNavigate).toBe(true);
    expect(r?.invoicePrefill?.client.name).toMatch(/ABC Construction/i);
    expect(r?.invoicePrefill?.items[0]?.unitPrice).toBe(15000);
    expect(r?.actions[0]?.href).toBe('/invoices/new');
  });

  it('opens cashflow', () => {
    const r = resolveLocalCommand('Show my cashflow.');
    expect(r?.intent).toBe('cashflow');
    expect(r?.actions[0]?.href).toBe('/cashflow');
  });

  it('explains cashflow with Timely Insights', () => {
    const r = resolveCommand('What is affecting my cashflow?', snapshot);
    expect(r.intent).toBe('cashflow_drivers');
    expect(r.reply).toContain('overdue');
    expect(r.actions[0]?.href).toBe('/reminders');
  });
});
