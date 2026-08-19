"use client"

// 아이콘 셀렉터 — shadcn DropdownMenu 조합 프리셋 (새 엔진 아님).
// 좌측 아이콘 + 라벨(+보조 텍스트) 트리거, 패널은 목록 + 현재값 체크.
// 타임존·호선 전환·제품 선택 등 "아이콘 + 목록" 셀렉터 전부 이걸로 — 인스턴스는 props만 다르다.

import * as React from "react"
import { Check, ChevronDown, type LucideIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Button } from "./button"
import { cn } from "../lib/utils"

export interface IconSelectItem {
  value: string
  label: string
  hint?: string
}

export interface IconSelectProps {
  /** 아이콘형/텍스트형 — 아이콘을 생략하면 텍스트형 트리거가 된다 */
  icon?: LucideIcon
  value?: string
  items: IconSelectItem[]
  onValueChange?: (value: string) => void
  heading?: string
  sub?: string
  className?: string
  align?: "start" | "end"
  defaultOpen?: boolean
}

function IconSelect({
  icon: Icon,
  value,
  items,
  onValueChange,
  heading,
  sub,
  className,
  align = "end",
  defaultOpen,
}: IconSelectProps) {
  const current = items.find((i) => i.value === value)
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>
        {/* 트리거: 아웃라인 · 높이 36px(h-9, CTA·인풋과 동일 스케일) · 아이콘 간격 8px · 라벨+시간 가로 한 줄 + 우측 4px */}
        <Button variant="outline" className={cn("h-9 gap-2 px-3 font-normal shadow-none", className)}>
          {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
          <span className="flex min-w-0 items-baseline gap-1.5 pr-1">
            <span className="truncate text-sm">{current?.label ?? "선택"}</span>
            {sub ? (
              <span className="truncate text-xs text-muted-foreground">{sub}</span>
            ) : null}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {heading ? (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">{heading}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={() => onValueChange?.(item.value)}
            className="gap-2"
          >
            <Check className={cn("size-4", item.value === value ? "opacity-100" : "opacity-0")} />
            <span className="flex-1">{item.label}</span>
            {item.hint ? (
              <span className="text-xs tabular-nums text-muted-foreground">{item.hint}</span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { IconSelect }
