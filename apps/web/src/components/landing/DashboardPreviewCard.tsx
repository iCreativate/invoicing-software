'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { cn } from '@/lib/utils/cn';

function MetricCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-5', className)}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}

export function DashboardPreviewCard() {
  return (
    <Card className="rounded-xl border-border p-0 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div>
          <div className="text-sm font-semibold tracking-tight">Dashboard preview</div>
          <div className="mt-0.5 text-xs text-muted-foreground">A live-style snapshot of revenue and invoices</div>
        </div>
        <Badge variant="outline" className="font-normal">
          ZAR
        </Badge>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <MetricCard label="Total revenue (month)" value="R 96 300" sub="Invoiced this month" />
        <MetricCard label="Outstanding invoices" value="R 24 180" sub="3 open invoices" />
        <MetricCard label="Paid" value="R 71 540" sub="7 payments collected" />
        <MetricCard label="Overdue" value="R 8 920" sub="2 overdue invoices" className="ring-1 ring-danger/20" />
      </div>

      <div className="border-t border-border">
        <div className="flex items-center justify-between gap-2 p-4 sm:px-5">
          <div className="text-sm font-semibold">Recent activity</div>
          <Badge variant="default">Live</Badge>
        </div>

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
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
                  { inv: 'INV-10418', client: 'Karoo Digital', status: 'sent' as const, amt: 'R 5 800' },
                  { inv: 'INV-10407', client: 'Ubuntu Labs', status: 'paid' as const, amt: 'R 12 400' },
                  { inv: 'INV-10391', client: 'Cape Creative', status: 'overdue' as const, amt: 'R 3 120' },
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
        </div>
      </div>
    </Card>
  );
}

