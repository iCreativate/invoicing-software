export type DashboardInvoice = {
  id: string;
  invoice_number: string;
  client_name: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  total_amount: number;
  balance_amount: number;
  paid_amount: number;
};

export type DashboardActivity =
  | {
      type: 'invoice_sent';
      at: string;
      invoiceId: string;
      invoiceNumber: string | null;
      clientName: string | null;
    }
  | {
      type: 'payment_received';
      at: string;
      invoiceId: string;
      invoiceNumber: string | null;
      clientName: string | null;
      amount: number;
      currency: string;
    }
  | {
      type: 'reminder_sent';
      at: string;
      invoiceId: string;
      invoiceNumber: string | null;
      clientName: string | null;
      channel: string;
    };

export type DashboardActionItem = {
  id: string;
  kind: 'overdue' | 'due_soon' | 'viewed_unpaid' | 'payments_today';
  title: string;
  amount: number;
  count: number;
  href: string;
  cta: string;
};

export type DashboardBusinessPulse = {
  health: 'healthy' | 'watch' | 'at_risk';
  headline: string;
  avgDaysToPay: number | null;
  /** Change in avg days vs prior period (negative = faster). */
  avgDaysDelta: number | null;
  collectionMomPercent: number | null;
  /** Lifetime / trailing collection rate 0–100. */
  collectionRatePercent: number | null;
  collectionRateDelta: number | null;
};

export type DashboardSummary = {
  currency: string;
  overview: {
    /** Sum of invoice totals issued this calendar month (excl. cancelled). */
    invoicedThisMonth: number;
    outstandingAmount: number;
    outstandingInvoiceCount: number;
    overdueAmount: number;
    overdueInvoiceCount: number;
    /** Cash collected: sum of completed payments this calendar month. */
    paidThisMonth: number;
    /** Invoices marked paid with paid_date in the current calendar month. */
    paidInvoiceCountThisMonth: number;
    /** Sum of expenses recorded this calendar month (ZAR workspace). */
    expensesThisMonth: number;
  };
  /** Last six calendar months: cash collected vs expenses. */
  monthlyIncomeVsExpense: { label: string; income: number; expense: number }[];
  /** Short narrative for the AI insight card (deterministic from metrics). */
  aiCashflowInsight: string;
  /** Daily payment totals for the last N days (cash basis). */
  revenueByDay: { date: string; label: string; amount: number }[];
  /** Pie slices: lifetime collected vs current outstanding. */
  paidVsUnpaid: { key: 'paid' | 'unpaid'; name: string; value: number }[];
  insights: {
    /** % change in cash collected vs previous calendar month. */
    collectionMomPercent: number | null;
    topPayingClient: { name: string; totalPaid: number } | null;
  };
  /** Actionable collections / follow-up buckets. */
  actionItems: DashboardActionItem[];
  /** Health pulse derived from receivables + collection pace. */
  businessPulse: DashboardBusinessPulse;
  /** Balance on invoices due in the next 14 days (not overdue). */
  expectedIncoming: number;
  activity: DashboardActivity[];
  recentInvoices: DashboardInvoice[];
};
