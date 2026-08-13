import Link from 'next/link';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function QuickActionCard({
  href,
  label,
  description,
  className,
}: {
  href: string;
  label: string;
  description?: string;
  className?: string;
  /** @deprecated unused — kept for call-site compatibility */
  icon?: unknown;
}) {
  return (
    <Link href={href} className={cn('group card-interactive flex items-center justify-between gap-3 px-4 py-3.5', className)}>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-slate-500">{description}</span> : null}
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-600 text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </Link>
  );
}
