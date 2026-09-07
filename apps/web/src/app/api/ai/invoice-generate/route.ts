import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { getLanguageModel, isLlmConfigured } from '@/lib/ai/anthropic';
import { invoiceGeneratorPrompt, systemPrompt } from '@/lib/ai/prompts';
import {
  draftInvoiceFromDescription,
  type CatalogHint,
  type DocumentKind,
  type KnownClient,
  type LocalInvoiceDraft,
} from '@/lib/ai/localInvoiceDraft';
import { parseLlmJson } from '@/lib/ai/parseLlmJson';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { captureException } from '@/lib/observability/api';
import { requestIsDemo } from '@/lib/demo/server';
import { demoClientsList, demoCatalogItems } from '@/lib/demo/fixtures';

const invoiceDraftSchema = z.object({
  client: z
    .object({
      id: z.string().nullable().optional(),
      name: z.string().optional().default(''),
      email: z.string().optional().default(''),
      phone: z.string().optional().default(''),
    })
    .optional(),
  currency: z.string().optional().default('ZAR'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        vatRate: z.number().optional().default(15),
      })
    )
    .min(1),
  notes: z.string().optional(),
});

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pricedCount(items: LocalInvoiceDraft['items']) {
  return items.filter((it) => it.unitPrice > 0).length;
}

function mergeDrafts(local: LocalInvoiceDraft, cloud: LocalInvoiceDraft): LocalInvoiceDraft {
  const items = pricedCount(cloud.items) > pricedCount(local.items) ? cloud.items : local.items;
  const client =
    local.client.id && (!cloud.client.name || cloud.client.id === local.client.id)
      ? local.client
      : cloud.client.name
        ? { ...cloud.client, id: cloud.client.id ?? local.client.id }
        : local.client;

  return {
    ...local,
    client,
    currency: cloud.currency || local.currency,
    issueDate: cloud.issueDate || local.issueDate,
    dueDate: cloud.dueDate || local.dueDate,
    items,
    notes: cloud.notes?.trim() ? cloud.notes : local.notes,
  };
}

async function generateInvoiceDraft(
  input: string,
  knownClients: KnownClient[],
  catalogItems: CatalogHint[],
  documentKind: DocumentKind,
  baseline?: LocalInvoiceDraft | null
) {
  const issueDefault = todayISO();
  const local =
    baseline ??
    draftInvoiceFromDescription(input, {
      knownClients,
      catalogItems,
      documentKind,
      today: issueDefault,
    });

  let d: LocalInvoiceDraft = local;
  let enhanced = false;

  if (isLlmConfigured()) {
    try {
      const dueDefault = documentKind === 'quote' ? addDaysISO(14) : addDaysISO(30);
      const result = await generateText({
        model: getLanguageModel(),
        system: systemPrompt,
        prompt: `${invoiceGeneratorPrompt}

Document type: ${documentKind}
Today: ${issueDefault}
Default ${documentKind === 'quote' ? 'valid until' : 'due date'}: ${dueDefault}
Known clients (match id only if clearly the same person/company):
${knownClients.length ? JSON.stringify(knownClients) : '(none loaded)'}
Catalog (use when the user mentions a product/service name):
${catalogItems.length ? JSON.stringify(catalogItems.map((c) => ({ name: c.name, unitPrice: c.unitPrice }))) : '(none loaded)'}
On-device baseline (refine — do not contradict priced lines unless clearly wrong):
${JSON.stringify({ client: local.client, items: local.items, currency: local.currency })}

User description:
${input}
`,
        temperature: 0.2,
      });

      const parsed = invoiceDraftSchema.safeParse(parseLlmJson(String(result.text ?? '')));
      if (parsed.success) {
        const items = parsed.data.items
          .map((it) => ({
            description: String(it.description ?? '').trim(),
            quantity: Number.isFinite(it.quantity) && it.quantity > 0 ? it.quantity : 1,
            unitPrice: Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
            vatRate: Number.isFinite(it.vatRate) ? it.vatRate : 15,
          }))
          .filter((it) => it.description.length > 0);
        if (items.length) {
          const knownIds = new Set(knownClients.map((c) => c.id));
          const clientId = parsed.data.client?.id && knownIds.has(parsed.data.client.id) ? parsed.data.client.id : null;
          const cloud: LocalInvoiceDraft = {
            client: {
              id: clientId,
              name: String(parsed.data.client?.name ?? '').trim(),
              email: String(parsed.data.client?.email ?? '').trim(),
              phone: String(parsed.data.client?.phone ?? '').trim(),
            },
            currency: String(parsed.data.currency ?? 'ZAR') || 'ZAR',
            issueDate:
              parsed.data.issueDate && isoDate.test(parsed.data.issueDate) ? parsed.data.issueDate : issueDefault,
            dueDate: parsed.data.dueDate && isoDate.test(parsed.data.dueDate) ? parsed.data.dueDate : dueDefault,
            items,
            notes: parsed.data.notes ? String(parsed.data.notes).trim() : '',
            documentKind,
          };
          d = mergeDrafts(local, cloud);
          enhanced = pricedCount(cloud.items) > pricedCount(local.items) || Boolean(cloud.notes?.trim());
        }
      }
    } catch (e: unknown) {
      await captureException(e, { route: 'ai.invoice-generate' });
      d = local;
    }
  }

  return { draft: d, enhanced };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body.input || '').trim();
    if (!input) {
      return NextResponse.json({ success: false, error: 'Describe the work to generate a draft.' }, { status: 400 });
    }
    if (input.length > 4000) {
      return NextResponse.json({ success: false, error: 'Description is too long. Keep it under 4,000 characters.' }, { status: 400 });
    }

    const documentKind: DocumentKind = body.documentKind === 'quote' ? 'quote' : 'invoice';

    const bodyClients = Array.isArray(body.clients)
      ? (body.clients as { id?: string; name?: string; email?: string }[])
          .slice(0, 40)
          .map((c) => ({
            id: String(c.id ?? ''),
            name: String(c.name ?? ''),
            email: c.email ? String(c.email) : '',
          }))
          .filter((c) => c.id && c.name)
      : [];

    const bodyCatalog = Array.isArray(body.catalog)
      ? (body.catalog as { id?: string; name?: string; unitPrice?: number; defaultTaxRate?: number | null }[])
          .slice(0, 40)
          .map((c) => ({
            id: String(c.id ?? ''),
            name: String(c.name ?? ''),
            unitPrice: Number(c.unitPrice ?? 0),
            defaultTaxRate: c.defaultTaxRate == null ? null : Number(c.defaultTaxRate),
          }))
          .filter((c) => c.id && c.name)
      : [];

    const baseline = body.localBaseline as LocalInvoiceDraft | undefined;

    const isDemo = requestIsDemo(request);
    let knownClients: KnownClient[] = bodyClients;
    let catalogItems: CatalogHint[] = bodyCatalog;

    if (isDemo) {
      knownClients = demoClientsList().map((c) => ({ id: c.id, name: c.name, email: c.email }));
      catalogItems = demoCatalogItems().map((c) => ({
        id: c.id,
        name: c.name,
        unitPrice: c.unitPrice,
        defaultTaxRate: c.defaultTaxRate,
      }));
    } else {
      const supabase = await createSupabaseServerClient(request);
      const ctx = await getWorkspaceContext(supabase);
      if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

      const rl = await checkRateLimit({
        key: `ai:invoice-generate:${ctx.workspaceOwnerId}`,
        limit: 30,
        windowSec: 3600,
      });
      if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
    }

    const { draft, enhanced } = await generateInvoiceDraft(input, knownClients, catalogItems, documentKind, baseline);

    if (!draft.items.length) {
      return NextResponse.json({ success: false, error: 'No line items found in that description.' }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: draft, enhanced, ...(isDemo ? { demo: true } : {}) });
  } catch (e: unknown) {
    await captureException(e, { route: 'ai.invoice-generate' });
    return NextResponse.json({ success: false, error: 'Couldn’t draft the document. Try a shorter description.' }, { status: 500 });
  }
}
