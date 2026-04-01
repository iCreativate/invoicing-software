import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Ozow not implemented yet. Next step: generate Ozow hash + redirect URL, then verify callback/webhook and update payment_sessions + invoices.',
    },
    { status: 501 }
  );
}

