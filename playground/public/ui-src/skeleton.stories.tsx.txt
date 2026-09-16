import * as React from "react"

import { BlockSkeleton, CardGridSkeleton, Skeleton, TableSkeleton } from "./skeleton"

/* Skeleton 스토리 — 로딩 상태 표준(skeleton 카드). Skeleton = animate-pulse rounded-md bg-accent.
 * 프리셋(본문 유형별 골격 고정): TableSkeleton(A 리스트) · CardGridSkeleton(D 대시보드) · BlockSkeleton(B 상세). 프리셋이 안 맞는 화면만 직접 조합. @storybook import 0. */

export default {
  title: "DS/Skeleton",
  component: Skeleton,
}

export const Table = {
  parameters: { vocab: "skeleton" },
  render: () => <TableSkeleton rows={3} />,
}

export const CardGrid = {
  render: () => (
    <div className="w-[720px]">
      <CardGridSkeleton />
    </div>
  ),
}

export const Block = {
  render: () => (
    <div className="w-[560px]">
      <BlockSkeleton />
    </div>
  ),
}

export const Atoms = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="size-10 rounded-full" />
    </div>
  ),
}

export const __namedExportsOrder = ["Table", "CardGrid", "Block", "Atoms"]
