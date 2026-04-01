'use client';

import type { ReactNode } from 'react';

export function MobileCardList({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid grid-cols-1 gap-4 min-w-0 ${className}`}>{children}</div>;
}

export function MobileCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass p-5 rounded-3xl shadow-xl border border-gray-200/50 card-hover min-w-0 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function KeyValueGrid({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid grid-cols-2 gap-3 pt-4 border-t border-gray-200/50 min-w-0 ${className}`}>{children}</div>;
}

export function KeyValue({
  label,
  value,
  className = '',
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 min-w-0 break-words">{value}</div>
    </div>
  );
}

