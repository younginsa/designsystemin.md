"use client"

// 아이콘 셀렉터 — shadcn DropdownMenu 조합 프리셋 (새 엔진 아님).
// 좌측 아이콘 + 라벨(+보조 텍스트) 트리거, 패널은 목록 + 현재값 체크.
// 타임존·호선 전환·제품 선택 등 "아이콘 + 목록" 셀렉터 전부 이걸로 — 인스턴스는 props만 다르다.
//
// 타입 3종: 아이콘형(icon 지정) · 텍스트형(icon 생략) · 다중형(multiple).
// 선택 문법은 시스템 기준이다 — 단일 = 왼쪽 ✓ 상시 슬롯(선택 행만 불투명),
// 다중 = 왼쪽 Checkbox 상시 노출. 구분 신호는 ✓ vs ☐ 글리프이고, 다중형은 토글해도
// 패널이 닫히지 않는다(연속 선택). 값 표기는 items 순서대로 ", " 병합.

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
import { Checkbox } from "./checkbox"
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
  /** 다중형 — 항목이 Checkbox가 되고 토글해도 패널이 닫히지 않는다 */
  multiple?: boolean
  /** 다중형 선택값. items 순서로 정규화되어 전달된다 */
  values?: string[]
  onValuesChange?: (values: string[]) => void
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
  multiple,
  values,
  onValuesChange,
  heading,
  sub,
  className,
  align = "end",
  defaultOpen,
}: IconSelectProps) {
  const current = items.find((i) => i.value === value)
  const selected = values ?? []
  // 값 표기는 items 순서로 고정 — 고른 순서대로 흐르면 같은 조합이 매번 다르게 보인다
  const selectedLabel = items
    .filter((i) => selected.includes(i.value))
    .map((i) => i.label)
    .join(", ")
  const toggle = (v: string) =>
    onValuesChange?.(
      selected.includes(v)
        ? selected.filter((x) => x !== v)
        : items.filter((i) => selected.includes(i.value) || i.value === v).map((i) => i.value)
    )
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>
        {/* 트리거: 아웃라인 · 높이 36px(h-9, CTA·인풋과 동일 스케일) · 아이콘 간격 8px · 라벨+시간 가로 한 줄 + 우측 4px */}
        <Button variant="outline" className={cn("h-9 gap-2 px-3 font-normal shadow-none", className)}>
          {Icon ? <Icon className="size-4 shrink-0 text-secondary-foreground" /> : null}
          <span className="flex min-w-0 items-baseline gap-1.5 pr-1">
            <span className="truncate text-sm">
              {multiple ? selectedLabel || "선택" : current?.label ?? "선택"}
            </span>
            {sub ? (
              <span className="truncate text-xs text-secondary-foreground">{sub}</span>
            ) : null}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-secondary-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {heading ? (
          <>
            <DropdownMenuLabel className="text-xs text-secondary-foreground">{heading}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={(e) => {
              if (multiple) {
                // 다중형은 토글해도 닫지 않는다 — 연속 선택
                e.preventDefault()
                toggle(item.value)
              } else {
                onValueChange?.(item.value)
              }
            }}
            className="gap-2"
          >
            {multiple ? (
              <Checkbox checked={selected.includes(item.value)} className="pointer-events-none" />
            ) : (
              <Check className={cn("size-4", item.value === value ? "opacity-100" : "opacity-0")} />
            )}
            <span className="flex-1">{item.label}</span>
            {item.hint ? (
              <span className="text-xs tabular-nums text-secondary-foreground">{item.hint}</span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { IconSelect }
