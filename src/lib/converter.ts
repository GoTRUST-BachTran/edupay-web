import * as XLSX from 'xlsx';
import { loadTemplateFromWorkbook } from '../engine/mapper/template-loader.js';
import { parseSchoolWorkbook } from '../engine/parser/school-parser.js';
import { mergeWithTemplateServices } from '../engine/config/services.js';
import { mapRecords } from '../engine/mapper/record-mapper.js';
import { validateRecords, getActiveServices } from '../engine/mapper/validator.js';
import { buildOutputWorkbook } from '../engine/writer/output-writer.js';
import type { ConvertResult } from './types';

/**
 * Load default template from public/ via fetch.
 */
export async function loadDefaultTemplate(): Promise<ArrayBuffer> {
  const res = await fetch('/edupay_template.xlsx');
  if (!res.ok) throw new Error('Không tải được template mặc định');
  return res.arrayBuffer();
}

/**
 * Read a File object into ArrayBuffer.
 */
export function readFileAsBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Run the full conversion pipeline in the browser.
 */
export function convert(
  schoolBuffer: ArrayBuffer,
  templateBuffer: ArrayBuffer,
): ConvertResult {
  // Load template
  const templateWb = XLSX.read(templateBuffer, { type: 'array' });
  const { students, services: templateServices, templateWorkbook } =
    loadTemplateFromWorkbook(templateWb);

  // Merge services
  const services = mergeWithTemplateServices(templateServices);

  // Parse school file
  const schoolWb = XLSX.read(schoolBuffer, { type: 'array' });
  const parseResult = parseSchoolWorkbook(schoolWb, services);

  // Map records
  const { records, warnings: mapWarnings } = mapRecords(parseResult.sheets, students);

  // Validate
  const warnings = validateRecords(records, mapWarnings, parseResult.sheets);

  // Active services
  const activeServices = getActiveServices(records);

  return {
    records,
    warnings,
    activeServices,
    parseResult,
    templateServices,
    templateWorkbook,
  };
}

/**
 * Generate output XLSX as downloadable Uint8Array.
 */
export function generateOutput(
  result: ConvertResult,
  options: { showZero?: boolean } = {},
): Uint8Array {
  const wb = buildOutputWorkbook(
    result.records,
    result.templateWorkbook,
    result.templateServices,
    options,
  );
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

/**
 * Trigger browser download of a Uint8Array as .xlsx file.
 */
export function downloadFile(data: Uint8Array, filename: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
