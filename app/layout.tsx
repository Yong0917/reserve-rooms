import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plateer Rooms · 회의실 예약',
  description: 'Plateer 회사 회의실 예약 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
