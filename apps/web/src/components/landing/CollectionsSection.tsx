import { Reveal } from '@/components/landing/landingMotion';
import { formatZarDisplay } from '@/components/landing/formatZar';

const EVENTS = [
  { label: 'Invoice sent', done: true },
  { label: 'Invoice opened', done: true },
  { label: 'Due tomorrow', done: false },
  { label: 'Reminder scheduled', done: false },
  { label: 'Payment received', done: true, highlight: true },
];

export function CollectionsSection() {
  return (
    <section className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
      <div className="grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-start lg:gap-20">
        <Reveal>
          <p className="tl-label">Collections</p>
          <h2 className="tl-h2 mt-3 max-w-lg">Stop chasing payments.</h2>
          <p className="tl-body mt-5 max-w-md">
            See where every invoice sits — sent, viewed, due, reminded — and let Timely follow up before balances age.
          </p>
        </Reveal>

        <Reveal delayMs={70}>
          <div className="border-t border-[var(--tl-line)] pt-2">
            <ol>
              {EVENTS.map((e, i) => (
                <li
                  key={e.label}
                  className="flex items-center justify-between gap-4 border-b border-[var(--tl-line)] py-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        e.done
                          ? 'flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tl-success)] text-[10px] text-white'
                          : 'h-5 w-5 rounded-full border border-[var(--tl-line-strong)]'
                      }
                      aria-hidden
                    >
                      {e.done ? '✓' : ''}
                    </span>
                    <span className={e.highlight ? 'font-medium text-[var(--tl-ink)]' : 'text-[var(--tl-ink-2)]'}>
                      {e.label}
                    </span>
                  </div>
                  {i === EVENTS.length - 1 ? (
                    <span className="tl-num text-sm font-semibold text-[var(--tl-success)]">Paid</span>
                  ) : null}
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <p className="tl-label">Invoice INV-10421</p>
              <p className="tl-num mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                {formatZarDisplay(18500)}
              </p>
              <p className="mt-2 text-sm text-[var(--tl-success)]">Paid</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
