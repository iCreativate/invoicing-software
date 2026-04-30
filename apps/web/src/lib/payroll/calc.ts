/** Net pay = base + bonus − deductions (never negative). */
export function computeNetPay(base: number, bonus: number, deductions: number): number {
  const n = Number(base) + Number(bonus) - Number(deductions);
  if (!Number.isFinite(n)) return 0;
  return roundMoney(Math.max(0, n));
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
