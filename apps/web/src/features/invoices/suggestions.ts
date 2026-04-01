import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export type ItemSuggestion = {
  description: string;
  unitPrice: number;
  vatRate: number;
  source: 'client_history' | 'global_history' | 'local_memory';
};

const MEMORY_KEY = 'ti_pricing_memory_v1';

function readMemory(): Record<string, { unitPrice: number; vatRate: number; usedAt: number }> {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeMemory(next: Record<string, { unitPrice: number; vatRate: number; usedAt: number }>) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function rememberPrice(description: string, unitPrice: number, vatRate: number) {
  const key = description.trim().toLowerCase();
  if (!key) return;
  const mem = readMemory();
  mem[key] = { unitPrice, vatRate, usedAt: Date.now() };
  writeMemory(mem);
}

export function suggestFromMemory(query: string): ItemSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const mem = readMemory();
  const entries = Object.entries(mem)
    .filter(([k]) => k.includes(q))
    .sort((a, b) => (b[1].usedAt ?? 0) - (a[1].usedAt ?? 0))
    .slice(0, 5);
  return entries.map(([description, v]) => ({
    description,
    unitPrice: v.unitPrice,
    vatRate: v.vatRate,
    source: 'local_memory',
  }));
}

export async function fetchItemSuggestions({
  clientId,
  query,
}: {
  clientId: string | null;
  query: string;
}): Promise<ItemSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return suggestFromMemory(q);

  const supabase = createSupabaseBrowserClient();
  const suggestions: ItemSuggestion[] = [];

  // Client history (if clientId present)
  if (clientId) {
    const { data } = await supabase
      .from('invoice_items')
      .select('description, unit_price, tax_rate, invoice:invoices(client_id)')
      .ilike('description', `%${q}%`)
      .limit(20);

    const filtered = (data ?? []).filter((row: any) => row.invoice?.client_id === clientId);
    for (const row of filtered.slice(0, 5)) {
      suggestions.push({
        description: String(row.description ?? ''),
        unitPrice: Number(row.unit_price ?? 0),
        vatRate: Number(row.tax_rate ?? 15),
        source: 'client_history',
      });
    }
  }

  // Global history
  if (suggestions.length < 8) {
    const { data } = await supabase
      .from('invoice_items')
      .select('description, unit_price, tax_rate')
      .ilike('description', `%${q}%`)
      .limit(8);
    for (const row of data ?? []) {
      suggestions.push({
        description: String(row.description ?? ''),
        unitPrice: Number(row.unit_price ?? 0),
        vatRate: Number(row.tax_rate ?? 15),
        source: 'global_history',
      });
    }
  }

  // Memory (prepend)
  return [...suggestFromMemory(q), ...dedupeByDescription(suggestions)].slice(0, 8);
}

export async function aiSuggestPricing({
  description,
  clientId,
}: {
  description: string;
  clientId: string | null;
}) {
  const res = await fetch('/api/ai/pricing-suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item: { description, clientId },
      history: null,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error ?? 'AI pricing failed');
  return json.data as { unitPrice: number; vatRate: number; confidence: string; reason: string };
}

function dedupeByDescription(list: ItemSuggestion[]) {
  const seen = new Set<string>();
  const out: ItemSuggestion[] = [];
  for (const s of list) {
    const k = s.description.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

