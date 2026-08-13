import { describe, expect, it } from 'vitest';
import { computeTimelyPaymentScore } from './paymentScore';

describe('computeTimelyPaymentScore', () => {
  it('scores a reliable payer highly', () => {
    const result = computeTimelyPaymentScore([
      {
        status: 'paid',
        issue_date: '2026-01-01',
        due_date: '2026-01-15',
        paid_date: '2026-01-10',
        total_amount: 1000,
        balance_amount: 0,
        paid_amount: 1000,
      },
      {
        status: 'paid',
        issue_date: '2026-02-01',
        due_date: '2026-02-15',
        paid_date: '2026-02-12',
        total_amount: 2000,
        balance_amount: 0,
        paid_amount: 2000,
      },
    ]);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.lateRate).toBe(0);
    expect(result.outstandingRatio).toBe(0);
    expect(result.factors).toHaveLength(3);
  });

  it('penalises late payments and outstanding balance', () => {
    const good = computeTimelyPaymentScore([
      {
        status: 'paid',
        issue_date: '2026-01-01',
        due_date: '2026-01-10',
        paid_date: '2026-01-08',
        total_amount: 1000,
        balance_amount: 0,
      },
    ]);
    const poor = computeTimelyPaymentScore([
      {
        status: 'paid',
        issue_date: '2026-01-01',
        due_date: '2026-01-10',
        paid_date: '2026-02-20',
        total_amount: 1000,
        balance_amount: 0,
      },
      {
        status: 'sent',
        issue_date: '2026-03-01',
        due_date: '2026-03-15',
        total_amount: 5000,
        balance_amount: 5000,
      },
    ]);
    expect(poor.score).toBeLessThan(good.score);
    expect(poor.lateRate).toBe(1);
    expect(poor.outstandingRatio).toBeGreaterThan(0);
  });

  it('ignores draft and cancelled invoices', () => {
    const result = computeTimelyPaymentScore([
      { status: 'draft', total_amount: 9999, balance_amount: 9999 },
      { status: 'cancelled', total_amount: 9999, balance_amount: 9999 },
    ]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.avgDaysToPay).toBeNull();
    expect(result.lateRate).toBeNull();
    expect(result.outstandingRatio).toBeNull();
  });

  it('returns score between 0 and 100', () => {
    const result = computeTimelyPaymentScore([]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
