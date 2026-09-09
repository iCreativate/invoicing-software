/** Soft account lifecycle for suspended / terminated workspaces. */

export type AccountStatus = 'active' | 'suspended' | 'terminated' | string;

export function isAccountBlocked(status: AccountStatus | null | undefined): boolean {
  const s = String(status ?? 'active').toLowerCase();
  return s === 'suspended' || s === 'terminated';
}

export function accountBlockMessage(status: AccountStatus | null | undefined): string {
  const s = String(status ?? 'active').toLowerCase();
  if (s === 'terminated') {
    return 'This workspace has been terminated. Contact Timely support if you believe this is a mistake.';
  }
  if (s === 'suspended') {
    return 'This workspace is suspended. Billing and support can help reinstate access.';
  }
  return 'This workspace is not available.';
}
