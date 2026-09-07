import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import type { DashboardSummary } from '@/lib/dashboard/types';

export type TimelyInsight = {
  id: string;
  happening: string;
  why: string;
  next: string;
  actionLabel: string;
  href: string;
};

function fmtPct(n: number) {
  return `${Math.abs(Math.round(n))}%`;
}

/** Featured narrative: what is happening, why, and what to do. */
export function buildFeaturedInsight(summary: DashboardSummary): TimelyInsight {
  const { currency, overview, insights, businessPulse } = summary;
  const mom = insights.collectionMomPercent;
  const revenueStable = mom == null || Math.abs(mom) < 5;
  const overdue = overview.overdueInvoiceCount > 0 && overview.overdueAmount > 0;

  if (overdue) {
    const revenueBit =
      mom == null
        ? 'Revenue is tracking this month'
        : revenueStable
          ? 'Revenue is stable'
          : mom >= 0
            ? `Revenue is up ${fmtPct(mom)} compared with last month`
            : `Revenue is down ${fmtPct(mom)} compared with last month`;
    return {
      id: 'featured',
      happening: `${revenueBit}, but cashflow is under pressure because ${formatMoney(overview.overdueAmount, currency)} remains overdue.`,
      why: `${overview.overdueInvoiceCount} invoice${overview.overdueInvoiceCount === 1 ? '' : 's'} ${overview.overdueInvoiceCount === 1 ? 'is' : 'are'} past due — that cash is invoiced but not in the bank.`,
      next: `Follow up with your ${overview.overdueInvoiceCount} overdue client${overview.overdueInvoiceCount === 1 ? '' : 's'}.`,
      actionLabel: 'View overdue invoices',
      href: routes.app.collections,
    };
  }

  if (mom != null && mom <= -8) {
    return {
      id: 'featured',
      happening: `Collections are down ${fmtPct(mom)} compared with last month.`,
      why: `You collected ${formatMoney(overview.paidThisMonth, currency)} this month. Outstanding is ${formatMoney(overview.outstandingAmount, currency)}.`,
      next: 'Review open invoices and send reminders before the month closes.',
      actionLabel: 'View invoices',
      href: routes.app.invoices,
    };
  }

  return {
    id: 'featured',
    happening: businessPulse.headline,
    why:
      businessPulse.avgDaysToPay != null
        ? `Clients take about ${businessPulse.avgDaysToPay.toFixed(0)} days to pay on average.`
        : `Collected ${formatMoney(overview.paidThisMonth, currency)} this month against ${formatMoney(overview.expensesThisMonth, currency)} in expenses.`,
    next: 'Keep invoicing on schedule and reconcile payments as they land.',
    actionLabel: 'View cashflow',
    href: routes.app.cashflow,
  };
}

export function buildTimelyInsights(summary: DashboardSummary): TimelyInsight[] {
  const { currency, overview, insights, businessPulse, monthlyIncomeVsExpense } = summary;
  const items: TimelyInsight[] = [];
  const mom = insights.collectionMomPercent;

  if (mom != null) {
    const up = mom >= 0;
    items.push({
      id: 'revenue-mom',
      happening: `Your revenue is ${up ? 'up' : 'down'} ${fmtPct(mom)} compared with last month.`,
      why: `You collected ${formatMoney(overview.paidThisMonth, currency)} this month across ${overview.paidInvoiceCountThisMonth} paid invoice${overview.paidInvoiceCountThisMonth === 1 ? '' : 's'}.`,
      next: up ? 'Keep the same invoicing cadence while cash is moving.' : 'Check who has not paid and follow up this week.',
      actionLabel: 'View invoices',
      href: routes.app.invoices,
    });
  }

  if (overview.overdueInvoiceCount > 0) {
    items.push({
      id: 'overdue',
      happening: `${overview.overdueInvoiceCount} invoice${overview.overdueInvoiceCount === 1 ? '' : 's'} ${overview.overdueInvoiceCount === 1 ? 'is' : 'are'} overdue and represent ${formatMoney(overview.overdueAmount, currency)}.`,
      why:
        overview.outstandingAmount > 0
          ? `That is ${Math.round((overview.overdueAmount / overview.outstandingAmount) * 100)}% of current outstanding (${formatMoney(overview.outstandingAmount, currency)}).`
          : 'Overdue balances sit outside your expected incoming window.',
      next: 'Chase the largest balances first.',
      actionLabel: 'View invoices',
      href: routes.app.collections,
    });
  }

  const months = monthlyIncomeVsExpense;
  if (months.length >= 2) {
    const current = months[months.length - 1]!;
    const prev = months[months.length - 2]!;
    if (prev.expense > 0) {
      const expMom = ((current.expense - prev.expense) / prev.expense) * 100;
      if (Math.abs(expMom) >= 3) {
        items.push({
          id: 'expenses-mom',
          happening: `Your expenses ${expMom >= 0 ? 'increased' : 'decreased'} ${fmtPct(expMom)} this month.`,
          why: `Spend is ${formatMoney(current.expense, currency)} versus ${formatMoney(prev.expense, currency)} last month.`,
          next: expMom >= 0 ? 'Review categories that jumped and cut anything that is not needed.' : 'Note what drove the saving so you can keep it.',
          actionLabel: 'Review expenses',
          href: routes.app.expenses,
        });
      }
    } else if (current.expense > 0) {
      items.push({
        id: 'expenses-mom',
        happening: `You recorded ${formatMoney(current.expense, currency)} in expenses this month.`,
        why: 'There was little or no comparable spend last month.',
        next: 'Check that categories are correct so profit reporting stays useful.',
        actionLabel: 'Review expenses',
        href: routes.app.expenses,
      });
    }
  }

  const rate = businessPulse.collectionRatePercent;
  const delta = businessPulse.collectionRateDelta;
  if (rate != null && delta != null && Math.abs(delta) >= 1) {
    const prevRate = rate - delta;
    items.push({
      id: 'collection-rate',
      happening: `Your collection rate has ${delta >= 0 ? 'risen' : 'fallen'} from ${Math.round(prevRate)}% to ${Math.round(rate)}%.`,
      why:
        delta < 0
          ? 'A smaller share of invoiced work is turning into cash.'
          : 'A larger share of invoiced work is being paid.',
      next: delta < 0 ? 'Tighten follow-up on open invoices and review payment terms.' : 'Keep current reminder timing; it is working.',
      actionLabel: 'View report',
      href: routes.app.reports,
    });
  }

  return items;
}
