import {
  draftInvoiceFromDescription,
  type KnownClient,
  type LocalInvoiceDraft,
  type LocalInvoiceItem,
} from '@/lib/ai/localInvoiceDraft';

export type DocumentKind = 'invoice' | 'quote';

export type CatalogDraftHint = {
  id: string;
  name: string;
  unitPrice: number;
  defaultTaxRate?: number | null;
};

export type DraftDocumentResult = {
  draft: LocalInvoiceDraft;
  source: 'local' | 'cloud' | 'merged';
  insights: string[];
  confidence: 'low' | 'medium' | 'high';
};

function pricedItemCount(items: LocalInvoiceItem[]) {
  return items.filter((it) => it.unitPrice > 0 && it.description.trim()).length;
}

function mergeDrafts(local: LocalInvoiceDraft, cloud: LocalInvoiceDraft): LocalInvoiceDraft {
  const localPriced = pricedItemCount(local.items);
  const cloudPriced = pricedItemCount(cloud.items);
  const items = cloudPriced > localPriced ? cloud.items : local.items.length >= cloud.items.length ? local.items : cloud.items;

  const client =
    local.client.id && (!cloud.client.name || cloud.client.id === local.client.id)
      ? local.client
      : cloud.client.name
        ? { ...cloud.client, id: cloud.client.id ?? local.client.id }
        : local.client;

  return {
    client,
    currency: cloud.currency || local.currency,
    issueDate: cloud.issueDate || local.issueDate,
    dueDate: cloud.dueDate || local.dueDate,
    items,
    notes: cloud.notes?.trim() ? cloud.notes : local.notes,
    documentKind: cloud.documentKind || local.documentKind,
  };
}

function scoreConfidence(draft: LocalInvoiceDraft): 'low' | 'medium' | 'high' {
  const priced = pricedItemCount(draft.items);
  const hasClient = Boolean(draft.client.id || draft.client.name.trim());
  if (priced >= 2 && hasClient) return 'high';
  if (priced >= 1) return 'medium';
  return 'low';
}

function buildInsights(draft: LocalInvoiceDraft, input: string, documentKind: DocumentKind): string[] {
  const insights: string[] = [];
  if (draft.client.name) insights.push(`Client: ${draft.client.name}`);
  if (draft.items.length) {
    const priced = draft.items.filter((it) => it.unitPrice > 0);
    insights.push(`${draft.items.length} line item${draft.items.length === 1 ? '' : 's'}`);
    if (priced.length) {
      const subtotal = priced.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      insights.push(`~${draft.currency} ${subtotal.toLocaleString('en-ZA')} ex VAT`);
    }
  }
  if (/\b(zero[-\s]?rated|vat\s*exempt|no\s*vat)\b/i.test(input)) insights.push('Zero-rated VAT');
  else if (draft.items.some((it) => it.vatRate === 0)) insights.push('Mixed VAT rates');
  insights.push(documentKind === 'quote' ? 'Quote validity applied' : 'Payment terms applied');
  return insights;
}

function canUseCloud(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export async function draftDocumentFromDescription(opts: {
  input: string;
  documentKind: DocumentKind;
  knownClients?: KnownClient[];
  catalogItems?: CatalogDraftHint[];
  today?: string;
}): Promise<DraftDocumentResult> {
  const input = opts.input.trim();
  const knownClients = opts.knownClients ?? [];
  const catalogItems = opts.catalogItems ?? [];

  const local = draftInvoiceFromDescription(input, {
    knownClients,
    catalogItems,
    documentKind: opts.documentKind,
    today: opts.today,
  });

  const insights = buildInsights(local, input, opts.documentKind);
  const confidence = scoreConfidence(local);

  if (!canUseCloud()) {
    return { draft: local, source: 'local', insights: [...insights, 'Drafted offline on this device'], confidence };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch('/api/ai/invoice-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        input,
        documentKind: opts.documentKind,
        clients: knownClients.slice(0, 40),
        catalog: catalogItems.slice(0, 40).map((c) => ({
          id: c.id,
          name: c.name,
          unitPrice: c.unitPrice,
          defaultTaxRate: c.defaultTaxRate,
        })),
        localBaseline: local,
      }),
    });
    clearTimeout(timeout);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success || !json?.data) {
      return { draft: local, source: 'local', insights: [...insights, 'Used on-device drafting'], confidence };
    }

    const cloud = json.data as LocalInvoiceDraft;
    const merged = mergeDrafts(local, cloud);
    const mergedInsights = [...buildInsights(merged, input, opts.documentKind)];
    if (json.enhanced) mergedInsights.push('Refined with Timely cloud');
    else mergedInsights.push('On-device draft confirmed');

    return {
      draft: merged,
      source: json.enhanced ? 'merged' : 'local',
      insights: mergedInsights,
      confidence: scoreConfidence(merged),
    };
  } catch {
    return { draft: local, source: 'local', insights: [...insights, 'Used on-device drafting'], confidence };
  }
}
