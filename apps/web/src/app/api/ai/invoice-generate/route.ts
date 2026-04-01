import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/anthropic';
import { invoiceGeneratorPrompt, systemPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = String(body.input || '').trim();
    if (!input) return NextResponse.json({ success: false, error: 'input required' }, { status: 400 });

    const { text } = await generateText({
      model: getClaudeModel(),
      system: systemPrompt,
      prompt: `${invoiceGeneratorPrompt}\n\nUser description:\n${input}\n`,
      temperature: 0.2,
    });

    // Expect JSON from model
    const json = JSON.parse(text);
    return NextResponse.json({ success: true, data: json });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'AI error' }, { status: 500 });
  }
}

