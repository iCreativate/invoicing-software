import { Reveal } from '@/components/landing/landingMotion';

const FLOW = [
  { n: '01', title: 'Create', body: 'Create professional invoices in seconds.' },
  { n: '02', title: 'Send', body: 'Email, payment link and communication channels.' },
  { n: '03', title: 'Track', body: 'Know when invoices are sent and viewed.' },
  { n: '04', title: 'Collect', body: 'Automated reminders and collections.' },
  { n: '05', title: 'Understand', body: 'See cashflow and financial trends.' },
];

export function TimelyFlow() {
  return (
    <section id="solutions" className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
      <Reveal>
        <p className="tl-label">The Timely flow</p>
        <h2 className="tl-h2 mt-3 max-w-2xl">One system from quote to cash.</h2>
      </Reveal>

      <div className="mt-14 space-y-0 border-t border-[var(--tl-line)]">
        {FLOW.map((step, i) => (
          <Reveal key={step.n} delayMs={i * 40}>
            <div className="grid gap-3 border-b border-[var(--tl-line)] py-8 sm:grid-cols-[5rem_10rem_1fr] sm:items-baseline sm:gap-8">
              <span className="tl-num text-sm text-[var(--tl-ink-3)]">{step.n}</span>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--tl-ink)]">{step.title}</h3>
              <p className="text-[var(--tl-ink-2)] sm:max-w-md">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
