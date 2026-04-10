/**
 * Simple {{placeholder}} replacement for stored email bodies (HTML or plain).
 */
export function applyEmailTemplate(
  template: string | null | undefined,
  vars: Record<string, string>,
  fallbackHtml: string
): string {
  const t = template?.trim();
  if (!t) return fallbackHtml;
  let out = t;
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{\\s*${escapeRegExp(k)}\\s*\\}\\}`, 'gi');
    out = out.replace(re, v);
  }
  return out;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
