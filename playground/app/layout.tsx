import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// 라이브러리 정합 서체 — 피그마 Typography = Inter (Desktop 10종 · dstk 편입분 동일).
// 한글은 시스템 폴백(Inter 한글 글리프 없음 — 피그마와 같은 거동). 2026-09-03 교정:
// 종전엔 Geist를 변수로만 싣고 --font-sans 매핑이 없어 system-ui(SF Pro)로 렌더됐다.
// 2026-10-12: Google Fonts 판 → rsms 원본 InterVariable(v4.1, OFL). Google 판에는 ss02(Disambiguation — I 세리프·l 꼬리·0 사선)가
// 동작하지 않아 피그마 라이브러리(Desktop 스타일 SS02 켜짐)와 글자 모양이 갈렸다. ss02 는 globals.css 의 --default-font-feature-settings.
const inter = localFont({
  src: "../public/fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
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
      {/* 로컬 디자인 수정(2026-10-19) — 맥 localhost 에서만(배포 사이트엔 없음). 세션이 끝나면 Jira 로 발행되고 비워진다(scripts/local-design-flush.mjs) */}
      {process.env.NODE_ENV === "development" && (
        <head>
          <link rel="stylesheet" href="/local-design.css" />
        </head>
      )}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
