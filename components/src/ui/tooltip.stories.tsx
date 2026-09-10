import * as React from "react"
import { Info } from "lucide-react"

import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

/* Tooltip 스토리 — 툴팁(ov-tooltip). TooltipContent = w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-background + Arrow 10px.
 * Static = 허브 카드용 정적 조립(TooltipContent 와 같은 클래스 — 종전 카드는 bg-primary 였으나 코드 원문은 bg-foreground, 2026-09-10 교정) · Open = 실물. @storybook import 0. */

export default {
  title: "DS/Tooltip",
  component: Tooltip,
}

export const Static = {
  parameters: { vocab: "ov-tooltip" },
  render: () => (
    <>
      <Info className="size-4 text-muted-foreground" />
      <div className="w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
        권장 버전은 별표(★)로 표시됩니다
      </div>
    </>
  ),
}

export const Open = {
  render: () => (
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="안내"><Info /></Button>
        </TooltipTrigger>
        <TooltipContent side="right">서버 타입은 설치 후 변경할 수 없습니다.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}

export const __namedExportsOrder = ["Static", "Open"]
