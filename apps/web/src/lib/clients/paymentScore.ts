export type PaymentScoreInvoice = {
  status: string;
  issue_date?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
  total_amount?: number | null;
  balance_amount?: number | null;
  paid_amount?: number | null;
};

export type PaymentScoreFactor = {
  key: 'avg_days_to_pay' | 'late_rate' | 'outstanding_ratio';
  label: string;
  value: number | null;
  weight: number;
  contribution: number;
};

export type TimelyPaymentScore = {
  score: number;
  factors: PaymentScoreFactor[];
  avgDaysToPay: number | null;
  lateRate: number | null;
  outstandingRatio: number | null;
};

function daysBetween(fromISO: string, toISO: string): number | null {
  const a = new Date(`${fromISO.slice(0, 10)}T00:00:00.000Z`).getTime();
  const b = new Date(`${toISO.slice(0, 10)}T00:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return (b - a) / 86400000;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Deterministic 0–100 Timely Payment Score from invoice history.
 * Higher is better (pays on time, low outstanding share).
 */
export function computeTimelyPaymentScore(invoices: PaymentScoreInvoice[]): TimelyPaymentScore {
  const active = invoices.filter((inv) => {
    const st = String(inv.status ?? '').toLowerCase();
    return st !== 'cancelled' && st !== 'draft';
  });

  const paid = active.filter((inv) => String(inv.status).toLowerCase() === 'paid');
  const payDays: number[] = [];
  let lateCount = 0;
  let settledWithDue = 0;

  for (const inv of paid) {
    const issue = inv.issue_date ? String(inv.issue_date).slice(0, 10) : null;
    const paidDate = inv.paid_date ? String(inv.paid_date).slice(0, 10) : null;
    const due = inv.due_date ? String(inv.due_date).slice(0, 10) : null;
    if (issue && paidDate) {
      const d = daysBetween(issue, paidDate);
      if (d != null) payDays.push(d);
    }
    if (due && paidDate) {
      settledWithDue += 1;
      if (paidDate > due) lateCount += 1;
    }
  }

  let totalBilled = 0;
  let outstanding = 0;
  for (const inv of active) {
    const total = Number(inv.total_amount ?? 0);
    const balance = Number(inv.balance_amount ?? Math.max(0, total - Number(inv.paid_amount ?? 0)));
    if (total > 0) totalBilled += total;
    if (balance > 0) outstanding += balance;
  }

  const avgDaysToPay = payDays.length > 0 ? payDays.reduce((s, d) => s + d, 0) / payDays.length : null;
  const lateRate = settledWithDue > 0 ? lateCount / settledWithDue : null;
  const outstandingRatio = totalBilled > 0 ? outstanding / totalBilled : null;

  // Component scores 0–100 (higher better)
  const avgDaysScore =
    avgDaysToPay == null ? 70 : clamp(100 - avgDaysToPay * 2.5, 15, 100);
  const lateScore = lateRate == null ? 70 : clamp(100 - lateRate * 100, 0, 100);
  const outstandingScore =
    outstandingRatio == null ? 70 : clamp(100 - outstandingRatio * 120, 0, 100);

  const weights = {
    avg_days_to_pay: 0.35,
    late_rate: 0.4,
    outstanding_ratio: 0.25,
  } as const;

  const factors: PaymentScoreFactor[] = [
    {
      key: 'avg_days_to_pay',
      label: 'Average days to pay',
      value: avgDaysToPay != null ? Math.round(avgDaysToPay * 10) / 10 : null,
      weight: weights.avg_days_to_pay,
      contribution: Math.round(avgDaysScore * weights.avg_days_to_pay * 10) / 10,
    },
    {
      key: 'late_rate',
      label: 'Late payment rate',
      value: lateRate != null ? Math.round(lateRate * 1000) / 1000 : null,
      weight: weights.late_rate,
      contribution: Math.round(lateScore * weights.late_rate * 10) / 10,
    },
    {
      key: 'outstanding_ratio',
      label: 'Outstanding ratio',
      value: outstandingRatio != null ? Math.round(outstandingRatio * 1000) / 1000 : null,
      weight: weights.outstanding_ratio,
      contribution: Math.round(outstandingScore * weights.outstanding_ratio * 10) / 10,
    },
  ];

  const raw =
    avgDaysScore * weights.avg_days_to_pay +
    lateScore * weights.late_rate +
    outstandingScore * weights.outstanding_ratio;
  const score = Math.round(clamp(raw, 0, 100));

  return {
    score,
    factors,
    avgDaysToPay: avgDaysToPay != null ? Math.round(avgDaysToPay * 10) / 10 : null,
    lateRate: lateRate != null ? Math.round(lateRate * 1000) / 1000 : null,
    outstandingRatio: outstandingRatio != null ? Math.round(outstandingRatio * 1000) / 1000 : null,
  };
}
