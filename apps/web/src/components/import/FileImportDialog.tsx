'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, ImageIcon, Table } from 'lucide-react';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { AdminAlertBanner } from '@/components/workspace/workspace-ui';
import { Button } from '@/components/ui/Button';
import { notifyError, notifySuccess } from '@/lib/notify';
import { cn } from '@/lib/utils/cn';

export type ImportColumnGuide = {
  name: string;
  required?: boolean;
  hint?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  endpoint: string;
  templateHref: string;
  onSuccess?: () => void;
  /** Optional column reference shown in a tidy table */
  columnGuide?: ImportColumnGuide[];
};

const FORMAT_OPTIONS = [
  {
    icon: Table,
    label: 'CSV',
    detail: 'Comma, tab, or semicolon — UTF-8 BOM auto-detected.',
  },
  {
    icon: FileSpreadsheet,
    label: 'Excel',
    detail: '.xlsx / .xls with header row detection.',
  },
  {
    icon: FileText,
    label: 'PDF',
    detail: 'Text and tables extracted when legible.',
  },
  {
    icon: ImageIcon,
    label: 'Image',
    detail: 'Screenshots and photos via OCR.',
  },
] as const;

export function FileImportDialog({
  open,
  onOpenChange,
  title,
  description,
  endpoint,
  templateHref,
  onSuccess,
  columnGuide,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setError(null);
      setFileName(null);
      setDragOver(false);
    }
  }, [open]);

  const runImport = async (file: File) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(endpoint, { method: 'POST', body: fd, credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Import failed.');
      }
      const d = json.data;
      const parts: string[] = [];
      if (typeof d?.imported === 'number') parts.push(`Imported: ${d.imported}`);
      if (typeof d?.totalRows === 'number') parts.push(`Rows in file: ${d.totalRows}`);
      if (typeof d?.skipped === 'number' && d.skipped > 0) parts.push(`Skipped (DB): ${d.skipped}`);
      if (Array.isArray(d?.parseErrors) && d.parseErrors.length) {
        parts.push(`Notes: ${d.parseErrors.slice(0, 8).join(' · ')}`);
      }
      if (Array.isArray(d?.errors) && d.errors.length) {
        parts.push(`Issues: ${d.errors.slice(0, 8).join(' · ')}`);
      }
      if (typeof d?.imported === 'number' && d.imported === 0 && typeof d?.totalRows === 'number' && d.totalRows > 0) {
        parts.push(
          'Nothing was saved — check column names and date/amount formats. Switch the period filter to “All time” if dates are older.'
        );
      }
      const summary = parts.join('\n') || 'Import completed.';
      setMessage(summary);
      notifySuccess(parts[0] ?? 'Import completed.');
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import failed.';
      setError(msg);
      notifyError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onFilePick = (file: File | undefined) => {
    if (file) void runImport(file);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl p-6 sm:p-7" aria-describedby="import-dialog-desc">
        <ModalHeader>
          <ModalTitle className="ti-h3 text-[var(--tl-ink)]">{title}</ModalTitle>
          <ModalDescription id="import-dialog-desc" className="text-[13px] text-[var(--tl-ink-3)]">
            {description}
          </ModalDescription>
        </ModalHeader>

        <div className="mt-5 grid gap-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {FORMAT_OPTIONS.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <div
                  key={fmt.label}
                  className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-3.5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tl-surface)] text-[var(--tl-ink-2)]">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--tl-ink)]">{fmt.label}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--tl-ink-3)]">{fmt.detail}</p>
                </div>
              );
            })}
          </div>

          {columnGuide && columnGuide.length > 0 ? (
            <div className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
              <div className="border-b border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-2.5">
                <p className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Column guide</p>
              </div>
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--tl-line)] text-[var(--tl-ink-3)]">
                    <th className="px-4 py-2 font-medium">Column</th>
                    <th className="px-4 py-2 font-medium">Required</th>
                    <th className="hidden px-4 py-2 font-medium sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {columnGuide.map((col) => (
                    <tr key={col.name} className="border-b border-[var(--tl-line)] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--tl-ink)]">{col.name}</td>
                      <td className="px-4 py-2.5 text-[var(--tl-ink-2)]">{col.required ? 'Yes' : 'Optional'}</td>
                      <td className="hidden px-4 py-2.5 text-[var(--tl-ink-3)] sm:table-cell">{col.hint ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={templateHref} download>
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Download example CSV
              </a>
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/pdf,image/png,image/jpeg,image/webp,image/gif,image/bmp"
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              onFilePick(f);
            }}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFilePick(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-2 rounded-[var(--tl-radius-sm)] border border-dashed px-4 py-10 text-center transition-colors',
              dragOver
                ? 'border-[color-mix(in_srgb,var(--tl-accent)_40%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-accent)_6%,white)]'
                : 'border-[var(--tl-line)] bg-[var(--tl-bg)] hover:border-[color-mix(in_srgb,var(--tl-accent)_25%,var(--tl-line))]',
              busy && 'opacity-70'
            )}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--tl-surface)] text-[var(--tl-ink-2)] shadow-[var(--shadow-elevated)]">
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-[14px] font-semibold text-[var(--tl-ink)]">
              {busy ? 'Importing…' : 'Drop your file here or browse'}
            </span>
            <span className="max-w-sm text-[12px] text-[var(--tl-ink-3)]">
              {fileName && busy ? fileName : 'CSV, Excel, PDF, or image — max 8 MB'}
            </span>
          </button>

          {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
          {message ? (
            <AdminAlertBanner tone="success">
              <span className="whitespace-pre-wrap">{message}</span>
            </AdminAlertBanner>
          ) : null}

          <div className="flex justify-end border-t border-[var(--tl-line)] pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
