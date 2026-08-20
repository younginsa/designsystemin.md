"use client"

// 우측 상세 시트 프리셋 — shadcn Sheet 조합(새 엔진 아님).
// 리스트 행 클릭 → 우측 요약/상세 패널은 전부 이걸로. 폭 프리셋: md(요약)·4xl(상세).
// 스크림 기본 = 팔레트 basic black-20, 모션은 Sheet 기본(열림 500ms/닫힘 300ms) 유지.
// 본문 섹션 규칙: 타이틀(text-sm font-medium text-muted-foreground) + 표준 Table
// (외곽선+헤더 배경) — 섹션 박스로 표를 감싸지 않는다(이중 테두리 금지).

import * as React from "react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"
import { cn } from "../lib/utils"

interface DetailPanelProps extends React.ComponentProps<typeof Sheet> {
  trigger?: React.ReactNode
  /** md = 요약 패널 · 4xl = 상세 패널 */
  size?: "md" | "4xl"
  /** ① 좌상단 컨트롤 슬롯 — 상태 Select(sm, 도트 포함 옵션) 등 */
  control?: React.ReactNode
  title: React.ReactNode
  /** ② 타이틀 우측 보조 링크 */
  titleLink?: React.ReactNode
  /** ③ 메타 줄(키-값) */
  meta?: React.ReactNode
  /** ④ 우상단 유틸 슬롯(ghost 버튼) — X 닫기 왼쪽에 고정 */
  utils?: React.ReactNode
  overlayClassName?: string
  className?: string
  children?: React.ReactNode
}

function DetailPanel({
  trigger,
  size = "md",
  control,
  title,
  titleLink,
  meta,
  utils,
  overlayClassName,
  className,
  children,
  ...props
}: DetailPanelProps) {
  return (
    <Sheet {...props}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent
        side="right"
        overlayClassName={cn("bg-(--basic-black-20)", overlayClassName)}
        className={cn(
          "gap-0 overflow-y-auto",
          size === "4xl" ? "w-full sm:max-w-4xl" : "w-full sm:max-w-md",
          className
        )}
      >
        {utils ? (
          <div className="absolute top-3 right-12 flex items-center gap-1">{utils}</div>
        ) : null}
        <SheetHeader className="gap-2 border-b pb-4">
          {control ? <div className="flex items-center gap-2">{control}</div> : null}
          <div className="flex items-baseline gap-2 pt-2">
            <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
            {titleLink}
          </div>
          {meta ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {meta}
            </div>
          ) : null}
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

export { DetailPanel }
