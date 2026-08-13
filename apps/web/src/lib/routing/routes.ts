export const routes = {
  marketing: {
    home: '/',
    pricing: '/pricing',
    privacy: '/privacy',
    terms: '/terms',
    faq: '/faq',
    contact: '/contact',
    overview: '/overview',
  },
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    onboarding: '/onboarding',
  },
  app: {
    dashboard: '/dashboard',
    invoices: '/invoices',
    quotes: '/quotes',
    recurring: '/recurring',
    clients: '/clients',
    productsServices: '/products-services',
    payments: '/payments',
    expenses: '/expenses',
    reports: '/reports',
    reportsPl: '/reports/pl',
    cashflow: '/cashflow',
    insights: '/insights',
    timeTracking: '/time-tracking',
    employees: '/employees',
    team: '/team',
    reminders: '/reminders',
    collections: '/reminders',
    notifications: '/notifications',
    billing: '/billing',
    integrations: '/integrations',
    payroll: '/payroll',
    profile: '/profile',
    settings: '/settings',
  },
  public: {
    invoice: (shareId: string) => `/invoice/${shareId}`,
    quote: (shareId: string) => `/quote/${shareId}`,
    portal: (slug: string) => `/portal/${slug}`,
  },
} as const;

/** Paths that should not boot workspace/auth client providers (marketing + public share + auth). */
export function isPublicShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  const marketing = Object.values(routes.marketing);
  if (marketing.some((p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`)))) return true;
  if (pathname.startsWith('/invoice/') || pathname.startsWith('/quote/') || pathname.startsWith('/portal/')) {
    return true;
  }
  const auth = [routes.auth.login, routes.auth.register, routes.auth.forgotPassword, routes.auth.resetPassword];
  if (auth.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return false;
}
