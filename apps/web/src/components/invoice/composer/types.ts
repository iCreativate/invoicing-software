export type InvoiceComposerTemplate = 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant' | 'corporate';

export type InvoiceComposerStatus = 'draft' | 'sent';

export type InvoiceComposerClient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type InvoiceComposerItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // percent, SA default 15
  /** When set (inventory catalog item), stock is reduced when the invoice is sent. */
  catalogItemId?: string | null;
};

export type InvoiceComposerDraft = {
  invoiceNumber?: string | null;
  clientId: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string; // ZAR default
  template: InvoiceComposerTemplate;
  items: InvoiceComposerItem[];
  notes?: string;
};

