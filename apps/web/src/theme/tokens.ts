/**
 * TimelyInvoices design tokens — mirrored in globals.css.
 * Prefer CSS variables in components; use this for JS/chart theming.
 */
export const themeTokens = {
  colors: {
    background: '#F6F4F0',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    surfaceMuted: '#ECEAE4',
    text: '#101418',
    textSecondary: '#5A6169',
    textMuted: '#8B9199',
    border: 'rgba(16, 20, 24, 0.1)',
    brand: '#1A3A4A',
    brandAccent: '#1A3A4A',
    sidebar: '#F6F4F0',
    success: '#1B7F4E',
    warning: '#B45309',
    danger: '#C0392B',
    info: '#1A3A4A',
  },
  radii: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  shadows: {
    softSm: '0 1px 0 rgb(16 20 24 / 0.04), 0 1px 2px rgb(16 20 24 / 0.04)',
    softMd: '0 1px 0 rgb(16 20 24 / 0.04), 0 12px 32px rgb(16 20 24 / 0.05)',
    softLg: '0 1px 0 rgb(16 20 24 / 0.04), 0 24px 48px rgb(16 20 24 / 0.06)',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
  typography: {
    fontSans: 'var(--font-inter), var(--font-geist-sans)',
    fontMono: 'var(--font-jetbrains), var(--font-geist-mono)',
    display: '2.25rem',
    heading: '1.5rem',
    subheading: '1.125rem',
    body: '0.90625rem',
    caption: '0.8125rem',
    label: '0.75rem',
    numeric: 'var(--font-jetbrains), var(--font-geist-mono)',
  },
  chart: {
    collected: '#1B7F4E',
    expected: '#1A3A4A',
    overdue: '#C0392B',
    grid: 'rgba(16, 20, 24, 0.08)',
    axis: '#8B9199',
  },
} as const;

export type ThemeTokens = typeof themeTokens;
