"use client"

// 상태 미리보기 — 생성 페이지 QA용 플로팅 필 (화면 상단 중앙 고정).
// 본문·헤더에 임베드하지 않는다 — 리뷰 도구는 화면 위에 떠 있어야 화면을 가리지 않고 비교된다.

import * as React from "react"
import { cn } from "../lib/utils"

export interface StatePreviewState {
  value: string
  label: string
}

const DEFAULT_STATES: StatePreviewState[] = [
  { value: "default", label: "기본" },
  { value: "empty", label: "빈" },
  { value: "loading", label: "로딩" },
  { value: "error", label: "에러" },
]

export interface StatePreviewProps {
  value: string
  onChange: (value: string) => void
  states?: StatePreviewState[]
  className?: string
}

function StatePreview({ value, onChange, states = DEFAULT_STATES, className }: StatePreviewProps) {
  return (
    <div
      className={cn(
        "fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card/95 p-1 shadow-sm backdrop-blur",
        className
      )}
    >
      <span className="px-2 text-[10px] font-medium tracking-wide text-secondary-foreground">상태 미리보기</span>
      {states.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={cn(
            "h-7 rounded-full px-3 text-xs transition-colors",
            s.value === value
              ? "bg-primary text-primary-foreground"
              : "text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

export { StatePreview }
