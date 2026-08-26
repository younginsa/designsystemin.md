"use client";

// RowsPerPage — 목록 푸터 문법 프리셋 (조합 제작, 새 엔진 아님). 2026-08-26 승격.
// 원본: 클론 _pagination/rows-per-page.tsx (그대로 기준, 재해석 없음)
// 구조: 페이지당: [15 ˅] │ 전체 143척  — 푸터 좌측 정렬, 우측은 페이지네이션 ("표시" 삭제 2026-08-26)
// - 라벨(연한 톤) + 숫자만 든 트리거(고스트) + 세로 구분선 + 전체 건수(summary)
// - Page x of y 표기는 기각(2026-08-26) — 전체 건수가 그 자리를 가진다
// - 드롭업(side="top") — 화면 맨 아래 위치. 트리거 꺾쇠는 레퍼런스대로 ˅(아래)
// - 목록은 숫자만·좁게. 단일 선택 DS 문법 = ✓ 오른쪽(shadcn Select 통일, 2026-08-26)
// - 기본 15행 · 옵션 10/15/30/50 · 행 수 변경 시 소비자는 1페이지로 리셋한다

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export const ROWS_PER_PAGE_DEFAULT = 15;

export function RowsPerPage({
  value,
  onChange,
  summary,
  options = [10, 15, 30, 50],
}: {
  value: number;
  onChange: (n: number) => void;
  /** 구분선 오른쪽 전체 건수 표기 — 예: "전체 143척". 경고 도트 등 리치 표기는 노드로 */
  summary: React.ReactNode;
  options?: number[];
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-secondary-foreground">페이지당:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="px-2 font-medium">
            {value} <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-24">
          {options.map((n) => (
            <DropdownMenuItem key={n} onSelect={() => onChange(n)}>
              {/* 단일 선택 ✓는 오른쪽 — shadcn Select 문법(2026-08-26 확정) */}
              {n}
              <Check className={"ml-auto size-4 " + (n === value ? "opacity-100" : "opacity-0")} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* 세로 구분선 — 셀렉터와 전체 건수를 가른다 */}
      <span className="h-5 w-px bg-border" aria-hidden />
      <span className="text-secondary-foreground">{summary}</span>
    </div>
  );
}
