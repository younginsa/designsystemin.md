"use client"

import * as React from "react"

import { cn } from "@ds/ui/lib/utils"

function Table({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"table"> & { variant?: "default" | "plain" }) {
  return (
    <div
      data-slot="table-container"
      className={
        // plain = 카드 내부용 경량 표(D 대시보드 패턴) — 외곽선·헤더 배경 없음
        variant === "plain"
          ? "relative w-full overflow-x-auto [&_thead]:bg-transparent"
          : // overflow-y-hidden — thead·행 배경이 둥근 모서리를 뚫는 클리핑 버그 방지(x축 스크롤 유지)
            "relative w-full overflow-x-auto overflow-y-hidden rounded-md border"
      }
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b bg-muted/50", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

// hover 잉크 = "클릭 가능" 신호다. 기본값으로 두면 헤더 행(TableHeader도 TableRow를 쓴다)과
// 클릭 불가능한 본문 행까지 클릭 가능한 척하게 된다 — 그래서 base에는 hover가 없다.
// 클릭 가능한 행에만 사용처에서 명시: className="cursor-pointer hover:bg-accent"
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-secondary-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-secondary-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
