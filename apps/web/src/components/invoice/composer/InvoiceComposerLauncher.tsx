'use client';

import Link from 'next/link';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { FilePlus2 } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

export function InvoiceComposerLauncher({
  label = 'New invoice',
  buttonVariant = 'primary',
  className,
  icon = true,
}: {
  label?: string;
  buttonVariant?: ButtonProps['variant'];
  className?: string;
  icon?: boolean;
}) {
  const { canEdit, status } = useWorkspaceCapabilities();
  if (status === 'loading' || status === 'idle') return null;
  if (!canEdit) return null;

  return (
    <Link href={`${routes.app.invoices}/new`} className={className}>
      <Button variant={buttonVariant} className={className}>
        {icon ? <FilePlus2 className="h-4 w-4" /> : null}
        {label ? label : null}
      </Button>
    </Link>
  );
}

