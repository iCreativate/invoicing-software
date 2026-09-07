/**
 * Invoice template system — presets today; workspace-saved templates later.
 * Architecture allows expansion without rewriting InvoicePreview.
 */

export type InvoiceTemplateLayout =
  | 'standard'
  | 'manblue'
  | 'nexus'
  | 'technosoft'
  | 'options'
  | 'present'
  | 'tealframe'
  | 'navylime'
  | 'navycoral'
  | 'venture';

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
  | 'letterhead'
  | 'manblue'
  | 'nexus'
  | 'technosoft'
  | 'options'
  | 'present'
  | 'tealframe'
  | 'navylime'
  | 'navycoral'
  | 'venture';

export type InvoiceTemplateChrome = {
  layout?: InvoiceTemplateLayout;
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
  {
    id: 'manblue',
    label: 'Manblue',
    description: 'Navy and lime, pill headers',
    accentHex: '#2E3192',
    chrome: {
      layout: 'manblue',
      page: 'bg-[#E8E8E8]',
      header: 'bg-transparent',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-5xl font-black',
      tableHead: 'bg-[#2E3192] text-white',
      tableHeadLast: 'bg-[#C5D97A] text-[#2E3192]',
      totals: 'text-[#2E3192]',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'nexus',
    label: 'Nexus',
    description: 'Gold accent, framed layout',
    accentHex: '#C9A961',
    chrome: {
      layout: 'nexus',
      page: 'bg-white border-[12px] border-zinc-700',
      header: 'bg-white',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-4xl font-extralight uppercase tracking-[0.35em]',
      tableHead: 'bg-[#C9A961] text-white',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'technosoft',
    label: 'Technosoft',
    description: 'Gold column, dark header bar',
    accentHex: '#D1B98B',
    chrome: {
      layout: 'technosoft',
      page: 'bg-white',
      header: 'bg-[#2E2E2E] text-white',
      headerMuted: 'text-zinc-500',
      invoiceTitle: 'text-2xl font-bold uppercase',
      tableHead: 'bg-[#2E2E2E] text-white',
      tableHeadLast: 'bg-[#D1B98B] text-[#2E2E2E]',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'options',
    label: 'Options',
    description: 'Cyan accent, banner footer',
    accentHex: '#17A2C6',
    chrome: {
      layout: 'options',
      page: 'bg-white',
      header: 'bg-white',
      headerMuted: 'text-zinc-500',
      invoiceTitle: 'text-4xl font-black uppercase',
      tableHead: 'bg-[#17A2C6] text-white',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'present',
    label: 'Present',
    description: 'Golden pills, sidebar layout',
    accentHex: '#F5A623',
    chrome: {
      layout: 'present',
      page: 'bg-white',
      header: 'bg-white',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-4xl font-black uppercase',
      tableHead: 'bg-[#F5A623] text-zinc-900',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'tealframe',
    label: 'Teal Frame',
    description: 'Teal rails, rounded metadata pill',
    accentHex: '#2E7D78',
    chrome: {
      layout: 'tealframe',
      page: 'bg-white',
      header: 'bg-white',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-5xl font-bold text-[#2E7D78]',
      tableHead: 'bg-[#2E7D78] text-white',
      totals: 'text-white',
      totalsMuted: 'text-zinc-600',
    },
  },
  {
    id: 'navylime',
    label: 'Navy Lime',
    description: 'Dark header, lime accents',
    accentHex: '#A4CC34',
    chrome: {
      layout: 'navylime',
      page: 'bg-white',
      header: 'bg-[#282C3F] text-white',
      headerMuted: 'text-white/80',
      invoiceTitle: 'text-4xl font-bold italic text-[#A4CC34]',
      tableHead: 'bg-[#A4CC34] text-[#282C3F]',
      totals: 'text-[#A4CC34]',
      totalsMuted: 'text-white/90',
    },
  },
  {
    id: 'navycoral',
    label: 'Navy Coral',
    description: 'Navy header, coral table bar',
    accentHex: '#E85D61',
    chrome: {
      layout: 'navycoral',
      page: 'bg-[#F2F2F2]',
      header: 'bg-[#1A2B4C] text-white',
      headerMuted: 'text-white/85',
      invoiceTitle: 'text-4xl font-black uppercase',
      tableHead: 'bg-[#E85D61] text-zinc-900',
      totals: 'text-white',
      totalsMuted: 'text-zinc-700',
    },
  },
  {
    id: 'venture',
    label: 'Venture',
    description: 'Green sidebar, vertical title',
    accentHex: '#3D8B5F',
    chrome: {
      layout: 'venture',
      page: 'bg-[#F4F4F4]',
      header: 'bg-[#F4F4F4]',
      headerMuted: 'text-zinc-600',
      invoiceTitle: 'text-2xl font-bold uppercase',
      tableHead: 'bg-[#3D8B5F] text-white',
      totals: 'text-zinc-900',
      totalsMuted: 'text-zinc-600',
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
