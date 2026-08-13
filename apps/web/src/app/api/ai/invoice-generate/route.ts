import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { friendlyAnthropicError, getClaudeModel, isAnthropicConfigured } from '@/lib/ai/anthropic';
import { invoiceGeneratorPrompt, systemPrompt } from '@/lib/ai/prompts';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { captureException } from '@/lib/observability/api';

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

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const rl = await checkRateLimit({
      key: `ai:invoice-generate:${ctx.workspaceOwnerId}`,
      limit: 30,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Invoice generator isn’t configured yet. Add ANTHROPIC_API_KEY on the server.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const input = String(body.input || '').trim();
    if (!input) return NextResponse.json({ success: false, error: 'Describe the work to generate an invoice.' }, { status: 400 });
    if (input.length > 4000) {
      return NextResponse.json({ success: false, error: 'Description is too long. Keep it under 4,000 characters.' }, { status: 400 });
    }

    const knownClients = Array.isArray(body.clients)
      ? (body.clients as { id?: string; name?: string; email?: string }[])
          .slice(0, 40)
          .map((c) => ({
            id: String(c.id ?? ''),
            name: String(c.name ?? ''),
            email: c.email ? String(c.email) : '',
          }))
          .filter((c) => c.id && c.name)
      : [];

    const issueDefault = todayISO();
    const dueDefault = addDaysISO(30);

    const result = await generateText({
      model: getClaudeModel(),
      system: systemPrompt,
      output: Output.object({ schema: invoiceDraftSchema }),
      prompt: `${invoiceGeneratorPrompt}

Today: ${issueDefault}
Default due date: ${dueDefault}
Known clients (match id only if clearly the same person/company):
${knownClients.length ? JSON.stringify(knownClients) : '(none loaded)'}

User description:
${input}
`,
      temperature: 0.2,
    });

    const parsed = invoiceDraftSchema.safeParse(result.output);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Couldn’t draft the invoice. Try a clearer description.' }, { status: 422 });
    }

    const d = parsed.data;
    const items = d.items
      .map((it) => ({
        description: String(it.description ?? '').trim(),
        quantity: Number.isFinite(it.quantity) && it.quantity > 0 ? it.quantity : 1,
        unitPrice: Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
        vatRate: Number.isFinite(it.vatRate) ? it.vatRate : 15,
      }))
      .filter((it) => it.description.length > 0);

    if (!items.length) {
      return NextResponse.json({ success: false, error: 'No line items found in that description.' }, { status: 422 });
    }

    const knownIds = new Set(knownClients.map((c) => c.id));
    const clientId = d.client?.id && knownIds.has(d.client.id) ? d.client.id : null;

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: clientId,
          name: String(d.client?.name ?? '').trim(),
          email: String(d.client?.email ?? '').trim(),
          phone: String(d.client?.phone ?? '').trim(),
        },
        currency: String(d.currency ?? 'ZAR') || 'ZAR',
        issueDate: d.issueDate && isoDate.test(d.issueDate) ? d.issueDate : issueDefault,
        dueDate: d.dueDate && isoDate.test(d.dueDate) ? d.dueDate : dueDefault,
        items,
        notes: d.notes ? String(d.notes).trim() : '',
      },
    });
  } catch (e: unknown) {
    await captureException(e, { route: 'ai.invoice-generate' });
    const { message, status } = friendlyAnthropicError(e);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
