import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isLlmConfigured() {
  return isGroqConfigured() || isAnthropicConfigured();
}

/** Groq (free tier) if set, otherwise Claude. */
export function getLanguageModel() {
  if (isGroqConfigured()) {
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    return groq(model);
  }
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  return anthropic(model);
}

/** @deprecated use getLanguageModel — kept so existing AI routes pick Groq automatically. */
export function getClaudeModel() {
  return getLanguageModel();
}

export function friendlyAnthropicError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (!isLlmConfigured() || /api[-_ ]?key|authentication|unauthorized|ANTHROPIC|GROQ/i.test(raw)) {
    return {
      message: 'Invoice generator isn’t configured yet. Add GROQ_API_KEY or ANTHROPIC_API_KEY on the server.',
      status: 503,
    };
  }
  return { message: 'Couldn’t draft the invoice. Try a shorter description.', status: 500 };
}
