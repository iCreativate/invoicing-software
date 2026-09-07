/** Deterministic ZAR display for marketing (avoids Intl SSR/client mismatches). */
export function formatZarDisplay(n: number) {
  const sign = n < 0 ? '−' : '';
  const abs = Math.round(Math.abs(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${sign}R\u00a0${grouped}`;
}
