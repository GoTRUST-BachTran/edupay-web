import * as XLSX from 'xlsx';
import { detectHeader } from './header-detector.js';
import { mapColumns } from './column-mapper.js';
import { extractData } from './data-extractor.js';
import { getDataRange } from '../utils/excel-helpers.js';

/**
 * Parse a school Excel file and extract all student records.
 *
 * @param {string} filePath - Path to .xls/.xlsx file
 * @param {Array} services - Service definitions with aliases
 * @returns {{
 *   schoolName: string | null,
 *   period: string | null,
 *   sheets: Array<{
 *     sheetName: string,
 *     className: string,
 *     records: Array,
 *     columnMapping: object,
 *     unmappedColumns: Array,
 *   }>,
 *   totalRecords: number,
 *   errors: Array<{ sheet: string, message: string }>,
 * }}
 */
/**
 * Parse a school workbook object (already loaded via XLSX.read or XLSX.readFile).
 * Used by both CLI and browser.
 */
export function parseSchoolWorkbook(workbook, services) {
  const result = {
    schoolName: null,
    period: null,
    sheets: [],
    totalRecords: 0,
    errors: [],
  };

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    // Detect header
    const header = detectHeader(worksheet, sheetName);
    if (!header) {
      result.errors.push({
        sheet: sheetName,
        message: `Không detect được header trong sheet "${sheetName}"`,
      });
      continue;
    }

    // Capture school name and period from first sheet
    if (!result.schoolName && header.schoolName) {
      result.schoolName = header.schoolName;
    }
    if (!result.period && header.period) {
      result.period = header.period;
    }

    // Map columns
    const { fixedColumns, serviceColumns, unmappedColumns } = mapColumns(
      worksheet,
      header.headerStartRow,
      header.headerEndRow,
      header.colCount,
      services,
    );

    // Validate required fixed columns
    if (fixedColumns.hoTen === -1) {
      result.errors.push({
        sheet: sheetName,
        message: `Không tìm thấy cột "Họ và Tên" trong sheet "${sheetName}"`,
      });
      continue;
    }
    if (fixedColumns.maHS === -1) {
      result.errors.push({
        sheet: sheetName,
        message: `Không tìm thấy cột "Mã HS" trong sheet "${sheetName}"`,
      });
      continue;
    }

    // Get data range
    const dataRange = getDataRange(worksheet);

    // Extract data
    const records = extractData(
      worksheet,
      header.dataStartRow,
      dataRange.endRow,
      fixedColumns,
      serviceColumns,
      sheetName,
    );

    result.sheets.push({
      sheetName,
      className: header.className,
      records,
      columnMapping: { fixedColumns, serviceColumns },
      unmappedColumns,
    });

    result.totalRecords += records.length;
  }

  return result;
}

/**
 * Parse a school Excel file from file path (CLI entry point).
 */
export function parseSchoolFile(filePath, services) {
  const workbook = XLSX.readFile(filePath);
  return parseSchoolWorkbook(workbook, services);
}
