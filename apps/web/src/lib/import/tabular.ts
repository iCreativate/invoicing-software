import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import * as XLSX from 'xlsx';

export type TabularParseResult = {
  headers: string[];
  rows: Record<string, string>[];
};

const UTF8_BOM = '\ufeff';

function stripUtf8Bom(text: string): string {
  return text.startsWith(UTF8_BOM) ? text.slice(1) : text;
}

function papaParsedToTabular(parsed: ParseResult<string[]>): TabularParseResult {
  // Only abort on broken quoting; FieldMismatch often appears on ragged bank CSVs but rows still parse.
  if (parsed.errors?.length) {
    const fatal = parsed.errors.find((e) => e.type === 'Quotes');
    if (fatal) throw new Error(`Table parse error: ${fatal.message}`);
  }
  const fields = parsed.meta.fields?.filter(Boolean) as string[] | undefined;
  if (!fields?.length) throw new Error('No header row.');
  const rows = (parsed.data as unknown as Record<string, unknown>[]).map((r) => {
    const o: Record<string, string> = {};
    for (const f of fields) {
      const v = r[f];
      o[f] = v == null ? '' : String(v).trim();
    }
    return o;
  });
  return { headers: fields, rows };
}

function rowObjects(headers: string[], dataRows: string[][]): Record<string, string>[] {
  const norm = headers.map((h) => String(h ?? '').trim());
  return dataRows.map((cells) => {
    const o: Record<string, string> = {};
    norm.forEach((h, i) => {
      if (!h) return;
      o[h] = cells[i] != null ? String(cells[i]).trim() : '';
    });
    return o;
  });
}

export function parseDelimitedString(text: string, delimiter: string): TabularParseResult {
  const parsed = Papa.parse<string[]>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (h) => String(h ?? '').trim(),
  });
  return papaParsedToTabular(parsed);
}

/**
 * CSV/TSV-style text: strip UTF-8 BOM and let Papa Parse infer delimiter (comma, tab, semicolon, |, etc.).
 * Avoids wrong guesses from naive character counts.
 */
export function parseCsvBufferAuto(buffer: Buffer): TabularParseResult {
  const text = stripUtf8Bom(buffer.toString('utf8'));
  const parsed = Papa.parse<string[]>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => String(h ?? '').trim(),
  });
  return papaParsedToTabular(parsed);
}

export function parseCsvBuffer(buffer: Buffer): TabularParseResult {
  return parseDelimitedString(buffer.toString('utf8'), ',');
}

export function parseExcelBuffer(buffer: Buffer): TabularParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const name = wb.SheetNames[0];
  if (!name) throw new Error('Excel file has no sheets.');
  const sheet = wb.Sheets[name];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
  if (!matrix.length) throw new Error('Excel sheet is empty.');
  const headers = matrix[0].map((c) => String(c ?? '').trim());
  if (!headers.some(Boolean)) throw new Error('Excel first row must be headers.');
  const dataRows = matrix.slice(1).filter((row) => row.some((c) => String(c ?? '').trim() !== ''));
  return { headers, rows: rowObjects(headers, dataRows) };
}

export function parseCsvString(text: string): TabularParseResult {
  return parseDelimitedString(text, ',');
}

export function parseTsvString(text: string): TabularParseResult {
  return parseDelimitedString(text, '\t');
}

export function normalizeHeaderKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
