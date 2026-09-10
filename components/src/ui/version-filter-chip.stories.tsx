import * as React from "react"

import { VersionFilterChip, type VersionRow } from "./version-filter-chip"

/* VersionFilterChip 스토리 — 버전 조건 필터 칩(version-filter-chip 카드). 칩 클릭 → 캐스케이드 3단(제품 → 공통 버전 → 제품 버전) 패널,
 * 적용 요약 = "제품 · 공통 · 제품버전" (2건 이상은 "… 외 N건"). 허브 카드는 패널이 포털이라 /shadcn-preview/version-filter-chip 을 iframe 으로 담는다.
 * controlled — Demo 래퍼. @storybook import 0. */

export default {
  title: "DS/VersionFilterChip",
  component: VersionFilterChip,
}

const PRODUCTS = ["Control", "Navigation", "SVM"]
const COMMON = ["v4.0.0", "v3.5.0", "v3.4.2"]
const PRODUCT_VERSIONS: Record<string, string[]> = {
  Control: ["v2.1.0", "v2.0.3"],
  Navigation: ["v3.5.3", "v3.5.0"],
  SVM: ["v1.2.0", "v1.1.4"],
}

function Demo({ initial }: { initial: VersionRow[] }) {
  const [value, setValue] = React.useState<VersionRow[]>(initial)
  return (
    <VersionFilterChip
      products={PRODUCTS}
      commonVersions={COMMON}
      productVersions={PRODUCT_VERSIONS}
      value={value}
      onChange={setValue}
    />
  )
}

export const Applied = {
  parameters: { vocab: "version-filter-chip" },
  render: () => <Demo initial={[{ id: 1, product: "Control", commonVersion: "v4.0.0", productVersion: "v2.1.0" }]} />,
}

export const Empty = {
  render: () => <Demo initial={[]} />,
}

export const Multiple = {
  render: () => (
    <Demo
      initial={[
        { id: 1, product: "Control", commonVersion: "v4.0.0", productVersion: "v2.1.0" },
        { id: 2, product: "SVM", commonVersion: "v3.5.0", productVersion: "v1.2.0" },
      ]}
    />
  ),
}

export const __namedExportsOrder = ["Applied", "Empty", "Multiple"]
