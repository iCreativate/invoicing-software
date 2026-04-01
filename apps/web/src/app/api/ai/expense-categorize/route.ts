import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/anthropic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const description = String(body.description ?? '').trim();
    const amount = body.amount != null ? Number(body.amount) : undefined;
    if (!description) return NextResponse.json({ success: false, error: 'description required' }, { status: 400 });

    const { text } = await generateText({
      model: getClaudeModel(),
      system:
        'You classify business expenses. Reply with a single JSON object: {"category":"..."} where category is one of: office, travel, software, meals, marketing, professional_services, equipment, utilities, payroll, taxes, uncategorized.',
      prompt: `Expense description: ${description}\nAmount: ${amount ?? 'unknown'}\n`,
      temperature: 0.1,
    });

    const json = JSON.parse(text);
    const category = String(json.category ?? 'uncategorized').toLowerCase().replace(/\s+/g, '_');
    return NextResponse.json({ success: true, category });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'AI error' }, { status: 500 });
  }
}
