import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Wallet, Users, Sparkles, UsersRound, Settings } from 'lucide-react';
import { routes } from '@/lib/routing/routes';

export type AppNavItem = { href: string; label: string; icon: LucideIcon };

export type AppNavGroup = {
  id: string;
  label: string;
  items: AppNavItem[];
};

/** Primary workspace navigation — daily work, then Team and Settings. */
export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ href: routes.app.dashboard, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'money',
    label: 'Money',
    items: [{ href: routes.app.money, label: 'Money', icon: Wallet }],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: routes.app.clients, label: 'Clients', icon: Users },
      { href: routes.app.team, label: 'Team', icon: UsersRound },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [{ href: routes.app.insights, label: 'Insights', icon: Sparkles }],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [{ href: routes.app.settings, label: 'Admin', icon: Settings }],
  },
];

/** Hidden from sidebar — still reachable via Settings, command palette, or deep links. */
export const APP_NAV_SECONDARY: AppNavItem[] = [];
