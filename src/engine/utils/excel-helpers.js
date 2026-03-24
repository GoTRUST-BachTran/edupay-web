import * as XLSX from 'xlsx';

/**
 * Get the effective value of a cell, resolving merged cell references.
 * If a cell is part of a merged range, returns the value from the top-left cell.
 *
 * @param {object} worksheet - XLSX worksheet
 * @param {number} row - 0-based row index
 * @param {number} col - 0-based column index
 * @returns {*} Cell value (string, number, or null)
 */
export function getCellValue(worksheet, row, col) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = worksheet[cellRef];

  if (cell !== undefined && cell.v !== undefined && cell.v !== null) {
    return cell.v;
  }

  // Check if this cell is part of a merged range
  const merges = worksheet['!merges'] || [];
  for (const merge of merges) {
    if (row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c) {
      // Return value from the top-left cell of the merged range
      const originRef = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
      const originCell = worksheet[originRef];
      if (originCell !== undefined && originCell.v !== undefined) {
        return originCell.v;
      }
      return null;
    }
  }

  return null;
}

/**
 * Get string value of a cell (trimmed).
 */
export function getCellString(worksheet, row, col) {
  const value = getCellValue(worksheet, row, col);
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Get the actual data range of a worksheet, ignoring trailing empty rows.
 * Excel 97-2003 (.xls) pads to 65535 rows.
 *
 * @param {object} worksheet
 * @returns {{ startRow: number, endRow: number, startCol: number, endCol: number }}
 */
export function getDataRange(worksheet) {
  const ref = worksheet['!ref'];
  if (!ref) return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };

  const range = XLSX.utils.decode_range(ref);

  // Scan FORWARD from row 0, tracking last row that has real cell data
  // (not just merged cell references). Stop after 10 consecutive empty rows.
  let lastDataRow = range.s.r;
  let consecutiveEmpty = 0;
  const maxScan = Math.min(range.e.r, 1000); // Never scan more than 1000 rows

  for (let r = range.s.r; r <= maxScan; r++) {
    let hasDirectValue = false;
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 30); c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellRef];
      if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
        hasDirectValue = true;
        break;
      }
    }

    if (hasDirectValue) {
      lastDataRow = r;
      consecutiveEmpty = 0;
    } else {
      consecutiveEmpty++;
      if (consecutiveEmpty > 10) break;
    }
  }

  return {
    startRow: range.s.r,
    endRow: lastDataRow,
    startCol: range.s.c,
    endCol: range.e.c,
  };
}

/**
 * Check if a row is part of a footer/summary section.
 * Indicators: large merged cells, "Tổng", "Cộng" keywords.
 */
export function isFooterRow(worksheet, row, startCol, endCol) {
  const merges = worksheet['!merges'] || [];

  // Check if this row has a merge spanning > 3 columns
  for (const merge of merges) {
    if (row >= merge.s.r && row <= merge.e.r) {
      const span = merge.e.c - merge.s.c + 1;
      if (span > 3 && merge.s.r >= row) return true;
    }
  }

  // Check for summary keywords in first few columns
  for (let c = startCol; c <= Math.min(endCol, startCol + 5); c++) {
    const val = getCellString(worksheet, row, c).toLowerCase();
    if (val.includes('tổng') || val.includes('cộng') || val.includes('total')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a row is completely empty.
 */
export function isEmptyRow(worksheet, row, startCol, endCol) {
  for (let c = startCol; c <= endCol; c++) {
    const val = getCellValue(worksheet, row, c);
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return false;
    }
  }
  return true;
}
