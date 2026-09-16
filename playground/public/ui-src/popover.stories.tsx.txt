import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

/* Popover 스토리 — 팝오버(ov-popover). PopoverContent = w-72 rounded-md border bg-popover p-4 shadow-md(포털 · 충돌 회피 내장 — 직접 포지셔닝 금지 규칙의 기본).
 * Static = 허브 카드용 정적 조립(같은 클래스, 카드 안에 가둠) · Open = 실물(open). @storybook import 0. */

export default {
  title: "DS/Popover",
  component: Popover,
}

export const Static = {
  parameters: { vocab: "ov-popover" },
  render: () => (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" size="sm">KST +9 <ChevronDown /></Button>
      <div className="w-56 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
        <div className="text-sm font-medium">타임존</div>
        <div className="mt-2 rounded-md bg-accent px-2 py-1.5 text-sm">KST +9 · 2026-07-30</div>
        <div className="px-2 py-1.5 text-sm text-muted-foreground">UTC +0 · 2026-07-30</div>
      </div>
    </div>
  ),
}

export const Open = {
  render: () => (
    <Popover open>
      <PopoverTrigger asChild>
        <Button variant="outline">KST +9 <ChevronDown /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="text-sm font-medium">타임존</div>
        <div className="mt-2 rounded-md bg-accent px-2 py-1.5 text-sm">KST +9 · 2026-07-30</div>
        <div className="px-2 py-1.5 text-sm text-muted-foreground">UTC +0 · 2026-07-30</div>
      </PopoverContent>
    </Popover>
  ),
}

export const __namedExportsOrder = ["Static", "Open"]
