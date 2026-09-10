import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// 라이브러리 정합 서체 — 피그마 Typography = Inter (Desktop 10종 · dstk 편입분 동일).
// 한글은 시스템 폴백(Inter 한글 글리프 없음 — 피그마와 같은 거동). 2026-09-03 교정:
// 종전엔 Geist를 변수로만 싣고 --font-sans 매핑이 없어 system-ui(SF Pro)로 렌더됐다.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
// DS 모노 서체 = Roboto Mono(2026-09-10 확정 — 피그마 Desktop/mono_m · mono_body · mono_l 과 정합).
// 종전 font-mono 는 Tailwind 시스템 스택(macOS = Menlo)이라 캡처와 피그마가 서로 달랐다.
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
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
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
