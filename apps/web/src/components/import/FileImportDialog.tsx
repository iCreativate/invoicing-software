'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { notifyError, notifySuccess } from '@/lib/notify';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  /** e.g. /api/expenses/import */
  endpoint: string;
  /** Public path to example CSV */
  templateHref: string;
  onSuccess?: () => void;
};

export function FileImportDialog({ open, onOpenChange, title, description, endpoint, templateHref, onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runImport = async (file: File) => {
    setBusy(true);
    setError(null);
    setMessage(null);
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
          'Nothing was saved — check column names (see example CSV) and date/amount formats. If you are on Expenses, switch the period filter to “All time” to see older rows.'
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

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <div className="mt-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>CSV</strong> delimiter (comma, semicolon, tab) and UTF-8 BOM are detected automatically.{' '}
            <strong>Excel</strong> picks the sheet and header row (skips common title rows). <strong>PDF</strong> and{' '}
            <strong>images</strong> use text/OCR plus automatic table detection (comma, tab, semicolon, or space-aligned
            columns). Clear headers and legible screenshots improve results.
          </p>
          <div>
            <a
              href={templateHref}
              download
              className="text-sm font-medium text-primary underline"
            >
              Download example CSV
            </a>
          </div>
          <div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/pdf,image/png,image/jpeg,image/webp,image/gif,image/bmp"
              disabled={busy}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void runImport(f);
              }}
            />
          </div>
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}
          {message ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">{message}</div>
          ) : null}
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
