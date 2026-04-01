export const routes = {
  marketing: {
    home: '/',
    pricing: '/pricing',
  },
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  app: {
    dashboard: '/dashboard',
    invoices: '/invoices',
    quotes: '/quotes',
    recurring: '/recurring',
    clients: '/clients',
    payments: '/payments',
    expenses: '/expenses',
    reports: '/reports',
    reportsPl: '/reports/pl',
    employees: '/employees',
    payroll: '/payroll',
    profile: '/profile',
    settings: '/settings',
  },
  public: {
    invoice: (shareId: string) => `/invoice/${shareId}`,
  },
} as const;

