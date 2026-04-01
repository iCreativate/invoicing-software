export type QuoteListItem = {
  id: string;
  quoteNumber: string | null;
  status: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  totalAmount: number;
  clientName: string | null;
  convertedInvoiceId: string | null;
};

export type QuoteItemRow = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
};

export type QuoteDetail = {
  id: string;
  quoteNumber: string | null;
  status: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  vatRate: number;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  clientId: string;
  convertedInvoiceId: string | null;
  items: QuoteItemRow[];
};
