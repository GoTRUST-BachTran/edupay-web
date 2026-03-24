/**
 * EduPay service definitions with fuzzy matching aliases.
 *
 * Each service maps to a fee type in the EduPay system.
 * `aliases` are used for fuzzy matching against school file headers.
 * `hasQuantity` indicates if this service has a SL (quantity/phiếu) + Tiền pair.
 */
export const SERVICES = [
  {
    code: 'TIENANCHINH',
    displayName: 'Tiền ăn chính',
    aliases: [
      'tiền ăn chính', 'tiền ăn trưa', 'ăn trưa', 'ăn chính',
      'tien an chinh', 'tien an trua', 'an trua',
    ],
    hasQuantity: true,
  },
  {
    code: 'TIENANSANG',
    displayName: 'Tiền ăn sáng',
    aliases: [
      'tiền ăn sáng', 'ăn sáng', 'tien an sang', 'an sang',
    ],
    hasQuantity: true,
  },
  {
    code: 'PHUCVUANSANG',
    displayName: 'Phục vụ ăn sáng',
    aliases: [
      'phục vụ ăn sáng', 'pv ăn sáng', 'phuc vu an sang',
    ],
    hasQuantity: true,
  },
  {
    code: 'HOTROCSBT',
    displayName: 'Hỗ trợ CSBT',
    aliases: [
      'hỗ trợ csbt', 'csbt', 'hỗ trợ chăm sóc bán trú',
      'ho tro csbt', 'cham soc ban tru',
    ],
    hasQuantity: true,
  },
  {
    code: 'TIENNUOCUONG',
    displayName: 'Tiền nước uống',
    aliases: [
      'tiền nước uống', 'nước uống', 'tien nuoc uong', 'nuoc uong',
    ],
    hasQuantity: true,
  },
  {
    code: 'NKTIENGANH',
    displayName: 'NK Tiếng Anh',
    aliases: [
      'nk tiếng anh', 'tiếng anh', 'ngoại khóa tiếng anh',
      'nk tieng anh', 'tieng anh',
    ],
    hasQuantity: true,
  },
  {
    code: 'NKVO',
    displayName: 'NK Võ',
    aliases: [
      'nk võ', 'võ', 'ngoại khóa võ', 'nk vo', 'vo',
    ],
    hasQuantity: true,
  },
  {
    code: 'NKVE',
    displayName: 'NK Vẽ',
    aliases: [
      'nk vẽ', 'vẽ', 'ngoại khóa vẽ', 'nk ve', 've', 'mỹ thuật',
    ],
    hasQuantity: true,
  },
  {
    code: 'NKMUA',
    displayName: 'NK Múa',
    aliases: [
      'nk múa', 'múa', 'ngoại khóa múa', 'nk mua', 'mua',
    ],
    hasQuantity: true,
  },
  {
    code: 'CLBPHATTRIENVDGYMKID',
    displayName: 'CLB phát triển VĐ Gymkid',
    aliases: [
      'clb phát triển vđ gymkid', 'gymkid', 'clb gymkid',
      'clb phat trien vd gymkid', 'gym kid',
      'clb phát triển vận động gymkid',
    ],
    hasQuantity: true,
  },
  {
    code: 'TRANGTHIETBIBT',
    displayName: 'Trang thiết bị BT',
    aliases: [
      'trang thiết bị bt', 'trang thiết bị bán trú', 'ttbbt',
      'trang thiet bi bt', 'trang thiet bi ban tru',
    ],
    hasQuantity: true,
  },
];

/**
 * Keywords that indicate a column is NOT a service (should be skipped).
 */
export const SKIP_KEYWORDS = [
  'tổng', 'cộng', 'total',
  'thiếu tháng trước', 'thieu thang truoc',
  'tổng thu', 'tong thu',
  'đã ăn', 'da an',
  'đã dùng', 'da dung',
  'tồn', 'ton',
  'trả lại', 'tra lai',
  'tổng trả', 'tong tra',
  'ngày tt', 'ngay tt',
  'ngày thanh toán', 'ngay thanh toan',
  'số biên lai', 'so bien lai',
  'stt',
  'trả lại', 'tra lai',
  'phần trả lại', 'phan tra lai',
  'trả lại học sinh',
  't.toán ăn cuối tháng', 'thanh toán ăn',
  'cuối tháng', 'cuoi thang',
];

/**
 * Keywords that indicate a quantity/count column (not amount).
 */
export const QUANTITY_KEYWORDS = [
  'phiếu', 'phieu',
  'sl', 'số lượng', 'so luong',
];

/**
 * Keywords that indicate "tồn tháng trước" (carry-over) — should be skipped in favor of "thu mới".
 */
export const CARRYOVER_KEYWORDS = [
  'tồn tháng trước', 'ton thang truoc',
  'tồn tt', 'ton tt',
  'tồn', // careful — only skip when in context of a service sub-header
];

/**
 * Keywords that indicate "thu mới" (new collection) — the data we want.
 */
export const NEW_COLLECTION_KEYWORDS = [
  'thu mới', 'thu moi',
  'thu', // in context of sub-header under a service
];

/**
 * Get service config by code.
 */
export function getServiceByCode(code) {
  return SERVICES.find(s => s.code === code) || null;
}

/**
 * Load services dynamically from EduPay template sheet "Dịch vụ kế toán".
 * Merges with built-in aliases.
 */
export function mergeWithTemplateServices(templateServices) {
  const merged = [...SERVICES];

  for (const ts of templateServices) {
    const existing = merged.find(s => s.code === ts.code);
    if (!existing) {
      // New service from template — add with basic alias from display name
      merged.push({
        code: ts.code,
        displayName: ts.displayName,
        aliases: [ts.displayName.toLowerCase()],
        hasQuantity: false,
      });
    }
  }

  return merged;
}
