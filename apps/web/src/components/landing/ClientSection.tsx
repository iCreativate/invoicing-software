import { formatZarDisplay } from '@/components/landing/formatZar';

export function ClientSection() {
  return (
    <section className="tl-section">
      <div className="tl-container">
        <div className="max-w-xl">
          <h2 className="tl-h2">
            Know who pays you.
            <br />
            And who doesn&apos;t.
          </h2>
          <p className="tl-body mt-6">
            Reliability on every relationship — so you know who to follow up, and who you can trust.
          </p>
        </div>

        <div className="mt-14 overflow-hidden rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-[var(--tl-surface)] shadow-[var(--tl-shadow)]">
          <div className="grid lg:grid-cols-2">
            <div className="bg-[var(--tl-navy)] p-8 text-white sm:p-10 lg:p-12">
              <p className="text-[12px] font-medium text-white/50">Client profile</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">Cape Creative</h3>
              <p className="mt-2 text-[15px] text-white/65">Usually pays on time</p>

              <div className="mt-10 inline-flex items-end gap-4 rounded-[var(--tl-radius-sm)] bg-white/[0.06] px-6 py-5">
                <p className="tl-num text-5xl font-semibold leading-none text-emerald-400">82</p>
                <div className="pb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Payment</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">reliability</p>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
                {[
                  { label: 'Invoices', value: '17' },
                  { label: 'Collected', value: formatZarDisplay(42800) },
                  { label: 'Outstanding', value: formatZarDisplay(12100) },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">{m.label}</p>
                    <p className="tl-num mt-2 text-sm font-semibold sm:text-base">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2">
              <div className="border-b border-[var(--tl-line)] p-8 sm:border-b-0 sm:border-r sm:p-10">
                <p className="text-[12px] font-semibold text-[var(--tl-ink)]">Payment history</p>
                <ul className="mt-6 space-y-0">
                  {[
                    { d: '12 Aug', a: 8500 },
                    { d: '28 Jul', a: 12400 },
                    { d: '03 Jul', a: 6200 },
                    { d: '18 Jun', a: 9800 },
                  ].map((r) => (
                    <li
                      key={r.d}
                      className="flex items-center justify-between gap-3 py-3.5 text-[13px] first:pt-0"
                    >
                      <span className="text-[var(--tl-ink-2)]">{r.d}</span>
                      <span className="tl-num font-semibold text-[var(--tl-ink)]">{formatZarDisplay(r.a)}</span>
                      <span className="font-semibold text-[var(--tl-success)]">Paid</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 sm:p-10">
                <p className="text-[12px] font-semibold text-[var(--tl-ink)]">Behaviour</p>
                <dl className="mt-6 space-y-5">
                  {[
                    ['Avg days to pay', '11d'],
                    ['Open invoices', '2'],
                    ['Last payment', '12 Aug'],
                    ['Collection rate', '78%'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3">
                      <dt className="text-[13px] text-[var(--tl-ink-2)]">{k}</dt>
                      <dd className="tl-num text-[14px] font-semibold text-[var(--tl-ink)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
