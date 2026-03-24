'use client';

import { useState, useMemo } from 'react';
import type { ConvertResult } from '@/lib/types';

interface DataTableProps {
  result: ConvertResult;
}

const PAGE_SIZE = 30;

export function DataTable({ result }: DataTableProps) {
  const [page, setPage] = useState(0);

  // Get ordered services (same logic as output-writer)
  const orderedServices = useMemo(() => {
    return result.templateServices.filter((s) =>
      result.activeServices.includes(s.code),
    );
  }, [result.templateServices, result.activeServices]);

  const totalPages = Math.ceil(result.records.length / PAGE_SIZE);
  const pageRecords = result.records.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Phiếu thu ({result.records.length} học sinh)
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <span className="text-gray-600">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left bg-gray-50 text-gray-600">
              <th className="px-3 py-2 sticky left-0 bg-gray-50 z-10 w-10">STT</th>
              <th className="px-3 py-2 w-20">Mã HS</th>
              <th className="px-3 py-2 w-40">Tên học sinh</th>
              <th className="px-3 py-2 w-20">Lớp</th>
              {orderedServices.map((s) => (
                <th key={s.code} className="px-3 py-2 text-right whitespace-nowrap">
                  {s.displayName}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-bold">Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.map((record) => {
              let rowTotal = 0;
              for (const [, v] of record.services) rowTotal += v.amount;

              return (
                <tr
                  key={record.stt}
                  className="border-t border-gray-100 hover:bg-blue-50/30"
                >
                  <td className="px-3 py-1.5 sticky left-0 bg-white text-gray-400 font-mono">
                    {record.stt}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-gray-600">{record.maHocSinh}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{record.tenHocSinh}</td>
                  <td className="px-3 py-1.5 text-gray-600">{record.lop}</td>
                  {orderedServices.map((s) => {
                    const val = record.services.get(s.code);
                    const amount = val?.amount ?? 0;
                    return (
                      <td
                        key={s.code}
                        className={`px-3 py-1.5 text-right font-mono ${
                          amount < 0
                            ? 'text-red-600'
                            : amount === 0
                              ? 'text-gray-300'
                              : ''
                        }`}
                      >
                        {amount !== 0 ? amount.toLocaleString('vi-VN') : ''}
                      </td>
                    );
                  })}
                  <td
                    className={`px-3 py-1.5 text-right font-mono font-semibold ${
                      rowTotal < 0 ? 'text-red-600' : ''
                    }`}
                  >
                    {rowTotal !== 0 ? rowTotal.toLocaleString('vi-VN') : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
