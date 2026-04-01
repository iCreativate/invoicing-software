export function subscriptionShowsPoweredBy(plan: string | null | undefined): boolean {
  const p = (plan ?? 'free').toLowerCase();
  return p === 'free';
}
