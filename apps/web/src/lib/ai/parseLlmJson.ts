/** Parse JSON from an LLM reply that may be wrapped in markdown fences or extra prose. */
export function parseLlmJson<T = unknown>(raw: string): T {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) throw new SyntaxError('Empty model response');

  const unfenced = trimmed.replace(/```(?:json)?/gi, '').trim();

  try {
    return JSON.parse(unfenced) as T;
  } catch {
    const start = unfenced.indexOf('{');
    const end = unfenced.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1)) as T;
    }
    throw new SyntaxError('Model did not return JSON');
  }
}
