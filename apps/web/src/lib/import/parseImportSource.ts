import type { TabularParseResult } from './tabular';
import { parseCsvBufferAuto } from './tabular';
import { parseExcelBufferAuto } from './excelAuto';
import { extractPdfText, extractedTextToTabularRows } from './pdfText';
import { extractImageText } from './imageOcr';

export function isImageImportFile(file: File, nameLower: string): boolean {
  const t = file.type?.toLowerCase() ?? '';
  if (t.startsWith('image/') && t !== 'image/svg+xml') return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(nameLower);
}

export type ImportParseMessages = {
  pdf422: string;
  image422: string;
  unsupported400: string;
};

export async function parseImportFileToTabular(
  buf: Buffer,
  file: File,
  messages: ImportParseMessages
): Promise<
  | { ok: true; tab: TabularParseResult }
  | { ok: false; status: 400 | 422; error: string }
> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.pdf')) {
      const text = await extractPdfText(buf);
      const t = extractedTextToTabularRows(text);
      if (!t?.rows?.length) {
        return { ok: false, status: 422, error: messages.pdf422 };
      }
      return { ok: true, tab: t };
    }
    if (name.endsWith('.csv')) {
      return { ok: true, tab: parseCsvBufferAuto(buf) };
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return { ok: true, tab: parseExcelBufferAuto(buf) };
    }
    if (isImageImportFile(file, name)) {
      const text = await extractImageText(buf);
      const t = extractedTextToTabularRows(text);
      if (!t?.rows?.length) {
        return { ok: false, status: 422, error: messages.image422 };
      }
      return { ok: true, tab: t };
    }
    return { ok: false, status: 400, error: messages.unsupported400 };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      error: e instanceof Error ? e.message : 'Failed to parse file.',
    };
  }
}
