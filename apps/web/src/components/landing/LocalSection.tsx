import { Reveal } from '@/components/landing/landingMotion';

const PRINCIPLES = [
  { title: 'One system', body: 'Quote, invoice, collect and understand without switching tools.' },
  { title: 'Follow-up without the chase', body: 'Reminders and status live on the invoice, not in your inbox.' },
  { title: 'Numbers you can trust', body: 'Outstanding, overdue and expected cash, presented as they actually are.' },
  { title: 'How work actually happens', body: 'ZAR, VAT, EFT and the channels your clients already use.' },
];

export function LocalSection() {
  return (
    <section className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
      <Reveal>
        <p className="tl-label">Philosophy</p>
        <h2 className="tl-h2 mt-3 max-w-2xl">Built for the way businesses actually work.</h2>
      </Reveal>
      <div className="mt-14 grid gap-0 border-t border-[var(--tl-line)] sm:grid-cols-2">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.title} delayMs={i * 40}>
            <div className="border-b border-[var(--tl-line)] py-8 sm:odd:border-r sm:odd:pr-10 sm:even:pl-10">
              <h3 className="text-base font-semibold tracking-tight text-[var(--tl-ink)]">{p.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--tl-ink-2)]">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
