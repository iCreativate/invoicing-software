import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="ti-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="ti-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ti-caption">{hint}</p>
      ) : null}
    </div>
  );
}
