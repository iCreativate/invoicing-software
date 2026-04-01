'use client';

import type { ReactNode } from 'react';

export function ResponsiveTableShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden min-w-0 max-w-full ${className}`}>
      <div className="overflow-x-auto min-w-0">
        {children}
      </div>
    </div>
  );
}

