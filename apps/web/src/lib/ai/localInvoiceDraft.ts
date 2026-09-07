export type LocalInvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  catalogItemId?: string;
};

export type KnownClient = {
  id: string;
  name: string;
  email?: string | null;
};

export type CatalogHint = {
  id: string;
  name: string;
  unitPrice: number;
  defaultTaxRate?: number | null;
};

export type DocumentKind = 'invoice' | 'quote';

export type LocalInvoiceDraft = {
  client: { id: string | null; name: string; email: string; phone: string };
  currency: string;
  issueDate: string;
  dueDate: string;
  items: LocalInvoiceItem[];
  notes: string;
  documentKind: DocumentKind;
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
    .split(' ')
    .map((w) => {
      if (w.length <= 4 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function cleanDescription(s: string) {
  return s
    .replace(/[:\-–—,]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function detectDocumentKind(input: string): DocumentKind {
  if (/\b(quote|quotation|estimate|proposal|tender)\b/i.test(input) && !/\binvoice\b/i.test(input)) return 'quote';
  return 'invoice';
}

function vatFromInput(input: string) {
  if (/\b(zero[-\s]?rated|vat\s*exempt|no\s*vat|excl(?:uding)?\s*vat|0\s*%\s*vat)\b/i.test(input)) return 0;
  const m = input.match(/\bvat\s*(?:at\s*)?(\d{1,2})\s*%?/i);
  if (m) return Number(m[1]);
  return 15;
}

function currencyFromInput(input: string) {
  if (/\bEUR\b|€/.test(input) && !/\bZAR\b|R\s*\d/i.test(input)) return 'EUR';
  if (/\bGBP\b|£/.test(input) && !/\bZAR\b|R\s*\d/i.test(input)) return 'GBP';
  if (/\bUSD\b|\$(?!\s*\d)/.test(input) && !/\bZAR\b|R\s*\d/i.test(input)) return 'USD';
  return 'ZAR';
}

function extractTermDays(input: string, documentKind: DocumentKind): number {
  const net = input.match(/\bnet\s*(\d{1,3})\b/i);
  if (net) return Number(net[1]);
  const dueIn = input.match(/\b(?:due|pay(?:able)?|payment)\s+(?:in|within)\s+(\d{1,3})\s+days?\b/i);
  if (dueIn) return Number(dueIn[1]);
  const valid = input.match(/\bvalid(?:ity)?\s+(?:for\s+)?(\d{1,3})\s+days?\b/i);
  if (valid) return Number(valid[1]);
  const terms = input.match(/\b(?:terms?|payment)\s+(\d{1,3})\s+days?\b/i);
  if (terms) return Number(terms[1]);
  return documentKind === 'quote' ? 14 : 30;
}

function extractNotes(input: string) {
  const po = input.match(/\b(?:PO|purchase order)\s*#?\s*([\w-]+)/i);
  if (po) return `PO: ${po[1]}`;
  const ref = input.match(/\b(?:ref(?:erence)?|job\s*#?)\s*[:#]?\s*([\w-]+)/i);
  if (ref) return `Reference: ${ref[1]}`;
  const terms = input.match(/\b(?:payment terms?|payable)\s*[:\-]?\s*([^.!\n]{4,80})/i);
  if (terms) return terms[1].trim();
  return '';
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

const WORK_WORDS =
  /\b(website|design|logo|hosting|maintenance|consulting|development|build|support|strategy|session|retainer|services?)\b/i;

function extractClientName(input: string) {
  const invoiceFor = input.match(
    /\b(?:create\s+)?(?:an?\s+)?(?:invoice|quote|quotation)\s+for\s+([A-Za-z][\w&.'-]*(?:\s+[A-Za-z][\w&.'-]*)*?)(?=\s+for\s+(?:R|ZAR|\$|€|£)|\s*[,.]|\s*$)/i
  );
  if (invoiceFor) {
    const name = invoiceFor[1].trim();
    if (!WORK_WORDS.test(name)) return titleCase(name);
  }

  const patterns = [
    /\b(?:for|to|client|bill(?:ing)?)\s+([A-Za-z][\w&.'-]*(?:\s+[A-Za-z][\w&.'-]*){0,3})(?=\s*[:\-–,.]|\s+(?:R|ZAR|\$|€|£)\s*\d|\s+\d+\s*(?:hours?|hrs?|days?|x|×))/i,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (!m) continue;
    const name = m[1].trim().replace(/\s+\b(for|to)\b$/i, '');
    if (/^(hours?|hrs?|days?|months?|vat|zar|usd|eur|gbp)$/i.test(name)) continue;
    if (WORK_WORDS.test(name)) continue;
    return titleCase(name);
  }
  return '';
}

function stripClientFromText(text: string, clientName: string) {
  if (!clientName.trim()) return text;
  const escaped = clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .replace(new RegExp(`\\bfor\\s+${escaped}\\s*[:\-–,.]?`, 'ig'), ' ')
    .replace(new RegExp(escaped, 'ig'), ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const HOURS_RE =
  /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:at|@|x|×)?\s*(?:R|ZAR|\$|€|£)?\s*(\d[\d\s,]*(?:\.\d+)?)(?:\s*(?:\/\s*hr|per\s*hour|\/hour|p\/h))?/i;
const DAYS_RE =
  /(\d+(?:\.\d+)?)\s*days?\s*(?:at|@|x|×)?\s*(?:R|ZAR|\$|€|£)?\s*(\d[\d\s,]*(?:\.\d+)?)(?:\s*(?:\/\s*day|per\s*day|daily))?/i;
const QTY_PRICE_RE =
  /(\d+(?:\.\d+)?)\s*[x×]\s*(?:R|ZAR|\$|€|£)?\s*(\d[\d\s,]*(?:\.\d+)?)/i;
const MONEY_RE = /(?:R|ZAR|\$|€|£)\s*(\d[\d\s,]*(?:\.\d+)?)/i;
const PERIOD_RE =
  /(?:R|ZAR|\$|€|£)\s*(\d[\d\s,]*(?:\.\d+)?)\s*(?:\/\s*(?:mo|month)|per\s*month|monthly|\/\s*(?:yr|year)|per\s*year|annually)/i;

function matchCatalog(text: string, catalog: CatalogHint[]): CatalogHint | null {
  const lower = text.toLowerCase();
  let best: CatalogHint | null = null;
  for (const item of catalog) {
    const name = item.name.trim();
    if (name.length < 3) continue;
    if (lower.includes(name.toLowerCase()) && (!best || name.length > best.name.length)) best = item;
  }
  return best;
}

function parseChunk(chunk: string, vatRate: number, catalog: CatalogHint[], clientName: string): LocalInvoiceItem | null {
  const text = stripClientFromText(chunk.replace(/\s+/g, ' ').trim(), clientName);
  if (!text || /^work\s*$/i.test(text)) return null;

  const catalogHit = matchCatalog(text, catalog);
  if (catalogHit) {
    const qtySuffix = text.match(/\bx\s*(\d+(?:\.\d+)?)\s*$/i);
    const qty = qtySuffix ? Number(qtySuffix[1]) : 1;
    if (!HOURS_RE.test(text) && !DAYS_RE.test(text) && !QTY_PRICE_RE.test(text)) {
      return {
        description: catalogHit.name,
        quantity: qty > 0 ? qty : 1,
        unitPrice: catalogHit.unitPrice,
        vatRate: catalogHit.defaultTaxRate ?? vatRate,
        catalogItemId: catalogHit.id,
      };
    }
  }

  const hours = text.match(HOURS_RE);
  if (hours) {
    const description = cleanDescription(text.replace(HOURS_RE, '').replace(/\b(at|@)\s*$/i, '')) || 'Professional services';
    return { description, quantity: Number(hours[1]), unitPrice: parseMoney(hours[2]), vatRate };
  }

  const days = text.match(DAYS_RE);
  if (days) {
    const description = cleanDescription(text.replace(DAYS_RE, '').replace(/\b(at|@)\s*$/i, '')) || 'Professional services';
    return { description, quantity: Number(days[1]), unitPrice: parseMoney(days[2]), vatRate };
  }

  const qtyPrice = text.match(QTY_PRICE_RE);
  if (qtyPrice) {
    const description = cleanDescription(text.replace(QTY_PRICE_RE, '')) || 'Item';
    return { description, quantity: Number(qtyPrice[1]), unitPrice: parseMoney(qtyPrice[2]), vatRate };
  }

  const period = text.match(PERIOD_RE);
  if (period) {
    const description = cleanDescription(text.replace(PERIOD_RE, '')) || 'Retainer';
    return { description, quantity: 1, unitPrice: parseMoney(period[1]), vatRate };
  }

  const money = text.match(MONEY_RE);
  if (money) {
    const description =
      cleanDescription(
        text.replace(MONEY_RE, '').replace(/\/\s*(mo|month|yr|year)\b/i, '').replace(/\b(at|@)\s*$/i, '')
      ) || 'Item';
    return { description, quantity: 1, unitPrice: parseMoney(money[1]), vatRate };
  }

  return { description: cleanDescription(text) || 'Item', quantity: 1, unitPrice: 0, vatRate };
}

function splitWorkSegments(work: string) {
  const normalized = work.replace(/\r\n/g, '\n').trim();
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[\.\)]\s+/, '').trim())
    .filter((line) => line.length > 0 && !/^work\s*$/i.test(line));
  if (lines.length > 1) return lines;

  return normalized
    .split(/\s*\+\s*|\s*;\s*|\s+and\s+(?=[A-Za-z(])/i)
    .map((c) => c.replace(/^[:\-–—,.\s]+/, '').trim())
    .filter(Boolean);
}

/** Draft line items + VAT from a work description. No API key required — works offline. */
export function draftInvoiceFromDescription(
  input: string,
  opts?: {
    knownClients?: KnownClient[];
    catalogItems?: CatalogHint[];
    documentKind?: DocumentKind;
    today?: string;
  }
): LocalInvoiceDraft {
  const raw = input.trim();
  const vatRate = vatFromInput(raw);
  const today = opts?.today ?? todayISO();
  const known = opts?.knownClients ?? [];
  const catalog = opts?.catalogItems ?? [];
  const documentKind = opts?.documentKind ?? detectDocumentKind(raw);

  const matched = matchKnownClient(raw, known);
  const clientName = matched?.name ?? extractClientName(raw);
  const termDays = extractTermDays(raw, documentKind);

  let work = raw;
  if (matched) work = work.replace(new RegExp(matched.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ');
  work = stripClientFromText(work, clientName);
  work = work
    .replace(/^work\s+for\s+[A-Za-z][\w&.'-]*(?:\s+[A-Za-z][\w&.'-]*){0,3}\s*:?\s*/i, '')
    .replace(/^work\s*:?\s*/i, '')
    .replace(/\b(?:create|draft|make|new|start|prepare)\s+(?:an?\s+)?(?:invoice|quote|quotation)\s+(?:for\s+)?/gi, ' ')
    .replace(/\b(zero[-\s]?rated|vat\s*exempt|no\s*vat|excl(?:uding)?\s*vat|0\s*%\s*vat|vat\s*(?:at\s*)?\d{1,2}\s*%?)\b/gi, ' ')
    .replace(/\b(?:net\s*\d{1,3}|due\s+in\s+\d{1,3}\s+days?|valid(?:ity)?\s+(?:for\s+)?\d{1,3}\s+days?)\b/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const chunks = splitWorkSegments(work);
  const items = (chunks.length ? chunks : [work || raw])
    .map((c) => parseChunk(c, vatRate, catalog, clientName))
    .filter((it): it is LocalInvoiceItem => Boolean(it && it.description));

  const priced = fallbackAmount(
    raw,
    items.length ? items : [{ description: cleanDescription(raw) || 'Professional services', quantity: 1, unitPrice: 0, vatRate }],
    vatRate
  );

  return {
    client: {
      id: matched?.id ?? null,
      name: clientName,
      email: matched?.email ? String(matched.email) : '',
      phone: '',
    },
    currency: currencyFromInput(raw),
    issueDate: today,
    dueDate: addDaysISO(termDays, today),
    items: priced,
    notes: extractNotes(raw),
    documentKind,
  };
}

function fallbackAmount(raw: string, items: LocalInvoiceItem[], vatRate: number): LocalInvoiceItem[] {
  if (items.some((it) => it.unitPrice > 0)) return items;
  const money = raw.match(MONEY_RE);
  if (!money) return items;
  const unitPrice = parseMoney(money[1]);
  if (!unitPrice) return items;
  const first = items[0];
  const description =
    first?.description && !/^(create|draft|make|new|start)?\s*(an?\s+)?(?:invoices?|quotes?)$/i.test(first.description)
      ? first.description
      : 'Professional services';
  return [{ description, quantity: first?.quantity || 1, unitPrice, vatRate }];
}
