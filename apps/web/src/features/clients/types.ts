export type ClientListItem = {
  id: string;
  name: string;
  email: string | null;
  companyName: string | null;
};

export type ClientDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  companyName: string | null;
  website: string | null;
  companyRegistration: string | null;
  vatNumber: string | null;
};

export type ClientInvoiceInsights = {
  invoiceCount: number;
  lifetimeBilled: number;
  lifetimeCollected: number;
  outstanding: number;
  paidCount: number;
  overdueCount: number;
  avgDaysToPay: number | null;
  lastPaidAt: string | null;
};
