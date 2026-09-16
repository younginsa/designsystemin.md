import * as React from "react"

import { HeatmapGrid, HeatmapLegend, type HeatmapRow } from "./heatmap-grid"

/* HeatmapGrid 스토리 — 시스템 진단 상세의 상태 히트맵 원문(Camera Status · Pod Status, 2026-09-16 채택).
 * 행 = 항목, 열 = 시간대. 셀 톤 4종(DES-206: 노랑·파랑 계열은 primary 로 대체):
 * success · primary · destructive · none(muted 40%). 범례는 HeatmapLegend, 카드 셸은 화면의 Card variant="flat". */

export default {
  title: "DS/HeatmapGrid",
  component: HeatmapGrid,
}

const DAYS = ["07-21", "07-22", "07-23", "07-24", "07-25", "07-26", "07-27", "07-28"]

const CAMERA: HeatmapRow[] = [
  { name: "bow", cells: ["none", "destructive", "destructive", "destructive", "destructive", "none", "none", "none"] },
  { name: "port-1", cells: ["none", "success", "destructive", "destructive", "destructive", "none", "none", "none"] },
  { name: "port-2", cells: ["none", "destructive", "destructive", "destructive", "destructive", "none", "none", "none"] },
  { name: "stbd-1", cells: ["none", "success", "destructive", "destructive", "destructive", "none", "none", "none"] },
  { name: "stbd-2", cells: ["none", "success", "destructive", "destructive", "destructive", "none", "none", "none"] },
  { name: "stern", cells: ["none", "destructive", "destructive", "destructive", "destructive", "none", "none", "none"] },
]

const PODS: HeatmapRow[] = [
  { name: "adta-0", cells: ["none", "success", "success", "success", "success", "none", "none", "none"] },
  { name: "argocd", group: true, cells: ["none", "success", "success", "success", "success", "none", "none", "none"] },
  { name: "codecommit-creds-refresh", cells: ["primary", "none", "none", "none", "none", "none", "none", "none"] },
  { name: "core-redis", cells: ["none", "success", "success", "success", "success", "none", "none", "none"] },
  { name: "disk-manager", group: true, cells: ["none", "success", "destructive", "success", "success", "none", "none", "none"] },
]

/** 카메라 상태 — 정상(success) · 이상(destructive) · 데이터 없음(none) */
export const Default = {
  parameters: { vocab: "heatmap" },
  render: () => <HeatmapGrid columns={DAYS} rows={CAMERA} rowLabel="Camera" />,
}

/** 범례 + 표 — 진단 상세의 카드 안 구성 */
export const Legend = {
  parameters: { vocab: "heatmap" },
  render: () => (
    <div className="space-y-3">
      <HeatmapLegend
        items={[
          { label: "NORMAL", tone: "success" },
          { label: "NO_DATA", tone: "none" },
          { label: "UNDETERMINABLE", tone: "primary" },
          { label: "ABNORMAL", tone: "destructive" },
        ]}
      />
      <HeatmapGrid columns={DAYS} rows={CAMERA} rowLabel="Camera" />
    </div>
  ),
}

/** 파드 상태 — 그룹 행(+) · 완료/대기는 primary */
export const Grouped = {
  parameters: { vocab: "heatmap" },
  render: () => <HeatmapGrid columns={DAYS} rows={PODS} rowLabel="Pod" />,
}

export const __namedExportsOrder = ["Default", "Legend", "Grouped"]
