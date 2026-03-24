import * as XLSX from 'xlsx';
import { getCellValue, getCellString } from '../utils/excel-helpers.js';

/**
 * Load student list and service definitions from EduPay template.
 *
 * @param {string} templatePath
 * @returns {{
 *   students: Map<string, { name: string, class: string }>,
 *   services: Array<{ code: string, displayName: string }>,
 *   templateWorkbook: object,
 * }}
 */
/**
 * Load template from an already-parsed XLSX workbook object.
 * Used by both CLI (after readFile) and browser (after XLSX.read).
 */
export function loadTemplateFromWorkbook(workbook) {
  const studentSheet = workbook.Sheets['Danh sách học sinh'];
  if (!studentSheet) {
    throw new Error('Template thiếu sheet "Danh sách học sinh"');
  }

  const students = new Map();
  const studentData = XLSX.utils.sheet_to_json(studentSheet, { header: 1, defval: '' });

  for (let i = 1; i < studentData.length; i++) {
    const row = studentData[i];
    const maHS = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const className = String(row[3] || '').trim();

    if (maHS && name) {
      students.set(maHS, { name, class: className });
    }
  }

  const serviceSheet = workbook.Sheets['Dịch vụ kế toán'];
  if (!serviceSheet) {
    throw new Error('Template thiếu sheet "Dịch vụ kế toán"');
  }

  const services = [];
  const serviceData = XLSX.utils.sheet_to_json(serviceSheet, { header: 1, defval: '' });

  for (let i = 1; i < serviceData.length; i++) {
    const row = serviceData[i];
    const displayName = String(row[1] || '').trim();
    const code = String(row[2] || '').trim();

    if (code && displayName) {
      services.push({ code, displayName });
    }
  }

  return { students, services, templateWorkbook: workbook };
}

/**
 * Load template from file path (CLI entry point).
 */
export function loadTemplate(templatePath) {
  const workbook = XLSX.readFile(templatePath);
  return loadTemplateFromWorkbook(workbook);
}
