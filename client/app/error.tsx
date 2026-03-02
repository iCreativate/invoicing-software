'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const isServerOrNetwork =
    error?.message?.toLowerCase().includes('internal server error') ||
    error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('network');

  return (
    <div className="min-h-screen w-full max-w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-3 sm:px-4 py-6 box-border">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8 text-center min-w-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
        <p className="text-slate-600 text-sm mb-6 break-words">
          {isServerOrNetwork ? (
            <>
              The app couldn’t reach the server or the server hit an error. Check that the backend is running on port 5000
              and that the database is up, then try again.
            </>
          ) : (
            <>An unexpected error occurred. You can try again or return to the home page.</>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
