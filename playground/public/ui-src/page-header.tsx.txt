import * as React from "react";

import { cn } from "@ds/ui/lib/utils";

// 조합 제작 — 페이지 헤더(타이틀 행). 갤러리 22면의 손 조합을 한 프리셋으로(2026-09-16).
// 규칙(admin-console · design.md §4): 제목 text-lg font-bold · 단일 줄이면 items-center,
// 부제(description)가 있을 때만 items-start · 우측은 페이지 레벨 액션만(목록 액션은 FilterBar actions 슬롯) ·
// "총 N건" 부제 금지(건수는 ListFooter 가 소유).

type PageHeaderProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** 페이지 제목 — h1 text-lg font-bold */
  title: React.ReactNode;
  /** 부제(설명 텍스트). 있을 때만 행이 items-start 가 된다 */
  description?: React.ReactNode;
  /** 제목 옆 인라인 — 상태 배지·설명 툴팁 등 */
  addon?: React.ReactNode;
  /** 제목 앞 — 아바타 등 */
  leading?: React.ReactNode;
  /** 우측 페이지 레벨 액션(파괴적 액션·StatePreview 등) */
  actions?: React.ReactNode;
};

function PageHeader({
  className,
  title,
  description,
  addon,
  leading,
  actions,
  ...props
}: PageHeaderProps) {
  const align = description ? "items-start" : "items-center";
  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-wrap justify-between gap-4", align, className)}
      {...props}
    >
      <div className={cn("flex min-w-0 gap-3", align)}>
        {leading}
        <div className="min-w-0">
          <h1
            data-slot="page-header-title"
            className="flex items-center gap-2 text-lg font-bold"
          >
            {title}
            {addon}
          </h1>
          {description ? (
            <p
              data-slot="page-header-description"
              className="text-sm text-secondary-foreground"
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div
          data-slot="page-header-actions"
          className="flex items-center gap-2"
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps };
