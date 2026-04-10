export type ReportsRange = { from: string; to: string };

export type RevenueMonthlyRow = { period: string; invoiced: number; collected: number };

export type RevenueYearlyRow = { year: string; invoiced: number; collected: number };

export type TopClientRow = {
  client_id: string;
  client_name: string;
  invoiced: number;
  paid_on_invoices: number;
  invoice_count: number;
};

export type OutstandingRow = {
  invoice_id: string;
  invoice_number: string;
  client_name: string | null;
  status: string;
  issue_date: string;
  due_date: string;
  currency: string;
  total_amount: number;
  balance_amount: number;
};

export type ReportsPayload = {
  range: ReportsRange;
  currency_filter: string | null;
  mixed_currency: boolean;
  primary_currency_hint: string;
  revenue_monthly: RevenueMonthlyRow[];
  revenue_yearly: RevenueYearlyRow[];
  top_clients: TopClientRow[];
  outstanding: OutstandingRow[];
  tax_summary: {
    invoice_count: number;
    taxable_subtotal: number;
    tax_amount: number;
  };
  totals_in_range: {
    invoiced: number;
    collected: number;
  };
};
