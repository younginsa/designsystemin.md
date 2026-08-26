import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 정적 호스팅 호환 — 라우트를 <경로>/index.html로 내보낸다. 이것 없이는 Vercel이
  // /shadcn-preview/overlay 같은 하위 라우트(overlay.html)를 404로 응답한다
  // (허브 카드의 오버레이 iframe이 여기에 의존 — 2026-08-26 컷오버에서 확인).
  trailingSlash: true,
  transpilePackages: ["@ds/ui"],
};

export default nextConfig;
