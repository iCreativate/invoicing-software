import { routes } from '@/lib/routing/routes';

export type SectionTab = {
  href: string;
  label: string;
  /** Match this path prefix for active state (defaults to href). */
  matchPrefix?: string;
};

export const MONEY_SECTION_TABS: SectionTab[] = [
  { href: routes.app.money, label: 'Overview' },
  { href: routes.app.invoices, label: 'Invoices', matchPrefix: '/invoices' },
  { href: routes.app.quotes, label: 'Quotes', matchPrefix: '/quotes' },
  { href: routes.app.payments, label: 'Payments', matchPrefix: '/payments' },
  { href: routes.app.collections, label: 'Collections', matchPrefix: '/reminders' },
  { href: routes.app.expenses, label: 'Expenses', matchPrefix: '/expenses' },
];

export const PEOPLE_SECTION_TABS: SectionTab[] = [
  { href: routes.app.clients, label: 'Clients', matchPrefix: '/clients' },
  { href: routes.app.team, label: 'Team', matchPrefix: '/team' },
];

export const INSIGHTS_SECTION_TABS: SectionTab[] = [
  { href: routes.app.insights, label: 'Overview' },
  { href: routes.app.cashflow, label: 'Cashflow', matchPrefix: '/cashflow' },
  { href: routes.app.reportsPl, label: 'Profit & Loss', matchPrefix: '/reports/pl' },
  { href: routes.app.reports, label: 'Reports', matchPrefix: '/reports' },
];

export const SETTINGS_SECTION_TABS: SectionTab[] = [
  { href: routes.app.settings, label: 'Workspace' },
  { href: routes.app.settingsProfile, label: 'Profile' },
  { href: routes.app.settingsTeam, label: 'Team' },
  { href: routes.app.settingsIntegrations, label: 'Integrations' },
  { href: routes.app.settingsBilling, label: 'Billing' },
  { href: routes.app.settingsNotifications, label: 'Notifications' },
  { href: routes.app.settingsSecurity, label: 'Security' },
  { href: routes.app.settingsPreferences, label: 'Preferences' },
];

export function isTabActive(pathname: string, tab: SectionTab): boolean {
  if (tab.href === routes.app.money) {
    return pathname === tab.href;
  }
  if (tab.href === routes.app.insights) {
    return pathname === tab.href || pathname === routes.app.insightsAi;
  }
  if (tab.href === routes.app.settings) {
    return (
      pathname === routes.app.settings ||
      pathname === routes.app.company ||
      pathname === routes.app.payroll ||
      pathname === routes.app.timeTracking
    );
  }
  if (tab.href === routes.app.team) {
    return pathname === routes.app.team || pathname.startsWith('/team/') || pathname.startsWith('/employees');
  }
  if (tab.href === routes.app.reports) {
    return pathname === routes.app.reports;
  }
  if (tab.href === routes.app.reportsPl) {
    return pathname === routes.app.reportsPl || pathname.startsWith(`${routes.app.reportsPl}/`);
  }
  if (tab.href === routes.app.invoices) {
    return (
      pathname.startsWith('/invoices') ||
      pathname.startsWith('/recurring') ||
      pathname.startsWith('/products-services')
    );
  }
  const prefix = tab.matchPrefix ?? tab.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
