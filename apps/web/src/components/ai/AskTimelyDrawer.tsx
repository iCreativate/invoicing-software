'use client';

import { useMemo, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalTrigger } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { MessageSquare } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export function AskTimelyDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi — I’m Ask Timely. Ask about invoices, pricing, or cash flow.' },
  ]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const transcript = useMemo(() => messages, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    setSending(true);
    const next: Msg[] = [...messages, { role: 'user', content: t }];
    setMessages(next);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error('Chat failed');

      // Read streaming text response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: acc }]);
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'AI is not configured yet (missing ANTHROPIC_API_KEY).' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Ask Timely
        </Button>
      </ModalTrigger>
      <ModalContent className="max-w-2xl p-6">
        <ModalHeader className="mb-4">
          <ModalTitle className="text-xl font-semibold tracking-tight">Ask Timely</ModalTitle>
          <ModalDescription className="text-sm text-muted-foreground">
            AI assistant for invoices, pricing, and cash flow.
          </ModalDescription>
        </ModalHeader>

        <Card className="p-4 max-h-[55vh] overflow-auto">
          <div className="space-y-3">
            {transcript.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'inline-block rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-sm shadow-[var(--shadow-sm)]'
                      : 'inline-block rounded-2xl bg-muted/40 px-3 py-2 text-sm text-foreground'
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask anything…"
            onKeyDown={(e) => e.key === 'Enter' && void send()}
          />
          <Button onClick={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

