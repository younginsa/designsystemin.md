"use client";

// data-status 렌더 캡처 — 상단: 순정 shadcn Badge(원형 스톡, 커스텀 없음) / 하단: 365 조정판.
// 365 규칙: 라운드 필 · 정상·중립 = bg-muted(시스템 회색) · 위험 = 도트+텍스트 destructive + bg 12%
import * as React from "react";
import { Badge } from "@ds/ui/ui/badge";

export default function Page() {
  return (
    <div className="flex h-screen flex-col items-center justify-start gap-40 bg-white pt-24">
      <style>{`nextjs-portal { display: none; }`}</style>

      {/* 스톡 — 순정 shadcn Badge 변형 그대로 */}
      <div className="flex items-center justify-center gap-4">
        <Badge variant="secondary">정상</Badge>
        <Badge variant="destructive">이상</Badge>
        <Badge variant="outline">CAUTION</Badge>
        <Badge variant="outline">COMPLETED</Badge>
        <Badge variant="secondary">Ready</Badge>
      </div>

      {/* 365 — 라운드 필, 시스템 회색(muted)·상태 색 쌍 */}
      <div className="flex items-center justify-center gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-sm">
          <span className="size-1.5 rounded-full bg-emerald-500" /> 정상
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-2.5 py-0.5 text-sm text-destructive">
          <span className="size-1.5 rounded-full bg-destructive" /> 이상
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          CAUTION
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          COMPLETED
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-sm">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Ready
        </span>
      </div>
    </div>
  );
}
