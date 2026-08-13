import { NextResponse } from 'next/server';
import { isResendConfigured, isWhatsappEnvReady } from '@/lib/integrations/messaging';

/** Tells the UI whether server env has messaging configured (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    resend: isResendConfigured(),
    whatsapp: isWhatsappEnvReady(),
  });
}
