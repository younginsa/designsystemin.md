import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@ds/ui/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // hover 는 인터랙티브 Badge(a · button 렌더)에만 — 종전 [a&] 는 앵커 한정이라 button 칩(감사 로그 분류)이 손으로 hover 를 달았다(2026-09-14 확장)
        default: "bg-primary text-primary-foreground [:is(a,button)&]:hover:bg-primary/90",
        secondary:
          // hover = accent(중립 면 규칙, Button secondary 와 동일 — 종전 secondary/90 은 흰 면 위에서 안 보였다. 2026-09-14)
          "bg-secondary text-secondary-foreground [:is(a,button)&]:hover:bg-accent [:is(a,button)&]:hover:text-accent-foreground",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [:is(a,button)&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [:is(a,button)&]:hover:bg-accent [:is(a,button)&]:hover:text-accent-foreground",
        ghost: "[:is(a,button)&]:hover:bg-accent [:is(a,button)&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [:is(a,button)&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
