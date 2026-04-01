import { anthropic } from '@ai-sdk/anthropic';

export function getClaudeModel() {
  // Defaults; override via env if desired
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  return anthropic(model);
}

