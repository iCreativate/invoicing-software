import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getClaudeModel } from '@/lib/ai/anthropic';
import { systemPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages ?? [];
  const result = streamText({
    model: getClaudeModel(),
    system: systemPrompt,
    messages,
    temperature: 0.2,
  });
  return result.toTextStreamResponse({
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

