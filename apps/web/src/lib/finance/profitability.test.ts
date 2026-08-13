import { describe, expect, it } from 'vitest';
import { estimateProfitability, paymentProgress } from './profitability';

describe('estimateProfitability', () => {
  it('computes estimated profit and margin', () => {
    const r = estimateProfitability(10000, 4000);
    expect(r.estimatedProfit).toBe(6000);
    expect(r.marginPercent).toBe(60);
    expect(r.disclaimer).toContain('Not an accounting');
  });
});

describe('paymentProgress', () => {
  it('shows partial progress', () => {
    const p = paymentProgress(1000, 250);
    expect(p.percentPaid).toBe(25);
    expect(p.balance).toBe(750);
  });
});
