import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/anthropic';
import { pricingSuggestPrompt, systemPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = body.item ?? null;
    const history = body.history ?? null;
    if (!item) return NextResponse.json({ success: false, error: 'item required' }, { status: 400 });

    const { text } = await generateText({
      model: getClaudeModel(),
      system: systemPrompt,
      prompt: `${pricingSuggestPrompt}\n\nItem:\n${JSON.stringify(item)}\n\nHistory:\n${JSON.stringify(history)}\n`,
      temperature: 0.2,
    });

    const json = JSON.parse(text);
    return NextResponse.json({ success: true, data: json });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'AI error' }, { status: 500 });
  }
}

