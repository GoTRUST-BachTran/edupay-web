import * as XLSX from 'xlsx';
import { getActiveServices } from '../mapper/validator.js';
import { getServiceByCode } from '../config/services.js';

/**
 * Create EduPay output .xlsx file.
 *
 * @param {Array} records - EduPay output records
 * @param {object} templateWorkbook - Original template workbook (to copy sheets)
 * @param {Array<{ code: string, displayName: string }>} templateServices - Services from template
 * @param {string} outputPath - Output file path
 * @param {object} [options] - Output options
 * @param {boolean} [options.showZero=false] - Hiển thị khoản thu 0đ (SL=1, Tiền=0) thay vì để trống
 */
/**
 * Build EduPay output workbook (no file I/O).
 * Used by both CLI and browser.
 */
export function buildOutputWorkbook(records, templateWorkbook, templateServices, options = {}) {
  const { showZero = false } = options;
  const workbook = XLSX.utils.book_new();

  // Determine active services (maintain template order)
  const activeServiceCodes = getActiveServices(records);
  const orderedServices = templateServices.filter(s => activeServiceCodes.includes(s.code));

  // Build "Phiếu thu" sheet
  const sheetData = [];

  // Row 1: Display headers — mỗi dịch vụ luôn có cặp SL + Tiền + cột Tổng cuối
  const headerRow1 = ['STT', 'Mã học sinh', 'Tên học sinh', 'Lớp'];
  for (const service of orderedServices) {
    headerRow1.push(`SL ${service.displayName}`);
    headerRow1.push(service.displayName);
  }
  headerRow1.push('Tổng tiền');
  sheetData.push(headerRow1);

  // Row 2: Service codes (for EduPay import)
  const headerRow2 = ['', '', '', ''];
  for (const service of orderedServices) {
    headerRow2.push(`SL_${service.code}`);
    headerRow2.push(service.code);
  }
  headerRow2.push('TOTAL');
  sheetData.push(headerRow2);

  // Data rows
  // Mode "showZero": Tất cả dịch vụ đều hiện (SL=1, Tiền=0) — để cô kế toán thấy trên phiếu thu
  // Mode default: SL = 0/null → trống, Amount = 0 → trống
  // Nếu không có SL từ file trường nhưng có amount → SL = 1
  for (const record of records) {
    const row = [record.stt, record.maHocSinh, record.tenHocSinh, record.lop];
    let totalAmount = 0;

    for (const service of orderedServices) {
      const value = record.services.get(service.code);

      const amount = value ? value.amount : 0;

      // SL trong EduPay luôn = 1 nếu có tiền (bao gồm số âm = hoàn trả/điều chỉnh)
      const sl = amount !== 0 ? 1 : null;

      totalAmount += amount;

      if (showZero) {
        // "Hiển thị khoản thu 0đ": ghi SL=1 và Tiền=0 cho dịch vụ không có dữ liệu
        row.push(sl && sl > 0 ? sl : (amount === 0 ? 1 : ''));
        row.push(amount);
      } else {
        // "Không hiển thị khoản thu 0đ": để trống nếu = 0/null
        row.push(sl && sl > 0 ? sl : '');
        row.push(amount !== 0 ? amount : '');
      }
    }

    row.push(totalAmount !== 0 ? totalAmount : '');
    sheetData.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  const colWidths = [
    { wch: 5 },   // STT
    { wch: 12 },  // Mã HS
    { wch: 25 },  // Tên
    { wch: 10 },  // Lớp
  ];
  for (const service of orderedServices) {
    colWidths.push({ wch: 8 });  // SL
    colWidths.push({ wch: 15 }); // Amount
  }
  colWidths.push({ wch: 15 }); // Tổng tiền
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, ws, 'Phiếu thu');

  // Copy supplementary sheets from template
  const sheetsToClone = ['Hướng dẫn', 'Danh sách học sinh', 'Dịch vụ kế toán'];
  for (const name of sheetsToClone) {
    if (templateWorkbook.Sheets[name]) {
      // Deep clone sheet by converting to JSON and back
      const data = XLSX.utils.sheet_to_json(templateWorkbook.Sheets[name], { header: 1, defval: '' });
      const clonedSheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, clonedSheet, name);
    }
  }

  return workbook;
}

/**
 * Write EduPay output to file (CLI entry point).
 */
export function writeOutput(records, templateWorkbook, templateServices, outputPath, options = {}) {
  const workbook = buildOutputWorkbook(records, templateWorkbook, templateServices, options);
  XLSX.writeFile(workbook, outputPath);
}
