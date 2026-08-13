import { Reveal } from '@/components/landing/landingMotion';

const ITEMS = [
  { title: 'Security', body: 'Authenticated sessions, workspace isolation and signed payment webhooks.' },
  { title: 'Data protection', body: 'Your invoices, clients and payments stay scoped to your business.' },
  { title: 'Reliable payments', body: 'Confirmation from trusted payment events — not a page visit.' },
  { title: 'Infrastructure', body: 'Modern cloud hosting with careful handling of financial records.' },
];

export function TrustSection() {
  return (
    <section className="border-y border-[var(--tl-line)] bg-[var(--tl-surface)]">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-16 sm:py-20">
        <Reveal>
          <p className="tl-label">Trust</p>
          <h2 className="tl-h3 mt-3 max-w-xl">Serious software for people who take their business seriously.</h2>
        </Reveal>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} delayMs={i * 30}>
              <div className="border-t border-[var(--tl-line)] pt-4">
                <dt className="text-sm font-semibold text-[var(--tl-ink)]">{item.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--tl-ink-2)]">{item.body}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
