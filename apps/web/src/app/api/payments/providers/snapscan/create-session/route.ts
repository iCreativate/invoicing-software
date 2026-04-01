import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'SnapScan not implemented yet. Next step: generate a SnapScan payment request/QR (merchant credentials), then update payment_sessions and confirm via webhook/poll.',
    },
    { status: 501 }
  );
}

