import { formatZarDisplay } from '@/components/landing/formatZar';

/** Three capabilities — elevated cards, still lean. */
export function BentoFeatures() {
  return (
    <section id="features" className="tl-section border-t border-[var(--tl-line)] bg-[var(--tl-bg)]">
      <div className="tl-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="tl-label">Product</p>
          <h2 className="tl-h2 tl-h2-wide mx-auto mt-4">Built for the work you do every day.</h2>
          <p className="tl-body mx-auto mt-5 max-w-md">
            Invoice, collect, and see what needs attention.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          <article className="tl-feature-card group">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--tl-ink)]">Invoicing</h3>
              <span className="rounded-full bg-[var(--tl-success)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--tl-success)]">
                Paid
              </span>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tl-ink-2)]">
              Professional invoices with VAT and payment links.
            </p>
            <div className="tl-feature-preview mt-auto">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--tl-ink-3)]">
                    INVOICE
                  </p>
                  <p className="mt-1.5 text-[13px] font-semibold text-[var(--tl-ink)]">INV-1042</p>
                </div>
                <p className="tl-num text-xl font-semibold tracking-tight text-[var(--tl-ink)]">
                  {formatZarDisplay(12400)}
                </p>
              </div>
              <p className="mt-3 text-[12px] text-[var(--tl-ink-3)]">Cape Creative · Brand identity</p>
            </div>
          </article>

          <article className="tl-feature-card group">
            <h3 className="text-lg font-semibold tracking-tight text-[var(--tl-ink)]">Collections</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tl-ink-2)]">
              Paid, due and overdue — in one place.
            </p>
            <div className="tl-feature-preview mt-auto space-y-0">
              {[
                { label: 'Paid', amount: 71540, tone: 'text-[var(--tl-success)]', bar: 'bg-[var(--tl-success)]' },
                { label: 'Due', amount: 18400, tone: 'text-[var(--tl-accent)]', bar: 'bg-[var(--tl-accent)]' },
                { label: 'Overdue', amount: 8920, tone: 'text-[var(--tl-danger)]', bar: 'bg-[var(--tl-danger)]' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 border-t border-[var(--tl-line)] py-3 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.bar}`} aria-hidden />
                  <span className={`min-w-[4.5rem] text-[13px] font-semibold ${row.tone}`}>
                    {row.label}
                  </span>
                  <span className="tl-num ml-auto text-[13px] font-semibold text-[var(--tl-ink)]">
                    {formatZarDisplay(row.amount)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="tl-feature-card group">
            <h3 className="text-lg font-semibold tracking-tight text-[var(--tl-ink)]">Clarity</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tl-ink-2)]">
              Know what needs attention before cash gets tight.
            </p>
            <div className="tl-feature-preview mt-auto border-[var(--tl-indigo)]/20 bg-[var(--tl-indigo)]/[0.04]">
              <p className="text-[12px] font-semibold text-[var(--tl-indigo)]">✦ Timely AI</p>
              <p className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--tl-ink)]">
                3 invoices are overdue
              </p>
              <p className="tl-num mt-2 text-[14px] font-semibold text-[var(--tl-ink-2)]">
                {formatZarDisplay(18400)}{' '}
                <span className="text-[12px] font-medium text-[var(--tl-ink-3)]">outstanding</span>
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
