/**
 * Invoice template system — presets today; workspace-saved templates later.
 * Architecture allows expansion without rewriting InvoicePreview.
 */

export type InvoiceTemplateId = 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant' | 'corporate';

export type InvoiceTemplateDefinition = {
  id: InvoiceTemplateId;
  label: string;
  description: string;
  /** CSS accent hint for preview chrome */
  accentHex: string;
};

export const INVOICE_TEMPLATE_PRESETS: InvoiceTemplateDefinition[] = [
  { id: 'modern', label: 'Modern', description: 'Clean type, restrained header', accentHex: '#1A3A4A' },
  { id: 'classic', label: 'Classic', description: 'Traditional business layout', accentHex: '#1F2937' },
  { id: 'minimal', label: 'Minimal', description: 'Maximum whitespace, quiet borders', accentHex: '#374151' },
  { id: 'bold', label: 'Bold', description: 'Strong header band', accentHex: '#0F766E' },
  { id: 'elegant', label: 'Elegant', description: 'Editorial spacing', accentHex: '#334155' },
  { id: 'corporate', label: 'Corporate', description: 'Structured columns', accentHex: '#1E3A5F' },
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
