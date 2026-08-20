"use client";

// error-state 렌더 캡처 — 확정 시안(sales365 계약 목록 에러 상태) 재현
import * as React from "react";
import { ErrorState } from "@ds/ui/ui/error-state";

export default function Page() {
  return (
    <div className="flex h-screen items-start justify-center bg-white pt-16">
      <style>{`nextjs-portal { display: none; }`}</style>
      <div className="w-[640px]">
        <ErrorState
          title="계약 목록을 불러오지 못했습니다"
          description="서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
          onRetry={() => {}}
        />
      </div>
    </div>
  );
}
