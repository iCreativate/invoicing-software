export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'cash'
  | 'cheque'
  | 'mobile_money'
  | 'paystack'
  | 'flutterwave';

export type PaymentListItem = {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  payment_date: string;
  notes: string | null;
};

/** Row from GET /api/payments (workspace-scoped). */
export type WorkspacePaymentListRow = PaymentListItem & {
  invoiceId: string;
  invoiceNumber: string | null;
  clientName: string | null;
  issueDate: string | null;
  provider: string | null;
  externalReference: string | null;
};

export type PaymentsAnalytics = {
  month: string;
  monthlyIncome: number;
  monthlyCurrency: string;
  avgDaysToFirstPayment: number | null;
};

