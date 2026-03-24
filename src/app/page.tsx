'use client';

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/file-upload';
import { OptionsPanel } from '@/components/options-panel';
import { StatsCards } from '@/components/preview/stats-cards';
import { WarningsTable } from '@/components/preview/warnings-table';
import { DataTable } from '@/components/preview/data-table';
import {
  loadDefaultTemplate,
  readFileAsBuffer,
  convert,
  generateOutput,
  downloadFile,
} from '@/lib/converter';
import type { ConvertResult } from '@/lib/types';

type Status = 'idle' | 'converting' | 'done' | 'error';

export default function Home() {
  const [schoolFile, setSchoolFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [showZero, setShowZero] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);

  const handleConvert = useCallback(async () => {
    if (!schoolFile) return;

    setStatus('converting');
    setError(null);
    setResult(null);

    try {
      const schoolBuffer = await readFileAsBuffer(schoolFile);

      let templateBuffer: ArrayBuffer;
      if (useCustomTemplate && templateFile) {
        templateBuffer = await readFileAsBuffer(templateFile);
      } else {
        templateBuffer = loadDefaultTemplate();
      }

      // Run conversion (synchronous, CPU-intensive)
      const convertResult = convert(schoolBuffer, templateBuffer);
      setResult(convertResult);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setStatus('error');
    }
  }, [schoolFile, templateFile, useCustomTemplate]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const data = generateOutput(result, { showZero });

    const schoolName = result.parseResult.schoolName || 'output';
    const period = result.parseResult.period || '';
    const safeName = schoolName
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50);
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `${safeName}_${period ? period.replace(/\s+/g, '_') : ''}_${ts}.xlsx`;

    downloadFile(data, filename);
  }, [result, showZero]);

  const canConvert =
    schoolFile && (!useCustomTemplate || templateFile) && status !== 'converting';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          EduPay Template Converter
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Chuyển đổi file Excel thu phí trường học sang format chuẩn EduPay — xử lý hoàn toàn trên trình duyệt
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-5">
        <FileUpload
          label="File trường học"
          description="Chọn file Excel thu phí từ trường (.xls, .xlsx)"
          accept=".xls,.xlsx"
          onFileSelect={setSchoolFile}
          selectedFile={schoolFile}
        />

        <OptionsPanel
          showZero={showZero}
          onShowZeroChange={setShowZero}
          useCustomTemplate={useCustomTemplate}
          onUseCustomTemplateChange={setUseCustomTemplate}
        />

        {useCustomTemplate && (
          <FileUpload
            label="Template EduPay"
            description="Chọn file template EduPay (.xlsx)"
            accept=".xlsx"
            onFileSelect={setTemplateFile}
            selectedFile={templateFile}
            optional
          />
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!canConvert}
          className={`
            w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${canConvert
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {status === 'converting' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            'Chuyển đổi'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Lỗi:</strong> {error}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {result && (
        <div className="space-y-4">
          <StatsCards result={result} />

          <WarningsTable warnings={result.warnings} />

          <DataTable result={result} />

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 active:scale-[0.99] shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải file output (.xlsx)
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-400">
        GoTRUST FinTech &middot; File được xử lý hoàn toàn trên trình duyệt, không upload lên server
      </div>
    </div>
  );
}
