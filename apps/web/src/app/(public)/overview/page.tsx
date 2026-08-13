import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { ProductStage } from '@/components/landing/ProductStage';
import { routes } from '@/lib/routing/routes';

export const metadata: Metadata = {
  title: 'Overview — TimelyInvoices',
  description: 'A product-led overview of TimelyInvoices: invoicing, payment tracking, reminders, and cashflow.',
};

function PageShell({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit font-normal">
            {label}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild className="shadow-[var(--shadow-sm)]">
              <Link href={routes.auth.register}>Start free</Link>
            </Button>
            <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
              <Link href={routes.app.dashboard}>View dashboard</Link>
            </Button>
          </div>
        </header>

        <main className="mt-8 space-y-6">{children}</main>

        <footer className="mt-10 border-t border-border/70 pt-8 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
          <div className="mt-3">© {new Date().getFullYear()} TimelyInvoices</div>
        </footer>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <PageShell
      label="Product"
      title="Overview"
      subtitle="A clean dashboard for invoicing, collections, and cashflow — built for South African businesses."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-xl border-border p-0 shadow-[var(--shadow-sm)]">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="text-sm font-semibold">What it looks like</div>
            <div className="mt-1 text-xs text-muted-foreground">The same UI language you see in the product.</div>
          </div>
          <div className="ti-landing p-4 sm:p-5">
            <ProductStage compact />
          </div>
        </Card>

        <div className="grid gap-3">
          <Card className="rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="text-sm font-semibold">Core workflow</div>
            <div className="mt-1 text-sm text-muted-foreground">Draft → send → track → get paid.</div>
            <div className="mt-4 space-y-2">
              {[
                { t: 'Draft an invoice', d: 'Create line items and totals.', s: 'draft' as const },
                { t: 'Send to client', d: 'Share a secure link and track status.', s: 'sent' as const },
                { t: 'Follow up', d: 'Automated reminders reduce overdue invoices.', s: 'overdue' as const },
                { t: 'Mark paid', d: 'Payments update cashflow in the dashboard.', s: 'paid' as const },
              ].map((r) => (
                <div key={r.t} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3">
                  <div>
                    <div className="text-sm font-semibold">{r.t}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{r.d}</div>
                  </div>
                  <StatusBadge status={r.s} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="text-sm font-semibold">Invoice list preview</div>
            <div className="mt-1 text-xs text-muted-foreground">Status badges stay consistent across the app.</div>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { inv: 'INV-2048', client: 'Mthembu Holdings', status: 'paid' as const, amt: 'R12,400' },
                    { inv: 'INV-2049', client: 'Zianda Brand Solutions', status: 'sent' as const, amt: 'R8,750' },
                    { inv: 'INV-2050', client: 'TSM Brand Solutions', status: 'overdue' as const, amt: 'R15,200' },
                  ].map((r) => (
                    <TableRow key={r.inv}>
                      <TableCell className="font-semibold text-foreground">{r.inv}</TableCell>
                      <TableCell className="text-muted-foreground">{r.client}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{r.amt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

