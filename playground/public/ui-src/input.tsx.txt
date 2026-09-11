import * as React from "react"

import { cn } from "@ds/ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // truncate(2026-09-08 디자이너 확정) — 긴 placeholder·포커스 밖 긴 값이 잘리지 않고 말줄임(…)으로 끝난다.
        // 발단: FilterBar 검색창(w-64)의 스펙 placeholder "Hull No. · 선명 · IMO · 선주 · 조선소 · 시리즈 코드 검색"
        "h-9 w-full min-w-0 truncate rounded-md border border-border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-input disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
