'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalTrigger } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { MessageSquare } from 'lucide-react';
import { resolveLocalCommand, type CommandAction, type CommandResult } from '@/lib/ai/commandLayer';
import { storeAskInvoicePrefill } from '@/lib/invoices/askPrefill';
import { cn } from '@/lib/utils/cn';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: CommandAction[];
};

const GREETING =
  'Tell Timely what you need — overdue invoices, who owes you, cashflow, or create an invoice.';

export const ASK_TIMELY_OPEN_EVENT = 'ti-ask-timely-open';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function openAskTimely(query?: string) {
  window.dispatchEvent(new CustomEvent(ASK_TIMELY_OPEN_EVENT, { detail: { query: query ?? '' } }));
}

export function AskTimelyDrawer({
  trigger = 'button',
}: {
  trigger?: 'button' | 'none';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ id: 'greet', role: 'assistant', content: GREETING }]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const applyResult = useCallback(
    (result: CommandResult, closeAfterNavigate = true) => {
      if (result.invoicePrefill) storeAskInvoicePrefill(result.invoicePrefill);
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: result.reply,
          actions: result.actions,
        },
      ]);
      const href = result.actions[0]?.href;
      if (result.autoNavigate && href) {
        if (closeAfterNavigate) setOpen(false);
        router.push(href);
      }
    },
    [router]
  );

  const send = useCallback(
    async (raw?: string) => {
      const t = (raw ?? text).trim();
      if (!t || sending) return;
      setText('');
      setSending(true);
      setMessages((prev) => [...prev, { id: newId(), role: 'user', content: t }]);

      const local = resolveLocalCommand(t);
      if (local?.reply) {
        applyResult(local);
        setSending(false);
        return;
      }

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: t }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json.error ?? 'Ask Timely could not complete that.');
        }
        applyResult(json.data as CommandResult);
      } catch (e: unknown) {
        const fallback = resolveLocalCommand(t);
        if (fallback) {
          applyResult({
            ...fallback,
            reply: fallback.reply || 'I can take you to the right place in Timely.',
            autoNavigate: Boolean(fallback.autoNavigate && fallback.reply),
          });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: 'assistant',
              content: e instanceof Error ? e.message : 'Ask Timely could not complete that.',
            },
          ]);
        }
      } finally {
        setSending(false);
      }
    },
    [applyResult, sending, text]
  );

  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = String((e as CustomEvent<{ query?: string }>).detail?.query ?? '').trim();
      setOpen(true);
      if (q) setQueued(q);
    };
    window.addEventListener(ASK_TIMELY_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ASK_TIMELY_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open || !queued) return;
    const q = queued;
    setQueued(null);
    void send(q);
  }, [open, queued, send]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      {trigger === 'button' ? (
        <ModalTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask Timely</span>
          </Button>
        </ModalTrigger>
      ) : null}
      <ModalContent className="max-w-2xl p-6">
        <ModalHeader className="mb-4">
          <ModalTitle className="text-xl font-semibold tracking-tight">Ask Timely</ModalTitle>
          <ModalDescription className="text-sm text-muted-foreground">
            Tell Timely what you need. It opens the right place in the app.
          </ModalDescription>
        </ModalHeader>

        <Card className="p-4">
          <div ref={listRef} className="max-h-[55vh] space-y-3 overflow-auto">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={cn(
                    'inline-block max-w-[95%] rounded-2xl px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-[var(--shadow-sm)]'
                      : 'bg-muted/40 text-foreground'
                  )}
                >
                  {m.content}
                </div>
                {m.actions?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.actions.map((a) => (
                      <Button
                        key={`${m.id}-${a.href}`}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setOpen(false);
                          router.push(a.href);
                        }}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {sending ? <p className="text-left text-xs text-muted-foreground">Working…</p> : null}
          </div>
        </Card>

        <div className="mt-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell Timely what you need"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={() => void send()} disabled={sending || !text.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
