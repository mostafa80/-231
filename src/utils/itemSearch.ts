import { ReturnItem } from '../types';

export interface SearchMatchResult {
  item: ReturnItem;
  source: 'invoice' | 'master';
  matchReasons: ('barcode_ends_with' | 'barcode_contains' | 'price' | 'name' | 'category')[];
  invoiceQty?: number;
  highlightDigits?: string;
  score: number;
}

/**
 * Normalizes Arabic text for flexible matching:
 * - Unifies Alef shapes (أ, إ, آ -> ا)
 * - Unifies Taa Marbuta (ة -> ه)
 * - Unifies Yaa (ى -> ي)
 * - Strips diacritics / tashkeel
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

/**
 * Advanced multi-criteria search with absolute priority for Active Invoice items first,
 * followed by Master Catalog items.
 *
 * Supports searching by:
 * 1. Last 3 or 4 digits of barcode (e.g. "842", "1234")
 * 2. Selling Price (e.g. "150", "299", "75")
 * 3. Product Name (Arabic normalized, single or multi-word)
 * 4. Full or partial barcode / SKU
 */
export function searchItemsWithPriority(
  query: string,
  invoiceMap: Record<string, ReturnItem> | undefined | null,
  masterCatalog: Record<string, ReturnItem> | undefined | null,
  limit: number = 25
): SearchMatchResult[] {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 1) return [];

  const lowerQ = cleanQ.toLowerCase();
  const normQ = normalizeArabic(cleanQ);
  const queryWords = normQ.split(/\s+/).filter(Boolean);
  const digitsOnly = cleanQ.replace(/\D/g, '');
  const isNumeric = !isNaN(Number(cleanQ)) && cleanQ.length > 0;
  const numericQ = isNumeric ? Number(cleanQ) : null;

  const invoiceItems = invoiceMap ? Object.values(invoiceMap) : [];
  const masterItems = masterCatalog ? Object.values(masterCatalog) : [];

  const invoiceResults: SearchMatchResult[] = [];
  const masterResults: SearchMatchResult[] = [];
  const seenCodes = new Set<string>();

  // Helper evaluator
  const evaluateItem = (item: ReturnItem, source: 'invoice' | 'master'): SearchMatchResult | null => {
    const reasons: ('barcode_ends_with' | 'barcode_contains' | 'price' | 'name' | 'category')[] = [];
    // Priority baseline: Invoice items (especially those with systemQty > 0 on the invoice sheet) strictly rank highest!
    let score = source === 'invoice' ? (item.systemQty > 0 ? 5000 : 2500) : 0;

    const codeUpper = (item.code || '').toUpperCase();
    const codeLower = (item.code || '').toLowerCase();
    const itemDigits = codeUpper.replace(/\D/g, '');

    // 1. Check exact, ends-with, or partial barcode
    if (codeLower === lowerQ || (digitsOnly.length >= 4 && itemDigits === digitsOnly)) {
      reasons.push('barcode_ends_with');
      score += 600; // Exact barcode match
    } else if (digitsOnly.length >= 2) {
      if (itemDigits.endsWith(digitsOnly) || codeLower.endsWith(lowerQ)) {
        reasons.push('barcode_ends_with');
        score += 350; // Strongest match for last digits!
      } else if (itemDigits.includes(digitsOnly) || codeLower.includes(lowerQ)) {
        reasons.push('barcode_contains');
        score += 100;
      }
    } else if (codeLower.includes(lowerQ)) {
      reasons.push('barcode_contains');
      score += 120;
    }

    // 2. Check Selling Price (سعر البيع)
    if (isNumeric && numericQ !== null) {
      if (Math.abs((item.price || 0) - numericQ) < 0.01) {
        reasons.push('price');
        score += 280; // Exact price match
      } else if (String(item.price || 0).startsWith(cleanQ)) {
        reasons.push('price');
        score += 80;
      }
    }

    // 3. Check Product Name (اسم المنتج - supports exact substring + multi-word tokens)
    const normItemName = normalizeArabic(item.itemName || '');
    if (normItemName.includes(normQ)) {
      reasons.push('name');
      if (normItemName === normQ) {
        score += 450;
      } else if (normItemName.startsWith(normQ)) {
        score += 300;
      } else {
        score += 180;
      }
    } else if (queryWords.length > 1 && queryWords.every((w) => normItemName.includes(w) || codeLower.includes(w))) {
      reasons.push('name');
      score += 150;
    }

    // 4. Check Category / Subcategory
    const normCat = normalizeArabic(item.fullCategory || item.category || '');
    if (normCat && normCat.includes(normQ)) {
      reasons.push('category');
      score += 50;
    }

    if (reasons.length === 0) return null;

    return {
      item,
      source,
      matchReasons: reasons,
      invoiceQty: source === 'invoice' ? item.systemQty : undefined,
      highlightDigits: digitsOnly.length >= 2 && reasons.includes('barcode_ends_with') ? digitsOnly : undefined,
      score,
    };
  };

  // 1. Process Invoice items first (Priority 1: Items in the Invoice Sheet)
  for (const item of invoiceItems) {
    const key = (item.code || '').toUpperCase();
    if (!key || seenCodes.has(key)) continue;
    // Only treat as 'invoice' source if it's originally in the invoice sheet (systemQty > 0) or already in invoiceMap
    const isTrueInvoiceItem = (item.systemQty || 0) > 0;
    const res = evaluateItem(item, isTrueInvoiceItem ? 'invoice' : 'master');
    if (res) {
      seenCodes.add(key);
      if (isTrueInvoiceItem) {
        invoiceResults.push(res);
      } else {
        masterResults.push(res);
      }
    }
  }

  // 2. Process Master items second (Priority 2: General Master Catalog)
  for (const item of masterItems) {
    const key = (item.code || '').toUpperCase();
    if (!key || seenCodes.has(key)) continue;
    const res = evaluateItem(item, 'master');
    if (res) {
      seenCodes.add(key);
      masterResults.push(res);
    }
  }

  // Sort within each category by score descending
  invoiceResults.sort((a, b) => b.score - a.score);
  masterResults.sort((a, b) => b.score - a.score);

  // Combine: Invoice sheet items STRICTLY come first, then Master items
  const combined = [...invoiceResults, ...masterResults];
  return combined.slice(0, limit);
}
