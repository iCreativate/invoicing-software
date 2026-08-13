'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/format/money';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { routes } from '@/lib/routing/routes';

type InsightBlock = {
  fact: string;
  interpretation: string;
  recommendation: string;
};

function buildInsights(summary: DashboardSummary): InsightBlock[] {
  const { currency, overview, insights, expectedIncoming, businessPulse } = summary;
  const blocks: InsightBlock[] = [];

  blocks.push({
    fact: `You collected ${formatMoney(overview.paidThisMonth, currency)} this month across ${overview.paidInvoiceCountThisMonth} paid invoice(s).`,
    interpretation:
      insights.collectionMomPercent != null
        ? `That is ${insights.collectionMomPercent >= 0 ? 'up' : 'down'} ${Math.abs(insights.collectionMomPercent).toFixed(1)}% versus last month.`
        : 'There is not enough prior-month payment history to compare pace yet.',
    recommendation:
      overview.paidThisMonth === 0
        ? 'Record completed payments or send invoices with payment links so cash shows up here.'
        : 'Keep reconciling EFTs promptly so month-to-date cash stays accurate.',
  });

  if (overview.overdueInvoiceCount > 0) {
    blocks.push({
      fact: `${overview.overdueInvoiceCount} overdue invoice(s) total ${formatMoney(overview.overdueAmount, currency)}.`,
      interpretation: `Overdue is ${overview.outstandingAmount > 0 ? `${((overview.overdueAmount / overview.outstandingAmount) * 100).toFixed(0)}%` : 'a share'} of current outstanding (${formatMoney(overview.outstandingAmount, currency)}).`,
      recommendation: 'Open Collections and chase the largest balances first with a firm reminder.',
    });
  } else {
    blocks.push({
      fact: `Outstanding receivables are ${formatMoney(overview.outstandingAmount, currency)} across ${overview.outstandingInvoiceCount} open invoice(s).`,
      interpretation: 'Nothing is past due right now based on due dates and open balances.',
      recommendation: expectedIncoming > 0
        ? `Expect about ${formatMoney(expectedIncoming, currency)} due in the next 14 days — confirm payment details on those invoices.`
        : 'Issue or schedule the next invoices so the pipeline stays full.',
    });
  }

  blocks.push({
    fact:
      businessPulse.avgDaysToPay != null
        ? `Average days to pay on settled invoices is ${businessPulse.avgDaysToPay.toFixed(1)}.`
        : 'Average days to pay is not available yet (needs paid invoices with issue and paid dates).',
    interpretation: `Business pulse is marked ${businessPulse.health.replace('_', ' ')}: ${businessPulse.headline}`,
    recommendation:
      businessPulse.health === 'at_risk'
        ? 'Tighten payment terms on repeat late payers and enable reminder sequences.'
        : 'Maintain current follow-up cadence and review expected incoming weekly.',
  });

  if (insights.topPayingClient) {
    blocks.push({
      fact: `${insights.topPayingClient.name} has paid ${formatMoney(insights.topPayingClient.totalPaid, currency)} all-time.`,
      interpretation: 'This is your strongest cash contributor among recorded payments.',
      recommendation: 'Prioritise relationship and on-time invoicing for this client; consider retainer or recurring schedules.',
    });
  }

  return blocks;
}

export default function InsightsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/summary', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load insights');
        if (!cancelled) setSummary(json.data as DashboardSummary);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const blocks = useMemo(() => (summary ? buildInsights(summary) : []), [summary]);

  return (
    <AppShell title="Insights">
      <PageBody>
        <PageHeader
          title="Timely Insights"
          description="Facts, interpretation, and recommendations derived only from your workspace metrics."
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href={routes.app.cashflow}>Open cashflow</Link>
            </Button>
          }
        />

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          {blocks.map((b, i) => (
            <GlassCard key={i} className="flex flex-col gap-4 p-5">
              <div className="border-b border-border/70 pb-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Fact</div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">{b.fact}</p>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Interpretation</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.interpretation}</p>
              </div>
              <div className="mt-auto rounded-[var(--ti-radius-sm)] border border-[var(--ti-brand-accent,#2F6F7E)]/20 bg-[var(--ti-brand-accent,#2F6F7E)]/[0.04] px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ti-brand-accent,#2F6F7E)]">Recommendation</div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">{b.recommendation}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </PageBody>
    </AppShell>
  );
}
