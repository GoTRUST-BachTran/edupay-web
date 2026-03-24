/**
 * Map parsed school records to EduPay output records.
 *
 * @param {Array} parsedSheets - From school-parser output
 * @param {Map<string, { name: string, class: string }>} students - Student lookup from template
 * @returns {{
 *   records: Array<{
 *     stt: number,
 *     maHocSinh: string,
 *     tenHocSinh: string,
 *     lop: string,
 *     services: Map<string, { sl: number | null, amount: number }>,
 *   }>,
 *   warnings: Array<{ sheet: string, row: number, maHS: string, message: string }>,
 * }}
 */
export function mapRecords(parsedSheets, students) {
  const records = [];
  const warnings = [];
  let stt = 0;

  for (const sheet of parsedSheets) {
    for (const record of sheet.records) {
      stt++;

      // Lookup student in template DSHS
      const student = students.get(record.maHS);
      let tenHocSinh;
      let lop;

      if (student) {
        tenHocSinh = student.name;
        lop = student.class;

        // Check tên lệch giữa file cô và DSHS
        const schoolName = (record.hoTen || '').trim();
        const dsName = student.name.trim();
        if (schoolName && dsName && schoolName !== dsName) {
          warnings.push({
            sheet: sheet.sheetName,
            row: record.rowIndex,
            maHS: record.maHS,
            message: `Tên lệch: file cô "${schoolName}" ≠ DSHS "${dsName}"`,
          });
        }
      } else {
        // Student not in DSHS — use school file data, add warning
        tenHocSinh = record.hoTen;
        lop = `Lớp ${sheet.className}`;
        warnings.push({
          sheet: sheet.sheetName,
          row: record.rowIndex,
          maHS: record.maHS,
          message: `Mã HS "${record.maHS}" không tìm thấy trong Danh sách học sinh`,
        });
      }

      // Map services — include non-zero values (bao gồm số âm = hoàn trả/điều chỉnh)
      const services = new Map();
      for (const [code, value] of record.services) {
        if (value.amount !== 0 || (value.quantity !== null && value.quantity !== 0)) {
          services.set(code, {
            sl: value.quantity,
            amount: value.amount,
          });
        }
      }

      records.push({
        stt,
        maHocSinh: record.maHS,
        tenHocSinh,
        lop,
        services,
      });
    }
  }

  // Check lớp từ file cô không có trong DSHS
  const dsClasses = new Set([...students.values()].map(s => s.class));
  const schoolClasses = new Set(parsedSheets.map(s => s.className));
  for (const cls of schoolClasses) {
    // Normalize: "A1" → match "Lớp A1" in DSHS
    const hasMatch = [...dsClasses].some(dc =>
      dc === cls || dc === `Lớp ${cls}` || dc.replace(/^Lớp\s*/, '') === cls,
    );
    if (!hasMatch) {
      warnings.push({
        sheet: cls,
        row: 0,
        maHS: '-',
        message: `Lớp "${cls}" từ file cô không tìm thấy trong DSHS`,
      });
    }
  }

  // Sort by class → STT
  records.sort((a, b) => {
    const classCompare = a.lop.localeCompare(b.lop, 'vi');
    if (classCompare !== 0) return classCompare;
    return a.stt - b.stt;
  });

  // Re-number STT after sorting
  records.forEach((r, i) => { r.stt = i + 1; });

  return { records, warnings };
}
