/**
 * Invoice template system — presets today; workspace-saved templates later.
 * Architecture allows expansion without rewriting InvoicePreview.
 */

export type InvoiceTemplateId =
  | 'modern'
  | 'classic'
  | 'minimal'
  | 'bold'
  | 'elegant'
  | 'corporate'
  | 'midnight'
  | 'paper'
  | 'stripe'
  | 'forest'
  | 'copper'
  | 'letterhead';

export type InvoiceTemplateChrome = {
  page: string;
  header: string;
  headerMuted: string;
  invoiceTitle: string;
  tableHead: string;
  tableHeadLast?: string;
  totals: string;
  totalsMuted: string;
  leftRail?: string;
  letterhead?: boolean;
  serif?: boolean;
};

export type InvoiceTemplateDefinition = {
  id: InvoiceTemplateId;
  label: string;
  description: string;
  accentHex: string;
  chrome: InvoiceTemplateChrome;
};

export const INVOICE_TEMPLATE_PRESETS: InvoiceTemplateDefinition[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean type, restrained header',
    accentHex: '#1A3A4A',
    chrome: {
      page: 'bg-white',
      header: 'bg-zinc-50 text-zinc-900',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-zinc-50 text-zinc-600',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional business layout',
    accentHex: '#1F2937',
    chrome: {
      page: 'bg-white',
      header: 'bg-white text-zinc-900 border-b-2 border-zinc-900',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'font-serif text-3xl font-semibold tracking-tight',
      tableHead: 'bg-zinc-100 text-zinc-800',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
      serif: true,
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Maximum whitespace, quiet borders',
    accentHex: '#374151',
    chrome: {
      page: 'bg-white',
      header: 'bg-white text-zinc-900',
      headerMuted: 'text-zinc-500',
      invoiceTitle: 'text-xl font-medium tracking-[0.2em]',
      tableHead: 'bg-white text-zinc-500 border-b border-zinc-200',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-500',
    },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Strong header band',
    accentHex: '#0F766E',
    chrome: {
      page: 'bg-white',
      header: 'bg-zinc-900 text-white',
      headerMuted: 'text-white/80',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-zinc-900 text-white',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'elegant',
    label: 'Elegant',
    description: 'Editorial spacing',
    accentHex: '#334155',
    chrome: {
      page: 'bg-white',
      header: 'bg-gradient-to-r from-[#1A3A4A] to-[#2F6F7E] text-white',
      headerMuted: 'text-white/80',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-zinc-900 text-white',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'corporate',
    label: 'Corporate',
    description: 'Structured columns',
    accentHex: '#1E3A5F',
    chrome: {
      page: 'bg-white',
      header: 'bg-white text-zinc-900',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-2xl font-semibold tracking-wide',
      tableHead: 'bg-blue-600 text-white',
      tableHeadLast: 'bg-fuchsia-600 text-white',
      totals: 'text-white',
      totalsMuted: 'text-white/90',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep ink header, Timely palette',
    accentHex: '#0F1418',
    chrome: {
      page: 'bg-white',
      header: 'bg-[#0F1418] text-[#f6f4f0]',
      headerMuted: 'text-[#f6f4f0]/75',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-[#0F1418] text-[#f6f4f0]',
      totals: 'text-[#0F1418]',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    description: 'Warm cream, studio stationery',
    accentHex: '#C4B8A5',
    chrome: {
      page: 'bg-[#f6f4f0]',
      header: 'bg-[#f6f4f0] text-[#101418] border-b border-[#1a3a4a]/15',
      headerMuted: 'text-[#5a6169]',
      invoiceTitle: 'font-serif text-3xl font-medium tracking-tight',
      tableHead: 'bg-[#eceae4] text-[#5a6169]',
      totals: 'text-[#101418]',
      totalsMuted: 'text-[#5a6169]',
      serif: true,
    },
  },
  {
    id: 'stripe',
    label: 'Stripe',
    description: 'Teal rail down the left edge',
    accentHex: '#1A3A4A',
    chrome: {
      page: 'relative bg-white',
      header: 'bg-white text-zinc-900',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-[#1A3A4A] text-white',
      totals: 'text-[#1A3A4A]',
      totalsMuted: 'text-zinc-600',
      leftRail: 'absolute inset-y-0 left-0 w-2 bg-[#1A3A4A]',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Green band for earthy brands',
    accentHex: '#1B5C45',
    chrome: {
      page: 'bg-white',
      header: 'bg-[#1B5C45] text-white',
      headerMuted: 'text-white/80',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-[#1B5C45] text-white',
      totals: 'text-[#1B5C45]',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'copper',
    label: 'Copper',
    description: 'Warm rust header',
    accentHex: '#9A5B32',
    chrome: {
      page: 'bg-white',
      header: 'bg-[#9A5B32] text-[#fdf6ef]',
      headerMuted: 'text-[#fdf6ef]/80',
      invoiceTitle: 'text-2xl font-semibold tracking-tight',
      tableHead: 'bg-[#c4a484] text-[#3f2a1a]',
      totals: 'text-[#9A5B32]',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'letterhead',
    label: 'Letterhead',
    description: 'Centered stationery, formal',
    accentHex: '#1A3A4A',
    chrome: {
      page: 'bg-white',
      header: 'bg-white text-[#101418] border-b-2 border-[#1A3A4A]',
      headerMuted: 'text-[#5a6169]',
      invoiceTitle: 'text-xs font-semibold uppercase tracking-[0.28em]',
      tableHead: 'bg-white text-[#5a6169] border-b-2 border-[#1A3A4A]',
      totals: 'text-[#101418]',
      totalsMuted: 'text-[#5a6169]',
      letterhead: true,
      serif: true,
    },
  },
];

export function getInvoiceTemplate(id: string | null | undefined): InvoiceTemplateDefinition {
  const found = INVOICE_TEMPLATE_PRESETS.find((t) => t.id === id);
  return found ?? INVOICE_TEMPLATE_PRESETS[0]!;
}

/** Future: load from `invoice_templates` table keyed by owner_id. */
export type WorkspaceInvoiceTemplate = {
  id: string;
  ownerId: string;
  name: string;
  basePreset: InvoiceTemplateId;
  logoUrl?: string | null;
  brandColor?: string | null;
  footerHtml?: string | null;
};
