import { NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';

/** Best-effort Sentry capture without hard-requiring the package at build time if unset. */
export async function captureException(err: unknown, context?: Record<string, unknown>) {
  try {
    if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, { extra: context });
  } catch {
    // package may be absent in some envs
  }
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/**
 * Wrap API handlers so uncaught errors are logged + reported.
 */
export function withApiErrorReporting<T extends Request>(
  name: string,
  handler: (request: T) => Promise<Response>
) {
  return async (request: T): Promise<Response> => {
    try {
      return await handler(request);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      logger.error(`api.${name}`, { message });
      await captureException(err, { route: name });
      return jsonError(message, 500);
    }
  };
}
