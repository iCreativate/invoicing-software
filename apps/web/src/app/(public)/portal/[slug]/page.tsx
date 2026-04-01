import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format/money';
import { PayNowButton } from '@/components/payments/PayNowButton';
import { CreditCard, ShieldCheck, Sparkles } from 'lucide-react';

function statusVariant(s: string) {
  const v = String(s ?? '').toLowerCase();
  if (v === 'paid') return 'success';
  if (v === 'overdue') return 'danger';
  if (v === 'partial') return 'primary';
  return 'outline';
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: portal, error: pErr } = await supabase
    .from('client_portals')
    .select('id,client_id,slug,enabled')
    .eq('slug', slug)
    .single();

  if (pErr || !portal || !(portal as any).enabled) notFound();

  const clientId = String((portal as any).client_id);
  const { data: client } = await supabase.from('clients').select('id,name,email').eq('id', clientId).single();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id,invoice_number,status,issue_date,due_date,currency,total_amount,paid_amount,balance_amount,public_share_id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50);

  const clientName = String((client as any)?.name ?? 'Client');

  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(900px_480px_at_15%_0%,hsl(var(--primary)/0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_90%_20%,rgba(99,102,241,0.12),transparent_50%)]" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <header className="relative overflow-hidden rounded-[calc(var(--radius)+12px)] border border-border bg-card/90 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client portal</div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{clientName}</h1>
                {(client as any)?.email ? (
                  <div className="mt-1 text-sm text-muted-foreground">{String((client as any).email)}</div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-3 py-1 font-medium text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  Secure payments
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-3 py-1">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  PayFast · SnapScan
                </span>
              </div>
            </div>
          </div>
        </header>

        <Card className="mt-8 border-border/80 p-5 sm:p-6 shadow-[var(--shadow-md)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Your invoices</div>
              <div className="mt-1 text-sm text-muted-foreground">
                View, download, and pay online. Balances update when payments are received.
              </div>
            </div>
            <div className="text-xs font-medium text-muted-foreground">{(invoices ?? []).length} shown</div>
          </div>

          {(invoices ?? []).length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No invoices to show yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {(invoices ?? []).map((inv: any) => {
                const canPay = Number(inv.balance_amount ?? 0) > 0 && String(inv.status ?? '') !== 'paid';
                return (
                  <div
                    key={String(inv.id)}
                    className="rounded-2xl border border-border bg-gradient-to-b from-card to-muted/10 p-4 shadow-[var(--shadow-sm)] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold">
                            {inv.invoice_number ? String(inv.invoice_number) : `Invoice`}
                          </div>
                          <Badge variant={statusVariant(inv.status)}>{String(inv.status ?? 'draft')}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground sm:text-sm">
                          Issued {String(inv.issue_date ?? '—')} · Due {String(inv.due_date ?? '—')}
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="font-semibold tabular-nums">
                              {formatMoney(Number(inv.total_amount ?? 0), String(inv.currency ?? 'ZAR'))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Paid</div>
                            <div className="font-semibold tabular-nums text-success">
                              {formatMoney(Number(inv.paid_amount ?? 0), String(inv.currency ?? 'ZAR'))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Balance</div>
                            <div className="font-semibold tabular-nums">
                              {formatMoney(Number(inv.balance_amount ?? 0), String(inv.currency ?? 'ZAR'))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start lg:w-[min(100%,280px)] lg:flex-col">
                        {inv.public_share_id ? (
                          <Link href={`/invoice/${String(inv.public_share_id)}`} className="block w-full sm:flex-1 lg:flex-none">
                            <Button variant="secondary" className="w-full">
                              View invoice
                            </Button>
                          </Link>
                        ) : null}
                        <div className="w-full flex-1 lg:flex-none">
                          <PayNowButton invoiceId={String(inv.id)} disabled={!canPay} label="Pay securely" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Secured checkout via trusted South African providers ·{' '}
          <span className="font-medium text-foreground/80">Powered by TimelyInvoices</span>
        </div>
      </div>
    </div>
  );
}
