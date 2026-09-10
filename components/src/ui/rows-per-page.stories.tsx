import * as React from "react"

import { RowsPerPage } from "./rows-per-page"

/* RowsPerPage 스토리 — 페이지당 행 수(rows-per-page 카드, 목록 푸터 좌측). "페이지당:" + Button ghost sm 값 ˅(DropdownMenu, side top, ✓ 오른쪽) + 세로 구분선 h-5 + 전체 건수 summary.
 * 옵션 기본 10 · 15 · 30 · 50, ROWS_PER_PAGE_DEFAULT 15. controlled — Demo 래퍼. @storybook import 0. */

export default {
  title: "DS/RowsPerPage",
  component: RowsPerPage,
}

function Demo({ summary }: { summary: React.ReactNode }) {
  const [v, setV] = React.useState(15)
  return <RowsPerPage value={v} onChange={setV} summary={summary} />
}

export const Default = {
  parameters: { vocab: "rows-per-page" },
  render: () => <Demo summary={<>전체 247척 (<span className="text-destructive">●</span> 미입력 38척)</>} />,
}

export const Plain = {
  render: () => <Demo summary="전체 60건" />,
}

export const __namedExportsOrder = ["Default", "Plain"]
