"use client";

// S9 납품 제품 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트)
// 원천: hinas365 와이어프레임 wireframe_s9_delivery_list.html
//
// 와이어프레임 대조 메모
// - 부제 "총 23건 (취소 제외)" + 안내: 납품 제품은 호선 배정 시 자동 생성 —
//   이 화면은 납품·커미셔닝 예정일과 도면만 관리(직접 생성·삭제 불가)
// - 행 선택 체크박스 + "N건 선택됨 · 예정일 일괄 수정 · 선택 해제" 액션 바
// - 컬럼: 이름 / 제품▾ / 호선▾ / 납품 유형▾ / 계약▾ / 납품 예정일↕▾ / 커미셔닝 예정일▾ /
//   도면▾ / 취소 여부(기본: 취소 제외)
// - 행 클릭 → S10 납품 제품 상세
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, Info } from "lucide-react";

import { Button } from "@ds/ui/ui/button";
import { Checkbox } from "@ds/ui/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Progress } from "@ds/ui/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
import {
  ROWS_PER_PAGE_DEFAULT,
  RowsPerPage,
} from "@ds/ui/ui/rows-per-page";

// 새 규칙(2026-08-26): 정렬은 헤더 전담 · 필터는 전부 FilterBar(2026-08-26 승격 완료)
import {
  FilterBar,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";

const BASE = "/generated/sales365";

type Row = {
  id: string;
  name: string;
  product: string;
  hull: string;
  delivery: string;
  contract: string;
  dueOn: string | null;
  commissioningOn: string | null;
  drawings: number;
  cancelled: boolean;
};

const ROWS: Row[] = [
  { id: "D-001", name: "Hull 1001 · Control", product: "Control", hull: "Hull 1001", delivery: "납품 + 구독", contract: "C-2026-001", dueOn: "2027-03-01", commissioningOn: "2027-05-01", drawings: 3, cancelled: false },
  { id: "D-002", name: "Hull 1001 · SVM", product: "SVM", hull: "Hull 1001", delivery: "납품 + 구독", contract: "C-2026-001", dueOn: "2027-03-01", commissioningOn: null, drawings: 1, cancelled: false },
  { id: "D-003", name: "Hull 1002 · Control", product: "Control", hull: "Hull 1002", delivery: "납품 + 구독", contract: "C-2026-001", dueOn: "2027-06-01", commissioningOn: null, drawings: 0, cancelled: false },
  { id: "D-004", name: "Hull 1002 · SVM", product: "SVM", hull: "Hull 1002", delivery: "납품 + 구독", contract: "C-2026-001", dueOn: null, commissioningOn: null, drawings: 0, cancelled: false },
  { id: "D-005", name: "HN-2025-001 · SVM", product: "SVM", hull: "HN-2025-001", delivery: "납품", contract: "C-2026-017", dueOn: "2026-02-01", commissioningOn: "2026-03-01", drawings: 2, cancelled: false },
  { id: "D-006", name: "HN-2025-002 · SVM", product: "SVM", hull: "HN-2025-002", delivery: "납품", contract: "C-2026-017", dueOn: "2026-05-01", commissioningOn: null, drawings: 0, cancelled: false },
  { id: "D-007", name: "2001 · Control", product: "Control", hull: "2001", delivery: "구독", contract: "C-2025-003", dueOn: "2025-10-01", commissioningOn: "2025-10-20", drawings: 1, cancelled: false },
  { id: "D-008", name: "Hull 1004 · Control", product: "Control", hull: "Hull 1004", delivery: "납품 + 구독", contract: "C-2026-001", dueOn: null, commissioningOn: null, drawings: 0, cancelled: true },
];

const TOTAL = 23;

// 새 규칙(2026-08-26): 필터는 전부 FilterBar — 컬럼 헤더 필터 편입.
const PAGE_FILTERS: FilterDef[] = [
  { name: "cancelled", label: "취소 여부", options: ["정상", "취소"], base: true },
  { name: "product", label: "제품", options: ["Control", "SVM", "Navigation", "Cloud"], multi: true },
  { name: "vessel", label: "호선", options: ["Hull 1001", "Hull 1002", "Hull 1004", "HN-2025-001", "2001"], multi: true },
  { name: "dtype", label: "납품 유형", options: ["납품", "납품 + 구독", "구독", "1회성 업데이트"], multi: true },
  { name: "contract", label: "계약", options: ["C-2026-001", "C-2026-017", "C-2025-003"], multi: true },
  { name: "drawing", label: "도면", options: ["있음", "없음"] },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365DeliveriesPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  // 푸터 페이지네이션 문법(2026-08-26) — 페이지네이션 없어도 페이지당·전체 건수는 하단
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({ cancelled: "정상" });
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  const [checked, setChecked] = React.useState<string[]>([]);

  // 헤더 정렬 실동작 — 납품 예정일
  const [sortAsc, setSortAsc] = React.useState(true);
  const rows = (view === "empty" ? [] : [...ROWS]).sort((a, b) => {
    // 예정일 미정(null)은 정렬 방향과 무관하게 맨 아래
    if (!a.dueOn && !b.dueOn) return 0;
    if (!a.dueOn) return 1;
    if (!b.dueOn) return -1;
    const c = a.dueOn.localeCompare(b.dueOn);
    return sortAsc ? c : -c;
  });
  const toggleRow = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));


  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">납품 제품</h1>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* 자동 생성 안내 */}
      <p className="flex items-start gap-1.5 text-xs text-secondary-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        납품 제품은 호선 배정 시 자동 생성되며, 이 화면에서는 납품·커미셔닝 예정일과 도면을
        관리합니다. 직접 만들거나 지울 수 없습니다.
      </p>

      {/* ── 툴바 — 새 규칙(2026-08-26): 필터는 전부 여기, 헤더는 정렬만 ── */}
      <FilterBar
        searchPlaceholder="납품 제품 이름 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={PAGE_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
      />

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">납품 제품 목록을 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="납품 제품 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>납품 제품이 없습니다.</EmptyTitle>
            <EmptyDescription>계약에서 호선을 배정하면 자동으로 생성됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <>
          {/* 선택 액션 바 */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-secondary-foreground">{checked.length}건 선택됨</span>
            <Button variant="outline" size="sm" disabled={checked.length === 0}>
              <CalendarDays className="size-4" /> 예정일 일괄 수정
            </Button>
            {checked.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setChecked([])}>
                선택 해제
              </Button>
            )}
          </div>

          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="전체 선택"
                    checked={checked.length === rows.length && rows.length > 0}
                    onCheckedChange={(v) => setChecked(v ? rows.map((r) => r.id) : [])}
                  />
                </TableHead>
                <TableHead>납품 제품 이름</TableHead>
                <TableHead>제품</TableHead>
                <TableHead>호선</TableHead>
                <TableHead>납품 유형</TableHead>
                <TableHead>계약</TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => setSortAsc((a) => !a)}>
                    납품 예정일 {sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead>커미셔닝 예정일</TableHead>
                <TableHead>도면</TableHead>
                <TableHead>취소 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  className={"cursor-pointer hover:bg-accent" + (r.cancelled ? " opacity-60" : "")}
                  onClick={() => router.push(`${BASE}/deliveries/detail`)}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`${r.name} 선택`}
                      checked={checked.includes(r.id)}
                      onCheckedChange={() => toggleRow(r.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`${BASE}/deliveries/detail`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell>{r.product}</TableCell>
                  <TableCell className="font-mono text-sm">{r.hull}</TableCell>
                  <TableCell>{r.delivery}</TableCell>
                  <TableCell className="font-mono text-sm">{r.contract}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {r.dueOn ?? <span className="text-secondary-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {r.commissioningOn ?? <span className="text-secondary-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.drawings > 0 ? (
                      `${r.drawings}건`
                    ) : (
                      <span className="text-secondary-foreground">없음</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.cancelled ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                        <span className="size-2 rounded-full bg-destructive" /> 취소
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className="size-2 rounded-full bg-muted-foreground" /> 정상
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ── 푸터 — 건수는 하단 규칙(2026-08-26) ── */}
          <RowsPerPage
            value={pageSize}
            onChange={setPageSize}
            summary={`총 ${TOTAL}건 (취소 제외)`}
          />
        </>
      )}
    </div>
  );
}
