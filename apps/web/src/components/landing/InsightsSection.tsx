import { Reveal } from '@/components/landing/landingMotion';

const INSIGHTS = [
  'Your overdue invoices increased 18% this month.',
  'Three clients account for 76% of outstanding payments.',
  'Your average payment time improved by 4 days.',
];

export function InsightsSection() {
  return (
    <section id="resources" className="border-y border-[var(--tl-line)] bg-[var(--tl-surface)]">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
        <Reveal>
          <p className="tl-label">Insights</p>
          <h2 className="tl-h2 mt-3 max-w-2xl">Timely notices what you might miss.</h2>
        </Reveal>
        <ul className="mt-14 space-y-0">
          {INSIGHTS.map((line, i) => (
            <Reveal key={line} delayMs={i * 50}>
              <li className="border-t border-[var(--tl-line)] py-8 sm:py-10">
                <p className="max-w-3xl text-xl font-medium leading-snug tracking-tight text-[var(--tl-ink)] sm:text-2xl">
                  “{line}”
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
        <hr className="tl-rule" />
      </div>
    </section>
  );
}
