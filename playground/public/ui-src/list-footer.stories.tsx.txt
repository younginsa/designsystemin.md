import * as React from "react"

import { ListFooter } from "./list-footer"

/* ListFooter 스토리 — 목록 푸터(list-footer 카드). 좌 RowsPerPage(페이지당 · 전체 건수) + 우 Pagination 한 행.
 * 창 규칙 Previous · 1 · … · p−1 p p+1 · … · N · Next. 단일 페이지면 페이지네이션 생략. controlled — Demo 래퍼. @storybook import 0. */

export default {
  title: "DS/ListFooter",
  component: ListFooter,
}

function Demo({
  total,
  unit,
  initialPage = 1,
}: {
  total: number
  unit?: string
  initialPage?: number
}) {
  const [pageSize, setPageSize] = React.useState(15)
  const [page, setPage] = React.useState(initialPage)
  return (
    <ListFooter
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      total={total}
      unit={unit}
      page={page}
      onPageChange={setPage}
    />
  )
}

/** 첫 페이지 — Previous 비활성, 1 2 … 17 */
export const Default = {
  parameters: { vocab: "list-footer" },
  render: () => <Demo total={247} unit="척" />,
}

/** 중간 페이지 — 양쪽 … 노출 */
export const Middle = {
  parameters: { vocab: "list-footer" },
  render: () => <Demo total={247} unit="척" initialPage={5} />,
}

/** 단일 페이지 — 페이지네이션 생략, 건수만 */
export const SinglePage = {
  parameters: { vocab: "list-footer" },
  render: () => <Demo total={12} />,
}

export const __namedExportsOrder = ["Default", "Middle", "SinglePage"]
