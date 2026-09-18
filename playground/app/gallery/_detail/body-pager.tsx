"use client";

// BodyPager — 상세 본문 안에 박힌 표의 푸터 (2026-09-18 디자이너 확정, 릴리즈 노트 개발자용 → 업데이트로 공용화)
// - 페이지 목록(A)의 ListFooter 와 달리 「페이지당 · 전체 N건」이 없다 — 건수는 섹션 제목이 이미 말한다.
//   페이저만 가운데. 페이지당은 DS 기본값(ROWS_PER_PAGE_DEFAULT = 15) 고정이라 선택기가 필요 없다.
// - 창 로직은 ListFooter 와 같다: Previous · 1 · … · p−1 p p+1 · … · N · Next, 양 끝 aria-disabled.
// - 단일 페이지면 페이저는 없지만 행 높이(36px = 페이지 버튼 높이)는 남긴다 — 섹션 끝 간격이 표마다 같아야 한다.
// - DS ListFooter 에 variant="pager" 가 채택되면 이 파일은 은퇴한다(UX-DS 요청 발송: _handover/2026-09-18-listfooter-pager.md).

import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ds/ui/ui/pagination";

export function BodyPager({
  page,
  count,
  onChange,
}: {
  /** 현재 페이지(1부터) */
  page: number;
  /** 전체 페이지 수 */
  count: number;
  onChange: (page: number) => void;
}) {
  const go = (p: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // href="#" 스크롤 점프 방지
    const next = Math.min(count, Math.max(1, p));
    if (next !== page) onChange(next);
  };
  const pages = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= count);
  if (count <= 1) return <div className="min-h-9" aria-hidden />;
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" aria-disabled={page <= 1} onClick={go(page - 1)} />
        </PaginationItem>
        {page > 2 && (
          <PaginationItem>
            <PaginationLink href="#" onClick={go(1)}>
              1
            </PaginationLink>
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
            <PaginationLink href="#" onClick={go(count)}>
              {count}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext href="#" aria-disabled={page >= count} onClick={go(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
