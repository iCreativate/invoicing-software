'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { fetchClientsList, createClient, searchClients } from '@/features/clients/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils/cn';
import type { ClientListItem } from '@/features/clients/types';
import type { InvoiceComposerDraft, InvoiceComposerItem } from './types';
import { addDaysISO, calcTotals, makeEmptyItem, todayISO } from './utils';
import { itemsToPayload, totalsForDraftSync, workingItemsForDraftSync } from './draftItems';
import { Check, FilePlus2, Sparkles, Send, Printer, Wand2 } from 'lucide-react';
import { aiSuggestPricing, fetchItemSuggestions, rememberPrice, type ItemSuggestion } from '@/features/invoices/suggestions';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { SendStep } from './SendStep';
import { clearDraft, loadDraft, saveDraft } from './autosave';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { fetchClientDetail } from '@/features/clients/api';
import { fetchCatalogItems } from '@/features/catalog/api';
import type { CatalogListItem } from '@/features/catalog/types';
import { buildPublicInvoiceViewUrl } from '@/lib/invoice/platformUrls';

const DraftSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.string().min(1),
});

type Step = 1 | 2 | 3 | 4;

export function InvoiceComposerModal({
  open,
  onOpenChange,
  onCreated,
  mode = 'modal',
  editInvoiceId = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (invoiceId: string) => void;
  mode?: 'modal' | 'page';
  /** When set (e.g. edit page), load this invoice from the API instead of a blank draft. */
  editInvoiceId?: string | null;
}) {
  const autosaveScope = mode === 'page' ? 'page' : 'modal';
  const makeInvoiceNumber = () => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const n = Math.floor(10000 + Math.random() * 90000);
    return `INV-${yyyy}-${n}`;
  };
  const [step, setStep] = useState<Step>(1);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [clientsQuery, setClientsQuery] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const [quickClient, setQuickClient] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    website: '',
    companyRegistration: '',
    vatNumber: '',
  });

  const [draft, setDraft] = useState<InvoiceComposerDraft>({
    invoiceNumber: null,
    clientId: '',
    issueDate: todayISO(),
    dueDate: addDaysISO(30),
    currency: 'ZAR',
    template: 'modern',
    items: [makeEmptyItem(15)],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [resumeCandidate, setResumeCandidate] = useState<InvoiceComposerDraft | null>(null);
  const [resumeCandidateSavedAt, setResumeCandidateSavedAt] = useState<number | null>(null);
  const [serverInvoiceId, setServerInvoiceId] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const clientSearchRef = useRef<HTMLInputElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestBoxRef = useRef<HTMLDivElement>(null);

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [companyName, setCompanyName] = useState<string>('TimelyInvoices');
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [companyLogoPath, setCompanyLogoPath] = useState<string | null>(null);
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [inventoryCatalog, setInventoryCatalog] = useState<CatalogListItem[]>([]);

  const submittingRef = useRef(false);
  submittingRef.current = submitting;

  useLayoutEffect(() => {
    if (!open) return;
    if (editInvoiceId) return;
    setSubmitError(null);
    setSaveOk(null);
    setErrors({});
    setClientsQuery('');
    setClients([]);
    setClientsSearched(false);
    setQuickClient({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      website: '',
      companyRegistration: '',
      vatNumber: '',
    });
    setServerInvoiceId(null);
    setShareUrl(null);

    const loaded = loadDraft(autosaveScope);
    if (loaded?.draft) {
      const d = loaded.draft;
      const hasClient = Boolean(d.clientId && String(d.clientId).trim().length);
      if (hasClient) {
        setDraft({
          ...d,
          invoiceNumber:
            d.invoiceNumber && String(d.invoiceNumber).trim().length ? d.invoiceNumber : makeInvoiceNumber(),
          items: d.items?.length ? d.items : [makeEmptyItem(15)],
        });
        setSavedAt(loaded.savedAt);
        setServerInvoiceId(loaded.serverInvoiceId ?? null);
        setResumeCandidate(null);
        setResumeCandidateSavedAt(null);
        setStep(2);
        return;
      }
      setResumeCandidate(d);
      setResumeCandidateSavedAt(loaded.savedAt);
      setStep(1);
      setDraft({
        clientId: '',
        invoiceNumber: makeInvoiceNumber(),
        issueDate: todayISO(),
        dueDate: addDaysISO(30),
        currency: d.currency || 'ZAR',
        template: d.template || 'modern',
        items: d.items?.length ? d.items : [makeEmptyItem(15)],
        notes: d.notes,
      });
      return;
    }

    setResumeCandidate(null);
    setResumeCandidateSavedAt(null);
    setStep(1);
    setDraft({
      invoiceNumber: makeInvoiceNumber(),
      clientId: '',
      issueDate: todayISO(),
      dueDate: addDaysISO(30),
      currency: 'ZAR',
      template: 'modern',
      items: [makeEmptyItem(15)],
    });
  }, [open, editInvoiceId, autosaveScope]);

  useEffect(() => {
    if (!open || !editInvoiceId) return;
    let alive = true;
    (async () => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch(`/api/invoices/${editInvoiceId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load invoice');
        if (!alive) return;
        const inv = json.data.invoice;
        const rawItems = inv.items ?? [];
        const items =
          rawItems.length > 0
            ? rawItems.map((it: any) => ({
                id: String(it.id),
                description: String(it.description ?? ''),
                quantity: Number(it.quantity ?? 1),
                unitPrice: Number(it.unit_price ?? 0),
                vatRate: Number(it.tax_rate ?? 15),
                ...(it.catalog_item_id ? { catalogItemId: String(it.catalog_item_id) } : {}),
              }))
            : [makeEmptyItem(15)];
        setDraft({
          clientId: String(inv.client_id ?? ''),
          invoiceNumber: String(inv.invoice_number ?? ''),
          issueDate: String(inv.issue_date ?? todayISO()),
          dueDate: String(inv.due_date ?? addDaysISO(30)),
          currency: String(inv.currency ?? 'ZAR'),
          template: (String(inv.template_id ?? 'modern') as InvoiceComposerDraft['template']) || 'modern',
          items,
          notes: inv.notes ? String(inv.notes) : undefined,
          ...(inv.public_share_id ? { publicShareId: String(inv.public_share_id) } : {}),
        } as InvoiceComposerDraft & { publicShareId?: string });
        setServerInvoiceId(String(inv.id));
        setShareUrl(inv.public_share_id ? buildPublicInvoiceViewUrl(String(inv.public_share_id)) : null);
        setResumeCandidate(null);
        setResumeCandidateSavedAt(null);
        setStep(2);
      } catch (e: any) {
        if (alive) setSubmitError(e?.message ?? 'Failed to load invoice');
      } finally {
        if (alive) setSubmitting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, editInvoiceId]);

  const saveInvoiceToServer = async (opts?: { redirectToInvoice?: boolean; silentAutosave?: boolean; relaxedItems?: boolean }) => {
    const silent = Boolean(opts?.silentAutosave);
    const relaxed = Boolean(opts?.relaxedItems);
    if (!silent) {
      setSubmitError(null);
      setSaveOk(null);
    }
    if (!relaxed) {
      if (!validateStep1() || !validateItems()) {
        setStep(1);
        return null;
      }
    } else {
      const parsed = DraftSchema.safeParse(draft);
      if (!parsed.success) return null;
    }

    const ownerId = await getWorkspaceOwnerIdForClient();
    const supabase = createSupabaseBrowserClient();

    const invoiceNumber = draft.invoiceNumber && String(draft.invoiceNumber).trim().length ? String(draft.invoiceNumber) : null;
    const shareIdFromDraft =
      (draft as any).publicShareId && String((draft as any).publicShareId).trim().length ? String((draft as any).publicShareId) : null;

    const workingItems = relaxed ? workingItemsForDraftSync(draft.items) : draft.items;
    const amountTotals = relaxed ? totalsForDraftSync(draft.items) : calcTotals(draft.items);

    const basePayload = {
      owner_id: ownerId,
      invoice_number: invoiceNumber ?? undefined,
      public_share_id: shareIdFromDraft ?? undefined,
      client_id: draft.clientId,
      issue_date: draft.issueDate,
      due_date: draft.dueDate,
      currency: draft.currency,
      template_id: draft.template,
      vat_rate: 15,
      subtotal_amount: amountTotals.subtotal,
      tax_amount: amountTotals.vat,
      total_amount: amountTotals.total,
      notes: draft.notes ?? null,
    };

    const insertPayload = {
      ...basePayload,
      status: 'draft' as const,
      paid_amount: 0,
      balance_amount: amountTotals.total,
    };

    const itemsPayload = relaxed ? itemsToPayload(workingItems) : itemsToPayload(draft.items);

    if (!silent) setSubmitting(true);
    try {
      let invoiceId = serverInvoiceId;
      let savedInvoiceNumber = invoiceNumber;

      if (!invoiceId) {
        if (!savedInvoiceNumber) savedInvoiceNumber = makeInvoiceNumber();
        const shareId = shareIdFromDraft ?? crypto.randomUUID();
        const { data: row, error } = await supabase
          .from('invoices')
          .insert({ ...insertPayload, invoice_number: savedInvoiceNumber, public_share_id: shareId })
          .select('id,invoice_number,public_share_id')
          .single();
        if (error) throw error;
        invoiceId = String((row as any).id);
        setServerInvoiceId(invoiceId);
        const dbInvNo = (row as any)?.invoice_number ? String((row as any).invoice_number) : savedInvoiceNumber;
        const dbShareId = (row as any)?.public_share_id ? String((row as any).public_share_id) : shareId;
        setDraft((d: any) => ({ ...d, invoiceNumber: dbInvNo ?? savedInvoiceNumber ?? null, publicShareId: dbShareId }));
        setShareUrl(buildPublicInvoiceViewUrl(String(dbShareId)));
      } else {
        if (silent) {
          const { data: stRow, error: stErr } = await supabase
            .from('invoices')
            .select('status')
            .eq('id', invoiceId)
            .eq('owner_id', ownerId)
            .maybeSingle();
          if (stErr) throw stErr;
          if (stRow && String((stRow as any).status) !== 'draft') {
            return invoiceId;
          }
        }

        // Ensure share id exists (so we can share before sending)
        let ensuredShareId = shareIdFromDraft;
        if (!ensuredShareId) {
          const { data: existing, error: existingErr } = await supabase
            .from('invoices')
            .select('public_share_id')
            .eq('id', invoiceId)
            .eq('owner_id', ownerId)
            .maybeSingle();
          if (!existingErr) ensuredShareId = (existing as any)?.public_share_id ? String((existing as any).public_share_id) : null;
        }
        if (!ensuredShareId) ensuredShareId = crypto.randomUUID();

        const { data: cur, error: curErr } = await supabase
          .from('invoices')
          .select('paid_amount,status')
          .eq('id', invoiceId)
          .eq('owner_id', ownerId)
          .single();
        if (curErr) throw curErr;
        const paid = Number((cur as any).paid_amount ?? 0);
        const balance = Math.max(0, amountTotals.total - paid);
        let st = String((cur as any).status ?? 'draft');
        const today = new Date().toISOString().slice(0, 10);
        if (!silent) {
          if (balance <= 0 && amountTotals.total >= 0 && paid >= amountTotals.total) st = 'paid';
          else if (paid > 0 && balance > 0) st = 'partial';
          else if (balance > 0 && draft.dueDate < today && st !== 'draft' && st !== 'cancelled') st = 'overdue';
          else if (st === 'overdue' && draft.dueDate >= today && balance > 0) st = 'sent';
        } else {
          st = 'draft';
        }

        const { data: updated, error } = await supabase
          .from('invoices')
          .update({
            ...basePayload,
            public_share_id: ensuredShareId,
            paid_amount: silent ? 0 : paid,
            balance_amount: silent ? amountTotals.total : balance,
            status: silent ? 'draft' : st,
          })
          .eq('id', invoiceId)
          .eq('owner_id', ownerId)
          .select('invoice_number,public_share_id')
          .maybeSingle();
        if (error) throw error;
        if (!draft.invoiceNumber && (updated as any)?.invoice_number) {
          setDraft((d) => ({ ...d, invoiceNumber: String((updated as any).invoice_number) }));
        }
        const gotShareId = (updated as any)?.public_share_id ? String((updated as any).public_share_id) : ensuredShareId;
        if (!(draft as any).publicShareId) setDraft((d: any) => ({ ...d, publicShareId: gotShareId }));
        setShareUrl(buildPublicInvoiceViewUrl(String(gotShareId)));
        const { error: delErr } = await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
        if (delErr) throw delErr;
      }

      const { error: itemsErr } = await supabase.from('invoice_items').insert(
        itemsPayload.map((it) => ({
          invoice_id: invoiceId,
          ...it,
        }))
      );
      if (itemsErr) throw itemsErr;

      if (!silent) setSaveOk('Saved.');
      if (opts?.redirectToInvoice) {
        clearDraft(autosaveScope);
        onCreated?.(invoiceId);
        onOpenChange(false);
        window.location.assign(`${routes.app.invoices}/${invoiceId}`);
      }

      return invoiceId;
    } finally {
      if (!silent) setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const p = await fetchMyCompanyProfile();
        if (!alive) return;
        if (p?.companyName) setCompanyName(p.companyName);
        setCompanyLogoPath(p?.logoUrl ?? null);
        setCompanyDetails(p ?? null);
        setShowPoweredBy(subscriptionShowsPoweredBy(p?.subscriptionPlan));
      } catch {
        // ignore (keeps composer usable if settings table isn't created yet)
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!draft.clientId) {
      setClientDetails(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const c = await fetchClientDetail(draft.clientId);
        if (!alive) return;
        setClientDetails(c);
      } catch {
        if (!alive) return;
        setClientDetails(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [draft.clientId, open]);

  useEffect(() => {
    if (!open || step !== 2) return;
    let alive = true;
    (async () => {
      try {
        const { items, tableMissing } = await fetchCatalogItems();
        if (!alive) return;
        if (tableMissing) {
          setInventoryCatalog([]);
          return;
        }
        setInventoryCatalog(items.filter((i) => i.itemType === 'inventory'));
      } catch {
        if (alive) setInventoryCatalog([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, step]);

  // Debounced local + server id persistence
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      saveDraft(autosaveScope, draft, serverInvoiceId);
      setSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(t);
  }, [autosaveScope, draft, open, serverInvoiceId]);

  const saveInvoiceRef = useRef(saveInvoiceToServer);
  saveInvoiceRef.current = saveInvoiceToServer;

  /** Persist in-progress work as a real `draft` row so it appears on the invoices list. */
  useEffect(() => {
    if (!open || editInvoiceId) return;
    if (submittingRef.current) return;
    const parsed = DraftSchema.safeParse(draft);
    if (!parsed.success) return;

    const t = setTimeout(() => {
      if (submittingRef.current) return;
      void saveInvoiceRef.current({ silentAutosave: true, relaxedItems: true }).catch(() => {});
    }, 2800);
    return () => clearTimeout(t);
  }, [draft, open, editInvoiceId]);

  const [clientsSearched, setClientsSearched] = useState(false);

  const runClientSearch = async () => {
    const q = clientsQuery.trim();
    setClientsSearched(true);
    setClientsError(null);
    setLoadingClients(true);
    try {
      if (!q) {
        setClients([]);
        return;
      }
      const list = await searchClients(q);
      setClients(list);
    } catch (e: any) {
      setClientsError(e?.message ?? 'Failed to search clients.');
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => clientSearchRef.current?.focus(), 0);
    }
  }, [open]);

  // `clients` is already server-filtered via `searchClients(clientsQuery)`
  const filteredClients = clients;

  // Intentionally no auto-highlight/auto-select: user must explicitly choose a client.
  const highlightedClientId = null;

  const totals = useMemo(() => calcTotals(draft.items), [draft.items]);
  const selectedClientName = useMemo(() => {
    if (clientDetails?.name) return clientDetails.name;
    return clients.find((c) => c.id === draft.clientId)?.name ?? '—';
  }, [clientDetails?.name, clients, draft.clientId]);

  /** Step 1: show selected client in the list without forcing a search. */
  useEffect(() => {
    if (!open || step !== 1 || editInvoiceId) return;
    const id = draft.clientId?.trim();
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const d = await fetchClientDetail(id);
        if (!alive) return;
        const row: ClientListItem = {
          id: d.id,
          name: d.name,
          email: d.email,
          companyName: d.companyName,
        };
        setClients((prev) => (prev.some((p) => p.id === row.id) ? prev : [row, ...prev]));
        setClientsSearched(true);
      } catch {
        // Client removed or inaccessible
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, step, editInvoiceId, draft.clientId]);

  const validateStep1 = () => {
    const parsed = DraftSchema.safeParse(draft);
    if (parsed.success) return true;
    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) next[issue.path.join('.')] = issue.message;
    setErrors(next);
    return false;
  };

  const validateItems = () => {
    const next: Record<string, string> = {};
    if (!draft.items.length) next.items = 'Add at least one line item';
    draft.items.forEach((it, idx) => {
      if (!it.description.trim()) next[`items.${idx}.description`] = 'Description required';
      if (!(it.quantity > 0)) next[`items.${idx}.quantity`] = 'Qty must be > 0';
      if (!(it.unitPrice >= 0)) next[`items.${idx}.unitPrice`] = 'Price must be ≥ 0';
      if (!(it.vatRate >= 0 && it.vatRate <= 100)) next[`items.${idx}.vatRate`] = 'VAT must be 0–100';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const addItem = () => setDraft((d) => ({ ...d, items: [...d.items, makeEmptyItem(15)] }));
  const removeItem = (id: string) => setDraft((d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }));
  const updateItem = (id: string, patch: Partial<InvoiceComposerItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  const activeItem = useMemo(
    () => (activeItemId ? draft.items.find((x) => x.id === activeItemId) ?? null : null),
    [activeItemId, draft.items]
  );

  useEffect(() => {
    if (step !== 2) return;
    const item = activeItem;
    if (!item) {
      setSuggestions([]);
      return;
    }
    if (!item.description.trim()) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const list = await fetchItemSuggestions({
          clientId: draft.clientId || null,
          query: item.description,
        });
        if (!alive) return;
        setSuggestions(list);
      } catch {
        if (!alive) return;
        setSuggestions([]);
      } finally {
        if (!alive) return;
        setSuggestLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [activeItem?.description, draft.clientId, step]);

  // Close suggestions when clicking outside the active input/popup
  useEffect(() => {
    if (step !== 2) return;
    if (!activeItemId) return;
    const onDown = (e: MouseEvent) => {
      const el = suggestBoxRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setActiveItemId(null);
    };
    window.addEventListener('mousedown', onDown, { capture: true });
    return () => window.removeEventListener('mousedown', onDown, { capture: true } as any);
  }, [activeItemId, step]);

  const createQuickClient = async () => {
    if (!quickClient.name.trim()) {
      setErrors((e) => ({ ...e, quickClientName: 'Client name required' }));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createClient({
        name: quickClient.name.trim(),
        email: quickClient.email.trim() || undefined,
        phone: quickClient.phone.trim() || undefined,
        companyName: quickClient.companyName.trim() || undefined,
        website: quickClient.website.trim() || undefined,
        companyRegistration: quickClient.companyRegistration.trim() || undefined,
        vatNumber: quickClient.vatNumber.trim() || undefined,
      });
      const list = await fetchClientsList();
      setClients(list);
      setDraft((d) => ({ ...d, clientId: created.id }));
      setQuickClient({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        website: '',
        companyRegistration: '',
        vatNumber: '',
      });
      setErrors((e) => {
        const { quickClientName, ...rest } = e;
        return rest;
      });
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to create client.');
    } finally {
      setSubmitting(false);
    }
  };

  const createInvoiceDraft = async () => {
    try {
      // Save draft to Supabase and go to invoice page
      await saveInvoiceToServer({ redirectToInvoice: true });
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to create invoice.');
    }
  };

  const runAiGenerate = async () => {
    const input = aiInput.trim();
    if (!input) return;
    setAiLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/ai/invoice-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'AI failed');
      const d = json.data;
      // Merge into draft (keep dates if already edited)
      setDraft((prev) => ({
        ...prev,
        currency: String(d.currency ?? prev.currency ?? 'ZAR'),
        issueDate: String(d.issueDate ?? prev.issueDate),
        dueDate: String(d.dueDate ?? prev.dueDate),
        items: Array.isArray(d.items)
          ? d.items.map((it: any) => ({
              id: crypto.randomUUID(),
              description: String(it.description ?? ''),
              quantity: Number(it.quantity ?? 1),
              unitPrice: Number(it.unitPrice ?? 0),
              vatRate: Number(it.vatRate ?? 15),
            }))
          : prev.items,
      }));
      // If client was suggested, prefill quick add area and move user to step 1 to confirm
      if (d?.client?.name) {
        setQuickClient({
          name: String(d.client.name ?? ''),
          email: d.client.email ? String(d.client.email) : '',
          phone: d.client.phone ? String(d.client.phone) : '',
          companyName: '',
          website: '',
          companyRegistration: '',
          vatNumber: '',
        });
      }
      setStep(1);
    } catch (e: any) {
      setSubmitError(e?.message ?? 'AI failed');
    } finally {
      setAiLoading(false);
    }
  };

  const sendInvoice = async ({
    invoiceId,
    toEmail,
    toWhatsapp,
  }: {
    invoiceId: string;
    toEmail?: string;
    toWhatsapp?: string;
  }) => {
    const res = await fetch('/api/invoices/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, toEmail, toWhatsapp }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Send failed');
    return json.data as { shareId: string; shareUrl: string };
  };

  const body = (
    <div className="space-y-4">
      <div className="flex items-center justify-between ti-no-print">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Fast flow</Badge>
          <div className="text-xs text-muted-foreground">Create + send in under 10 seconds</div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <span className={cn('inline-flex items-center gap-1', step >= 1 && 'text-foreground')}>
            <span className={cn('h-5 w-5 rounded-full grid place-items-center', step > 1 ? 'bg-success text-white' : 'bg-muted/50')}>
              {step > 1 ? <Check className="h-3 w-3" /> : 1}
            </span>
            Client
          </span>
          <span>→</span>
          <span className={cn('inline-flex items-center gap-1', step >= 2 && 'text-foreground')}>
            <span className={cn('h-5 w-5 rounded-full grid place-items-center', step > 2 ? 'bg-success text-white' : 'bg-muted/50')}>
              {step > 2 ? <Check className="h-3 w-3" /> : 2}
            </span>
            Items
          </span>
          <span>→</span>
          <span className={cn('inline-flex items-center gap-1', step >= 3 && 'text-foreground')}>
            <span className={cn('h-5 w-5 rounded-full grid place-items-center', step > 3 ? 'bg-success text-white' : 'bg-muted/50')}>
              {step > 3 ? <Check className="h-3 w-3" /> : 3}
            </span>
            Review
          </span>
          <span>→</span>
          <span className={cn('inline-flex items-center gap-1', step >= 4 && 'text-foreground')}>
            <span className={cn('h-5 w-5 rounded-full grid place-items-center', step > 4 ? 'bg-success text-white' : 'bg-muted/50')}>
              4
            </span>
            Send
          </span>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger ti-no-print">{submitError}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          {/* AI quick generator (kept minimal and optional) */}
          <div className="mb-5 rounded-2xl bg-blue-600/10 p-4 ti-no-print">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Smart invoice generator</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Describe the work and we’ll draft the invoice (items + VAT).
                </div>
              </div>
              <div className="shrink-0">
                <Button type="button" variant="secondary" onClick={runAiGenerate} disabled={aiLoading || !aiInput.trim()}>
                  <Wand2 className="h-4 w-4" />
                  {aiLoading ? 'Generating…' : 'Generate'}
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="e.g. Website design for Acme: 8 hours at R950/hr + hosting retainer…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void runAiGenerate();
                  }
                }}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Requires `ANTHROPIC_API_KEY` configured on the server.
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Client</div>
                  <div className="mt-1 text-sm text-muted-foreground">Search or quickly add.</div>
                </div>
                <Link href={`${routes.app.clients}/new`} className="text-sm font-semibold text-primary hover:underline">
                  Full client form
                </Link>
              </div>

              {resumeCandidate ? (
                <div className="rounded-2xl border border-border bg-card p-4 ti-no-print">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Resume unfinished invoice?</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Draft saved {resumeCandidateSavedAt ? new Date(resumeCandidateSavedAt).toLocaleString() : 'recently'}.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          clearDraft(autosaveScope);
                          setResumeCandidate(null);
                          setResumeCandidateSavedAt(null);
                          setSavedAt(null);
                        }}
                      >
                        Discard
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const invNo =
                            (resumeCandidate as any)?.invoiceNumber && String((resumeCandidate as any).invoiceNumber).trim().length
                              ? (resumeCandidate as any).invoiceNumber
                              : makeInvoiceNumber();
                          setDraft({ ...(resumeCandidate as any), invoiceNumber: invNo });
                          setSavedAt(resumeCandidateSavedAt ?? Date.now());
                          setResumeCandidate(null);
                          setResumeCandidateSavedAt(null);
                        }}
                      >
                        Resume
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">Search clients</label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      ref={clientSearchRef}
                      value={clientsQuery}
                      onChange={(e) => {
                        const v = e.target.value;
                        setClientsQuery(v);
                        setClientsSearched(false);
                        setClients([]);
                        setClientsError(null);
                      }}
                      placeholder="Type a name or email…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void runClientSearch();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 shrink-0 px-4"
                    disabled={loadingClients}
                    onClick={() => void runClientSearch()}
                  >
                    {loadingClients ? 'Searching…' : 'Search'}
                  </Button>
                </div>
              </div>

              {clientsError ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{clientsError}</div> : null}
              {saveOk ? (
                <div className="rounded-2xl bg-success/10 p-3 text-sm text-success">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>{saveOk}</div>
                    {shareUrl ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            setSaveOk('Saved. Share link copied.');
                          } catch {
                            setSaveOk(`Saved. Share link: ${shareUrl}`);
                          }
                        }}
                      >
                        Copy share link
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="max-h-48 overflow-auto rounded-2xl bg-muted/20 p-2">
                {loadingClients ? (
                  <div className="p-3 text-sm text-muted-foreground">Searching…</div>
                ) : !clientsSearched ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Search to load clients. Nothing is shown until you search.
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No matches.</div>
                ) : (
                  filteredClients.slice(0, 10).map((c) => {
                    const selected = draft.clientId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, clientId: c.id }))}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/70 dark:hover:bg-white/10',
                          selected && 'bg-white/80 shadow-[var(--shadow-sm)] dark:bg-white/10'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background'
                          )}
                          aria-hidden
                        >
                          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">{c.name}</div>
                          {c.companyName ? (
                            <div className="text-xs text-muted-foreground">{c.companyName}</div>
                          ) : null}
                          <div className="text-xs text-muted-foreground">{c.email ?? '—'}</div>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              {errors.clientId ? <div className="text-xs text-danger">{errors.clientId}</div> : null}
              {draft.clientId && clientsSearched ? (
                <div className="text-xs text-muted-foreground">
                  The checked client is selected. Search again only if you want to bill someone else.
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue date</label>
                  <Input type="date" value={draft.issueDate} onChange={(e) => setDraft((d) => ({ ...d, issueDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due date</label>
                  <Input type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Input value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <select
                    className="h-11 w-full rounded-xl bg-white/70 px-3 text-sm shadow-[var(--shadow-sm)] dark:bg-white/5"
                    value={draft.template}
                    onChange={(e) => setDraft((d) => ({ ...d, template: e.target.value as any }))}
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                    <option value="bold">Bold</option>
                    <option value="elegant">Elegant</option>
                    <option value="corporate">Corporate (Blue)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice number</label>
                <Input
                  value={draft.invoiceNumber ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, invoiceNumber: e.target.value }))}
                  placeholder="e.g. INV-2026-00042"
                />
                <div className="text-xs text-muted-foreground">This will appear on the PDF and share link.</div>
              </div>

              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="text-sm font-semibold">Quick add client</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Input
                    value={quickClient.name}
                    onChange={(e) => setQuickClient((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Name (required)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void createQuickClient();
                      }
                    }}
                  />
                  <Input
                    value={quickClient.email}
                    onChange={(e) => setQuickClient((c) => ({ ...c, email: e.target.value }))}
                    placeholder="Email (optional)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void createQuickClient();
                      }
                    }}
                  />
                  <Input
                    value={quickClient.phone}
                    onChange={(e) => setQuickClient((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Phone (optional)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void createQuickClient();
                      }
                    }}
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    value={quickClient.companyName}
                    onChange={(e) => setQuickClient((c) => ({ ...c, companyName: e.target.value }))}
                    placeholder="Company name (optional)"
                  />
                  <Input
                    value={quickClient.website}
                    onChange={(e) => setQuickClient((c) => ({ ...c, website: e.target.value }))}
                    placeholder="Website (optional)"
                    type="url"
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    value={quickClient.companyRegistration}
                    onChange={(e) => setQuickClient((c) => ({ ...c, companyRegistration: e.target.value }))}
                    placeholder="Reg / CK (optional)"
                  />
                  <Input
                    value={quickClient.vatNumber}
                    onChange={(e) => setQuickClient((c) => ({ ...c, vatNumber: e.target.value }))}
                    placeholder="VAT no. (optional)"
                  />
                </div>
                {errors.quickClientName ? <div className="mt-2 text-xs text-danger">{errors.quickClientName}</div> : null}
                <div className="mt-3">
                  <Button type="button" variant="secondary" onClick={createQuickClient} disabled={submitting}>
                    <FilePlus2 className="h-4 w-4" />
                    Add client
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSubmitError(null);
                    if (!validateStep1()) return;
                    setStep(2);
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Line items</div>
                  <div className="mt-1 text-sm text-muted-foreground">VAT defaults to 15% (South Africa).</div>
                </div>
                <Button type="button" variant="secondary" onClick={addItem}>
                  + Add item
                </Button>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground">Bill to</div>
                  <div className="truncate text-sm font-semibold">{clientDetails?.name ?? selectedClientName}</div>
                  {clientDetails?.email ? (
                    <div className="truncate text-xs text-muted-foreground">{clientDetails.email}</div>
                  ) : null}
                </div>
                <Button type="button" variant="secondary" className="shrink-0" onClick={() => setStep(1)}>
                  Change client
                </Button>
              </div>

              {errors.items ? <div className="text-xs text-danger">{errors.items}</div> : null}

              <div className="space-y-3">
                <div className="hidden md:grid md:grid-cols-[1fr_120px_160px_120px] md:items-end md:gap-3 px-1">
                  <div className="text-xs font-semibold text-muted-foreground">Description</div>
                  <div className="text-xs font-semibold text-muted-foreground">Qty</div>
                  <div className="text-xs font-semibold text-muted-foreground">Unit ({draft.currency})</div>
                  <div className="text-xs font-semibold text-muted-foreground">VAT %</div>
                </div>
                {draft.items.map((it) => (
                  <div key={it.id} className="rounded-2xl bg-muted/20 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_120px_160px_120px] md:items-start">
                      <div className="space-y-2">
                        <label className="text-sm font-medium md:sr-only">Description</label>
                        {inventoryCatalog.length > 0 ? (
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor={`inv-cat-${it.id}`}>
                              Inventory catalog
                            </label>
                            <select
                              id={`inv-cat-${it.id}`}
                              className={cn(
                                'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-[var(--shadow-sm)]',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring/40'
                              )}
                              value={it.catalogItemId ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (!v) {
                                  updateItem(it.id, { catalogItemId: undefined });
                                  return;
                                }
                                const cat = inventoryCatalog.find((x) => x.id === v);
                                if (!cat) return;
                                updateItem(it.id, {
                                  catalogItemId: v,
                                  description: cat.name,
                                  unitPrice: cat.unitPrice,
                                  vatRate: cat.defaultTaxRate ?? 15,
                                });
                              }}
                            >
                              <option value="">— Manual line (no stock link) —</option>
                              {inventoryCatalog.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                  {c.sku ? ` (${c.sku})` : ''}
                                  {c.stockQuantity != null ? ` · ${c.stockQuantity} on hand` : ''}
                                </option>
                              ))}
                            </select>
                            {it.catalogItemId ? (
                              <p className="text-xs text-muted-foreground">
                                On hand decreases by quantity when the invoice is sent.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="relative" ref={activeItemId === it.id ? suggestBoxRef : undefined}>
                          <Input
                            value={it.description}
                            onFocus={() => setActiveItemId(it.id)}
                            onChange={(e) => {
                              setActiveItemId(it.id);
                              updateItem(it.id, { description: e.target.value });
                            }}
                            placeholder="e.g. Consulting services"
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setActiveItemId(null);
                              }
                            }}
                          />
                          {activeItemId === it.id && (suggestLoading || suggestions.length > 0) ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20">
                              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)]">
                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                                  {suggestLoading ? 'Suggestions…' : 'Suggestions'}
                                </div>
                                {suggestions.length ? (
                                  <div className="max-h-52 overflow-auto px-1 pb-1">
                                    {suggestions.map((s, idx) => (
                                      <button
                                        key={`${s.description}-${idx}`}
                                        type="button"
                                        className="w-full rounded-lg px-2 py-2 text-left text-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                        onClick={() => {
                                          updateItem(it.id, {
                                            description: s.description,
                                            unitPrice: s.unitPrice,
                                            vatRate: s.vatRate,
                                          });
                                          setActiveItemId(null);
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="truncate font-semibold text-foreground">{s.description}</div>
                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                              {s.source.replace('_', ' ')} · VAT {s.vatRate}%
                                            </div>
                                          </div>
                                          <div className="shrink-0 font-semibold tabular-nums text-foreground">
                                            {formatMoney(s.unitPrice, draft.currency)}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        {errors[`items.${draft.items.findIndex((x) => x.id === it.id)}.description`] ? (
                          <div className="text-xs text-danger">
                            {errors[`items.${draft.items.findIndex((x) => x.id === it.id)}.description`]}
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium md:sr-only">Qty</label>
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          className="tabular-nums md:text-right"
                          onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium md:sr-only">Unit ({draft.currency})</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={it.unitPrice}
                            className="tabular-nums md:text-right"
                            onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                            onBlur={() => rememberPrice(it.description, it.unitPrice, it.vatRate)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="hidden md:inline-flex"
                            onClick={async () => {
                              try {
                                const desc = it.description.trim();
                                if (!desc) return;
                                const r = await aiSuggestPricing({ description: desc, clientId: draft.clientId || null });
                                updateItem(it.id, {
                                  unitPrice: Number(r.unitPrice ?? it.unitPrice),
                                  vatRate: Number(r.vatRate ?? it.vatRate),
                                });
                              } catch {
                                // ignore (AI not configured)
                              }
                            }}
                          >
                            Suggest
                          </Button>
                        </div>
                        <button
                          type="button"
                          className="md:hidden text-xs font-semibold text-primary hover:underline"
                          onClick={async () => {
                            try {
                              const desc = it.description.trim();
                              if (!desc) return;
                              const r = await aiSuggestPricing({ description: desc, clientId: draft.clientId || null });
                              updateItem(it.id, {
                                unitPrice: Number(r.unitPrice ?? it.unitPrice),
                                vatRate: Number(r.vatRate ?? it.vatRate),
                              });
                            } catch {
                              // ignore (AI not configured)
                            }
                          }}
                        >
                          Suggest price (AI)
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium md:sr-only">VAT %</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={it.vatRate}
                          className="tabular-nums md:text-right"
                          onChange={(e) => updateItem(it.id, { vatRate: Number(e.target.value) })}
                          onBlur={() => rememberPrice(it.description, it.unitPrice, it.vatRate)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        Line total:{' '}
                        <span className="font-semibold text-foreground">
                          {formatMoney(it.quantity * it.unitPrice + it.quantity * it.unitPrice * (it.vatRate / 100), draft.currency)}
                        </span>
                      </div>
                      {draft.items.length > 1 ? (
                        <button type="button" className="text-sm font-semibold text-danger hover:underline" onClick={() => removeItem(it.id)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSubmitError(null);
                    if (!validateItems()) return;
                    setStep(3);
                  }}
                >
                  Review
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="flex items-end justify-between ti-no-print">
                <div>
                  <div className="text-lg font-semibold">Review</div>
                  <div className="mt-1 text-sm text-muted-foreground">Totals are calculated automatically (VAT included).</div>
                </div>
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Edit
                </Button>
              </div>

              <div className="rounded-2xl bg-muted/20 p-4 text-sm ti-no-print">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatMoney(totals.subtotal, draft.currency)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="font-semibold">{formatMoney(totals.vat, draft.currency)}</span>
                </div>
                <div className="mt-3 h-px bg-black/5 dark:bg-white/10" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold">{formatMoney(totals.total, draft.currency)}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center justify-between ti-no-print">
                  <div className="text-sm font-semibold">PDF preview</div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    Print / Save PDF
                  </Button>
                </div>
                <div className="mt-4 ti-print-area">
                  <InvoicePreview
                    draft={draft}
                    client={{
                      name: clientDetails?.name ?? selectedClientName,
                      email: clientDetails?.email ?? null,
                      phone: clientDetails?.phone ?? null,
                      address: clientDetails?.address ?? null,
                      companyName: clientDetails?.companyName ?? null,
                      website: clientDetails?.website ?? null,
                      companyRegistration: clientDetails?.companyRegistration ?? null,
                      vatNumber: clientDetails?.vatNumber ?? null,
                    }}
                    companyName={companyName}
                    companyLogoPath={companyLogoPath}
                    companyDetails={companyDetails}
                    showPoweredBy={showPoweredBy}
                    invoiceViewUrl={shareUrl}
                  />
                </div>
                <div className="mt-3 text-xs text-muted-foreground ti-no-print">
                  South Africa VAT: item-level VAT rates supported (default 15%).
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 ti-no-print">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={submitting}
                    onClick={async () => {
                      try {
                        await saveInvoiceToServer();
                      } catch (e: any) {
                        setSubmitError(e?.message ?? 'Save failed');
                      }
                    }}
                  >
                    {submitting ? 'Saving…' : 'Save'}
                  </Button>
                  <Button type="button" onClick={() => setStep(4)}>
                    Continue to send
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-semibold">Send</div>
                  <div className="mt-1 text-sm text-muted-foreground">Email, WhatsApp, or shareable link.</div>
                </div>
                <Badge variant="outline">v1</Badge>
              </div>

              <SendStep
                currency={draft.currency}
                total={totals.total}
                submitting={submitting}
                onCreateAndSend={async ({ email, whatsapp }) => {
                  setSubmitting(true);
                  setSubmitError(null);
                  try {
                    // Save invoice first (draft), then send
                    const invoiceId = await saveInvoiceToServer();
                    if (!invoiceId) throw new Error('Missing invoice id');

                    const sent = await sendInvoice({
                      invoiceId,
                      toEmail: email || undefined,
                      toWhatsapp: whatsapp || undefined,
                    });

                    onCreated?.(invoiceId);
                    setSubmitting(false);
                    onOpenChange(false);
                    window.location.assign(sent.shareUrl);
                  } catch (e: any) {
                    setSubmitError(e?.message ?? 'Send failed');
                    setSubmitting(false);
                  }
                }}
              />

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="button" variant="secondary" onClick={createInvoiceDraft} disabled={submitting}>
                  {submitting ? 'Working…' : 'Skip sending'}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="p-5 h-fit lg:sticky lg:top-4 ti-no-print">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Totals</div>
            <Badge variant="outline">SA VAT</Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {savedAt ? `Auto-saved just now` : `Auto-save on`}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold tabular-nums whitespace-nowrap">{formatMoney(totals.subtotal, draft.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span className="font-semibold tabular-nums whitespace-nowrap">{formatMoney(totals.vat, draft.currency)}</span>
            </div>
            <div className="h-px bg-black/5 dark:bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="text-base font-semibold tabular-nums whitespace-nowrap">{formatMoney(totals.total, draft.currency)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-blue-600/10 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-blue-600/15 p-2 text-blue-700 dark:text-blue-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Smart invoice (AI)</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Coming next: describe your work and we’ll generate the invoice.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Prefer full page?{' '}
            <Link href={`${routes.app.invoices}/new`} className="font-semibold text-primary hover:underline">
              Open editor
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );

  if (mode === 'page') return body;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-5xl p-6">
        <ModalHeader className="mb-4">
          <ModalTitle className="text-xl font-semibold tracking-tight">New invoice</ModalTitle>
          <ModalDescription className="text-sm text-muted-foreground">
            Fast path for creating and sending a professional invoice.
          </ModalDescription>
        </ModalHeader>
        {body}
      </ModalContent>
    </Modal>
  );
}

