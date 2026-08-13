import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { routes } from '@/lib/routing/routes';

export const metadata: Metadata = {
  title: 'FAQ — TimelyInvoices',
  description: 'Answers to common questions about TimelyInvoices.',
};

const FAQS = [
  {
    q: 'Is TimelyInvoices built for South Africa?',
    a: 'Yes—ZAR pricing, SA-focused workflows, and VAT-aware invoice totals.',
  },
  {
    q: 'Do clients need an account to pay?',
    a: 'No. Clients can pay from a secure link without signing up.',
  },
  {
    q: 'Can I export invoices and reports?',
    a: 'Yes. Export to CSV and print/save PDFs anytime.',
  },
  {
    q: 'Can my team use it?',
    a: 'Yes. Team permissions are available on higher plans.',
  },
  {
    q: 'How do overdue reminders work?',
    a: 'You can send reminders manually or automate follow-ups. Status stays visible so you know what’s outstanding.',
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit font-normal">
            Help
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h1>
          <p className="text-sm text-muted-foreground">Clear answers in the same product language as the dashboard.</p>
        </header>

        <Card className="mt-6 overflow-hidden rounded-xl border-border p-0 shadow-[var(--shadow-sm)]">
          {FAQS.map((it, i) => (
            <details key={it.q} className={i === 0 ? '' : 'border-t border-border'}>
              <summary className="cursor-pointer list-none px-4 py-4 text-sm font-semibold sm:px-5">
                {it.q}
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground sm:px-5">{it.a}</div>
            </details>
          ))}
        </Card>

        <div className="mt-10 flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/overview">Overview</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
            <Link href={routes.auth.register}>Start free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

