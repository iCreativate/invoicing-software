import { createWorker, PSM } from 'tesseract.js';

type PageLike = {
  text?: string | null;
  blocks?: Array<{
    paragraphs?: Array<{ lines?: Array<{ text?: string | null }> }>;
  }> | null;
};

/**
 * Prefer line-by-line text from layout blocks (better for table screenshots than a single blob).
 */
function textFromPageData(data: PageLike): string {
  const blocks = data.blocks;
  if (blocks?.length) {
    const lines: string[] = [];
    for (const block of blocks) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          const t = String(line.text ?? '')
            .replace(/\s+/g, ' ')
            .trim();
          if (t) lines.push(t);
        }
      }
    }
    if (lines.length) return lines.join('\n');
  }
  return String(data.text ?? '').trim();
}

/**
 * OCR for import: screenshots or photos of tables/spreadsheets.
 * English-first; numbers and typical email headers still work.
 */
export async function extractImageText(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng', undefined, {
    logger: () => {},
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });
    const { data } = await worker.recognize(buffer, {}, { text: true, blocks: true });
    return textFromPageData(data as PageLike);
  } finally {
    await worker.terminate();
  }
}
