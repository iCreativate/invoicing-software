export const themeTokens = {
  colors: {
    primary: '#1E40AF',
    success: '#10B981',
    danger: '#EF4444',
    background: '#FFFFFF',
    foreground: '#0F172A',
  },
  radii: {
    xl: '0.75rem',
    '2xl': '1rem',
  },
  shadows: {
    softSm: '0 1px 2px rgba(15, 23, 42, 0.06)',
    softMd: '0 6px 18px rgba(15, 23, 42, 0.08)',
    softLg: '0 12px 32px rgba(15, 23, 42, 0.10)',
  },
  typography: {
    fontSans: 'var(--font-geist-sans)',
    fontMono: 'var(--font-geist-mono)',
  },
} as const;

export type ThemeTokens = typeof themeTokens;

