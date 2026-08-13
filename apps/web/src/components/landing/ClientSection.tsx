import { Reveal } from '@/components/landing/landingMotion';
import { formatZarDisplay } from '@/components/landing/formatZar';

const HISTORY = [
  { inv: 'INV-10421', status: 'Paid', amount: 18500 },
  { inv: 'INV-10388', status: 'Paid', amount: 9200 },
  { inv: 'INV-10341', status: 'Outstanding', amount: 12100 },
  { inv: 'INV-10290', status: 'Paid', amount: 6400 },
];

export function ClientSection() {
  return (
    <section className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
      <Reveal>
        <p className="tl-label">Clients</p>
        <h2 className="tl-h2 mt-3 max-w-lg">Know who pays you.</h2>
      </Reveal>

      <Reveal delayMs={60}>
        <div className="mt-12 grid gap-10 border-t border-[var(--tl-line)] pt-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Cape Creative</h3>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8">
              <div>
                <p className="text-xs text-[var(--tl-ink-3)]">Payment score</p>
                <p className="tl-num mt-1 text-4xl font-semibold">82</p>
              </div>
              <div>
                <p className="text-xs text-[var(--tl-ink-3)]">Avg. payment time</p>
                <p className="tl-num mt-1 text-4xl font-semibold">
                  17<span className="text-lg font-medium text-[var(--tl-ink-3)]">d</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--tl-ink-3)]">Total billed</p>
                <p className="tl-num mt-1 text-xl font-semibold sm:text-2xl">{formatZarDisplay(184500)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--tl-ink-3)]">Outstanding</p>
                <p className="tl-num mt-1 text-xl font-semibold sm:text-2xl">{formatZarDisplay(12100)}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="tl-label mb-4">Invoice history</p>
            <ul>
              {HISTORY.map((row) => (
                <li
                  key={row.inv}
                  className="flex items-baseline justify-between gap-4 border-b border-[var(--tl-line)] py-3.5 text-sm"
                >
                  <span className="font-medium text-[var(--tl-ink)]">{row.inv}</span>
                  <span className="text-[var(--tl-ink-3)]">{row.status}</span>
                  <span className="tl-num font-medium">{formatZarDisplay(row.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
