import * as React from "react";

import { cn } from "@ds/ui/lib/utils";

// 원본 재현 — HiNAS 365 STATUS HISTORY 타임라인.
// 점과 세로선이 같은 마커 컬럼(flex 중앙 정렬) 안에 있어 구조적으로 어긋날 수 없다.

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol data-slot="timeline" className={cn("flex flex-col", className)} {...props} />
  );
}

type TimelineStatus = "default" | "neutral" | "current" | "success" | "error";

// 점 = 단계의 상태. 빈 동그라미(default) → 회색 채움(neutral) → 의미색 채움(current·success·error).
// neutral 은 "값은 있지만 의미색을 붙일 수 없는" 단계 — StatusBadge 의 neutral 톤과 같은 회색(muted-foreground)이다.
// current 는 "지금 이 단계"라는 뜻이라 건수가 있다는 이유로 쓰지 않는다(2026-09-29 — 업데이트 현황 패널이 그렇게 써서 파란 점이 여러 개 생겼다).
const dotStyles: Record<TimelineStatus, string> = {
  default: "border-border bg-background",
  neutral: "border-muted-foreground bg-muted-foreground",
  current: "border-primary bg-primary",
  success: "border-success bg-success",
  error: "border-destructive bg-destructive",
};

function TimelineItem({
  className,
  status = "default",
  children,
  ...props
}: React.ComponentProps<"li"> & { status?: TimelineStatus }) {
  return (
    <li
      data-slot="timeline-item"
      data-status={status}
      className={cn("group/titem flex gap-3", className)}
      {...props}
    >
      <span aria-hidden className="flex w-4 shrink-0 flex-col items-center">
        <span
          className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full border-2",
            dotStyles[status]
          )}
        />
        <span className="mt-1 w-px flex-1 bg-border group-last/titem:hidden" />
      </span>
      <div className="flex-1 pb-6 group-last/titem:pb-0">{children}</div>
    </li>
  );
}

function TimelineTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="timeline-title"
      className={cn(
        "text-sm font-medium leading-none",
        "group-data-[status=error]/titem:text-destructive",
        className
      )}
      {...props}
    />
  );
}

function TimelineMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="timeline-meta"
      className={cn("mt-1.5 text-xs text-secondary-foreground", className)}
      {...props}
    />
  );
}

export { Timeline, TimelineItem, TimelineTitle, TimelineMeta };
