"use client";

// version-filter-chip 렌더 캡처·허브 카드 iframe용 — 패널 열린 캐스케이드 상태.
// 활성 조건 1건이 적용된 칩("PRODUCT · Control") + 패널에 캐스케이드 3단 전부 노출.
import * as React from "react";

import { VersionFilterChip, type VersionRow } from "@ds/ui/ui/version-filter-chip";

const PRODUCTS = ["Control", "Navigation", "SVM"];
const COMMON = ["v4.0.0", "v3.5.0", "v3.4.2"];
const PRODUCT_VERSIONS: Record<string, string[]> = {
  Control: ["v2.1.0", "v2.0.3"],
  Navigation: ["v3.5.3", "v3.5.0"],
  SVM: ["v1.2.0", "v1.1.4"],
};

export default function Page() {
  const [value, setValue] = React.useState<VersionRow[]>([
    { id: 1, product: "Control", commonVersion: "v4.0.0", productVersion: "v2.1.0" },
  ]);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // 트리거 클릭 → 패널 열림(드래프트 = 적용값) — 카드 기본 그림이 열린 상태가 되게
    ref.current?.querySelector("button")?.click();
  }, []);
  return (
    <div ref={ref} className="min-h-screen bg-white p-6">
      <style>{`nextjs-portal { display: none; }`}</style>
      <VersionFilterChip
        products={PRODUCTS}
        commonVersions={COMMON}
        productVersions={PRODUCT_VERSIONS}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
