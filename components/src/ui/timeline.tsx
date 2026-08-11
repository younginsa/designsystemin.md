import * as React from "react";

import { cn } from "@ds/ui/lib/utils";

// 원본 재현 — HiNAS 365 STATUS HISTORY 타임라인.
// 점과 세로선이 같은 마커 컬럼(flex 중앙 정렬) 안에 있어 구조적으로 어긋날 수 없다.

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol data-slot="timeline" className={cn("flex flex-col", className)} {...props} />
  );
}

type TimelineStatus = "default" | "current" | "success" | "error";

const dotStyles: Record<TimelineStatus, string> = {
  default: "border-muted-foreground bg-background",
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
      className={cn("mt-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Timeline, TimelineItem, TimelineTitle, TimelineMeta };
