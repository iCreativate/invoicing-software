export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type InvoiceListItem = {
  id: string;
  invoice_number: string;
  client_name: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
};

