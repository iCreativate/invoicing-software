import * as XLSX from 'xlsx';
import type { TabularParseResult } from './tabular';

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

const HEADER_HINT =
  /date|amount|email|description|qty|quantity|price|total|invoice|quote|client|expense|currency|due|vat|unit|tax|memo|merchant|category|balance|debit|credit|valid/i;

function scoreHeaderCandidate(row: unknown[]): number {
  const cells = row.map((c) => String(c ?? '').trim()).filter((c) => c.length > 0);
  if (cells.length < 2) return -Infinity;
  let s = 0;
  for (const c of cells) {
    if (HEADER_HINT.test(c)) s += 4;
    if (/^[\d.,\s%-]+$/.test(c) && !/[a-z]/i.test(c)) s -= 2;
  }
  return s;
}

function matrixToTabular(matrix: string[][], headerRowIndex: number): TabularParseResult {
  const headers = matrix[headerRowIndex].map((c) => String(c ?? '').trim());
  if (!headers.some(Boolean)) throw new Error('Excel header row is empty.');
  const dataRows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((c) => String(c ?? '').trim() !== ''));
  return { headers, rows: rowObjects(headers, dataRows) };
}

function countDataRows(matrix: string[][], afterHeader: number): number {
  return matrix.slice(afterHeader + 1).filter((row) => row.some((c) => String(c ?? '').trim() !== '')).length;
}

/** Choose header row: prefer rows that look like labels (keywords) and have data beneath. */
function bestHeaderRowForSheet(matrix: string[][]): number {
  if (!matrix.length) return 0;
  const maxScan = Math.min(25, matrix.length);
  let bestIdx = 0;
  let bestWeight = -Infinity;
  for (let i = 0; i < maxScan; i++) {
    const hdr = scoreHeaderCandidate(matrix[i]);
    const dataRows = countDataRows(matrix, i);
    if (dataRows === 0) continue;
    const cells = matrix[i].map((c) => String(c ?? '').trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const weight = hdr * 20 + Math.min(dataRows, 10_000);
    if (weight > bestWeight) {
      bestWeight = weight;
      bestIdx = i;
    }
  }
  if (bestWeight > -Infinity) return bestIdx;
  for (let i = 0; i < Math.min(10, matrix.length); i++) {
    if (countDataRows(matrix, i) > 0) return i;
  }
  return 0;
}

/**
 * Picks the sheet and header row automatically (skips title rows / blank rows above the table).
 */
export function parseExcelBufferAuto(buffer: Buffer): TabularParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  if (!wb.SheetNames.length) throw new Error('Excel file has no sheets.');

  let best: { matrix: string[][]; headerIdx: number } | null = null;
  let bestWeight = -1;

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
    if (!matrix.length) continue;
    const norm = matrix.map((row) => row.map((c) => String(c ?? '')));
    const headerIdx = bestHeaderRowForSheet(norm);
    const dataRows = countDataRows(norm, headerIdx);
    if (dataRows === 0) continue;
    const hint = scoreHeaderCandidate(norm[headerIdx]);
    const weight = dataRows * 1000 + hint;
    if (weight > bestWeight) {
      bestWeight = weight;
      best = { matrix: norm, headerIdx };
    }
  }

  if (!best) throw new Error('Excel workbook has no usable data.');
  return matrixToTabular(best.matrix, best.headerIdx);
}
