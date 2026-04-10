'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { fetchClientsList } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import { createQuote } from '@/features/quotes/api';
import { todayISO, addDaysISO, makeEmptyItem } from '@/components/invoice/composer/utils';
import type { InvoiceComposerItem } from '@/components/invoice/composer/types';
import { RedirectIfReadOnly } from '@/components/workspace/RedirectIfReadOnly';

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(addDaysISO(14));
  const [currency, setCurrency] = useState('ZAR');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceComposerItem[]>([makeEmptyItem(15)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchClientsList();
        if (!alive) return;
        setClients(list);
        if (list[0]) setClientId(list[0].id);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <RedirectIfReadOnly href={routes.app.quotes}>
      <AppShell
        title="New quote"
        actions={
          <Link href={routes.app.quotes}>
            <Button variant="secondary">Back</Button>
          </Link>
        }
      >
        <Card className="p-5">
        {error ? <div className="mb-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Client</label>
            <select
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Issue date</label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valid until</label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="mt-6 text-sm font-semibold">Line items</div>
        <div className="mt-3 space-y-3">
          {items.map((it, idx) => (
            <div key={it.id} className="grid gap-2 rounded-2xl bg-muted/20 p-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <Input
                  value={it.description}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...it, description: e.target.value };
                    setItems(next);
                  }}
                  placeholder="Description"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...it, quantity: Number(e.target.value) };
                    setItems(next);
                  }}
                  placeholder="Qty"
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...it, unitPrice: Number(e.target.value) };
                    setItems(next);
                  }}
                  placeholder="Unit price"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number"
                  value={it.vatRate}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...it, vatRate: Number(e.target.value) };
                    setItems(next);
                  }}
                  placeholder="VAT %"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setItems([...items, makeEmptyItem(15)])}
          >
            Add line
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={saving || !clientId}
            onClick={async () => {
              setError(null);
              setSaving(true);
              try {
                const row = await createQuote({
                  clientId,
                  issueDate,
                  validUntil,
                  currency,
                  vatRate: 15,
                  notes: notes || undefined,
                  items: items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    vatRate: i.vatRate,
                  })),
                });
                router.push(`${routes.app.quotes}/${row.id}`);
              } catch (e: any) {
                setError(e?.message ?? 'Failed to save quote.');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving…' : 'Create quote'}
          </Button>
        </div>
        </Card>
      </AppShell>
    </RedirectIfReadOnly>
  );
}
