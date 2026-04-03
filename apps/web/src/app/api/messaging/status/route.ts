import { NextResponse } from 'next/server';
import { isResendConfigured } from '@/lib/integrations/messaging';

/** Tells the UI whether server env has Resend configured (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    resend: isResendConfigured(),
  });
}
