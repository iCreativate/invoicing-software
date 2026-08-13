import { describe, expect, it } from 'vitest';
import {
  calcBalance,
  calcInvoiceTotalsFromLines,
  calcLine,
  paymentStatusFromBalance,
  toCents,
  fromCents,
} from './index';

describe('money cents', () => {
  it('converts without float drift for common ZAR amounts', () => {
    expect(toCents(18.5)).toBe(1850);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(fromCents(1850)).toBe(18.5);
  });
});

describe('calcLine VAT exclusive', () => {
  it('applies 15% VAT on net', () => {
    const r = calcLine({ quantity: 2, unitPrice: 100, taxRate: 15, taxMode: 'exclusive' });
    expect(r.lineNet).toBe(200);
    expect(r.lineTax).toBe(30);
    expect(r.lineTotal).toBe(230);
  });

  it('supports discount before tax', () => {
    const r = calcLine({ quantity: 1, unitPrice: 100, taxRate: 15, discountPercent: 10, taxMode: 'exclusive' });
    expect(r.lineNet).toBe(90);
    expect(r.lineTax).toBe(13.5);
    expect(r.lineTotal).toBe(103.5);
  });
});

describe('calcLine VAT inclusive', () => {
  it('extracts tax from inclusive total', () => {
    const r = calcLine({ quantity: 1, unitPrice: 115, taxRate: 15, taxMode: 'inclusive' });
    expect(r.lineTotal).toBe(115);
    expect(r.lineNet).toBe(100);
    expect(r.lineTax).toBe(15);
  });
});

describe('calcLine exempt', () => {
  it('charges no tax', () => {
    const r = calcLine({ quantity: 1, unitPrice: 50, taxRate: 15, taxMode: 'exempt' });
    expect(r.lineTax).toBe(0);
    expect(r.lineTotal).toBe(50);
  });
});

describe('invoice totals', () => {
  it('sums lines consistently', () => {
    const t = calcInvoiceTotalsFromLines([
      { quantity: 1, unitPrice: 100, taxRate: 15 },
      { quantity: 1, unitPrice: 50, taxRate: 15 },
    ]);
    expect(t.subtotal).toBe(150);
    expect(t.tax).toBe(22.5);
    expect(t.total).toBe(172.5);
  });
});

describe('balance', () => {
  it('never returns negative outstanding', () => {
    const b = calcBalance({ total: 100, paid: 150 });
    expect(b.balance).toBe(0);
    expect(b.overpaid).toBe(true);
  });

  it('computes partial correctly', () => {
    expect(paymentStatusFromBalance(100, 40)).toBe('partial');
    expect(paymentStatusFromBalance(100, 100)).toBe('paid');
    expect(paymentStatusFromBalance(100, 0)).toBe('unpaid');
  });
});
