import { getCellValue, getCellString, isFooterRow, isEmptyRow } from '../utils/excel-helpers.js';
import { parseMoney } from '../utils/money-parser.js';

/**
 * Extract student data rows from a worksheet.
 *
 * @param {object} worksheet
 * @param {number} dataStartRow
 * @param {number} endRow - Max row to scan
 * @param {{ stt: number, soBienLai: number, hoTen: number, maHS: number }} fixedColumns
 * @param {import('./column-mapper.js').ColumnMapping[]} serviceColumns
 * @param {string} sheetName
 * @returns {import('../../types.js').SchoolRecord[]}
 */
export function extractData(worksheet, dataStartRow, endRow, fixedColumns, serviceColumns, sheetName) {
  const records = [];
  let consecutiveEmpty = 0;

  for (let r = dataStartRow; r <= endRow; r++) {
    // Stop conditions
    if (consecutiveEmpty >= 5) break;

    if (isEmptyRow(worksheet, r, 0, Math.max(...serviceColumns.map(c => c.colIndex), fixedColumns.maHS, 10))) {
      consecutiveEmpty++;
      continue;
    }
    consecutiveEmpty = 0;

    // Skip footer rows
    if (isFooterRow(worksheet, r, 0, fixedColumns.maHS + 20)) continue;

    // Extract fixed columns
    const hoTen = getCellString(worksheet, r, fixedColumns.hoTen);
    const maHS = getCellString(worksheet, r, fixedColumns.maHS);

    // Skip rows without student code (not a data row)
    if (!maHS) continue;

    const stt = getCellValue(worksheet, r, fixedColumns.stt);
    const soBienLai = fixedColumns.soBienLai >= 0
      ? getCellString(worksheet, r, fixedColumns.soBienLai)
      : null;

    // Extract service values
    const services = new Map();

    for (const col of serviceColumns) {
      const rawValue = getCellValue(worksheet, r, col.colIndex);
      const value = parseMoney(rawValue);

      if (!services.has(col.serviceCode)) {
        services.set(col.serviceCode, { quantity: null, amount: 0 });
      }

      const entry = services.get(col.serviceCode);
      if (col.type === 'quantity') {
        // Quantity can be a plain number (not money format)
        const qty = typeof rawValue === 'number'
          ? Math.round(rawValue)
          : (rawValue ? parseInt(String(rawValue).replace(/[^0-9-]/g, ''), 10) || 0 : 0);
        // Last wins: cột sau (Thu mới) overwrite cột trước (Tồn tháng trước)
        entry.quantity = qty;
      } else {
        // Last wins: cột sau (Thu mới) overwrite cột trước (Tồn tháng trước)
        entry.amount = value;
      }
    }

    records.push({
      sheetName,
      rowIndex: r + 1, // 1-based for human-readable reporting
      stt: typeof stt === 'number' ? stt : parseInt(String(stt), 10) || null,
      soBienLai,
      hoTen,
      maHS: String(maHS).trim(),
      services,
    });
  }

  return records;
}
