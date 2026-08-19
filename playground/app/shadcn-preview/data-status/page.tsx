"use client";

// data-status 렌더 캡처 — 상단: 스톡(라운드) / 하단: 365(각짐).
// 규칙: 위험·에러 계열은 도트+텍스트 모두 destructive (도트만 착색 금지)
import * as React from "react";

function Row({ square }: { square?: boolean }) {
  const badge = square ? "rounded-none" : "rounded-md";
  return (
    <div className="flex items-center gap-5">
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="size-1.5 rounded-full bg-emerald-500" /> 정상
      </span>
      <span className={`inline-flex items-center gap-1.5 bg-destructive/12 px-2 py-0.5 text-sm text-destructive ${square ? "rounded-none" : "rounded-full"}`}>
        <span className="size-1.5 rounded-full bg-destructive" /> 이상
      </span>
      <span className={`border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ${badge}`}>
        CAUTION
      </span>
      <span className={`border px-2 py-0.5 text-xs font-medium text-muted-foreground ${badge}`}>
        COMPLETED
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="size-1.5 rounded-full bg-emerald-500" /> Ready
      </span>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex h-screen flex-col items-center gap-24 bg-white pt-20">
      <style>{`nextjs-portal { display: none; }`}</style>
      <Row />
      <Row square />
    </div>
  );
}
