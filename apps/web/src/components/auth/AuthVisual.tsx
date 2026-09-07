import { formatZarDisplay } from '@/components/landing/formatZar';

export function AuthVisual() {
  return (
    <div className="mt-16 max-w-sm border-t border-white/10 pt-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">This month</p>
      <p className="tl-num mt-3 text-[2rem] font-semibold leading-none tracking-tight text-white">
        {formatZarDisplay(71540)}
      </p>
      <p className="mt-2 text-sm text-white/50">Collected</p>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[11px] text-white/35">Outstanding</p>
          <p className="tl-num mt-1 text-lg font-semibold text-white">{formatZarDisplay(24180)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35">Overdue</p>
          <p className="tl-num mt-1 text-lg font-semibold text-white/80">{formatZarDisplay(8920)}</p>
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-white/10 pt-5 text-sm">
        <span className="text-white/55">INV-10422 · Cape Creative</span>
        <span className="text-[12px] font-medium text-[var(--tl-success)]">Paid</span>
      </div>
    </div>
  );
}
