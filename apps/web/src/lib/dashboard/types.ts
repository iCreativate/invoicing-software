export type DashboardInvoice = {
  id: string;
  invoice_number: string;
  client_name: string | null;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
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
  };
  /** Daily payment totals for the last N days (cash basis). */
  revenueByDay: { date: string; label: string; amount: number }[];
  /** Pie slices: lifetime collected vs current outstanding. */
  paidVsUnpaid: { key: 'paid' | 'unpaid'; name: string; value: number }[];
  insights: {
    /** % change in cash collected vs previous calendar month. */
    collectionMomPercent: number | null;
    topPayingClient: { name: string; totalPaid: number } | null;
  };
  activity: DashboardActivity[];
  recentInvoices: DashboardInvoice[];
};
