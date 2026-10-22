import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 정적 호스팅 호환 — 라우트를 <경로>/index.html로 내보낸다. 이것 없이는 Vercel이
  // /shadcn-preview/overlay 같은 하위 라우트(overlay.html)를 404로 응답한다
  // (허브 카드의 오버레이 iframe이 여기에 의존 — 2026-08-26 컷오버에서 확인).
  trailingSlash: true,
  transpilePackages: ["@ds/ui"],
  // 사내망(192.168.x.x)의 다른 맥에서 클론 dev 서버(http://192.168.x.x:3000)를 열 수 있게 — next dev 전용, 배포(export)엔 영향 없음.
  // 없으면 Next 16 이 localhost 아닌 출처의 dev 스크립트를 403 으로 막아 HTML 만 보이고 클릭이 안 된다(2026-10-22 클론 요청).
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
