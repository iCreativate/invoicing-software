import { describe, expect, it } from 'vitest';
import { draftInvoiceFromDescription, detectDocumentKind } from './localInvoiceDraft';

describe('draftInvoiceFromDescription', () => {
  it('parses hours, rate, client, and a retainer line', () => {
    const d = draftInvoiceFromDescription(
      'Website design for Acme: 8 hours at R950/hr + hosting retainer',
      { today: '2026-08-13' }
    );
    expect(d.client.name).toBe('Acme');
    expect(d.currency).toBe('ZAR');
    expect(d.issueDate).toBe('2026-08-13');
    expect(d.dueDate).toBe('2026-09-12');
    expect(d.items).toEqual([
      { description: 'Website design', quantity: 8, unitPrice: 950, vatRate: 15 },
      { description: 'Hosting retainer', quantity: 1, unitPrice: 0, vatRate: 15 },
    ]);
  });

  it('matches a known client and a priced retainer', () => {
    const d = draftInvoiceFromDescription('Logo refresh for Acme Corp + hosting retainer R1,200', {
      knownClients: [{ id: 'c1', name: 'Acme Corp', email: 'ap@acme.test' }],
    });
    expect(d.client).toMatchObject({ id: 'c1', name: 'Acme Corp', email: 'ap@acme.test' });
    expect(d.items[1]).toMatchObject({ description: 'Hosting retainer', unitPrice: 1200, quantity: 1 });
  });

  it('uses zero VAT when asked', () => {
    const d = draftInvoiceFromDescription('Consulting 4 hrs @ R600 zero-rated');
    expect(d.items[0]).toMatchObject({ quantity: 4, unitPrice: 600, vatRate: 0 });
  });

  it('parses invoice for a named client and a rand amount', () => {
    const d = draftInvoiceFromDescription('Create an invoice for ABC Construction for R15,000.');
    expect(d.client.name).toBe('ABC Construction');
    expect(d.items[0]).toMatchObject({ quantity: 1, unitPrice: 15000, vatRate: 15 });
  });

  it('parses day rates and net 14 payment terms', () => {
    const d = draftInvoiceFromDescription('On-site support for Beta Ltd: 3 days at R2,200/day, due in 14 days', {
      today: '2026-08-28',
    });
    expect(d.client.name).toBe('Beta Ltd');
    expect(d.items[0]).toMatchObject({ description: 'On-site support', quantity: 3, unitPrice: 2200 });
    expect(d.dueDate).toBe('2026-09-11');
  });

  it('detects quotes and applies shorter validity', () => {
    const d = draftInvoiceFromDescription('Quote for Sunrise Studio: brand identity R18,500 + 2 x R950 strategy sessions', {
      documentKind: 'quote',
      today: '2026-08-28',
    });
    expect(d.documentKind).toBe('quote');
    expect(d.dueDate).toBe('2026-09-11');
    expect(d.items.length).toBeGreaterThanOrEqual(2);
  });

  it('matches catalog items by name', () => {
    const d = draftInvoiceFromDescription('Invoice Acme for Website Maintenance x2', {
      catalogItems: [{ id: 'cat-1', name: 'Website Maintenance', unitPrice: 1200, defaultTaxRate: 15 }],
      knownClients: [{ id: 'c1', name: 'Acme', email: 'a@acme.test' }],
    });
    expect(d.items[0]).toMatchObject({
      description: 'Website Maintenance',
      quantity: 2,
      unitPrice: 1200,
      catalogItemId: 'cat-1',
    });
  });

  it('splits numbered list lines', () => {
    const d = draftInvoiceFromDescription(`Work for Delta:
1. Discovery R4,500
2. Build R12,000`);
    expect(d.items.length).toBe(2);
    expect(d.items[0]).toMatchObject({ description: 'Discovery', unitPrice: 4500 });
    expect(d.items[1]).toMatchObject({ description: 'Build', unitPrice: 12000 });
  });
});

describe('detectDocumentKind', () => {
  it('prefers quote when only quote language is used', () => {
    expect(detectDocumentKind('Quote for Acme: logo design R5,000')).toBe('quote');
    expect(detectDocumentKind('Invoice for Acme: logo design R5,000')).toBe('invoice');
  });
});
