import { describe, expect, it } from 'vitest';
import { draftInvoiceFromDescription } from './localInvoiceDraft';

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
});
