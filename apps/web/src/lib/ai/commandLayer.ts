import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { draftInvoiceFromDescription, type KnownClient, type LocalInvoiceDraft } from '@/lib/ai/localInvoiceDraft';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { buildFeaturedInsight } from '@/lib/insights/buildTimelyInsights';

export type CommandAction = { label: string; href: string };

export type CommandResult = {
  intent: string;
  reply: string;
  actions: CommandAction[];
  autoNavigate: boolean;
  invoicePrefill?: LocalInvoiceDraft;
};

export type OverdueClient = { name: string; amount: number };

export type CommandSnapshot = {
  currency: string;
  outstandingAmount: number;
  outstandingInvoiceCount: number;
  overdueAmount: number;
  overdueInvoiceCount: number;
  paidThisMonth: number;
  expensesThisMonth: number;
  lastMonthIncome: number | null;
  lastMonthExpense: number | null;
  lastMonthLabel: string | null;
  featured: { happening: string; why: string; next: string; actionLabel: string; href: string } | null;
  overdueClients: OverdueClient[];
  knownClients: KnownClient[];
};

export function snapshotFromSummary(
  summary: DashboardSummary,
  extra?: { overdueClients?: OverdueClient[]; knownClients?: KnownClient[] }
): CommandSnapshot {
  const months = summary.monthlyIncomeVsExpense ?? [];
  const prev = months.length >= 2 ? months[months.length - 2] : null;
  const featured = buildFeaturedInsight(summary);
  return {
    currency: summary.currency || 'ZAR',
    outstandingAmount: summary.overview.outstandingAmount,
    outstandingInvoiceCount: summary.overview.outstandingInvoiceCount,
    overdueAmount: summary.overview.overdueAmount,
    overdueInvoiceCount: summary.overview.overdueInvoiceCount,
    paidThisMonth: summary.overview.paidThisMonth,
    expensesThisMonth: summary.overview.expensesThisMonth,
    lastMonthIncome: prev?.income ?? null,
    lastMonthExpense: prev?.expense ?? null,
    lastMonthLabel: prev?.label ?? null,
    featured: featured
      ? {
          happening: featured.happening,
          why: featured.why,
          next: featured.next,
          actionLabel: featured.actionLabel,
          href: featured.href,
        }
      : null,
    overdueClients: extra?.overdueClients ?? [],
    knownClients: extra?.knownClients ?? [],
  };
}

function norm(q: string) {
  return q.replace(/\s+/g, ' ').trim();
}

function looksLikeCreateInvoice(q: string) {
  if (/\b(show|list|open|view|find|filter)\b/i.test(q) && !/\b(create|draft|make|prepare|start|new)\b/i.test(q)) {
    return false;
  }
  if (/\b(create|draft|make|prepare|start|new)\b[\s\S]{0,48}\binvoices?\b/i.test(q)) return true;
  return /\binvoice\b[\s\S]{0,48}\b(for|to)\b/i.test(q) && /(?:R|ZAR|\$)\s*\d/i.test(q);
}

function action(label: string, href: string): CommandAction[] {
  return [{ label, href }];
}

/** Instant navigation / invoice start — no books snapshot required. */
export function resolveLocalCommand(query: string, knownClients: KnownClient[] = []): CommandResult | null {
  const q = norm(query);
  if (!q) return null;

  if (looksLikeCreateInvoice(q)) {
    const invoicePrefill = draftInvoiceFromDescription(q, { knownClients });
    const who = invoicePrefill.client.name || 'the client';
    const amount = invoicePrefill.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const money = amount > 0 ? ` for ${formatMoney(amount, invoicePrefill.currency)}` : '';
    return {
      intent: 'create_invoice',
      reply: `Starting an invoice for ${who}${money}. Review the details, then save or send.`,
      actions: action('Open invoice', `${routes.app.invoices}/new`),
      autoNavigate: true,
      invoicePrefill,
    };
  }

  if (/\b(new|create|add)\b.{0,20}\b(quote|quotation)\b/i.test(q)) {
    return {
      intent: 'new_quote',
      reply: 'Opening a new quote.',
      actions: action('New quote', `${routes.app.quotes}/new`),
      autoNavigate: true,
    };
  }

  if (/\b(new|create|add)\b.{0,20}\bclient\b/i.test(q)) {
    return {
      intent: 'new_client',
      reply: 'Opening a new client.',
      actions: action('New client', `${routes.app.clients}/new`),
      autoNavigate: true,
    };
  }

  if (/affect(ing)?\s+(my\s+)?cash\s*-?flow|why.{0,24}cash\s*-?flow|cash\s*-?flow.{0,24}(pressure|problem|issue|risk)/i.test(q)) {
    return {
      intent: 'cashflow_drivers',
      reply: '',
      actions: action('Open Insights', routes.app.insights),
      autoNavigate: false,
    };
  }

  if (/cash\s*-?flow/i.test(q)) {
    return {
      intent: 'cashflow',
      reply: 'Opening Insights → Cashflow.',
      actions: action('Open cashflow', routes.app.cashflow),
      autoNavigate: true,
    };
  }

  if (/\b(overdue\s+clients?|clients?.{0,40}(haven'?t paid|have not paid|not paid|unpaid|overdue)|who.{0,20}(hasn'?t|have not)\s+paid)/i.test(q)) {
    return {
      intent: 'unpaid_clients',
      reply: '',
      actions: action('View overdue clients', `${routes.app.clients}?status=overdue`),
      autoNavigate: false,
    };
  }

  if (/\b(overdue|past\s+due|late\s+invoices?|collections?)\b/i.test(q)) {
    return {
      intent: 'overdue_invoices',
      reply: 'Opening Money → Collections for overdue invoices.',
      actions: action('Open collections', routes.app.collections),
      autoNavigate: true,
    };
  }

  if (/(how much|what).{0,40}(owed|outstanding|receivable)|money.{0,24}owed|\boutstanding\b/i.test(q)) {
    return {
      intent: 'outstanding',
      reply: '',
      actions: action('View invoices', `${routes.app.invoices}?status=overdue`),
      autoNavigate: false,
    };
  }

  if (/\b(last|previous)\s+month\b/i.test(q) && /\b(make|made|earn|earned|revenue|collect|income|profit|take)\b/i.test(q)) {
    return {
      intent: 'last_month_revenue',
      reply: '',
      actions: action('Open Insights', routes.app.insights),
      autoNavigate: false,
    };
  }

  if (/\b(profit|p\s*&\s*l|profit\s+and\s+loss)\b/i.test(q)) {
    return {
      intent: 'profit',
      reply: 'Opening Insights → Profit & Loss.',
      actions: action('Open P&L', routes.app.reportsPl),
      autoNavigate: true,
    };
  }

  if (/\bexpenses?\b/i.test(q)) {
    return {
      intent: 'expenses',
      reply: 'Opening Money → Expenses.',
      actions: action('Open expenses', routes.app.expenses),
      autoNavigate: true,
    };
  }

  if (/\bpayments?\b/i.test(q)) {
    return {
      intent: 'payments',
      reply: 'Opening Money → Payments.',
      actions: action('Open payments', routes.app.payments),
      autoNavigate: true,
    };
  }

  if (/\bquotes?\b/i.test(q)) {
    return {
      intent: 'quotes',
      reply: 'Opening Money → Quotes.',
      actions: action('Open quotes', routes.app.quotes),
      autoNavigate: true,
    };
  }

  if (/\binvoices?\b/i.test(q)) {
    return {
      intent: 'invoices',
      reply: 'Opening Money → Invoices.',
      actions: action('Open invoices', routes.app.invoices),
      autoNavigate: true,
    };
  }

  if (/\bclients?\b/i.test(q)) {
    return {
      intent: 'clients',
      reply: 'Opening Clients.',
      actions: action('Open clients', routes.app.clients),
      autoNavigate: true,
    };
  }

  if (/\b(team|employees?|staff|permissions?|invitations?)\b/i.test(q)) {
    return {
      intent: 'team',
      reply: 'Opening Team.',
      actions: action('Open team', routes.app.team),
      autoNavigate: true,
    };
  }

  if (/\b(settings?|profile|billing|integrations?|preferences|security|notifications?)\b/i.test(q)) {
    let href: string = routes.app.settings;
    let label = 'Open settings';
    let reply = 'Opening Settings.';
    if (/\bbilling\b/i.test(q)) {
      href = routes.app.settingsBilling;
      label = 'Open billing';
      reply = 'Opening Settings → Billing.';
    } else if (/\bintegrations?\b/i.test(q)) {
      href = routes.app.settingsIntegrations;
      label = 'Open integrations';
      reply = 'Opening Settings → Integrations.';
    } else if (/\bnotifications?\b/i.test(q)) {
      href = routes.app.settingsNotifications;
      label = 'Open notification preferences';
      reply = 'Opening Settings → Notifications.';
    } else if (/\bsecurity|password\b/i.test(q)) {
      href = routes.app.settingsSecurity;
      label = 'Open security';
      reply = 'Opening Settings → Security.';
    } else if (/\bprofile\b/i.test(q)) {
      href = routes.app.settingsProfile;
      label = 'Open profile';
      reply = 'Opening Settings → Profile.';
    } else if (/\bpreferences\b/i.test(q)) {
      href = routes.app.settingsPreferences;
      label = 'Open preferences';
      reply = 'Opening Settings → Preferences.';
    }
    return { intent: 'settings', reply, actions: action(label, href), autoNavigate: true };
  }

  if (/\b(products?|services?|catalog|inventory)\b/i.test(q)) {
    return {
      intent: 'products',
      reply: 'Opening products & services under Invoices.',
      actions: action('Open catalog', routes.app.productsServices),
      autoNavigate: true,
    };
  }

  if (/\bpayroll\b/i.test(q)) {
    return {
      intent: 'payroll',
      reply: 'Opening payroll in Settings.',
      actions: action('Open payroll', routes.app.payroll),
      autoNavigate: true,
    };
  }

  if (/\b(dashboard|home|overview)\b/i.test(q)) {
    return {
      intent: 'dashboard',
      reply: 'Opening the dashboard.',
      actions: action('Open dashboard', routes.app.dashboard),
      autoNavigate: true,
    };
  }

  return null;
}

function fillAnswers(partial: CommandResult, snapshot: CommandSnapshot): CommandResult {
  const ccy = snapshot.currency;

  if (partial.intent === 'outstanding') {
    const reply = `You are owed ${formatMoney(snapshot.outstandingAmount, ccy)} across ${snapshot.outstandingInvoiceCount} open invoice${snapshot.outstandingInvoiceCount === 1 ? '' : 's'}. ${
      snapshot.overdueAmount > 0
        ? `${formatMoney(snapshot.overdueAmount, ccy)} of that is overdue.`
        : 'Nothing is overdue right now.'
    }`;
    return {
      ...partial,
      reply,
      actions:
        snapshot.overdueAmount > 0
          ? action('View overdue', routes.app.collections)
          : action('View invoices', routes.app.invoices),
    };
  }

  if (partial.intent === 'unpaid_clients') {
    const names = snapshot.overdueClients.filter((x) => x.name.trim());
    const list =
      names.length > 0
        ? names
            .slice(0, 6)
            .map((x) => `${x.name} (${formatMoney(x.amount, ccy)})`)
            .join(', ')
        : snapshot.overdueInvoiceCount > 0
          ? `${snapshot.overdueInvoiceCount} overdue invoice${snapshot.overdueInvoiceCount === 1 ? '' : 's'} totalling ${formatMoney(snapshot.overdueAmount, ccy)}`
          : 'No overdue clients right now';
    return {
      ...partial,
      reply: names.length ? `These clients still have overdue balances: ${list}.` : `${list}.`,
      autoNavigate: true,
      actions: action('View overdue clients', `${routes.app.clients}?status=overdue`),
    };
  }

  if (partial.intent === 'last_month_revenue') {
    const when = snapshot.lastMonthLabel ? ` in ${snapshot.lastMonthLabel}` : ' last month';
    const income = snapshot.lastMonthIncome;
    const expense = snapshot.lastMonthExpense;
    if (income == null) {
      return {
        ...partial,
        reply: 'I do not have last month’s collected revenue yet. Insights will fill in as payments land.',
        actions: action('Open Insights', routes.app.insights),
      };
    }
    const profitBit =
      expense != null ? ` Expenses were ${formatMoney(expense, ccy)}, so net was ${formatMoney(income - expense, ccy)}.` : '';
    return {
      ...partial,
      reply: `You collected ${formatMoney(income, ccy)}${when}.${profitBit}`,
      actions: [
        { label: 'Open Insights', href: routes.app.insights },
        { label: 'Open P&L', href: routes.app.reportsPl },
      ],
    };
  }

  if (partial.intent === 'cashflow_drivers') {
    const f = snapshot.featured;
    if (!f) {
      return {
        ...partial,
        reply: 'Open Insights for the current cashflow story.',
        autoNavigate: true,
        actions: action('Open Insights', routes.app.insights),
      };
    }
    return {
      ...partial,
      reply: `${f.happening} ${f.why} ${f.next}`,
      autoNavigate: true,
      actions: action(f.actionLabel, f.href),
    };
  }

  return partial;
}

/** Full command resolution with workspace figures. Always returns a result. */
export function resolveCommand(query: string, snapshot: CommandSnapshot): CommandResult {
  const local = resolveLocalCommand(query, snapshot.knownClients);
  if (local) {
    if (!local.reply) return fillAnswers(local, snapshot);
    return local;
  }

  const q = norm(query);
  if (/\b(this\s+month|today)\b/i.test(q) && /\b(make|made|earn|revenue|collect|income)\b/i.test(q)) {
    return {
      intent: 'this_month_revenue',
      reply: `You collected ${formatMoney(snapshot.paidThisMonth, snapshot.currency)} this month, with ${formatMoney(snapshot.expensesThisMonth, snapshot.currency)} in expenses.`,
      actions: action('Open Insights', routes.app.insights),
      autoNavigate: false,
    };
  }

  return {
    intent: 'fallback',
    reply:
      'I can take you to the right place in Timely — overdue invoices, cashflow, expenses, or start an invoice. Tell me what you need.',
    actions: [
      { label: 'Dashboard', href: routes.app.dashboard },
      { label: 'Money', href: routes.app.money },
      { label: 'Insights', href: routes.app.insights },
    ],
    autoNavigate: false,
  };
}
