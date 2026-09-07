import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { getLanguageModel, isLlmConfigured } from '@/lib/ai/anthropic';
import { commandLayerPrompt, systemPrompt } from '@/lib/ai/prompts';
import { parseLlmJson } from '@/lib/ai/parseLlmJson';
import { resolveCommand, snapshotFromSummary, type CommandResult, type OverdueClient } from '@/lib/ai/commandLayer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { captureException } from '@/lib/observability/api';
import { requestIsDemo } from '@/lib/demo/server';
import { getDashboardSummary, buildDemoDashboardSummary } from '@/lib/dashboard/summary';
import { demoClientsList, demoInvoicesList } from '@/lib/demo/fixtures';
import type { KnownClient } from '@/lib/ai/localInvoiceDraft';

const llmShape = z.object({
  intent: z.string().optional(),
  reply: z.string().optional(),
  href: z.string().optional(),
  label: z.string().optional(),
});

function lastUserMessage(messages: unknown): string {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as { role?: string; content?: string };
    if (m?.role === 'user' && typeof m.content === 'string') return m.content.trim();
  }
  return '';
}

function overdueFromDemo(): OverdueClient[] {
  const map = new Map<string, number>();
  for (const inv of demoInvoicesList()) {
    if (inv.status !== 'overdue') continue;
    const name = inv.client_name || 'Client';
    map.set(name, (map.get(name) ?? 0) + Number(inv.balance_amount ?? 0));
  }
  return [...map.entries()].map(([name, amount]) => ({ name, amount }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = String(body.query ?? lastUserMessage(body.messages) ?? '').trim();
    if (!query) return NextResponse.json({ success: false, error: 'Ask Timely what you need.' }, { status: 400 });
    if (query.length > 2000) {
      return NextResponse.json({ success: false, error: 'Keep that request a little shorter.' }, { status: 400 });
    }

    const isDemo = requestIsDemo(request);
    let ownerKey = 'demo';
    let summary = buildDemoDashboardSummary();
    let knownClients: KnownClient[] = demoClientsList().map((c) => ({ id: c.id, name: c.name, email: c.email }));
    let overdueClients = overdueFromDemo();

    if (!isDemo) {
      const supabase = await createSupabaseServerClient(request);
      const ctx = await getWorkspaceContext(supabase);
      if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
      ownerKey = ctx.workspaceOwnerId;
      summary = await getDashboardSummary(supabase, ctx.workspaceOwnerId);

      const [clientRes, overdueRes] = await Promise.all([
        supabase.from('clients').select('id,name,email').eq('owner_id', ctx.workspaceOwnerId).limit(40),
        supabase
          .from('invoices')
          .select('client_name,balance_amount,status')
          .eq('owner_id', ctx.workspaceOwnerId)
          .eq('status', 'overdue')
          .limit(30),
      ]);
      knownClients = ((clientRes.data ?? []) as { id: string; name: string; email?: string | null }[]).map((c) => ({
        id: String(c.id),
        name: String(c.name ?? ''),
        email: c.email,
      }));
      const map = new Map<string, number>();
      for (const row of (overdueRes.data ?? []) as { client_name?: string | null; balance_amount?: number }[]) {
        const name = String(row.client_name ?? '').trim() || 'Client';
        map.set(name, (map.get(name) ?? 0) + Number(row.balance_amount ?? 0));
      }
      overdueClients = [...map.entries()].map(([name, amount]) => ({ name, amount }));
    }

    const rl = await checkRateLimit({
      key: `ai:chat:${ownerKey}`,
      limit: 60,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const snapshot = snapshotFromSummary(summary, { overdueClients, knownClients });
    let result: CommandResult = resolveCommand(query, snapshot);

    if (result.intent === 'fallback' && isLlmConfigured()) {
      try {
        const { text } = await generateText({
          model: getLanguageModel(),
          system: `${systemPrompt}\n${commandLayerPrompt}`,
          prompt: `SNAPSHOT:\n${JSON.stringify({
            currency: snapshot.currency,
            outstandingAmount: snapshot.outstandingAmount,
            outstandingInvoiceCount: snapshot.outstandingInvoiceCount,
            overdueAmount: snapshot.overdueAmount,
            overdueInvoiceCount: snapshot.overdueInvoiceCount,
            paidThisMonth: snapshot.paidThisMonth,
            expensesThisMonth: snapshot.expensesThisMonth,
            lastMonthIncome: snapshot.lastMonthIncome,
            lastMonthLabel: snapshot.lastMonthLabel,
            overdueClients: snapshot.overdueClients,
          })}\n\nUser: ${query}`,
          temperature: 0.1,
        });
        const parsed = llmShape.safeParse(parseLlmJson(text));
        if (parsed.success) {
          const href = String(parsed.data.href ?? '').trim();
          const safe =
            href.startsWith('/') &&
            !href.startsWith('//') &&
            !href.includes('://');
          const llmResolved = resolveCommand(query + (parsed.data.intent ? ` ${parsed.data.intent}` : ''), snapshot);
          if (llmResolved.intent !== 'fallback') {
            result = llmResolved;
          } else if (safe && parsed.data.reply) {
            result = {
              intent: parsed.data.intent || 'navigate',
              reply: String(parsed.data.reply).slice(0, 600),
              actions: [{ label: parsed.data.label || 'Open', href }],
              autoNavigate: true,
            };
          }
        }
      } catch (e: unknown) {
        await captureException(e, { route: 'ai.chat.llm' });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (e: unknown) {
    await captureException(e, { route: 'ai.chat' });
    return NextResponse.json({ success: false, error: 'Ask Timely could not complete that request.' }, { status: 500 });
  }
}
