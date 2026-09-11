"use client";

// ListFooter — 목록 푸터 프리셋 (조합 제작, 새 엔진 아님). 2026-09-10 신설.
// layout/body-patterns.md A 리스트 「푸터」 규칙을 컴포넌트로 고정:
//   좌측 「페이지당: [15 ˅] │ 전체 N건」(RowsPerPage) · 우측 Pagination — 같은 행, justify-between.
// - 페이지 창: Previous · 1 · … · p−1 p p+1 · … · N · Next (간격이 있을 때만 …). 갤러리 ships-view 로직 그대로.
// - Previous/Next 는 양 끝에서 aria-disabled(PaginationLink 가 흐림·클릭 차단).
// - 단일 페이지(pageCount ≤ 1)면 페이지네이션 생략 — 건수는 남는다(건수는 푸터가 소유, design.md).
// - 행 수 변경 시 1페이지로 리셋한다(RowsPerPage 규칙) — 소비자가 따로 할 필요 없음.
// - pageCount 생략 시 total ÷ pageSize 로 계산. 서버 페이징이면 pageCount 를 직접 넘긴다.
// - summary 생략 시 `전체 {total}{unit}`(천 단위 구분). 보조 카운트 병기(● 미입력 N) 규칙은 2026-09-10 폐기 — 건수 하나만.

import * as React from "react";

import { cn } from "@ds/ui/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import { RowsPerPage } from "./rows-per-page";

export type ListFooterProps = {
  /** 페이지당 행 수(controlled) */
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  /** RowsPerPage 옵션 — 기본 10/15/30/50 */
  pageSizeOptions?: number[];
  /** 전체 건수 — summary 미지정 시 `전체 {total}{unit}` 로 표기 */
  total: number;
  /** 건수 단위 — 예: "척" · "건"(기본) · "개" */
  unit?: string;
  /** 구분선 오른쪽 전체 건수 표기를 직접 지정(단위가 문장에 안 맞을 때) — 예: "검색 결과 12건". 보조 카운트 병기 규칙은 폐기(2026-09-10) */
  summary?: React.ReactNode;
  /** 현재 페이지(1부터, controlled) */
  page: number;
  onPageChange: (page: number) => void;
  /** 전체 페이지 수 — 생략 시 ceil(total / pageSize) */
  pageCount?: number;
  className?: string;
};

export function ListFooter({
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  total,
  unit = "건",
  summary,
  page,
  onPageChange,
  pageCount,
  className,
}: ListFooterProps) {
  const count = Math.max(1, pageCount ?? Math.ceil(total / pageSize));
  const go = (p: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // href="#" 스크롤 점프 방지
    const next = Math.min(count, Math.max(1, p));
    if (next !== page) onPageChange(next);
  };
  const pages = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= count);

  return (
    <div
      data-slot="list-footer"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <RowsPerPage
        value={pageSize}
        options={pageSizeOptions}
        onChange={(n) => {
          onPageSizeChange(n);
          if (page !== 1) onPageChange(1);
        }}
        summary={summary ?? `전체 ${total.toLocaleString()}${unit}`}
      />
      {count > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" aria-disabled={page <= 1} onClick={go(page - 1)} />
            </PaginationItem>
            {page > 2 && (
              <PaginationItem>
                <PaginationLink href="#" onClick={go(1)}>1</PaginationLink>
              </PaginationItem>
            )}
            {page > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink href="#" isActive={p === page} onClick={go(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            {page < count - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page < count - 1 && (
              <PaginationItem>
                <PaginationLink href="#" onClick={go(count)}>{count}</PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext href="#" aria-disabled={page >= count} onClick={go(page + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
