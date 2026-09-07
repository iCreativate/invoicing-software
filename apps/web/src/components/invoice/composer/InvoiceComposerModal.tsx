'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Amount } from '@/components/ui/Text';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { fetchClientsList, createClient, searchClients } from '@/features/clients/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { demoQuoteDetail, demoSaveInvoice, demoSendInvoice } from '@/lib/demo/fixtures';
import { cn } from '@/lib/utils/cn';
import type { ClientListItem } from '@/features/clients/types';
import type { InvoiceComposerDraft, InvoiceComposerItem, InvoiceComposerTemplate } from './types';
import { addDaysISO, calcTotals, makeEmptyItem, todayISO } from './utils';
import { itemsToPayload, totalsForDraftSync, workingItemsForDraftSync } from './draftItems';
import { Check, ChevronRight, Download, FilePlus2, Printer, Search, Sparkles, Trash2, UserPlus, Users, Wifi, WifiOff } from 'lucide-react';
import { aiSuggestPricing, fetchItemSuggestions, rememberPrice, type ItemSuggestion } from '@/features/invoices/suggestions';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { SendStep } from './SendStep';
import { clearDraft, loadDraft, saveDraft } from './autosave';
import { discardPersistedDraft, loadPersistedDraft } from './composerPersistence';
import { consumeAskInvoicePrefill } from '@/lib/invoices/askPrefill';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import {
  mapCompanyProfileToPreviewDetails,
  type InvoicePreviewCompanyDetails,
} from '@/features/company/previewDetails';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { fetchClientDetail } from '@/features/clients/api';
import { fetchCatalogItems } from '@/features/catalog/api';
import type { CatalogListItem } from '@/features/catalog/types';
import { notifyError, notifySuccess } from '@/lib/notify';
import { openDocumentPrintPage } from '@/lib/documents/print';
import { buildPublicInvoiceViewUrl } from '@/lib/invoice/platformUrls';
import { createQuote, updateQuote, ensureQuoteShareLink, makeQuoteNumber } from '@/features/quotes/api';
import { draftDocumentFromDescription } from '@/lib/ai/draftDocument';
import { ComposerDocumentOptions } from './ComposerDocumentOptions';

const DraftSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.string().min(1),
});

type Step = 1 | 2 | 3 | 4;
type ComposerKind = 'invoice' | 'quote';

function InvoiceTotalsBlock({
  currency,
  totals,
  totalLabel = 'Total due',
  elevated = false,
}: {
  currency: string;
  totals: { subtotal: number; vat: number; total: number };
  totalLabel?: string;
  elevated?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--tl-ink-3)]">Subtotal</span>
        <span className="ti-amount ti-amount-live">{formatMoney(totals.subtotal, currency)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-sm">
        <span className="text-[var(--tl-ink-3)]">Tax</span>
        <span className="ti-amount ti-amount-live">{formatMoney(totals.vat, currency)}</span>
      </div>
      <div className={cn(elevated ? 'ti-composer-total-label' : 'mt-5 border-t border-border pt-4')}>
        <p className="ti-meta">{totalLabel}</p>
        <Amount display className={cn('ti-amount-live mt-2 block', elevated && 'ti-composer-total-value')}>
          {formatMoney(totals.total, currency)}
        </Amount>
      </div>
    </div>
  );
}

export function InvoiceComposerModal({
  open,
  onOpenChange,
  onCreated,
  mode = 'modal',
  editInvoiceId = null,
  initialClientId = null,
  kind = 'invoice',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (invoiceId: string) => void;
  mode?: 'modal' | 'page';
  /** When set (e.g. edit page), load this invoice from the API instead of a blank draft. */
  editInvoiceId?: string | null;
  /** Prefill the client when opening from a client profile. */
  initialClientId?: string | null;
  /** Invoice vs quote composer. Quotes ignore editInvoiceId for now. */
  kind?: ComposerKind;
}) {
  const isQuote = kind === 'quote';
  const isPage = mode === 'page';
  const autosaveScope = isQuote ? (isPage ? 'quote-page' : 'quote-modal') : isPage ? 'page' : 'modal';
  const defaultValidDays = isQuote ? 14 : 30;
  const makeDocumentNumber = () => {
    if (isQuote) return makeQuoteNumber();
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const n = Math.floor(10000 + Math.random() * 90000);
    return `INV-${yyyy}-${n}`;
  };
  const [step, setStep] = useState<Step>(1);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [clientsQuery, setClientsQuery] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientPickerMode, setClientPickerMode] = useState<'search' | 'add'>('search');
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
    dueDate: addDaysISO(defaultValidDays),
    currency: 'ZAR',
    template: 'modern',
    items: [makeEmptyItem(15)],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [resumeCandidate, setResumeCandidate] = useState<InvoiceComposerDraft | null>(null);
  const [resumeCandidateSavedAt, setResumeCandidateSavedAt] = useState<number | null>(null);
  const [serverInvoiceId, setServerInvoiceId] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const clientSearchRef = useRef<HTMLInputElement>(null);
  const sendSectionRef = useRef<HTMLDivElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestBoxRef = useRef<HTMLDivElement>(null);

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOk, setAiOk] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiSource, setAiSource] = useState<'local' | 'cloud' | 'merged' | null>(null);
  const [showSmart, setShowSmart] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sentShareUrl, setSentShareUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('TimelyInvoices');
  const [companyDetails, setCompanyDetails] = useState<InvoicePreviewCompanyDetails | null>(null);
  const [companyLogoPath, setCompanyLogoPath] = useState<string | null>(null);
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [inventoryCatalog, setInventoryCatalog] = useState<CatalogListItem[]>([]);
  const [draftCatalog, setDraftCatalog] = useState<CatalogListItem[]>([]);

  const submittingRef = useRef(false);
  submittingRef.current = submitting;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const serverAutosaveRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skipPersistResumeRef = useRef(false);

  const applyDraftBundle = (loaded: { draft: InvoiceComposerDraft; savedAt: number; serverInvoiceId?: string | null }) => {
    const d = loaded.draft;
    const hasClient = Boolean(d.clientId && String(d.clientId).trim().length);
    if (hasClient) {
      setDraft({
        ...d,
        invoiceNumber:
          d.invoiceNumber && String(d.invoiceNumber).trim().length ? d.invoiceNumber : makeDocumentNumber(),
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
      invoiceNumber: makeDocumentNumber(),
      issueDate: todayISO(),
      dueDate: addDaysISO(defaultValidDays),
      currency: d.currency || 'ZAR',
      template: d.template || 'modern',
      items: d.items?.length ? d.items : [makeEmptyItem(15)],
      notes: d.notes,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    if (!isQuote && editInvoiceId) return;
    setSubmitError(null);
    setSaveOk(null);
    setAiOk(null);
    setErrors({});
    setClientsQuery('');
    setClients([]);
    setClientsSearched(false);
    setClientPickerMode('search');
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
    skipPersistResumeRef.current = false;

    const ask = !isQuote ? consumeAskInvoicePrefill() : null;
    if (ask) {
      skipPersistResumeRef.current = true;
      const items: InvoiceComposerItem[] = ask.items.length
        ? ask.items.map((it) => ({
            id: crypto.randomUUID(),
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            vatRate: it.vatRate,
          }))
        : [makeEmptyItem(15)];
      const clientId = String(ask.client.id ?? initialClientId ?? '').trim();
      setResumeCandidate(null);
      setResumeCandidateSavedAt(null);
      setDraft({
        invoiceNumber: makeDocumentNumber(),
        clientId,
        issueDate: ask.issueDate || todayISO(),
        dueDate: ask.dueDate || addDaysISO(defaultValidDays),
        currency: ask.currency || 'ZAR',
        template: 'modern',
        items,
        notes: ask.notes || undefined,
      });
      if (!clientId && ask.client.name) {
        setQuickClient({
          name: ask.client.name,
          email: ask.client.email || '',
          phone: ask.client.phone || '',
          companyName: '',
          website: '',
          companyRegistration: '',
          vatNumber: '',
        });
        setStep(1);
      } else {
        setStep(clientId ? 2 : 1);
      }
      setAiOk('Ask Timely pre-filled this invoice. Review and continue.');
      return;
    }

    const loaded = loadDraft(autosaveScope);
    if (loaded?.draft) {
      const savedClient = String(loaded.draft.clientId ?? '').trim();
      const requested = String(initialClientId ?? '').trim();
      if (!requested || !savedClient || savedClient === requested) {
        applyDraftBundle(loaded);
        if (requested && !savedClient) {
          setDraft((d) => ({ ...d, clientId: requested }));
          setStep(2);
        }
        return;
      }
    }

    setResumeCandidate(null);
    setResumeCandidateSavedAt(null);
    setStep(initialClientId ? 2 : 1);
    setDraft({
      invoiceNumber: makeDocumentNumber(),
      clientId: initialClientId ?? '',
      issueDate: todayISO(),
      dueDate: addDaysISO(defaultValidDays),
      currency: 'ZAR',
      template: 'modern',
      items: [makeEmptyItem(15)],
    });
  }, [open, editInvoiceId, autosaveScope, initialClientId, isQuote, defaultValidDays]);

  useEffect(() => {
    if (!open || isQuote || editInvoiceId) return;
    if (skipPersistResumeRef.current) return;
    let alive = true;
    (async () => {
      try {
        const resolved = await loadPersistedDraft(autosaveScope);
        if (!alive || !resolved?.draft) return;
        const requested = String(initialClientId ?? '').trim();
        const resolvedClient = String(resolved.draft.clientId ?? '').trim();
        if (requested && resolvedClient && resolvedClient !== requested) return;
        const local = loadDraft(autosaveScope);
        const shouldApply =
          !local ||
          (resolved.serverInvoiceId && !local.serverInvoiceId) ||
          resolved.savedAt > (local.savedAt ?? 0) + 1000;
        if (shouldApply) applyDraftBundle(resolved);
      } catch {
        // keep local draft from layout effect
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, editInvoiceId, autosaveScope, initialClientId, isQuote]);

  useEffect(() => {
    if (!open || isQuote || !editInvoiceId) return;
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
  }, [open, editInvoiceId, isQuote]);

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

    const invoiceNumber = draft.invoiceNumber && String(draft.invoiceNumber).trim().length ? String(draft.invoiceNumber) : null;
    const shareIdFromDraft =
      (draft as any).publicShareId && String((draft as any).publicShareId).trim().length ? String((draft as any).publicShareId) : null;

    const workingItems = relaxed ? workingItemsForDraftSync(draft.items) : draft.items;
    const amountTotals = relaxed ? totalsForDraftSync(draft.items) : calcTotals(draft.items);

    if (isDemoUiActive()) {
      if (!silent) setSubmitting(true);
      try {
        const sourceItems = relaxed ? workingItems : draft.items;
        const saved = demoSaveInvoice({
          invoiceId: serverInvoiceId,
          clientId: draft.clientId,
          issueDate: draft.issueDate,
          dueDate: draft.dueDate,
          currency: draft.currency,
          templateId: draft.template,
          invoiceNumber,
          notes: draft.notes ?? null,
          publicShareId: shareIdFromDraft,
          items: sourceItems.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            vatRate: it.vatRate,
          })),
        });
        setServerInvoiceId(saved.id);
        setDraft((d: any) => ({
          ...d,
          invoiceNumber: saved.invoiceNumber,
          publicShareId: saved.publicShareId,
        }));
        setShareUrl(buildPublicInvoiceViewUrl(saved.publicShareId));
        saveDraft(autosaveScope, draftRef.current, saved.id);
        setCloudSyncStatus('saved');
        if (!silent) {
          setSaveOk('Saved.');
          notifySuccess('Invoice saved.');
        }
        if (opts?.redirectToInvoice) {
          clearDraft(autosaveScope);
          onCreated?.(saved.id);
          onOpenChange(false);
          window.location.assign(`${routes.app.invoices}/${saved.id}`);
        }
        return saved.id;
      } finally {
        if (!silent) setSubmitting(false);
      }
    }

    const ownerId = await getWorkspaceOwnerIdForClient();
    const supabase = createSupabaseBrowserClient();

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
        if (!savedInvoiceNumber) savedInvoiceNumber = makeDocumentNumber();
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

      saveDraft(autosaveScope, draftRef.current, invoiceId);
      setCloudSyncStatus('saved');

      if (!silent) {
        setSaveOk('Saved.');
        notifySuccess('Invoice saved.');
      }
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

  const saveQuoteToServer = async (opts?: { redirectToInvoice?: boolean; silentAutosave?: boolean; relaxedItems?: boolean }) => {
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

    const quoteNumber =
      draft.invoiceNumber && String(draft.invoiceNumber).trim().length ? String(draft.invoiceNumber).trim() : null;
    const sourceItems = relaxed ? workingItemsForDraftSync(draft.items) : draft.items;
    const items = sourceItems.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      vatRate: it.vatRate,
    }));

    if (!silent) setSubmitting(true);
    try {
      let quoteId = serverInvoiceId;

      if (!quoteId) {
        const created = await createQuote({
          clientId: draft.clientId,
          issueDate: draft.issueDate,
          validUntil: draft.dueDate,
          currency: draft.currency,
          vatRate: 15,
          notes: draft.notes,
          quoteNumber: quoteNumber ?? makeDocumentNumber(),
          items,
        });
        quoteId = created.id;
        setServerInvoiceId(quoteId);
        setDraft((d) => ({ ...d, invoiceNumber: created.quoteNumber || quoteNumber || d.invoiceNumber }));
      } else {
        if (silent) {
          if (isDemoUiActive()) {
            const q = demoQuoteDetail(quoteId);
            if (q && q.status !== 'draft') return quoteId;
          } else {
            const supabase = createSupabaseBrowserClient();
            const ownerId = await getWorkspaceOwnerIdForClient();
            const { data: stRow, error: stErr } = await supabase
              .from('quotes')
              .select('status')
              .eq('id', quoteId)
              .eq('owner_id', ownerId)
              .maybeSingle();
            if (stErr) throw stErr;
            if (stRow && String((stRow as any).status) !== 'draft') {
              return quoteId;
            }
          }
        }

        await updateQuote(quoteId, {
          clientId: draft.clientId,
          issueDate: draft.issueDate,
          validUntil: draft.dueDate,
          currency: draft.currency,
          vatRate: 15,
          notes: draft.notes ?? null,
          quoteNumber,
          items,
        });
      }

      saveDraft(autosaveScope, draftRef.current, quoteId);
      setCloudSyncStatus('saved');

      if (!silent) {
        setSaveOk('Saved.');
        notifySuccess('Quote saved.');
      }
      if (opts?.redirectToInvoice) {
        clearDraft(autosaveScope);
        onCreated?.(quoteId);
        onOpenChange(false);
        window.location.assign(`${routes.app.quotes}/${quoteId}`);
      }

      return quoteId;
    } finally {
      if (!silent) setSubmitting(false);
    }
  };

  const saveDocumentToServer = async (opts?: {
    redirectToInvoice?: boolean;
    silentAutosave?: boolean;
    relaxedItems?: boolean;
  }) => (isQuote ? saveQuoteToServer(opts) : saveInvoiceToServer(opts));

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const p = await fetchMyCompanyProfile();
        if (!alive) return;
        if (p?.companyName) setCompanyName(p.companyName);
        setCompanyLogoPath(p?.logoUrl ?? null);
        setCompanyDetails(mapCompanyProfileToPreviewDetails(p));
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
    if (!open) return;
    const sync = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const { items, tableMissing } = await fetchCatalogItems();
        if (!alive) return;
        setDraftCatalog(tableMissing ? [] : items);
      } catch {
        if (alive) setDraftCatalog([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

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

  const saveDocumentRef = useRef(saveDocumentToServer);
  saveDocumentRef.current = saveDocumentToServer;

  /** Persist in-progress work as a real `draft` row so it appears on the list. */
  useEffect(() => {
    if (!open || (!isQuote && editInvoiceId)) return;
    if (submittingRef.current) return;
    const parsed = DraftSchema.safeParse(draft);
    if (!parsed.success) return;

    const t = setTimeout(() => {
      if (submittingRef.current) return;
      void (async () => {
        try {
          const id = await saveDocumentRef.current({ silentAutosave: true, relaxedItems: true });
          if (id) {
            saveDraft(autosaveScope, draftRef.current, id);
            setCloudSyncStatus('saved');
            if (serverAutosaveRetryRef.current) {
              clearTimeout(serverAutosaveRetryRef.current);
              serverAutosaveRetryRef.current = null;
            }
          }
        } catch {
          setCloudSyncStatus('error');
          if (serverAutosaveRetryRef.current) clearTimeout(serverAutosaveRetryRef.current);
          serverAutosaveRetryRef.current = setTimeout(() => {
            void saveDocumentRef.current({ silentAutosave: true, relaxedItems: true }).catch(() => {
              setCloudSyncStatus('error');
            });
          }, 12000);
        }
      })();
    }, 2800);
    return () => clearTimeout(t);
  }, [draft, open, editInvoiceId, autosaveScope, isQuote]);

  useEffect(() => {
    return () => {
      if (serverAutosaveRetryRef.current) clearTimeout(serverAutosaveRetryRef.current);
    };
  }, []);

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
  const hasResolvedClient = Boolean(draft.clientId?.trim() && selectedClientName !== '—');
  const selectedClientInitial = hasResolvedClient ? selectedClientName.trim().charAt(0).toUpperCase() : null;

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

  useEffect(() => {
    if (step !== 4) return;
    sendSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

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

  const collectValidationIssues = () => {
    const issues: string[] = [];
    const step1 = DraftSchema.safeParse(draft);
    if (!step1.success) {
      for (const issue of step1.error.issues) issues.push(issue.message);
    }
    if (!draft.items.length) issues.push('Add at least one line item.');
    draft.items.forEach((it, idx) => {
      if (!it.description.trim()) issues.push(`Line ${idx + 1}: add a description.`);
      if (!(it.quantity > 0)) issues.push(`Line ${idx + 1}: quantity must be greater than zero.`);
      if (!(it.unitPrice >= 0)) issues.push(`Line ${idx + 1}: unit price must be zero or more.`);
      if (!(it.vatRate >= 0 && it.vatRate <= 100)) issues.push(`Line ${idx + 1}: VAT must be between 0 and 100.`);
    });
    return issues;
  };

  const reportValidationIssues = () => {
    const issues = collectValidationIssues();
    if (!issues.length) return true;
    validateStep1();
    validateItems();
    const message = issues[0];
    setSubmitError(message);
    notifyError(message);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return false;
  };

  const proceedToSendStep = () => {
    setSubmitError(null);
    if (!reportValidationIssues()) return;
    setStep(4);
  };

  const downloadDocumentPdf = async () => {
    setSubmitError(null);
    if (!reportValidationIssues()) return;
    let docId = serverInvoiceId;
    if (!docId) {
      setSubmitting(true);
      try {
        docId = await saveDocumentToServer();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Could not save before downloading PDF.';
        setSubmitError(message);
        notifyError(message);
        return;
      } finally {
        setSubmitting(false);
      }
    }
    if (!docId) {
      const message = 'Save the document before downloading PDF.';
      setSubmitError(message);
      notifyError(message);
      return;
    }
    openDocumentPrintPage(isQuote ? 'quote' : 'invoice', docId);
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

  const openQuickAddClient = (prefillName = '') => {
    const name = prefillName.trim();
    if (name) {
      setQuickClient((current) => ({ ...current, name }));
    }
    setClientPickerMode('add');
    setErrors((current) => {
      const { quickClientName, clientId, ...rest } = current;
      return rest;
    });
  };

  const createQuickClient = async () => {
    const name = quickClient.name.trim();
    if (!name) {
      setErrors((e) => ({ ...e, quickClientName: 'Client name required' }));
      return;
    }
    setCreatingClient(true);
    setSubmitError(null);
    setErrors((current) => {
      const { quickClientName, clientId, ...rest } = current;
      return rest;
    });
    try {
      const payload = {
        name,
        email: quickClient.email.trim() || undefined,
        phone: quickClient.phone.trim() || undefined,
        companyName: quickClient.companyName.trim() || undefined,
        website: quickClient.website.trim() || undefined,
        companyRegistration: quickClient.companyRegistration.trim() || undefined,
        vatNumber: quickClient.vatNumber.trim() || undefined,
      };
      const created = await createClient(payload);
      const optimistic: ClientListItem = {
        id: created.id,
        name: payload.name,
        email: payload.email ?? null,
        companyName: payload.companyName ?? null,
      };
      setClientDetails({
        id: created.id,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        address: null,
        companyName: payload.companyName ?? null,
        website: payload.website ?? null,
        companyRegistration: payload.companyRegistration ?? null,
        vatNumber: payload.vatNumber ?? null,
      });
      setDraft((d) => ({ ...d, clientId: created.id }));
      setClients((prev) => [optimistic, ...prev.filter((c) => c.id !== created.id)]);
      setClientsSearched(true);
      setClientPickerMode('search');
      setQuickClient({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        website: '',
        companyRegistration: '',
        vatNumber: '',
      });
      notifySuccess(`${payload.name} added to this ${isQuote ? 'quote' : 'invoice'}.`);
      try {
        const list = await fetchClientsList();
        setClients(list);
      } catch {
        // Keep optimistic client selection if the refresh fails.
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create client.';
      setSubmitError(message);
      setErrors((current) => ({ ...current, quickClientName: message }));
      notifyError(message);
    } finally {
      setCreatingClient(false);
    }
  };

  const createDocumentDraft = async () => {
    try {
      await saveDocumentToServer({ redirectToInvoice: true });
    } catch (e: any) {
      setSubmitError(e?.message ?? (isQuote ? 'Failed to create quote.' : 'Failed to create invoice.'));
    }
  };

  const runAiGenerate = async () => {
    const input = aiInput.trim();
    if (!input) return;
    setAiLoading(true);
    setSubmitError(null);
    setAiOk(null);
    setAiInsights([]);
    setAiSource(null);
    try {
      const knownClients = clients.slice(0, 40).map((c) => ({ id: c.id, name: c.name, email: c.email }));
      const result = await draftDocumentFromDescription({
        input,
        documentKind: isQuote ? 'quote' : 'invoice',
        knownClients,
        catalogItems: draftCatalog.map((c) => ({
          id: c.id,
          name: c.name,
          unitPrice: c.unitPrice,
          defaultTaxRate: c.defaultTaxRate,
        })),
      });

      const d = result.draft;
      const items: InvoiceComposerItem[] = d.items
        .map((it) => ({
          id: crypto.randomUUID(),
          description: String(it.description ?? '').trim(),
          quantity: Number(it.quantity ?? 1),
          unitPrice: Number(it.unitPrice ?? 0),
          vatRate: Number(it.vatRate ?? 15),
          ...(it.catalogItemId ? { catalogItemId: it.catalogItemId } : {}),
        }))
        .filter((it) => it.description.length > 0);
      if (!items.length) throw new Error('No line items found in that description.');

      const suggestedName = String(d?.client?.name ?? '').trim();
      const suggestedEmail = d?.client?.email ? String(d.client.email).trim() : '';
      const suggestedPhone = d?.client?.phone ? String(d.client.phone).trim() : '';
      const suggestedId = d?.client?.id ? String(d.client.id) : '';

      let matched: ClientListItem | null =
        suggestedId && clients.some((c) => c.id === suggestedId)
          ? (clients.find((c) => c.id === suggestedId) ?? null)
          : null;

      if (!matched && suggestedName) {
        try {
          const found = await searchClients(suggestedName);
          const q = suggestedName.toLowerCase();
          const e = suggestedEmail.toLowerCase();
          matched =
            found.find((c) => e && (c.email ?? '').toLowerCase() === e) ??
            found.find((c) => c.name.toLowerCase() === q || (c.companyName ?? '').toLowerCase() === q) ??
            null;
          if (found.length) setClients(found);
        } catch {
          // keep unmatched — user can add the client
        }
      }

      setDraft((prev) => ({
        ...prev,
        clientId: matched?.id ?? prev.clientId,
        currency: String(d.currency ?? prev.currency ?? 'ZAR'),
        issueDate: String(d.issueDate ?? prev.issueDate),
        dueDate: String(d.dueDate ?? prev.dueDate),
        notes: d.notes ? String(d.notes) : prev.notes,
        items,
      }));

      const n = items.length;
      const itemLabel = n === 1 ? '1 line item' : `${n} line items`;
      setAiInsights(result.insights);
      setAiSource(result.source);

      const sourceNote =
        result.source === 'merged'
          ? ' Timely refined this with cloud AI.'
          : result.source === 'local'
            ? isOnline
              ? ' Drafted on this device.'
              : ' Drafted offline on this device.'
            : '';

      if (matched) {
        setAiOk(`Drafted ${itemLabel} for ${matched.name}.${sourceNote} Review quantities and VAT.`);
        setStep(2);
      } else if (draft.clientId) {
        setAiOk(`Drafted ${itemLabel}.${sourceNote} Review quantities and VAT.`);
        setStep(2);
      } else if (suggestedName) {
        setQuickClient({
          name: suggestedName,
          email: suggestedEmail,
          phone: suggestedPhone,
          companyName: '',
          website: '',
          companyRegistration: '',
          vatNumber: '',
        });
        setAiOk(`Drafted ${itemLabel}. Add or select ${suggestedName} to continue.${sourceNote}`);
        setStep(1);
      } else {
        setAiOk(`Drafted ${itemLabel}. Pick a client to continue.${sourceNote}`);
        setStep(1);
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : `Couldn’t draft the ${isQuote ? 'quote' : 'invoice'}.`);
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
    if (isDemoUiActive()) {
      void toEmail;
      void toWhatsapp;
      return demoSendInvoice(invoiceId);
    }
    const res = await fetch('/api/invoices/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, toEmail, toWhatsapp }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Send failed');
    return json.data as { shareId: string; shareUrl: string };
  };

  const showClientStep = isPage ? step < 4 : step === 1;
  const showItemsStep = isPage ? step < 4 : step === 2;
  const showReviewStep = !isPage && step === 3;
  const showSendStep = step === 4;

  const hasClient = Boolean(draft.clientId?.trim());
  const hasPricedLines = draft.items.some((i) => i.description.trim().length > 0 && Number(i.unitPrice) > 0);
  const syncState =
    cloudSyncStatus === 'error' ? 'error' : cloudSyncStatus === 'saved' || serverInvoiceId ? 'saved' : 'local';
  const syncLabel =
    syncState === 'error'
      ? 'Sync issue'
      : syncState === 'saved'
        ? 'Saved'
        : savedAt
          ? 'On this device'
          : 'Auto-save on';

  const pageKicker = !isQuote && editInvoiceId ? 'Edit invoice' : isQuote ? 'New quote' : 'New invoice';
  const phaseClient = !showSendStep && !hasClient;
  const phaseLines = !showSendStep && hasClient;
  const phaseSend = showSendStep;

  const draftExamples = isQuote
    ? [
        'Quote for Sunrise Studio: brand identity R18,500 + 2 strategy sessions at R950',
        'Estimate for Beta Ltd — 3 days on-site at R2,200/day, valid 14 days',
        'Proposal: website rebuild R45,000, hosting R1,200/month',
      ]
    : [
        'Website design for Acme: 8 hours at R950/hr + hosting retainer R1,200',
        'Invoice ABC Construction for R15,000, net 30',
        'Consulting for Delta — 4 hrs @ R600, zero-rated VAT',
      ];

  const documentOptionsBar = (
    <ComposerDocumentOptions
      draft={draft}
      documentKind={isQuote ? 'quote' : 'invoice'}
      className={!isPage ? 'rounded-t-[var(--radius-card)]' : undefined}
      onCurrencyChange={(code) => setDraft((d) => ({ ...d, currency: code }))}
      onTemplateChange={(template) => setDraft((d) => ({ ...d, template }))}
    />
  );

  const livePreview =
    isPage ? (
      <aside className="ti-composer-live ti-no-print" aria-label="Live document preview">
        <div className="ti-composer-live-head">
          <p className="ti-meta">Live document</p>
          <p className="ti-caption text-[var(--tl-ink-3)]">Updates as you type</p>
        </div>
        <div className="ti-composer-live-frame">
          <InvoicePreview
            draft={draft}
            documentKind={isQuote ? 'quote' : 'invoice'}
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
      </aside>
    ) : null;

  const body = (
    <div className={cn(isPage ? 'ti-composer-page ti-page-enter' : 'space-y-4')}>
      {isPage ? null : (
        <div className="flex items-end justify-between gap-4 ti-no-print">
          <div>
            <p className="ti-meta">{isQuote ? 'Quote' : 'Invoice'}</p>
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-[var(--tl-ink-3)] sm:flex">
            <span className={step >= 1 ? 'text-[var(--tl-ink)]' : undefined}>Client</span>
            <span aria-hidden>→</span>
            <span className={step >= 2 ? 'text-[var(--tl-ink)]' : undefined}>Items</span>
            <span aria-hidden>→</span>
            <span className={step >= 3 ? 'text-[var(--tl-ink)]' : undefined}>Review</span>
            <span aria-hidden>→</span>
            <span className={step >= 4 ? 'text-[var(--tl-ink)]' : undefined}>Send</span>
          </div>
        </div>
      )}

      {submitError ? (
        <div className="ti-error ti-no-print" role="alert">
          {submitError}
        </div>
      ) : null}

      <div
        className={cn(
          isPage ? 'ti-composer-workspace' : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_min(360px,100%)] lg:items-start'
        )}
      >
        <div className={isPage ? 'ti-composer-sheet' : undefined}>
          {isPage ? (
            <>
              <header className="ti-composer-mast ti-no-print">
                <div className="min-w-0">
                  <p className="ti-composer-mast-kicker">{pageKicker}</p>
                  <h1 className="ti-composer-mast-no">
                    {draft.invoiceNumber || (isQuote ? 'Untitled quote' : 'Untitled invoice')}
                  </h1>
                </div>
                <div className="ti-composer-mast-meta">
                  <span className="ti-composer-sync" data-state={syncState}>
                    {syncLabel}
                  </span>
                  <p className="ti-composer-phase" aria-label="Composer progress">
                    <span data-on={phaseClient || hasClient ? 'true' : undefined}>01 Client</span>
                    {' · '}
                    <span data-on={phaseLines || hasPricedLines ? 'true' : undefined}>02 Lines</span>
                    {' · '}
                    <span data-on={phaseSend ? 'true' : undefined}>03 Send</span>
                  </p>
                </div>
              </header>
              {documentOptionsBar}
            </>
          ) : null}
          <div
            className={
              isPage
                ? 'ti-composer-sheet-body'
                : 'overflow-hidden rounded-[var(--radius-card)] border border-border bg-[var(--tl-surface)] shadow-[var(--shadow-elevated)]'
            }
          >
          {!isPage ? documentOptionsBar : null}
          <div className={cn(!isPage && 'p-5')}>
          <div className="ti-no-print">
            {showSendStep ? null : showSmart ? (
              <div className={cn(isPage ? 'ti-composer-ai ti-composer-ai-hero' : 'mb-8 border-b border-border pb-6')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ti-composer-ai-badge">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        Timely draft
                      </span>
                      <span className="ti-composer-ai-mode" data-online={isOnline ? 'true' : undefined}>
                        {isOnline ? (
                          <>
                            <Wifi className="h-3 w-3" aria-hidden />
                            On-device + cloud
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3" aria-hidden />
                            Offline — on-device only
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold tracking-tight text-[var(--tl-ink)]">
                      Describe the {isQuote ? 'quote' : 'invoice'} — Timely drafts it
                    </p>
                    <p className="mt-1 text-sm text-[var(--tl-ink-2)]">
                      Plain language in, line items + client + terms out. Works without an internet connection; smarter when
                      you&apos;re online.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowSmart(false)}>
                    Hide
                  </Button>
                </div>

                <div className="ti-composer-ai-examples">
                  {draftExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="ti-composer-ai-example"
                      onClick={() => setAiInput(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <label htmlFor="smart-invoice-prompt" className="sr-only">
                  Describe the work
                </label>
                <textarea
                  id="smart-invoice-prompt"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={
                    isQuote
                      ? 'e.g. Quote for Acme: logo design R8,500 + 3 revision rounds at R750, valid 30 days…'
                      : 'e.g. Website design for Acme: 8 hours at R950/hr + hosting retainer R1,200, due in 14 days…'
                  }
                  rows={4}
                  disabled={aiLoading}
                  aria-busy={aiLoading}
                  className={cn('input mt-3 min-h-[6.5rem] resize-y py-2.5 leading-5', aiLoading && 'opacity-70')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void runAiGenerate();
                    }
                  }}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="ti-caption">
                    Timely reads hours, day rates, retainers, lists, VAT, and your catalog. ⌘ Enter to draft.
                  </p>
                  <Button type="button" onClick={() => void runAiGenerate()} disabled={aiLoading || !aiInput.trim()} loading={aiLoading}>
                    {aiLoading ? 'Drafting…' : `Draft ${isQuote ? 'quote' : 'invoice'}`}
                  </Button>
                </div>
                {aiInsights.length ? (
                  <div className="ti-composer-ai-insights" aria-label="Draft summary">
                    {aiInsights.map((insight) => (
                      <span key={insight} className="ti-composer-ai-insight">
                        {insight}
                      </span>
                    ))}
                    {aiSource === 'merged' ? (
                      <span className="ti-composer-ai-insight" data-tone="cloud">
                        Cloud refined
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {aiOk ? <p className="mt-2 text-xs font-medium text-[var(--tl-success)]">{aiOk}</p> : null}
                {submitError && showSmart ? (
                  <p className="mt-2 text-xs font-medium text-[var(--tl-danger)]" role="alert">
                    {submitError}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className={cn(
                  isPage
                    ? 'ti-composer-ai-toggle'
                    : 'mb-6 flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--tl-violet)_22%,var(--tl-line))] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--tl-violet)_8%,white),color-mix(in_srgb,var(--tl-indigo)_5%,white)_52%,color-mix(in_srgb,var(--tl-accent)_3%,white))] p-4 text-left shadow-[var(--shadow-elevated)] transition hover:-translate-y-px'
                )}
                onClick={() => {
                  setSubmitError(null);
                  setShowSmart(true);
                }}
                aria-expanded={false}
              >
                <span className={isPage ? 'ti-composer-ai-toggle-icon' : 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--tl-violet)_22%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-violet)_14%,white)] text-[color-mix(in_srgb,var(--tl-violet)_72%,var(--tl-ink))]'}>
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <span className={isPage ? 'ti-composer-ai-toggle-copy' : 'min-w-0 flex-1'}>
                  <span className={isPage ? 'ti-composer-ai-toggle-title' : 'block text-sm font-semibold text-[var(--tl-ink)]'}>
                    Ask Timely to draft this {isQuote ? 'quote' : 'invoice'}
                  </span>
                  <span className={isPage ? 'ti-composer-ai-toggle-hint' : 'mt-0.5 block text-xs text-[var(--tl-ink-2)]'}>
                    Plain language in — line items, client, and terms out. Works offline.
                  </span>
                </span>
                <ChevronRight className={cn('h-4 w-4 shrink-0', isPage ? 'ti-composer-ai-toggle-chevron' : 'text-[var(--tl-ink-3)]')} aria-hidden />
              </button>
            )}
          </div>

          {showClientStep ? (
            <div className={cn(isPage ? 'ti-composer-section' : 'space-y-8')}>
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--tl-line)] bg-white shadow-[var(--shadow-elevated)]">
                <div className="grid md:grid-cols-2">
                  <div className="min-w-0 border-b border-[var(--tl-line)] p-5 md:border-r md:border-b-0 md:p-6">
                    <p className="ti-meta">From</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--tl-ink)]">{companyName}</p>
                    <p className="ti-caption mt-1">Your company on this document</p>
                  </div>

                  <div className="min-w-0 bg-[color-mix(in_srgb,var(--tl-navy)_2.5%,white)] p-5 md:p-6">
                    <p className="ti-meta">To</p>
                    {hasResolvedClient ? (
                      <div className="mt-2 flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--tl-navy)] text-sm font-semibold text-white shadow-[0_6px_16px_rgb(15_20_28_/_0.18)]">
                          {selectedClientInitial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold tracking-tight text-[var(--tl-ink)]">{selectedClientName}</p>
                          {(clientDetails?.companyName || clientDetails?.email) ? (
                            <p className="ti-caption mt-0.5 truncate">
                              {[clientDetails?.companyName, clientDetails?.email].filter(Boolean).join(' · ')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-lg font-semibold tracking-tight text-[var(--tl-ink-3)]">Choose recipient</p>
                        <p className="ti-caption mt-1">Search your list or add someone new below.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-[var(--tl-line)] p-5 md:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="ti-tabs" role="tablist" aria-label="Client picker mode">
                      <button
                        type="button"
                        role="tab"
                        className="ti-tab inline-flex items-center gap-1.5"
                        aria-selected={clientPickerMode === 'search'}
                        data-active={clientPickerMode === 'search' ? 'true' : undefined}
                        onClick={() => setClientPickerMode('search')}
                      >
                        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Search existing
                      </button>
                      <button
                        type="button"
                        role="tab"
                        className="ti-tab inline-flex items-center gap-1.5"
                        aria-selected={clientPickerMode === 'add'}
                        data-active={clientPickerMode === 'add' ? 'true' : undefined}
                        onClick={() => openQuickAddClient()}
                      >
                        <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Add new
                      </button>
                    </div>
                    <Link
                      href={`${routes.app.clients}/new`}
                      className="inline-flex items-center gap-0.5 text-sm font-semibold text-[var(--tl-ink-2)] transition hover:text-[var(--tl-ink)]"
                    >
                      Full client form
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </Link>
                  </div>

                  {clientPickerMode === 'search' ? (
                    <div className="space-y-3">
                      <label htmlFor="composer-client-search" className="sr-only">
                        Search clients
                      </label>
                      <div className="flex items-stretch gap-2 rounded-full border border-[var(--tl-line)] bg-[color-mix(in_srgb,var(--tl-bg)_50%,white)] p-1">
                        <div className="relative min-w-0 flex-1">
                          <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tl-ink-3)]"
                            aria-hidden
                          />
                          <Input
                            id="composer-client-search"
                            ref={clientSearchRef}
                            value={clientsQuery}
                            onChange={(e) => {
                              const v = e.target.value;
                              setClientsQuery(v);
                              setClientsSearched(false);
                              setClients([]);
                              setClientsError(null);
                            }}
                            placeholder="Search by name or email…"
                            autoComplete="off"
                            className="h-10 border-0 bg-transparent pl-10 shadow-none focus:border-transparent focus:shadow-none"
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
                          className="h-10 shrink-0 rounded-full px-5"
                          disabled={loadingClients}
                          onClick={() => void runClientSearch()}
                        >
                          {loadingClients ? 'Searching…' : 'Search'}
                        </Button>
                      </div>

                      {!clientsSearched && !loadingClients ? (
                        <p className="text-xs leading-relaxed text-[var(--tl-ink-3)]">
                          Start typing, then search your saved clients.
                        </p>
                      ) : null}

                      {clientsError ? <div className="ti-error">{clientsError}</div> : null}
                      {errors.clientId ? <div className="text-xs text-danger">{errors.clientId}</div> : null}

                      {clientsSearched || loadingClients ? (
                        <div className="max-h-60 overflow-auto rounded-[calc(var(--radius-card)-4px)] border border-[var(--tl-line)] bg-white shadow-[var(--shadow-elevated)]">
                          {loadingClients ? (
                            <p className="px-4 py-3 text-sm text-[var(--tl-ink-3)]">Searching your client list…</p>
                          ) : filteredClients.length === 0 ? (
                            <p className="px-4 py-3 text-sm leading-relaxed text-[var(--tl-ink-3)]">
                              No matches for &ldquo;{clientsQuery.trim()}&rdquo;.{' '}
                              <button
                                type="button"
                                className="font-semibold text-[var(--tl-ink)] underline underline-offset-2 hover:text-[var(--tl-accent)]"
                                onClick={() => openQuickAddClient(clientsQuery)}
                              >
                                Add as new client
                              </button>
                            </p>
                          ) : (
                            filteredClients.slice(0, 10).map((c) => {
                              const selected = draft.clientId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setDraft((d) => ({ ...d, clientId: c.id }))}
                                  className={cn(
                                    'flex w-full items-center gap-3 border-b border-[var(--tl-line)] px-4 py-3 text-left transition-colors duration-[var(--ti-duration-hover)] last:border-b-0 hover:bg-[var(--tl-accent-soft)]',
                                    selected && 'bg-[var(--tl-accent-soft)]'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                                      selected
                                        ? 'border-[var(--tl-navy)] bg-[var(--tl-navy)] text-white'
                                        : 'border-[color-mix(in_srgb,var(--tl-navy)_12%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-navy)_8%,white)] text-[var(--tl-ink)]'
                                    )}
                                    aria-hidden
                                  >
                                    {c.name.trim().charAt(0).toUpperCase()}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className={cn('block text-sm', selected ? 'font-semibold text-[var(--tl-ink)]' : 'text-[var(--tl-ink)]')}>
                                      {c.name}
                                    </span>
                                    {c.companyName ? <span className="ti-caption block">{c.companyName}</span> : null}
                                    <span className="ti-caption block">{c.email ?? 'No email on file'}</span>
                                  </span>
                                  <span className="grid h-5 w-5 shrink-0 place-items-center text-[var(--tl-accent)]" aria-hidden>
                                    {selected ? <Check className="h-4 w-4" strokeWidth={2.25} /> : null}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed text-[var(--tl-ink-2)]">
                        Capture essentials now — you can enrich the profile later from Clients.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Name">
                          <Input
                            value={quickClient.name}
                            onChange={(e) => setQuickClient((c) => ({ ...c, name: e.target.value }))}
                            placeholder="Client or contact name"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void createQuickClient();
                              }
                            }}
                          />
                        </Field>
                        <Field label="Email">
                          <Input
                            value={quickClient.email}
                            onChange={(e) => setQuickClient((c) => ({ ...c, email: e.target.value }))}
                            placeholder="Optional"
                            type="email"
                          />
                        </Field>
                        <Field label="Phone">
                          <Input
                            value={quickClient.phone}
                            onChange={(e) => setQuickClient((c) => ({ ...c, phone: e.target.value }))}
                            placeholder="Optional"
                          />
                        </Field>
                        <Field label="Company">
                          <Input
                            value={quickClient.companyName}
                            onChange={(e) => setQuickClient((c) => ({ ...c, companyName: e.target.value }))}
                            placeholder="Optional"
                          />
                        </Field>
                        <Field label="Registration">
                          <Input
                            value={quickClient.companyRegistration}
                            onChange={(e) => setQuickClient((c) => ({ ...c, companyRegistration: e.target.value }))}
                            placeholder="Reg / CK"
                          />
                        </Field>
                        <Field label="VAT number">
                          <Input
                            value={quickClient.vatNumber}
                            onChange={(e) => setQuickClient((c) => ({ ...c, vatNumber: e.target.value }))}
                            placeholder="Optional"
                          />
                        </Field>
                        <Field label="Website" className="sm:col-span-2">
                          <Input
                            value={quickClient.website}
                            onChange={(e) => setQuickClient((c) => ({ ...c, website: e.target.value }))}
                            placeholder="https://"
                            type="url"
                          />
                        </Field>
                      </div>
                      {errors.quickClientName ? (
                        <div className="text-xs text-danger" role="alert">
                          {errors.quickClientName}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => void createQuickClient()}
                          disabled={creatingClient || !quickClient.name.trim()}
                          loading={creatingClient}
                        >
                          <FilePlus2 className="h-4 w-4" />
                          Add client
                        </Button>
                        <button
                          type="button"
                          className="text-sm font-semibold text-[var(--tl-ink-2)] underline underline-offset-2 hover:text-[var(--tl-ink)]"
                          onClick={() => setClientPickerMode('search')}
                        >
                          Search existing instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {resumeCandidate ? (
                <div className="border-b border-border py-4 ti-no-print">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Unfinished {isQuote ? 'quote' : 'invoice'}</p>
                      <p className="ti-small mt-1">
                        Draft saved {resumeCandidateSavedAt ? new Date(resumeCandidateSavedAt).toLocaleString() : 'recently'}.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="text-sm text-[var(--tl-ink-3)] hover:text-[var(--tl-ink)]"
                        onClick={() => {
                          if (isQuote) {
                            clearDraft(autosaveScope);
                            if (serverInvoiceId) {
                              void (async () => {
                                try {
                                  const supabase = createSupabaseBrowserClient();
                                  const ownerId = await getWorkspaceOwnerIdForClient();
                                  await supabase.from('quotes').delete().eq('id', serverInvoiceId).eq('owner_id', ownerId);
                                } catch {
                                  // local draft already cleared
                                }
                              })();
                            }
                          } else {
                            void discardPersistedDraft(autosaveScope, serverInvoiceId);
                          }
                          setServerInvoiceId(null);
                          setResumeCandidate(null);
                          setResumeCandidateSavedAt(null);
                          setSavedAt(null);
                          setCloudSyncStatus('idle');
                        }}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-[var(--tl-ink)] hover:underline"
                        onClick={() => {
                          const invNo =
                            (resumeCandidate as any)?.invoiceNumber && String((resumeCandidate as any).invoiceNumber).trim().length
                              ? (resumeCandidate as any).invoiceNumber
                              : makeDocumentNumber();
                          setDraft({ ...(resumeCandidate as any), invoiceNumber: invNo });
                          setSavedAt(resumeCandidateSavedAt ?? Date.now());
                          setResumeCandidate(null);
                          setResumeCandidateSavedAt(null);
                        }}
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {saveOk && shareUrl ? (
                <button
                  type="button"
                  className="text-sm text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
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
                </button>
              ) : null}

              <div className={cn(isPage ? 'ti-composer-section space-y-4' : 'space-y-4 border-t border-border pt-6')}>
                <p className="ti-meta">{isQuote ? 'Quote details' : 'Invoice details'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Issue date">
                    <Input type="date" value={draft.issueDate} onChange={(e) => setDraft((d) => ({ ...d, issueDate: e.target.value }))} />
                  </Field>
                  <Field label={isQuote ? 'Quote number' : 'Invoice number'} hint="Shown on the PDF and share link.">
                    <Input
                      value={draft.invoiceNumber ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, invoiceNumber: e.target.value }))}
                      placeholder={isQuote ? 'e.g. QT-2026-00042' : 'e.g. INV-2026-00042'}
                    />
                  </Field>
                </div>
              </div>

              <div className={cn(isPage ? 'ti-composer-section space-y-4' : 'space-y-4')}>
                <p className="ti-meta">{isQuote ? 'Validity' : 'Payment terms'}</p>
                <Field label={isQuote ? 'Valid until' : 'Due date'}>
                  <Input type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} />
                </Field>
              </div>

              {!isPage ? (
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
              ) : null}
            </div>
          ) : null}

          {showItemsStep ? (
            <div className={cn(isPage ? 'ti-composer-section space-y-5' : 'space-y-5')}>
              <div className="ti-composer-section-head">
                <div>
                  <p className="ti-meta">Line items</p>
                  <p className={isPage ? 'ti-composer-section-title' : 'mt-2 text-lg font-semibold tracking-tight'}>
                    {isQuote ? 'Quoted work' : 'Work billed'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={routes.app.productsServices} className="text-xs font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]">
                    Products &amp; services
                  </Link>
                  <Button type="button" variant="secondary" onClick={addItem}>
                    Add item
                  </Button>
                </div>
              </div>

              {!isPage ? (
                <div className="flex flex-col gap-2 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="ti-meta">{isQuote ? 'Quote to' : 'Bill to'}</p>
                    <div className="mt-2 truncate text-sm font-semibold">{clientDetails?.name ?? selectedClientName}</div>
                    {clientDetails?.email ? (
                      <div className="truncate text-xs text-[var(--tl-ink-3)]">{clientDetails.email}</div>
                    ) : null}
                  </div>
                  <Button type="button" variant="secondary" className="shrink-0" onClick={() => setStep(1)}>
                    Change client
                  </Button>
                </div>
              ) : null}

              {errors.items ? <div className="text-xs text-danger">{errors.items}</div> : null}

              <div className={cn(isPage ? 'ti-composer-lines' : 'space-y-2')}>
                <div
                  className={cn(
                    isPage
                      ? 'ti-composer-lines-head'
                      : 'hidden px-4 md:grid md:grid-cols-[minmax(0,1fr)_4.75rem_7.25rem_4.5rem_8.5rem_2.5rem] md:items-center md:gap-3'
                  )}
                >
                  <div className="ti-meta">Description</div>
                  <div className="ti-meta text-right">Qty</div>
                  <div className="ti-meta text-right">Unit ({draft.currency})</div>
                  <div className="ti-meta text-right">VAT %</div>
                  <div className="ti-meta text-right">Line total</div>
                  <div className="sr-only">Action</div>
                </div>
                {draft.items.map((it, itemIndex) => {
                  const lineTotal = it.quantity * it.unitPrice * (1 + it.vatRate / 100);
                  const suggestPrice = async () => {
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
                  };
                  return (
                    <div
                      key={it.id}
                      className={cn(
                        'ti-line-enter',
                        isPage ? 'ti-composer-line' : 'border-b border-border py-3 md:px-0'
                      )}
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_4.75rem_7.25rem_4.5rem_8.5rem_2.5rem] md:items-start">
                        <div className="min-w-0 space-y-2">
                          <label className="ti-meta md:sr-only">Description</label>
                          {inventoryCatalog.length > 0 ? (
                            <div>
                              <label className="sr-only" htmlFor={`inv-cat-${it.id}`}>
                                Inventory catalog
                              </label>
                              <select
                                id={`inv-cat-${it.id}`}
                                className="input ti-select h-10 w-full"
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
                                <option value="">Catalog — or type a custom line</option>
                                {inventoryCatalog.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                    {c.sku ? ` (${c.sku})` : ''}
                                    {c.stockQuantity != null ? ` · ${c.stockQuantity} on hand` : ''}
                                  </option>
                                ))}
                              </select>
                              {it.catalogItemId ? (
                                <p className="mt-1 text-xs text-muted-foreground">Stock drops by qty when sent.</p>
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
                              className="h-10"
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setActiveItemId(null);
                                }
                              }}
                            />
                            {activeItemId === it.id && (suggestLoading || suggestions.length > 0) ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20">
                                <div className="overflow-hidden border border-border bg-[var(--tl-surface)] shadow-[var(--shadow-dropdown)]">
                                  <div className="ti-meta px-3 py-2">
                                    {suggestLoading ? 'Suggestions…' : 'Suggestions'}
                                  </div>
                                  {suggestions.length ? (
                                    <div className="max-h-52 overflow-auto px-1 pb-1">
                                      {suggestions.map((s, idx) => (
                                        <button
                                          key={`${s.description}-${idx}`}
                                          type="button"
                                          className="w-full px-2 py-2 text-left text-sm hover:bg-[var(--tl-accent-soft)]"
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
                          {errors[`items.${itemIndex}.description`] ? (
                            <div className="text-xs text-danger">{errors[`items.${itemIndex}.description`]}</div>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <label className="ti-meta md:sr-only">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            inputMode="decimal"
                            value={it.quantity}
                            className="h-10 text-right tabular-nums"
                            onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="ti-meta md:sr-only">
                            Unit ({draft.currency})
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            value={it.unitPrice}
                            className="h-10 text-right tabular-nums"
                            onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                            onBlur={() => rememberPrice(it.description, it.unitPrice, it.vatRate)}
                          />
                          <button
                            type="button"
                            className="text-xs font-medium text-[var(--tl-ink-3)] hover:text-[var(--tl-ink)]"
                            onClick={() => void suggestPrice()}
                          >
                            Suggest
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="ti-meta md:sr-only">VAT %</label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            inputMode="decimal"
                            value={it.vatRate}
                            className="h-10 text-right tabular-nums"
                            onChange={(e) => updateItem(it.id, { vatRate: Number(e.target.value) })}
                            onBlur={() => rememberPrice(it.description, it.unitPrice, it.vatRate)}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3 md:h-10 md:justify-end">
                          <span className="ti-meta md:sr-only">Line total</span>
                          <span className="ti-amount ti-amount-live text-sm">
                            {formatMoney(lineTotal, draft.currency)}
                          </span>
                        </div>

                        <div className="flex md:h-10 md:items-center md:justify-center">
                          {draft.items.length > 1 ? (
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center text-[var(--tl-danger)] transition-colors duration-[var(--ti-duration-hover)] hover:text-[var(--tl-ink)]"
                              aria-label="Remove line item"
                              onClick={() => removeItem(it.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="hidden h-10 w-10 md:block" aria-hidden />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Field label="Notes">
                <Textarea
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder={
                    isQuote
                      ? 'Scope notes or terms for the client'
                      : 'Payment instructions or a short note to the client'
                  }
                  rows={3}
                />
              </Field>

              {isPage ? (
                <details className="ti-composer-section ti-composer-preview-fallback ti-no-print">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]">
                    Preview document
                  </summary>
                  <div className="mt-4 overflow-hidden rounded-[calc(var(--radius-card)-4px)] border border-border">
                    <InvoicePreview
                      draft={draft}
                      documentKind={isQuote ? 'quote' : 'invoice'}
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
                </details>
              ) : null}

              {isPage ? (
                <p>
                  <button
                    type="button"
                    className="ti-composer-cancel"
                    onClick={() => window.location.assign(isQuote ? routes.app.quotes : routes.app.invoices)}
                  >
                    Cancel
                  </button>
                </p>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      loading={submitting}
                      onClick={async () => {
                        try {
                          await saveDocumentToServer();
                        } catch (e: any) {
                          setSubmitError(e?.message ?? 'Save failed');
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setSubmitError(null);
                        if (!reportValidationIssues()) return;
                        setStep(3);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {showReviewStep ? (
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

              <InvoiceTotalsBlock
                currency={draft.currency}
                totals={totals}
                totalLabel={isQuote ? 'Quote total' : 'Total due'}
              />

              <div className="border-t border-border pt-4 ti-no-print">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Preview</p>
                  <Button type="button" variant="ghost" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
                <div className="mt-4 ti-print-area">
                  <InvoicePreview
                    draft={draft}
                    documentKind={isQuote ? 'quote' : 'invoice'}
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
                        await saveDocumentToServer();
                      } catch (e: any) {
                        setSubmitError(e?.message ?? 'Save failed');
                      }
                    }}
                  >
                    {submitting ? 'Saving…' : 'Save'}
                  </Button>
                  <Button type="button" onClick={proceedToSendStep}>
                    Continue to send
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showSendStep ? (
            <div ref={sendSectionRef} className={cn(isPage ? 'ti-composer-section space-y-6' : 'space-y-6')}>
              {sentShareUrl ? (
                <div className="ti-send-success space-y-3">
                  <p className="ti-meta">Sent</p>
                  <p className={isPage ? 'ti-composer-section-title' : 'text-lg font-semibold tracking-tight'}>
                    {isQuote ? 'Quote is on its way.' : 'Invoice is on its way.'}
                  </p>
                  <p className="text-sm text-[var(--tl-ink-2)]">Opening the client view…</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="ti-meta">Send</p>
                    <p className={isPage ? 'ti-composer-section-title' : 'mt-2 text-lg font-semibold tracking-tight'}>
                      {isQuote ? 'Deliver this quote' : 'Deliver this invoice'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--tl-ink-2)]">Email, WhatsApp, or a shareable link.</p>
                  </div>

                  <SendStep
                    currency={draft.currency}
                    total={totals.total}
                    submitting={submitting}
                    defaultEmail={clientDetails?.email ?? ''}
                    actionLabel={isQuote ? 'Send quote' : 'Send invoice'}
                    amountLabel={isQuote ? 'Quote total' : 'Amount due'}
                    onDownloadPdf={() => void downloadDocumentPdf()}
                    onCreateAndSend={async ({ email, whatsapp }) => {
                      setSubmitting(true);
                      setSubmitError(null);
                      try {
                        const docId = await saveDocumentToServer();
                        if (!docId) throw new Error(isQuote ? 'Missing quote id' : 'Missing invoice id');

                        if (isQuote) {
                          // Quotes: ensure share link only (no invoice send / stock reduction).
                          const share = await ensureQuoteShareLink(docId);
                          void email;
                          void whatsapp;
                          onCreated?.(docId);
                          setSubmitting(false);
                          setSentShareUrl(share.shareUrl);
                          notifySuccess('Quote ready to share.');
                          window.setTimeout(() => {
                            onOpenChange(false);
                            window.location.assign(share.shareUrl);
                          }, 400);
                          return;
                        }

                        const sent = await sendInvoice({
                          invoiceId: docId,
                          toEmail: email || undefined,
                          toWhatsapp: whatsapp || undefined,
                        });

                        onCreated?.(docId);
                        setSubmitting(false);
                        setSentShareUrl(sent.shareUrl);
                        notifySuccess('Invoice sent.');
                        window.setTimeout(() => {
                          onOpenChange(false);
                          window.location.assign(sent.shareUrl);
                        }, 400);
                      } catch (e: any) {
                        setSubmitError(e?.message ?? 'Send failed');
                        setSubmitting(false);
                      }
                    }}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <Button type="button" variant="secondary" onClick={() => setStep(isPage ? 1 : 3)}>
                      Back
                    </Button>
                    <Button type="button" variant="ghost" onClick={createDocumentDraft} disabled={submitting}>
                      Skip sending
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
          </div>
          </div>

          {isPage && !showSendStep ? (
            <footer className="ti-composer-sheet-foot ti-no-print">
              <InvoiceTotalsBlock
                currency={draft.currency}
                totals={totals}
                totalLabel={isQuote ? 'Quote total' : 'Total due'}
                elevated
              />
              <div className="ti-composer-dock">
                <Button
                  type="button"
                  variant="ghost"
                  loading={submitting}
                  onClick={async () => {
                    try {
                      await saveDocumentToServer();
                    } catch (e: any) {
                      setSubmitError(e?.message ?? 'Save failed');
                    }
                  }}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  loading={submitting}
                  onClick={() => void downloadDocumentPdf()}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  PDF
                </Button>
                <Button type="button" onClick={proceedToSendStep}>
                  {isQuote ? 'Send quote' : 'Send invoice'}
                </Button>
              </div>
            </footer>
          ) : null}
        </div>

        {isPage ? (
          livePreview
        ) : (
          <aside className="ti-no-print h-fit">
            <div className="rounded-[var(--radius-card)] border border-border bg-[var(--tl-surface)] p-5 shadow-[var(--shadow-elevated)]">
              <InvoiceTotalsBlock
                currency={draft.currency}
                totals={totals}
                totalLabel={isQuote ? 'Quote total' : 'Total due'}
              />
              <p className="ti-caption mt-4">
                {cloudSyncStatus === 'error'
                  ? 'Saved on this device — retrying cloud sync…'
                  : saveOk
                    ? isQuote
                      ? 'Quote saved.'
                      : 'Invoice saved.'
                    : cloudSyncStatus === 'saved' || serverInvoiceId
                      ? 'Saved to your account'
                      : savedAt
                        ? 'Saved on this device'
                        : 'Auto-save on'}
              </p>
              <p className="mt-4 text-xs text-[var(--tl-ink-3)]">
                Prefer the full editor?{' '}
                <Link
                  href={isQuote ? `${routes.app.quotes}/new` : `${routes.app.invoices}/new`}
                  className="font-medium text-[var(--tl-ink)] hover:underline"
                >
                  Open page
                </Link>
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );

  if (mode === 'page') return body;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-5xl p-4 sm:p-6">
        <ModalHeader className="mb-4">
          <ModalTitle className="text-xl font-semibold tracking-tight">
            {isQuote ? 'New quote' : 'New invoice'}
          </ModalTitle>
          <ModalDescription className="text-sm text-muted-foreground">
            {isQuote
              ? 'Fast path for creating and sharing a professional quote.'
              : 'Fast path for creating and sending a professional invoice.'}
          </ModalDescription>
        </ModalHeader>
        {body}
      </ModalContent>
    </Modal>
  );
}

