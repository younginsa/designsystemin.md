"use client";

// search-box 렌더 캡처·허브 카드 iframe용 — 패널 열린 상태 2종을 나란히(2026-09-11):
//   ① 최근+빠른검색 ② 결과 없음(입력 중 후보 0, 한 줄). 기록 없음은 상태가 아니다 — 보여줄 게 없으면 패널이 안 열린다.
// 허브 카드가 이 라우트를 iframe으로 담는다(플로팅 패널은 포털이라 카드 안에 못 가둔다).
// defaultOpen(미리보기 전용)으로 두 패널을 동시에 연다 — 포커스는 하나만 가질 수 있어서.
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
  const [noMatchValue, setNoMatchValue] = React.useState("zzz");
  return (
    <div className="flex min-h-screen items-start gap-6 bg-white p-6">
      <style>{`nextjs-portal { display: none; }`}</style>
      <div className="w-64 shrink-0">
        <SearchBox
          placeholder="호선 검색"
          value={value}
          onChange={setValue}
          candidates={CANDIDATES}
          recentInitial={["SVM_BUSAN_1", "CONTROL_TEST", "부산"]}
          quick={["SVM", "부산", "테스트 호선", "v4.0.0", "Pending"]}
          defaultOpen
        />
      </div>
      <div className="w-64 shrink-0">
        <SearchBox
          placeholder="호선 검색"
          value={noMatchValue}
          onChange={setNoMatchValue}
          candidates={CANDIDATES}
          recentInitial={["SVM_BUSAN_1", "CONTROL_TEST", "부산"]}
          quick={["SVM", "부산", "테스트 호선", "v4.0.0", "Pending"]}
          defaultOpen
        />
      </div>
    </div>
  );
}
