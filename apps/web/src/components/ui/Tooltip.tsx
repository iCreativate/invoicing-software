import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('ti-tooltip-wrap', className)}>
      {children}
      <span role="tooltip" className="ti-tooltip">
        {label}
      </span>
    </span>
  );
}
