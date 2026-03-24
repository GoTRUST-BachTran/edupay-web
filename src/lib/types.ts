export interface ServiceValue {
  sl: number | null;
  amount: number;
}

export interface OutputRecord {
  stt: number;
  maHocSinh: string;
  tenHocSinh: string;
  lop: string;
  services: Map<string, ServiceValue>;
}

export interface Warning {
  sheet: string;
  row: number;
  maHS: string;
  message: string;
}

export interface ParsedSheet {
  sheetName: string;
  className: string;
  records: unknown[];
  columnMapping: unknown;
  unmappedColumns: Array<{ headerText: string }>;
}

export interface ParseResult {
  schoolName: string | null;
  period: string | null;
  sheets: ParsedSheet[];
  totalRecords: number;
  errors: Array<{ sheet: string; message: string }>;
}

export interface TemplateData {
  students: Map<string, { name: string; class: string }>;
  services: Array<{ code: string; displayName: string }>;
  templateWorkbook: unknown;
}

export interface ConvertResult {
  records: OutputRecord[];
  warnings: Warning[];
  activeServices: string[];
  parseResult: ParseResult;
  templateServices: Array<{ code: string; displayName: string }>;
  templateWorkbook: unknown;
}
