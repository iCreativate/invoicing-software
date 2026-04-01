import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { PieChart, FileSpreadsheet } from 'lucide-react';

export default function ReportsHubPage() {
  return (
    <AppShell title="Reports">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 motion-safe:transition-transform hover:-translate-y-0.5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Profit &amp; loss</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Revenue from paid invoices versus categorized expenses (readiness for multi-currency totals).
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href={routes.app.reportsPl}>Open P&amp;L</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 opacity-80">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">More reports</div>
              <p className="mt-1 text-sm text-muted-foreground">VAT, aging, and cashflow exports can plug into this hub next.</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
