/**
 * No genuine customer logos/testimonials exist in the codebase.
 * Product credibility only — do not invent social proof.
 */
export function ProofSection() {
  const points = [
    {
      title: 'Invoice to payment in one place',
      body: 'Create, send, track and collect without juggling tools.',
    },
    {
      title: 'Clarity before the chase',
      body: "See what's outstanding, overdue and expected — before you chase.",
    },
    {
      title: 'Built for South Africa',
      body: 'ZAR amounts and workflows that match how you get paid.',
    },
    {
      title: 'Attention when it matters',
      body: 'Surfaces overdue invoices and due payments early.',
    },
  ];

  return (
    <section className="tl-section tl-dark-section">
      <div className="tl-container">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16 lg:items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <p className="tl-label">Why Timely</p>
            <h2 className="tl-h2 tl-h2-wide mt-4">
              Built for getting paid —
              <br />
              not another accounting suite.
            </h2>
            <p className="mt-6 max-w-sm text-[17px] leading-relaxed text-slate-400">
              Clarity around invoices, collections and cash — without tools you will never use.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {points.map((p, i) => (
              <article
                key={p.title}
                className="flex flex-col rounded-[var(--tl-radius)] border border-white/10 bg-white/[0.03] p-6 sm:p-7"
              >
                <span className="tl-num text-[13px] font-semibold text-[var(--tl-accent)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-[17px] font-semibold leading-snug tracking-tight text-white">
                  {p.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
