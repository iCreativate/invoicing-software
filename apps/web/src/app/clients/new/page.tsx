'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { ClientsWorkspace } from '@/components/clients/ClientsWorkspace';
import { ClientForm } from '@/components/clients/ClientForm';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/features/clients/api';
import { normalizeClientPayload } from '@/lib/clients/form';
import { routes } from '@/lib/routing/routes';
import { notifyError, notifySuccess } from '@/lib/notify';
import { RedirectIfReadOnly } from '@/components/workspace/RedirectIfReadOnly';

export default function NewClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (payload: ReturnType<typeof normalizeClientPayload>, action: 'save' | 'invoice') => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { id } = await createClient(payload);
      notifySuccess(action === 'invoice' ? 'Client created — opening invoice.' : 'Client created.');
      if (action === 'invoice') {
        router.push(`${routes.app.invoices}/new?clientId=${id}`);
        return;
      }
      router.push(`${routes.app.clients}/${id}`);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to create client.';
      setSubmitError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RedirectIfReadOnly href={routes.app.clients}>
      <ClientsWorkspace
        title="New client"
        description="Add a client with contact, company, and billing details — ready for your first invoice."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={routes.app.clients}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Back to clients
            </Link>
          </Button>
        }
      >
        <div className="ti-page-enter">
          <div className="mb-4 flex items-center gap-3 rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tl-accent)_10%,white)] text-[var(--tl-accent)]">
              <UserPlus className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--tl-ink)]">Build your client directory</p>
              <p className="text-[13px] text-[var(--tl-ink-3)]">
                Capture enough detail now so invoices and reminders look professional from day one.
              </p>
            </div>
          </div>

          <ClientForm
            submitting={submitting}
            error={submitError}
            showSecondaryAction
            onCancel={() => router.push(routes.app.clients)}
            onSubmit={onSubmit}
          />
        </div>
      </ClientsWorkspace>
    </RedirectIfReadOnly>
  );
}
