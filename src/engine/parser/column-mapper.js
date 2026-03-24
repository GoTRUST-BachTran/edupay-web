import { getCellString } from '../utils/excel-helpers.js';
import { findBestMatch, normalize, containsAny } from '../utils/fuzzy-match.js';
import { SKIP_KEYWORDS, QUANTITY_KEYWORDS, CARRYOVER_KEYWORDS } from '../config/services.js';

/**
 * @typedef {Object} ColumnMapping
 * @property {number} colIndex
 * @property {string} serviceCode
 * @property {'quantity' | 'amount'} type
 * @property {string} headerText - Original header text for debugging
 */

/**
 * Map worksheet columns to service codes by analyzing multi-row headers.
 *
 * @param {object} worksheet
 * @param {number} headerStartRow
 * @param {number} headerEndRow
 * @param {number} colCount
 * @param {Array} services - Service definitions with aliases
 * @returns {{
 *   fixedColumns: { stt: number, soBienLai: number, hoTen: number, maHS: number },
 *   serviceColumns: ColumnMapping[],
 *   unmappedColumns: Array<{ colIndex: number, headerText: string }>,
 * }}
 */
export function mapColumns(worksheet, headerStartRow, headerEndRow, colCount, services) {
  // Step 1: Build flattened headers — combine all header rows per column
  const flatHeaders = [];
  for (let c = 0; c < colCount; c++) {
    const parts = [];
    for (let r = headerStartRow; r <= headerEndRow; r++) {
      const val = getCellString(worksheet, r, c);
      if (val) parts.push(val);
    }
    flatHeaders[c] = parts.join(' > ');
  }

  // Step 2: Identify fixed columns
  const fixedColumns = { stt: -1, soBienLai: -1, hoTen: -1, maHS: -1 };

  for (let c = 0; c < colCount; c++) {
    const norm = normalize(flatHeaders[c]);
    if (fixedColumns.stt === -1 && norm === 'stt') {
      fixedColumns.stt = c;
    } else if (fixedColumns.soBienLai === -1 && (norm.includes('bien lai') || norm.includes('so bien lai'))) {
      fixedColumns.soBienLai = c;
    } else if (fixedColumns.hoTen === -1 && (norm.includes('ho va ten') || norm.includes('ho ten') || norm.includes('ten hoc sinh'))) {
      fixedColumns.hoTen = c;
    } else if (fixedColumns.maHS === -1 && (norm.includes('ma hs') || norm.includes('ma hoc sinh') || norm === 'mshs')) {
      fixedColumns.maHS = c;
    }
  }

  // Step 3: Detect "return/refund" section boundary
  // School files have a "PHẦN TRẢ LẠI HỌC SINH" section at the end — skip those columns
  let returnSectionStart = colCount;
  for (let c = 0; c < colCount; c++) {
    const norm = normalize(flatHeaders[c]);
    if (norm.includes('tra lai') || norm.includes('phan tra lai') || norm.includes('tra lai hoc sinh')) {
      returnSectionStart = c;
      break;
    }
  }

  // Step 4: Map remaining columns to services (only before return section)
  const serviceColumns = [];
  const unmappedColumns = [];
  const fixedSet = new Set(Object.values(fixedColumns).filter(v => v >= 0));

  for (let c = 0; c < returnSectionStart; c++) {
    if (fixedSet.has(c)) continue;

    const headerText = flatHeaders[c];
    if (!headerText) continue;

    const norm = normalize(headerText);

    // Skip known non-service columns
    if (containsAny(headerText, SKIP_KEYWORDS)) continue;

    // Skip carry-over columns ("Tồn tháng trước") — we only want "Thu mới"
    if (isCarryoverColumn(headerText) && !isNewCollectionColumn(headerText)) continue;

    // Try to match service
    const match = findBestMatch(headerText, services);
    if (match) {
      const type = isQuantityColumn(headerText) ? 'quantity' : 'amount';
      serviceColumns.push({
        colIndex: c,
        serviceCode: match.code,
        type,
        headerText,
      });
    } else {
      // Check if it's a quantity sub-header for the previous service column
      if (isQuantityColumn(headerText) && serviceColumns.length > 0) {
        continue;
      }

      unmappedColumns.push({ colIndex: c, headerText });
    }
  }

  // Step 4: Resolve quantity/amount pairs
  resolveQuantityAmountPairs(serviceColumns);

  return { fixedColumns, serviceColumns, unmappedColumns };
}

/**
 * Check if header text indicates a carry-over (tồn) column.
 */
function isCarryoverColumn(headerText) {
  const norm = normalize(headerText);
  return CARRYOVER_KEYWORDS.some(kw => norm.includes(normalize(kw)));
}

/**
 * Check if header text indicates a new collection (thu mới) column.
 */
function isNewCollectionColumn(headerText) {
  const norm = normalize(headerText);
  return norm.includes('thu moi') || norm.includes('thu mới');
}

/**
 * Check if a header indicates quantity (count), not amount.
 */
function isQuantityColumn(headerText) {
  const norm = normalize(headerText);
  return QUANTITY_KEYWORDS.some(kw => norm.includes(normalize(kw)));
}

/**
 * Post-process: when we have two columns for the same service,
 * ensure one is 'quantity' and the other is 'amount'.
 *
 * Pattern: for services with hasQuantity, consecutive columns are [SL, Tiền].
 */
function resolveQuantityAmountPairs(serviceColumns) {
  // Group by serviceCode
  const groups = {};
  for (const col of serviceColumns) {
    if (!groups[col.serviceCode]) groups[col.serviceCode] = [];
    groups[col.serviceCode].push(col);
  }

  for (const [code, cols] of Object.entries(groups)) {
    if (cols.length === 2) {
      // Sort by column index
      cols.sort((a, b) => a.colIndex - b.colIndex);
      // First is quantity, second is amount (standard Vietnamese accounting pattern)
      cols[0].type = 'quantity';
      cols[1].type = 'amount';
    }
    // If only 1 column → keep as 'amount' (default)
  }
}
