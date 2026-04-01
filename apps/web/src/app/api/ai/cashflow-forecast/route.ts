import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/anthropic';
import { cashflowForecastPrompt, systemPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const summary = body.summary ?? null;
    if (!summary) return NextResponse.json({ success: false, error: 'summary required' }, { status: 400 });

    const { text } = await generateText({
      model: getClaudeModel(),
      system: systemPrompt,
      prompt: `${cashflowForecastPrompt}\n\nSummary:\n${JSON.stringify(summary)}\n`,
      temperature: 0.2,
    });

    const json = JSON.parse(text);
    return NextResponse.json({ success: true, data: json });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'AI error' }, { status: 500 });
  }
}

