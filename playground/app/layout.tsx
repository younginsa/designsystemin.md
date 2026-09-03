import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 라이브러리 정합 서체 — 피그마 Typography = Inter (Desktop 10종 · dstk 편입분 동일).
// 한글은 시스템 폴백(Inter 한글 글리프 없음 — 피그마와 같은 거동). 2026-09-03 교정:
// 종전엔 Geist를 변수로만 싣고 --font-sans 매핑이 없어 system-ui(SF Pro)로 렌더됐다.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HiNAS 365",
  description: "HiNAS Design System playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
