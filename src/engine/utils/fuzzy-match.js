/**
 * Vietnamese-aware fuzzy string matching for header → service mapping.
 */

// Vietnamese diacritics removal map
const DIACRITICS_MAP = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'đ': 'd',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
};

/**
 * Normalize text: lowercase, trim, collapse spaces, remove diacritics.
 */
export function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  let result = text.toLowerCase().trim().replace(/\s+/g, ' ');
  // Remove diacritics
  result = [...result].map(c => DIACRITICS_MAP[c] || c).join('');
  return result;
}

/**
 * Normalize but keep diacritics (for display matching).
 */
export function normalizeKeepDiacritics(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate match score between input and alias.
 * Returns 0.0 - 1.0
 */
export function matchScore(input, alias) {
  const a = normalize(input);
  const b = normalize(alias);

  if (!a || !b) return 0;

  // Exact match
  if (a === b) return 1.0;

  // Alias is substring of input (input is more specific)
  if (a.includes(b)) return 0.9;

  // Input is substring of alias
  if (b.includes(a)) return 0.85;

  // Token overlap (bag of words)
  const tokensA = new Set(a.split(/\s+/));
  const tokensB = new Set(b.split(/\s+/));
  const intersection = [...tokensA].filter(t => tokensB.has(t));

  if (intersection.length === 0) return 0;

  const score = intersection.length / Math.max(tokensA.size, tokensB.size);
  return score;
}

/**
 * Find best matching service for a header text.
 * @param {string} headerText - Header text from school file
 * @param {Array<{code: string, aliases: string[]}>} services - Service definitions
 * @param {number} threshold - Minimum score to accept (default 0.6)
 * @returns {{ code: string, score: number, matchedAlias: string } | null}
 */
export function findBestMatch(headerText, services, threshold = 0.6) {
  let bestMatch = null;
  let bestScore = 0;

  for (const service of services) {
    for (const alias of service.aliases) {
      const score = matchScore(headerText, alias);
      if (score > bestScore ||
          (score === bestScore && bestMatch && normalize(alias).length > normalize(bestMatch.matchedAlias).length)) {
        // Tiebreaker: longer alias = more specific match
        bestScore = score;
        bestMatch = { code: service.code, score, matchedAlias: alias };
      }
    }
  }

  if (bestScore < threshold) return null;
  return bestMatch;
}

/**
 * Check if text matches any of the given keywords.
 */
export function containsAny(text, keywords) {
  const norm = normalize(text);
  return keywords.some(kw => norm.includes(normalize(kw)));
}
