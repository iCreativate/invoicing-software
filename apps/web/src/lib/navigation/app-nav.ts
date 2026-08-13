import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  Users,
  FileInput,
  CreditCard,
  Receipt,
  BellRing,
  BarChart3,
  Bell,
  UsersRound,
  Settings,
  Wallet,
  Package,
  Repeat,
  Clock,
  PieChart,
  WalletCards,
  User,
  TrendingUp,
  Sparkles,
  Plug,
} from 'lucide-react';
import { routes } from '@/lib/routing/routes';

export type AppNavItem = { href: string; label: string; icon: LucideIcon };

export type AppNavGroup = {
  id: string;
  label: string;
  items: AppNavItem[];
};

/** Grouped workspace navigation (2.0 IA). */
export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ href: routes.app.dashboard, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'money',
    label: 'Money',
    items: [
      { href: routes.app.invoices, label: 'Invoices', icon: FileText },
      { href: routes.app.quotes, label: 'Quotes', icon: FileInput },
      { href: routes.app.payments, label: 'Payments', icon: CreditCard },
      { href: routes.app.expenses, label: 'Expenses', icon: Receipt },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [{ href: routes.app.clients, label: 'Clients', icon: Users }],
  },
  {
    id: 'collections',
    label: 'Collections',
    items: [{ href: routes.app.reminders, label: 'Collections', icon: BellRing }],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { href: routes.app.cashflow, label: 'Cashflow', icon: TrendingUp },
      { href: routes.app.reports, label: 'Reports', icon: BarChart3 },
      { href: routes.app.insights, label: 'Timely Insights', icon: Sparkles },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { href: routes.app.team, label: 'Team', icon: UsersRound },
      { href: routes.app.integrations, label: 'Integrations', icon: Plug },
      { href: routes.app.settings, label: 'Settings', icon: Settings },
      { href: routes.app.billing, label: 'Billing', icon: Wallet },
    ],
  },
];

/** Flattened primary list for mobile / command palette. */
export const APP_NAV_PRIMARY: AppNavItem[] = APP_NAV_GROUPS.flatMap((g) => g.items);

/** Secondary / operations (sidebar “More”). */
export const APP_NAV_MORE: AppNavItem[] = [
  { href: routes.app.productsServices, label: 'Products / services', icon: Package },
  { href: routes.app.recurring, label: 'Recurring', icon: Repeat },
  { href: routes.app.notifications, label: 'Notifications', icon: Bell },
  { href: routes.app.reportsPl, label: 'P&L', icon: PieChart },
  { href: routes.app.payroll, label: 'Payroll', icon: WalletCards },
  { href: routes.app.timeTracking, label: 'Time tracking', icon: Clock },
  { href: routes.app.profile, label: 'Profile', icon: User },
];

/** First items shown on mobile bottom bar; rest open from “More”. */
export const APP_NAV_MOBILE_PINNED: AppNavItem[] = [
  APP_NAV_PRIMARY[0]!,
  APP_NAV_PRIMARY[1]!,
  APP_NAV_PRIMARY[5]!, // Clients
  APP_NAV_PRIMARY[6]!, // Collections
  APP_NAV_PRIMARY[7]!, // Cashflow
];
