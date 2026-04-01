export async function suggestSmartReminder(context: any) {
  const res = await fetch('/api/ai/reminder-suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Reminder AI failed');
  return json.data as { sendAt: string; channel: 'email' | 'whatsapp'; message: string; reason: string };
}

