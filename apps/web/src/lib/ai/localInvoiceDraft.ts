export type LocalInvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type KnownClient = {
  id: string;
  name: string;
  email?: string | null;
};

export type LocalInvoiceDraft = {
  client: { id: string | null; name: string; email: string; phone: string };
  currency: string;
  issueDate: string;
  dueDate: string;
  items: LocalInvoiceItem[];
  notes: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number, from = todayISO()) {
  const d = new Date(`${from}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseMoney(raw: string) {
  const n = Number(String(raw).replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function titleCase(s: string) {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanDescription(s: string) {
  return s
    .replace(/[:\-–—]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function vatFromInput(input: string) {
  if (/\b(zero[-\s]?rated|vat\s*exempt|no\s*vat|excl(?:uding)?\s*vat|0\s*%\s*vat)\b/i.test(input)) return 0;
  const m = input.match(/\bvat\s*(?:at\s*)?(\d{1,2})\s*%?/i);
  if (m) return Number(m[1]);
  return 15;
}

function matchKnownClient(input: string, known: KnownClient[]) {
  const lower = input.toLowerCase();
  let best: KnownClient | null = null;
  for (const c of known) {
    const name = c.name.trim();
    if (name.length < 2) continue;
    if (lower.includes(name.toLowerCase()) && (!best || name.length > best.name.length)) best = c;
  }
  return best;
}

function extractClientName(input: string) {
  const m = input.match(
    /\b(?:for|to|client|bill(?:ing)?)\s+([A-Za-z][\w&.'-]*(?:\s+[A-Za-z][\w&.'-]*){0,4})(?=\s*[:\-–,]|\s+\d|\s*$)/i
  );
  if (!m) return '';
  const name = m[1].trim();
  if (/^(hours?|hrs?|days?|months?|vat|zar|usd)$/i.test(name)) return '';
  return titleCase(name);
}

const HOURS_RE =
  /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:at|@|x|×)?\s*(?:of\s*)?(?:R|ZAR|\$)?\s*(\d[\d\s,]*(?:\.\d+)?)(?:\s*(?:\/\s*hr|per\s*hour|\/hour|p\/h))?/i;
const QTY_PRICE_RE =
  /(\d+(?:\.\d+)?)\s*[x×]\s*(?:R|ZAR|\$)?\s*(\d[\d\s,]*(?:\.\d+)?)/i;
const MONEY_RE = /(?:R|ZAR|\$)\s*(\d[\d\s,]*(?:\.\d+)?)/i;

function parseChunk(chunk: string, vatRate: number): LocalInvoiceItem | null {
  const text = chunk.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const hours = text.match(HOURS_RE);
  if (hours) {
    const description = cleanDescription(text.replace(HOURS_RE, '').replace(/\b(at|@)\s*$/i, '')) || 'Professional services';
    return {
      description,
      quantity: Number(hours[1]),
      unitPrice: parseMoney(hours[2]),
      vatRate,
    };
  }

  const qtyPrice = text.match(QTY_PRICE_RE);
  if (qtyPrice) {
    const description = cleanDescription(text.replace(QTY_PRICE_RE, '')) || 'Item';
    return {
      description,
      quantity: Number(qtyPrice[1]),
      unitPrice: parseMoney(qtyPrice[2]),
      vatRate,
    };
  }

  const money = text.match(MONEY_RE);
  if (money) {
    const description = cleanDescription(text.replace(MONEY_RE, '').replace(/\/\s*(mo|month|yr|year)\b/i, '').replace(/\b(at|@)\s*$/i, '')) || 'Item';
    return {
      description,
      quantity: 1,
      unitPrice: parseMoney(money[1]),
      vatRate,
    };
  }

  return {
    description: cleanDescription(text) || 'Item',
    quantity: 1,
    unitPrice: 0,
    vatRate,
  };
}

/** Draft line items + VAT from a work description. No API key required. */
export function draftInvoiceFromDescription(
  input: string,
  opts?: {
    knownClients?: KnownClient[];
    today?: string;
  }
): LocalInvoiceDraft {
  const raw = input.trim();
  const vatRate = vatFromInput(raw);
  const today = opts?.today ?? todayISO();
  const known = opts?.knownClients ?? [];

  const matched = matchKnownClient(raw, known);
  const clientName = matched?.name ?? extractClientName(raw);

  let work = raw;
  if (matched) work = work.replace(new RegExp(matched.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ');
  work = work
    .replace(/\b(?:for|to|client|bill(?:ing)?)\s+[A-Za-z][\w&.'-]*(?:\s+[A-Za-z][\w&.'-]*){0,4}\s*[:\-–,.]?/gi, ' ')
    .replace(/\b(zero[-\s]?rated|vat\s*exempt|no\s*vat|excl(?:uding)?\s*vat|0\s*%\s*vat|vat\s*(?:at\s*)?\d{1,2}\s*%?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const chunks = work
    .split(/\s*\+\s*|\s*;\s*|\n+/)
    .map((c) => c.replace(/^[:\-–—,.\s]+/, '').trim())
    .filter(Boolean);

  const items = (chunks.length ? chunks : [work || raw])
    .map((c) => parseChunk(c, vatRate))
    .filter((it): it is LocalInvoiceItem => Boolean(it && it.description));

  return {
    client: {
      id: matched?.id ?? null,
      name: clientName,
      email: matched?.email ? String(matched.email) : '',
      phone: '',
    },
    currency: /\$|USD/i.test(raw) && !/\bZAR\b|R\s*\d/i.test(raw) ? 'USD' : 'ZAR',
    issueDate: today,
    dueDate: addDaysISO(30, today),
    items: items.length ? items : [{ description: cleanDescription(raw) || 'Professional services', quantity: 1, unitPrice: 0, vatRate }],
    notes: '',
  };
}
