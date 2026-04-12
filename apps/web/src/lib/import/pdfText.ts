import type { TabularParseResult } from './tabular';
import { parseCsvString, parseDelimitedString, parseTsvString } from './tabular';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod = await import('pdf-parse');
  const pdfParse = (mod as unknown as { default?: (b: Buffer) => Promise<{ text: string }> }).default;
  if (typeof pdfParse !== 'function') {
    throw new Error('pdf-parse module could not be loaded.');
  }
  const res = await pdfParse(buffer);
  return String(res.text ?? '');
}

/**
 * Try to recover CSV-like tabular data from PDF text (first table-like block).
 */
export function pdfTextToTabularRows(text: string): TabularParseResult | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commaCount = (line.match(/,/g) ?? []).length;
    if (commaCount >= 2) {
      const block = lines.slice(i).join('\n');
      try {
        return parseCsvString(block);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Recover tabular data from plain text (PDF text, OCR). Tries comma CSV, semicolon, then tab-separated.
 */
export function extractedTextToTabularRows(text: string): TabularParseResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const comma = pdfTextToTabularRows(trimmed);
  if (comma?.rows?.length) return comma;

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sc = (line.match(/;/g) ?? []).length;
    if (sc >= 2) {
      const block = lines.slice(i).join('\n');
      try {
        const t = parseDelimitedString(block, ';');
        if (t.rows.length) return t;
      } catch {
        /* try next */
      }
    }
  }

  const tabLines = lines.filter((l) => l.includes('\t'));
  if (tabLines.length >= 2) {
    try {
      const t = parseTsvString(tabLines.join('\n'));
      if (t.rows.length) return t;
    } catch {
      /* */
    }
  }

  const spaced = spaceAlignedTextToTabularRows(trimmed);
  if (spaced?.rows?.length) return spaced;

  return null;
}

/**
 * OCR often emits columns as multiple spaces (no commas). Detect a header row and fixed-width-style rows.
 */
export function spaceAlignedTextToTabularRows(text: string): TabularParseResult | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  function splitCells(line: string): string[] | null {
    const commas = (line.match(/,/g) ?? []).length;
    if (commas >= 2) return null;
    if (line.includes('\t')) {
      const p = line.split(/\t/).map((s) => s.trim());
      return p.length >= 2 ? p : null;
    }
    const parts = line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
    return parts.length >= 2 ? parts : null;
  }

  let headerIdx = -1;
  let colCount = 0;
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const cells = splitCells(lines[i]);
    if (cells && cells.length >= 2) {
      headerIdx = i;
      colCount = cells.length;
      break;
    }
  }
  if (headerIdx === -1) return null;

  const rawHeaders = splitCells(lines[headerIdx])!;
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((h, idx) => {
    const base = (h || `column_${idx}`).replace(/\s+/g, ' ').trim() || `column_${idx}`;
    const n = seen.get(base.toLowerCase()) ?? 0;
    seen.set(base.toLowerCase(), n + 1);
    return n ? `${base}_${n}` : base;
  });

  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = splitCells(lines[i]);
    if (!cells) continue;
    if (cells.length < 2) continue;
    if (Math.abs(cells.length - colCount) > 2) continue;
    const o: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      o[headers[c]] = cells[c] != null ? cells[c] : '';
    }
    rows.push(o);
  }

  if (!rows.length) return null;
  return { headers, rows };
}
