"use client";

// search-box 렌더 캡처·허브 카드 iframe용 — 패널 열린 상태(비어 있음: 최근+빠른검색).
// 허브 카드가 이 라우트를 iframe으로 담는다(플로팅 패널은 포털이라 카드 안에 못 가둔다).
import * as React from "react";

import { SearchBox } from "@ds/ui/ui/search-box";

const CANDIDATES = [
  { label: "SVM_BUSAN_1", sub: "IMO 9876543" },
  { label: "SVM_BUSAN_2", sub: "IMO 9876544" },
  { label: "CONTROL_TEST", sub: "IMO 9876545" },
  { label: "REAL_FINAL_TEST", sub: "IMO 9876546" },
  { label: "NAV_ULSAN_1", sub: "IMO 9876547" },
];

export default function Page() {
  const [value, setValue] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // 입력창 포커스 → 패널 열림 (카드 iframe에서 열린 상태가 기본 그림이 되게)
    ref.current?.querySelector("input")?.focus();
  }, []);
  return (
    <div ref={ref} className="min-h-screen bg-white p-6">
      <style>{`nextjs-portal { display: none; }`}</style>
      <SearchBox
        placeholder="호선 검색"
        value={value}
        onChange={setValue}
        candidates={CANDIDATES}
        recentInitial={["SVM_BUSAN_1", "CONTROL_TEST", "부산"]}
        quick={["SVM", "부산", "테스트 호선", "v4.0.0", "Pending"]}
      />
    </div>
  );
}
