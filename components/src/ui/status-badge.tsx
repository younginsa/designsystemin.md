import * as React from "react"

import { Badge } from "@ds/ui/ui/badge"
import { cn } from "@ds/ui/lib/utils"

// StatusBadge — 상태 필 · 도트(data-status). FE 팀 status-badge.tsx(2026-09-10 수령)를 DS 토큰으로 옮긴 것:
// Badge(outline) 위에 tone · dot · bg · mono. 톤은 DS 색만(2026-08-21 상태색 통합 유지) — neutral · success · error · progress.
// FE 의 warning · info · attention 은 DS 토큰이 없어 toneClassName 으로 제품 쪽에서 덧입힌다.
// 규칙: 라벨은 error 를 제외하고 항상 foreground(도트만 톤 색) · bg=false 면 도트가 강제로 보인다 · 도트 8px.
export type StatusTone = "neutral" | "success" | "error" | "progress"

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  // muted-foreground 는 흐림 톤 전용(가독 텍스트 금지)이지만 여기선 도트 색으로만 쓴다 — 라벨은 foreground
  neutral: "text-muted-foreground",
  success: "text-success",
  error: "text-destructive",
  progress: "text-primary",
}

export interface StatusBadgeProps {
  label: React.ReactNode
  tone?: StatusTone
  /** 제품 전용 톤 덧입힘(예: FE warning · info · attention) — DS 톤 밖 색은 여기로 */
  toneClassName?: string
  dot?: boolean
  /** false = 배경 없이 도트 + 라벨(도트 강제) */
  bg?: boolean
  mono?: boolean
  className?: string
}

function StatusBadge({
  label,
  tone = "neutral",
  toneClassName,
  dot = false,
  bg = true,
  mono = false,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-slot="status-badge"
      data-tone={tone}
      className={cn(
        // text-title-xs(FE) = Title_XS 14 medium
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-medium",
        STATUS_TONE_CLASS[tone],
        bg ? "border-none bg-muted" : "border-none bg-transparent",
        toneClassName,
        className
      )}
    >
      {(dot || !bg) && <span className="size-2 rounded-full bg-current" />}
      <span className={cn(tone !== "error" && "text-foreground", mono && "font-mono")}>{label}</span>
    </Badge>
  )
}

export { StatusBadge }
