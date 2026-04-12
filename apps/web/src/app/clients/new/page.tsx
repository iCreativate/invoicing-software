'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { createClient } from '@/features/clients/api';
import { RedirectIfReadOnly } from '@/components/workspace/RedirectIfReadOnly';

const Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  companyRegistration: z.string().optional().or(z.literal('')),
  vatNumber: z.string().optional().or(z.literal('')),
});

export default function NewClientPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    website: '',
    companyRegistration: '',
    vatNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});
    setSubmitting(true);
    try {
      const parsed = Schema.safeParse(form);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          next[issue.path.join('.')] = issue.message;
        }
        setErrors(next);
        return;
      }

      const { id } = await createClient({
        name: parsed.data.name,
        email: parsed.data.email || undefined,
        phone: parsed.data.phone || undefined,
        address: parsed.data.address || undefined,
        companyName: parsed.data.companyName || undefined,
        website: parsed.data.website || undefined,
        companyRegistration: parsed.data.companyRegistration || undefined,
        vatNumber: parsed.data.vatNumber || undefined,
      });

      window.location.assign(routes.app.clients);
      void id;
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to create client.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RedirectIfReadOnly href={routes.app.clients}>
      <AppShell
        title="New client"
        actions={
          <Link href={routes.app.clients}>
            <Button variant="secondary">Back</Button>
          </Link>
        }
      >
        <Card className="p-4">
          {submitError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</div>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-6 sm:max-w-xl">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground">Contact</div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Name <span className="text-muted-foreground">(required)</span>
                </label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contact or billing name" />
                {errors.name ? <div className="text-xs text-red-700">{errors.name}</div> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email (optional)
                </label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                {errors.email ? <div className="text-xs text-red-700">{errors.email}</div> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="phone">
                  Phone (optional)
                </label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="text-sm font-semibold text-foreground">Company</div>
              <p className="text-xs text-muted-foreground">Optional — helps invoices and VAT records look professional.</p>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="companyName">
                  Company / trading name (optional)
                </label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  placeholder="e.g. Acme (Pty) Ltd"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="website">
                  Website (optional)
                </label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://example.co.za"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="companyRegistration">
                    Registration / CK (optional)
                  </label>
                  <Input
                    id="companyRegistration"
                    value={form.companyRegistration}
                    onChange={(e) => setForm((f) => ({ ...f, companyRegistration: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="vatNumber">
                    VAT number (optional)
                  </label>
                  <Input
                    id="vatNumber"
                    value={form.vatNumber}
                    onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
                    placeholder="e.g. 4123456789"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-sm font-medium" htmlFor="address">
                Address (optional)
              </label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, city, postal code"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create client'}
              </Button>
            </div>
          </form>
        </Card>
      </AppShell>
    </RedirectIfReadOnly>
  );
}
