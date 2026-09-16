import * as React from "react"
import { Info } from "lucide-react"

import { Button } from "./button"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

/* PageHeader 스토리 — 페이지 헤더(타이틀 행). 갤러리 22면 손 조합의 원문(2026-09-16 프리셋화).
 * 제목 text-lg font-bold · 단일 줄이면 items-center, description 이 있을 때만 items-start ·
 * actions = 페이지 레벨 액션만(목록 액션·CTA는 FilterBar actions 슬롯) · "총 N건" 부제 금지(ListFooter 소유). */

export default {
  title: "DS/PageHeader",
  component: PageHeader,
}

/** 제목 + 우측 페이지 레벨 액션(파괴적 액션은 아웃라인 파괴형) */
export const Default = {
  parameters: { vocab: "page-header" },
  render: () => (
    <PageHeader
      title="계약 호선"
      actions={
        <Button variant="destructive-outline" size="sm">
          호선 삭제
        </Button>
      }
    />
  ),
}

/** 부제 — 설명 텍스트가 있을 때만 행이 items-start */
export const Description = {
  parameters: { vocab: "page-header" },
  render: () => (
    <PageHeader
      title="제품 목록"
      description="계약 항목에 담을 수 있는 제품과, 판매 단위로 묶은 패키지입니다"
    />
  ),
}

/** 제목 옆 addon — 상태 배지 · 설명 툴팁(Info) */
export const Addon = {
  parameters: { vocab: "page-header" },
  render: () => (
    <TooltipProvider>
      <PageHeader
        title="시스템 진단 호선"
        addon={
          <>
            <StatusBadge label="활성" tone="success" bg={false} className="font-normal" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="설명">
                  <Info className="size-4 text-secondary-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>호선별 자가 진단 결과와 해결 상태를 관리합니다.</TooltipContent>
            </Tooltip>
          </>
        }
      />
    </TooltipProvider>
  ),
}

export const __namedExportsOrder = ["Default", "Description", "Addon"]
