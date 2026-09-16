import * as React from "react";

import { cn } from "@ds/ui/lib/utils";

// 원본 재현 — HiNAS 365 시스템 진단 상세의 상태 히트맵(Camera Status · Pod Status).
// 행 = 항목(카메라·파드), 열 = 시간대. 셀 톤은 4종뿐(DES-206: 노랑·파랑 계열은 primary 로 대체):
//   success(정상) · primary(판정 불가·완료·대기) · destructive(이상) · none(데이터 없음 — muted 40%).
// 카드 셸(제목·설명·Expand All)은 화면이 Card variant="flat" 로 감싼다 — 이 컴포넌트는 범례 + 표만.

type HeatmapTone = "success" | "primary" | "destructive" | "none";

const TONE_CLS: Record<HeatmapTone, string> = {
  success: "bg-success",
  primary: "bg-primary",
  destructive: "bg-destructive",
  none: "bg-muted opacity-40",
};

const LEGEND_CLS: Record<HeatmapTone, string> = {
  success: "bg-success",
  primary: "bg-primary",
  destructive: "bg-destructive",
  none: "bg-muted",
};

type HeatmapRow = {
  name: string;
  /** 그룹 행 — 이름 앞에 + 표시 */
  group?: boolean;
  /** 열 순서대로의 셀 톤 — columns 와 같은 길이 */
  cells: HeatmapTone[];
};

function HeatmapLegend({
  className,
  items,
  ...props
}: React.ComponentProps<"div"> & { items: { label: string; tone: HeatmapTone }[] }) {
  return (
    <div
      data-slot="heatmap-legend"
      className={cn("flex flex-wrap gap-4", className)}
      {...props}
    >
      {items.map((it) => (
        <span
          key={it.label}
          className="flex items-center gap-1.5 text-xs text-secondary-foreground"
        >
          <span aria-hidden className={cn("size-2 rounded-full", LEGEND_CLS[it.tone])} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function HeatmapGrid({
  className,
  columns,
  rows,
  rowLabel,
  cellTitle = (row, column) => `${row.name} · ${column}`,
  ...props
}: Omit<React.ComponentProps<"table">, "rows"> & {
  /** 열 라벨(시간대) */
  columns: string[];
  rows: HeatmapRow[];
  /** 첫 열 헤더(항목 종류 — Camera · Pod) */
  rowLabel?: string;
  /** 셀 title(툴팁) — 기본 "행 이름 · 열 라벨" */
  cellTitle?: (row: HeatmapRow, column: string) => string;
}) {
  return (
    <div data-slot="heatmap-grid" className="overflow-x-auto">
      <table className={cn("w-full", className)} {...props}>
        <thead>
          <tr>
            <th className="w-48 py-2 text-left text-xs font-medium uppercase text-secondary-foreground">
              {rowLabel}
            </th>
            {columns.map((c) => (
              <th
                key={c}
                className="py-2 text-left text-xs font-normal text-secondary-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} data-group={r.group ? "" : undefined}>
              <td className="max-w-48 truncate py-1 pr-4 font-mono text-sm">
                {r.group ? <span className="mr-1 text-secondary-foreground">+</span> : null}
                {r.name}
              </td>
              {columns.map((c, i) => {
                const tone = r.cells[i] ?? "none";
                return (
                  <td key={c} className="py-1 pr-1">
                    <span
                      data-tone={tone}
                      className={cn("block h-5 w-full min-w-8 rounded-sm", TONE_CLS[tone])}
                      title={tone === "none" ? undefined : cellTitle(r, c)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { HeatmapGrid, HeatmapLegend };
export type { HeatmapRow, HeatmapTone };
