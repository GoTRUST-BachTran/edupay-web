/**
 * Validate mapped records and collect additional warnings.
 *
 * @param {Array} records - EduPay output records
 * @param {Array} warnings - Existing warnings from record-mapper
 * @param {Array} [parsedSheets] - Parsed sheets (for unmapped column validation)
 * @returns {Array} Combined warnings
 */
export function validateRecords(records, warnings, parsedSheets) {
  const allWarnings = [...warnings];
  const AMOUNT_THRESHOLD = 10_000_000; // 10 triệu VND

  for (const record of records) {
    for (const [code, value] of record.services) {
      // Check for unusually high amounts
      if (value.amount > AMOUNT_THRESHOLD) {
        allWarnings.push({
          sheet: '-',
          row: record.stt,
          maHS: record.maHocSinh,
          message: `Số tiền ${code} = ${value.amount.toLocaleString('vi-VN')} đ (bất thường — > ${AMOUNT_THRESHOLD.toLocaleString('vi-VN')} đ)`,
        });
      }

      // Check for negative amounts
      if (value.amount < 0) {
        allWarnings.push({
          sheet: '-',
          row: record.stt,
          maHS: record.maHocSinh,
          message: `Số tiền ${code} = ${value.amount} (âm — hoàn trả/điều chỉnh)`,
        });
      }
    }
  }

  // Check unmapped columns (dịch vụ file cô có mà EduPay không nhận diện được)
  if (parsedSheets) {
    const seen = new Set();
    for (const sheet of parsedSheets) {
      for (const col of (sheet.unmappedColumns || [])) {
        if (!seen.has(col.headerText)) {
          seen.add(col.headerText);
          allWarnings.push({
            sheet: sheet.sheetName,
            row: 0,
            maHS: '-',
            message: `Cột "${col.headerText}" trong file cô không map được sang dịch vụ EduPay`,
          });
        }
      }
    }
  }

  return allWarnings;
}

/**
 * Determine which services are actually used across all records.
 *
 * @param {Array} records
 * @returns {string[]} Service codes with at least 1 non-zero record
 */
export function getActiveServices(records) {
  const serviceTotals = new Map();

  for (const record of records) {
    for (const [code, value] of record.services) {
      if (!serviceTotals.has(code)) serviceTotals.set(code, 0);
      serviceTotals.set(code, serviceTotals.get(code) + value.amount);
    }
  }

  return [...serviceTotals.entries()]
    .filter(([, total]) => total !== 0)
    .map(([code]) => code);
}
