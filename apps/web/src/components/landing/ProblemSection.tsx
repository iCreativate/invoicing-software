import { Reveal } from '@/components/landing/landingMotion';

const STEPS = ['Invoice sent', 'Waiting', 'Follow-up', 'Overdue', 'Paid'];

export function ProblemSection() {
  return (
    <section className="border-y border-[var(--tl-line)] bg-[var(--tl-surface)]">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
        <Reveal>
          <h2 className="tl-h2 max-w-3xl text-[var(--tl-ink)]">Sending an invoice isn&apos;t the same as getting paid.</h2>
          <p className="tl-body mt-5 max-w-xl">
            Businesses lose time chasing invoices, checking payments and trying to understand what is still outstanding.
          </p>
        </Reveal>

        <Reveal delayMs={60}>
          <ol className="mt-14 flex flex-col gap-0 sm:mt-16">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-stretch gap-4 sm:gap-6">
                <div className="flex w-8 flex-col items-center">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--tl-accent)]" aria-hidden />
                  {i < STEPS.length - 1 ? <span className="mt-1 w-px flex-1 bg-[var(--tl-line-strong)]" aria-hidden /> : null}
                </div>
                <div className={i < STEPS.length - 1 ? 'pb-8' : ''}>
                  <p className="text-base font-medium text-[var(--tl-ink)] sm:text-lg">{label}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delayMs={100}>
          <h3 className="tl-h2 mt-16 max-w-2xl text-[var(--tl-ink)] sm:mt-20">Timely closes the gap.</h3>
          <p className="tl-body mt-4 max-w-lg">
            From the moment you send an invoice to the moment funds land — visibility, follow-up and cashflow in one place.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
