import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@ds/ui/lib/utils";

// 원본 재현 — HiNAS 365 위저드 스테퍼 (완료 체크 · 현재 강조 · 미래 muted).

function Stepper({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="stepper"
      className={cn("flex w-full items-center gap-2", className)}
      {...props}
    />
  );
}

type StepState = "completed" | "current" | "upcoming";

function StepperItem({
  className,
  step,
  state = "upcoming",
  children,
  ...props
}: React.ComponentProps<"li"> & { step: number; state?: StepState }) {
  return (
    <li
      data-slot="stepper-item"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "group/step flex flex-1 items-center gap-2 last:flex-none",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          state === "completed" && "border-primary bg-primary text-primary-foreground",
          state === "current" && "border-primary bg-background text-primary",
          state === "upcoming" && "border-border bg-background text-secondary-foreground"
        )}
      >
        {state === "completed" ? <Check className="size-4" /> : step}
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-sm",
          state === "current"
            ? "font-semibold text-foreground"
            : "text-secondary-foreground"
        )}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          "h-px flex-1 group-last/step:hidden",
          state === "completed" ? "bg-primary" : "bg-border"
        )}
      />
    </li>
  );
}

export { Stepper, StepperItem };
