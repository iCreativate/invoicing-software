import { describe, expect, it } from 'vitest';
import { canTransitionInvoiceStatus } from './lifecycle';

describe('invoice status transitions', () => {
  it('allows draft → sent', () => {
    expect(canTransitionInvoiceStatus('draft', 'sent')).toBe(true);
  });
  it('blocks paid → draft', () => {
    expect(canTransitionInvoiceStatus('paid', 'draft')).toBe(false);
  });
  it('allows overdue → paid', () => {
    expect(canTransitionInvoiceStatus('overdue', 'paid')).toBe(true);
  });
});
