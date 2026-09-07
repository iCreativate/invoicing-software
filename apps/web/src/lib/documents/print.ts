export function documentPrintPath(kind: 'invoice' | 'quote', id: string) {
  return kind === 'quote' ? `/quotes/${id}/print` : `/invoices/${id}/print`;
}

export function openDocumentPrintPage(kind: 'invoice' | 'quote', id: string) {
  const path = documentPrintPath(kind, id);
  window.open(path, '_blank', 'noopener,noreferrer');
}
