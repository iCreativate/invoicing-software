'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowRight, Banknote, CheckCircle2, TrendingDown } from 'lucide-react';
import { AdminPanel } from '@/components/workspace/workspace-ui';
import { Skeleton } from '@/components/ui/Skeleton';
import { Amount } from '@/components/ui/Text';
import { formatMoney } from '@/lib/format/money';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

type Overview = DashboardSummary['overview'];
type LatestPayment = Extract<DashboardSummary['activity'][number], { type: 'payment_received' }>;

type AttentionTone = 'danger' | 'warning' | 'success' | 'calm';

function AttentionCard({
  href,
  tone,
  kicker,
  title,
  icon: Icon,
  value,
  body,
  cta,
}: {
  href?: string;
  tone: AttentionTone;
  kicker: string;
  title: string;
  icon: LucideIcon;
  value?: ReactNode;
  body: string;
  cta?: string;
}) {
  const inner = (
    <>
      <div className="ti-attention-head">
        <div className="min-w-0">
          <p className="ti-attention-kicker">{kicker}</p>
          <p className="ti-attention-title">{title}</p>
        </div>
        <span className="ti-attention-icon" aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      {value != null ? (
        <div className="pt-1">
          {typeof value === 'string' ? (
            <Amount
              display
              className={cn(
                '!text-[clamp(1.2rem,1.9vw,1.5rem)] leading-tight',
                tone === 'danger' && 'text-[var(--tl-danger)]',
                tone === 'success' && 'text-[var(--tl-success)]'
              )}
            >
              {value}
            </Amount>
          ) : (
            value
          )}
        </div>
      ) : null}

      <p className="ti-attention-body leading-relaxed">{body}</p>

      {cta ? (
        <span className="ti-attention-cta mt-1 border-t border-[color-mix(in_srgb,var(--tl-line)_80%,transparent)] pt-3">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </>
  );

  const className = 'ti-attention-card ti-attention-card-roomy';

  if (href) {
    return (
      <Link href={href} className={className} data-tone={tone}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} data-tone={tone}>
      {inner}
    </div>
  );
}

function AttentionSkeleton() {
  return (
    <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-7 w-32" />
      <Skeleton className="mt-3 h-3.5 w-full" />
    </div>
  );
}

export function MoneyAttentionSection({
  loading,
  currency,
  overview,
  expenseSpike,
  latestPayment,
}: {
  loading: boolean;
  currency: string;
  overview?: Overview;
  expenseSpike: number | null;
  latestPayment?: LatestPayment;
}) {
  const overdueCount = overview?.overdueInvoiceCount ?? 0;
  const hasOverdue = overdueCount > 0;

  return (
    <AdminPanel
      kicker="Needs attention"
      title="Act on this"
      description="Priorities that move cash faster."
      className="min-w-0"
    >
      {loading ? (
        <div className="flex flex-col gap-4" aria-busy>
          <AttentionSkeleton />
          <AttentionSkeleton />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {hasOverdue ? (
            <AttentionCard
              href={routes.app.collections}
              tone="danger"
              kicker="Overdue"
              title={`${overdueCount} invoice${overdueCount === 1 ? '' : 's'} need collecting`}
              icon={AlertCircle}
              value={formatMoney(overview?.overdueAmount ?? 0, currency)}
              body="Outstanding balances past their due date."
              cta="Collect now"
            />
          ) : (
            <AttentionCard
              tone="calm"
              kicker="Collections"
              title="Nothing overdue"
              icon={CheckCircle2}
              body="All open invoices are still within terms."
            />
          )}

          {expenseSpike != null ? (
            <AttentionCard
              href={routes.app.expenses}
              tone="warning"
              kicker="Spend"
              title="Expense spike detected"
              icon={TrendingDown}
              value={`${expenseSpike.toFixed(0)}% up`}
              body="This month’s expenses are higher than last month — worth a quick review."
              cta="Review expenses"
            />
          ) : null}

          {latestPayment ? (
            <AttentionCard
              href={`${routes.app.invoices}/${latestPayment.invoiceId}`}
              tone="success"
              kicker="Latest win"
              title="Payment received"
              icon={Banknote}
              value={formatMoney(latestPayment.amount, latestPayment.currency || currency)}
              body={
                latestPayment.clientName
                  ? `From ${latestPayment.clientName}`
                  : 'Money landed in your ledger.'
              }
              cta="View invoice"
            />
          ) : null}
        </div>
      )}
    </AdminPanel>
  );
}
