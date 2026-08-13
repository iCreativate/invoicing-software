import { anthropic } from '@ai-sdk/anthropic';

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getClaudeModel() {
  // Defaults; override via env if desired
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  return anthropic(model);
}

export function friendlyAnthropicError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (!isAnthropicConfigured() || /api[-_ ]?key|authentication|unauthorized|ANTHROPIC/i.test(raw)) {
    return {
      message: 'Invoice generator isn’t configured yet. Add ANTHROPIC_API_KEY on the server.',
      status: 503,
    };
  }
  return { message: 'Couldn’t draft the invoice. Try a shorter description.', status: 500 };
}

