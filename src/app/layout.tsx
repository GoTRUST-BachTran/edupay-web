import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduPay Template Converter',
  description: 'Chuyển đổi file Excel thu phí trường học sang format chuẩn EduPay',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
