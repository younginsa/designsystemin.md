import { cn } from "@ds/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  )
}

// ── 로딩 프리셋 ────────────────────────────────────────────────────────────
// 로딩 상태 표준 = 스켈레톤(ds365: skeleton). 화면마다 손으로 배치하면 골격이 제각각
// 표류하므로, 본문 유형별 프리셋을 어휘로 고정한다.
// 프리셋이 맞지 않는 화면만 Skeleton을 직접 조합한다.

/** A 리스트(표) 본문 — 헤더 1줄 + 데이터 행 */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex gap-6 border-b pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b py-3 last:border-b-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

/** D 대시보드 본문 — 통계 카드 3열 + 차트 카드 3열 */
function CardGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg bg-card p-4 shadow-card">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg bg-card p-4 shadow-card">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mx-auto size-36 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** B 상세 본문 — 타이틀 + 문단 블록 */
function BlockSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export { Skeleton, TableSkeleton, CardGridSkeleton, BlockSkeleton }
