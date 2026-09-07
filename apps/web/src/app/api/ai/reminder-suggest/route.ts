import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/anthropic';
import { smartReminderPrompt, systemPrompt } from '@/lib/ai/prompts';
import { parseLlmJson } from '@/lib/ai/parseLlmJson';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const context = body.context ?? {};

    const prompt = `${smartReminderPrompt}

Context JSON:
${JSON.stringify(context)}`;

    const result = await generateText({
      model: getClaudeModel(),
      system: systemPrompt,
      prompt,
      temperature: 0.2,
    });

    const text = result.text?.trim() ?? '';
    const data = parseLlmJson(text);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'AI reminder failed' }, { status: 500 });
  }
}

