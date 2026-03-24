'use client';

import { useState } from 'react';
import type { Warning } from '@/lib/types';

interface WarningsTableProps {
  warnings: Warning[];
}

export function WarningsTable({ warnings }: WarningsTableProps) {
  const [expanded, setExpanded] = useState(false);

  if (warnings.length === 0) return null;

  const displayed = expanded ? warnings : warnings.slice(0, 10);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
      <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-800">
          Cảnh báo ({warnings.length})
        </h3>
        {warnings.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium"
          >
            {expanded ? 'Thu gọn' : `Xem tất cả (${warnings.length})`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-amber-700 uppercase">
              <th className="px-4 py-2 w-24">Sheet</th>
              <th className="px-4 py-2 w-16">Dòng</th>
              <th className="px-4 py-2">Nội dung</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((w, i) => (
              <tr key={i} className="border-t border-amber-100 hover:bg-amber-50">
                <td className="px-4 py-1.5 text-amber-700 font-mono text-xs">{w.sheet}</td>
                <td className="px-4 py-1.5 text-amber-700 font-mono text-xs">{w.row || '-'}</td>
                <td className="px-4 py-1.5 text-amber-900">{w.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
