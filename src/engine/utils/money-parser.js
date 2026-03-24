/**
 * Parse Vietnamese money strings to integer VND.
 * Handles: "735,000" | "735.000" | 735000 | "0" | "" | null | undefined
 */
export function parseMoney(value) {
  if (value === null || value === undefined || value === '') return 0;

  // Already a number
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value);
  }

  if (typeof value !== 'string') return 0;

  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return 0;

  // Remove thousand separators (comma or dot) but keep decimal point
  // Vietnamese format: 735,000 or 735.000 (both mean 735000)
  // Detect: if string has comma/dot followed by exactly 3 digits → thousand separator
  let cleaned = trimmed;

  // Remove spaces
  cleaned = cleaned.replace(/\s/g, '');

  // Handle negative
  const isNegative = cleaned.startsWith('-');
  if (isNegative) cleaned = cleaned.slice(1);

  // Remove currency symbols
  cleaned = cleaned.replace(/[đ₫VND]/gi, '').trim();

  // Determine if dots/commas are thousand separators
  // Pattern: digits separated by comma or dot every 3 digits
  // "735,000" "1,234,567" "735.000" "1.234.567"
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
    // Pure thousand-separated format → remove all separators
    cleaned = cleaned.replace(/[.,]/g, '');
  } else if (/^\d{1,3}([.,]\d{3})*[.,]\d{1,2}$/.test(cleaned)) {
    // Has decimal part (e.g., "735,000.50") — unlikely for VND but handle it
    // Last separator is decimal, others are thousands
    const lastSep = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
    const beforeDecimal = cleaned.slice(0, lastSep).replace(/[.,]/g, '');
    const afterDecimal = cleaned.slice(lastSep + 1);
    cleaned = beforeDecimal + '.' + afterDecimal;
  } else if (/^\d+[.,]\d+[.,]\d+$/.test(cleaned)) {
    // Multiple separators but non-standard grouping (e.g., "15.60.000") → treat all as thousand seps
    cleaned = cleaned.replace(/[.,]/g, '');
  } else if (/^\d+[.,]\d{3}$/.test(cleaned)) {
    // Ambiguous: "180.000" or "180,000" — exactly 3 digits after separator → thousand separator (VND has no decimal)
    cleaned = cleaned.replace(/[.,]/g, '');
  } else {
    // Simple number or already clean — remove all separators
    cleaned = cleaned.replace(/[.,]/g, '');
  }

  const result = parseFloat(cleaned);
  if (!Number.isFinite(result)) return 0;

  return Math.round(isNegative ? -result : result);
}
