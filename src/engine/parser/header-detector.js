import { getCellString, getCellValue } from '../utils/excel-helpers.js';
import { normalize } from '../utils/fuzzy-match.js';

/**
 * Detect header region and metadata from a school worksheet.
 *
 * @param {object} worksheet - XLSX worksheet
 * @param {string} sheetName - Sheet name (e.g. "A1")
 * @returns {{
 *   headerStartRow: number,
 *   headerEndRow: number,
 *   dataStartRow: number,
 *   className: string,
 *   schoolName: string | null,
 *   period: string | null,
 *   colCount: number,
 * }}
 */
export function detectHeader(worksheet, sheetName) {
  let headerStartRow = -1;
  let dataStartRow = -1;
  let schoolName = null;
  let period = null;
  let className = sheetName; // Default: use sheet name

  // Scan first 20 rows to find anchor keywords
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 30; c++) {
      const val = getCellString(worksheet, r, c);
      if (!val) continue;

      const norm = normalize(val);

      // Extract school name (usually row 0-2)
      if (norm.includes('truong') && !schoolName) {
        schoolName = val;
      }

      // Extract period (e.g. "Tháng 3 Năm 2026")
      if ((norm.includes('thang') && norm.includes('nam')) || norm.match(/thang\s*\d+/)) {
        period = val;
      }

      // Extract class name from header text (e.g. "Lớp: A1")
      const classMatch = val.match(/[Ll][ớo]p[:\s]*([A-Za-z0-9]+)/);
      if (classMatch) {
        className = classMatch[1];
      }

      // Find header start: row containing "STT" or "Mã HS"
      if (headerStartRow === -1) {
        if (norm === 'stt' || norm.includes('ma hs') || norm.includes('ma hoc sinh')) {
          headerStartRow = r;
        }
      }
    }
  }

  if (headerStartRow === -1) {
    // Fallback: find first row with multiple non-empty cells (likely header)
    for (let r = 0; r < 20; r++) {
      let nonEmpty = 0;
      for (let c = 0; c < 30; c++) {
        if (getCellString(worksheet, r, c)) nonEmpty++;
      }
      if (nonEmpty >= 5) {
        headerStartRow = r;
        break;
      }
    }
  }

  if (headerStartRow === -1) {
    return null; // Cannot detect header
  }

  // Find data start row: first row after header where col A is a number (STT)
  // and there's a value in the name/maHS columns
  for (let r = headerStartRow + 1; r < headerStartRow + 10; r++) {
    const colA = getCellValue(worksheet, r, 0);
    const hasNumber = typeof colA === 'number' || (typeof colA === 'string' && /^\d+$/.test(colA.trim()));

    if (hasNumber) {
      // Verify this looks like data (has a name or student code)
      let hasName = false;
      for (let c = 1; c <= 5; c++) {
        const val = getCellString(worksheet, r, c);
        if (val && val.length > 1 && !/^\d+$/.test(val)) {
          hasName = true;
          break;
        }
      }
      if (hasName) {
        dataStartRow = r;
        break;
      }
    }
  }

  if (dataStartRow === -1) {
    dataStartRow = headerStartRow + 1; // Fallback
  }

  const headerEndRow = dataStartRow - 1;

  // Determine column count from header region
  let colCount = 0;
  for (let r = headerStartRow; r <= headerEndRow; r++) {
    for (let c = 0; c < 50; c++) {
      if (getCellString(worksheet, r, c)) {
        colCount = Math.max(colCount, c + 1);
      }
    }
  }

  return {
    headerStartRow,
    headerEndRow,
    dataStartRow,
    className,
    schoolName,
    period,
    colCount,
  };
}
