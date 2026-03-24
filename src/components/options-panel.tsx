'use client';

interface OptionsPanelProps {
  showZero: boolean;
  onShowZeroChange: (v: boolean) => void;
  useCustomTemplate: boolean;
  onUseCustomTemplateChange: (v: boolean) => void;
}

export function OptionsPanel({
  showZero,
  onShowZeroChange,
  useCustomTemplate,
  onUseCustomTemplateChange,
}: OptionsPanelProps) {
  return (
    <div className="flex flex-wrap gap-6">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showZero}
          onChange={(e) => onShowZeroChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>Hiển thị khoản thu 0đ</span>
        <span className="text-xs text-gray-400">(SL=1, Tiền=0)</span>
      </label>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={useCustomTemplate}
          onChange={(e) => onUseCustomTemplateChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>Dùng template khác</span>
        <span className="text-xs text-gray-400">(mặc định: template chuẩn EduPay)</span>
      </label>
    </div>
  );
}
