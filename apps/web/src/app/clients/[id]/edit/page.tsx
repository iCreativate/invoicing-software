'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { fetchClientDetail, updateClient } from '@/features/clients/api';

const Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export default function ClientEditPage() {
  const params = useParams();
  const id = String((params as any).id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setSubmitError(null);
        const c = await fetchClientDetail(id);
        if (!alive) return;
        setForm({
          name: c.name ?? '',
          email: c.email ?? '',
          phone: c.phone ?? '',
          address: c.address ?? '',
        });
      } catch (e: any) {
        if (!alive) return;
        setSubmitError(e?.message ?? 'Failed to load client.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const canSave = useMemo(() => form.name.trim().length > 0 && !submitting, [form.name, submitting]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setSubmitError(null);
    setErrors({});
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join('.')] = issue.message;
      setErrors(next);
      return;
    }
    setSubmitting(true);
    try {
      await updateClient({
        id,
        name: parsed.data.name.trim(),
        email: parsed.data.email?.trim() || undefined,
        phone: parsed.data.phone?.trim() || undefined,
        address: parsed.data.address?.trim() || undefined,
      });
      setOk('Saved.');
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to save client.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Edit client"
      actions={
        <div className="flex items-center gap-2">
          <Link href={`${routes.app.clients}/${id}`}>
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" form="client-edit-form" disabled={!canSave}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <Card className="p-5">
        {submitError ? <div className="mb-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{submitError}</div> : null}
        {ok ? <div className="mb-4 rounded-2xl bg-success/10 p-3 text-sm text-success">{ok}</div> : null}

        <form id="client-edit-form" onSubmit={onSave} className="grid gap-4 sm:max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={loading} />
            {errors.name ? <div className="text-xs text-danger">{errors.name}</div> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email (optional)</label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={loading} />
            {errors.email ? <div className="text-xs text-danger">{errors.email}</div> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={loading} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address (optional)</label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} disabled={loading} />
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            Tip: keep client names consistent so AI pricing suggestions work better.
          </div>
        </form>
      </Card>
    </AppShell>
  );
}

