import { routes } from '@/lib/routing/routes';

const MONEY_PREFIXES = [
  routes.app.money,
  routes.app.invoices,
  routes.app.quotes,
  routes.app.payments,
  routes.app.collections,
  routes.app.expenses,
  routes.app.recurring,
  routes.app.productsServices,
];

const INSIGHTS_PREFIXES = [routes.app.insights, routes.app.cashflow, routes.app.reports];

const SETTINGS_PREFIXES = [
  routes.app.settings,
  routes.app.settingsProfile,
  routes.app.settingsTeam,
  routes.app.settingsIntegrations,
  routes.app.settingsBilling,
  routes.app.settingsNotifications,
  routes.app.settingsSecurity,
  routes.app.settingsPreferences,
  routes.app.company,
  routes.app.payroll,
  routes.app.timeTracking,
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isMoneyNavActive(pathname: string): boolean {
  return MONEY_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isInsightsNavActive(pathname: string): boolean {
  return INSIGHTS_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isSettingsNavActive(pathname: string): boolean {
  return SETTINGS_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === routes.app.money) return isMoneyNavActive(pathname);
  if (href === routes.app.insights) return isInsightsNavActive(pathname);
  if (href === routes.app.settings) return isSettingsNavActive(pathname);
  if (href === routes.app.team) {
    return matchesPrefix(pathname, routes.app.team) || matchesPrefix(pathname, routes.app.employees);
  }
  return matchesPrefix(pathname, href);
}
