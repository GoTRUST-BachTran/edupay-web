'use client';

import type { ConvertResult } from '@/lib/types';

interface StatsCardsProps {
  result: ConvertResult;
}

export function StatsCards({ result }: StatsCardsProps) {
  const totalStudents = result.records.length;
  const totalServices = result.activeServices.length;
  const totalWarnings = result.warnings.length;
  const totalErrors = result.parseResult.errors.length;
  const totalSheets = result.parseResult.sheets.length;

  // Calculate grand total
  let grandTotal = 0;
  for (const record of result.records) {
    for (const [, value] of record.services) {
      grandTotal += value.amount;
    }
  }

  const cards = [
    {
      label: 'Học sinh',
      value: totalStudents.toLocaleString('vi-VN'),
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Lớp',
      value: totalSheets,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Dịch vụ',
      value: totalServices,
      color: 'text-green-700 bg-green-50 border-green-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Tổng tiền',
      value: grandTotal.toLocaleString('vi-VN') + ' đ',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Cảnh báo',
      value: totalWarnings,
      color: totalWarnings > 0
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-gray-500 bg-gray-50 border-gray-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      label: 'Lỗi',
      value: totalErrors,
      color: totalErrors > 0
        ? 'text-red-700 bg-red-50 border-red-200'
        : 'text-gray-500 bg-gray-50 border-gray-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${card.color}`}
        >
          <div className="flex items-center gap-2 mb-1 opacity-80">
            {card.icon}
            <span className="text-xs font-medium">{card.label}</span>
          </div>
          <div className="text-lg font-bold">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
