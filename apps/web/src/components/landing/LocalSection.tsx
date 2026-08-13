import { Reveal } from '@/components/landing/landingMotion';

const POINTS = [
  { title: 'ZAR first', body: 'Prices, invoices and reports in South African Rand by default.' },
  { title: 'VAT-aware', body: 'Inclusive, exclusive and exempt lines — without burying tax assumptions in the UI.' },
  { title: 'EFT & local pay', body: 'Bank details on invoices, plus PayFast and SnapScan when you need a link.' },
  { title: 'WhatsApp-ready', body: 'Remind and follow up on the channel your clients already use.' },
];

export function LocalSection() {
  return (
    <section className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
      <Reveal>
        <p className="tl-label">South Africa</p>
        <h2 className="tl-h2 mt-3 max-w-2xl">Built for the way businesses actually work.</h2>
        <p className="tl-body mt-5 max-w-xl">
          Globally premium design. Locally relevant workflows — without turning the product into a stereotype.
        </p>
      </Reveal>
      <div className="mt-14 grid gap-0 border-t border-[var(--tl-line)] sm:grid-cols-2">
        {POINTS.map((p, i) => (
          <Reveal key={p.title} delayMs={i * 40}>
            <div className="border-b border-[var(--tl-line)] py-8 sm:odd:border-r sm:odd:pr-10 sm:even:pl-10">
              <h3 className="text-base font-semibold text-[var(--tl-ink)]">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--tl-ink-2)]">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
