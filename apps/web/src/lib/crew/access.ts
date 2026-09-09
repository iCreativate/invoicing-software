/**
 * Timely crew (staff) allowlist — emails in TIMELY_CREW_EMAILS (comma-separated).
 * Comparison is case-insensitive. Empty/missing env → nobody is crew.
 */

export function parseCrewEmails(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isCrewEmail(
  email: string | null | undefined,
  allowlistRaw: string | null | undefined = process.env.TIMELY_CREW_EMAILS
): boolean {
  const emailNorm = String(email ?? '').trim().toLowerCase();
  if (!emailNorm) return false;
  return parseCrewEmails(allowlistRaw).includes(emailNorm);
}
