"use client";

// S5 계약 호선 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트)
// 원천: hinas365 와이어프레임 wireframe_s5_vessel_list.html
//
// 와이어프레임 대조 메모
// - 헤더: "전체 247척 · 미입력 식별자 38척"(warning 도트) + [+ 호선 등록](S2 위저드)
// - 컬럼 헤더 정렬(Hull ▲·인도 예정일 ↕) + 필터(선주·선종·선급·시리즈)
// - 선급은 복수 표기 "KR / DNV" — 필터에 '주선급으로만 검색' 스위치(★ 주선급만 대상)
// - 미입력 식별자(Ship Name·IMO) warning 도트 + 이탤릭, 조선소 '미정'
// - 행 클릭 → S7 계약 호선 상세
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown, Info, Plus } from "lucide-react";

import { Button } from "@ds/ui/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ds/ui/ui/pagination";
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
  hull: string;
  shipName: string | null;
  imo: string | null;
  owner: string;
  yard: string | null;
  shipType: string;
  classes: string[]; // 첫 항목 = ★ 주선급
  seriesCode: string | null;
  deliveryOn: string;
};

const ROWS: Row[] = [
  { hull: "1001", shipName: "MV EXAMPLE", imo: "9876543", owner: "○○해운", yard: "△△중공업", shipType: "Container", classes: ["KR", "DNV"], seriesCode: "SER-2026-A", deliveryOn: "2027-06-01" },
  { hull: "1002", shipName: "MV PIONEER", imo: "9876544", owner: "○○해운", yard: "△△중공업", shipType: "Container", classes: ["KR"], seriesCode: "SER-2026-A", deliveryOn: "2027-09-01" },
  { hull: "1003", shipName: null, imo: null, owner: "○○해운", yard: "△△중공업", shipType: "Container", classes: ["KR"], seriesCode: "SER-2026-A", deliveryOn: "2027-12-01" },
  { hull: "1004", shipName: null, imo: null, owner: "○○해운", yard: "△△중공업", shipType: "Container", classes: ["KR"], seriesCode: "SER-2026-A", deliveryOn: "2028-02-01" },
  { hull: "HN-2025-001", shipName: "OCEAN STAR", imo: "9765432", owner: "◇◇해운", yard: "□□조선", shipType: "Bulk Carrier", classes: ["BV"], seriesCode: "SER-2025-B", deliveryOn: "2026-03-15" },
  { hull: "HN-2025-002", shipName: "OCEAN MOON", imo: "9765433", owner: "◇◇해운", yard: "□□조선", shipType: "Bulk Carrier", classes: ["BV"], seriesCode: "SER-2025-B", deliveryOn: "2026-06-15" },
  { hull: "HN-2026-010", shipName: null, imo: null, owner: "▽▽선사", yard: null, shipType: "Tanker", classes: ["NK"], seriesCode: null, deliveryOn: "2028-01-01" },
  { hull: "HN-2026-011", shipName: null, imo: null, owner: "▽▽선사", yard: null, shipType: "Tanker", classes: ["NK"], seriesCode: null, deliveryOn: "2028-04-01" },
  { hull: "2001", shipName: "BLUE HORIZON", imo: "8123456", owner: "△△선사", yard: "○○중공업", shipType: "Container", classes: ["LR", "ABS"], seriesCode: "SER-2024-C", deliveryOn: "2025-11-01" },
  { hull: "2002", shipName: "RED HORIZON", imo: "8123457", owner: "△△선사", yard: "○○중공업", shipType: "Container", classes: ["LR"], seriesCode: "SER-2024-C", deliveryOn: "2026-01-01" },
];

const TOTAL = 247;
const MISSING = 38;

// 새 규칙(2026-08-26): 필터는 전부 FilterBar — 컬럼 헤더 필터 편입.
// 주선급 스위치는 별도 칩(선급 기준)으로, 미입력만 보기는 식별자 칩으로 흡수.
const VESSEL_FILTERS: FilterDef[] = [
  { name: "owner", label: "선주", options: ["○○해운", "◇◇해운", "▽▽선사", "△△선사"], multi: true },
  { name: "shipType", label: "선종", options: ["Container", "Bulk Carrier", "Tanker", "LNG Carrier", "RoRo"], multi: true },
  { name: "shipClass", label: "선급", options: ["KR", "LR", "BV", "DNV", "ABS", "NK"], multi: true },
  { name: "classBasis", label: "선급 기준", options: ["하나라도 일치", "주선급만"] },
  { name: "seriesCode", label: "시리즈 코드", options: ["SER-2026-A", "SER-2025-B", "SER-2024-C", "—"], multi: true },
  { name: "missing", label: "식별자", options: ["미입력만 보기"] },
];

const splitVal = (v?: string) => (v ? v.split(", ") : []);

// 미입력 표기 — warning 도트 + 이탤릭 (도트+텍스트 규칙)
function MissingMark() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm italic text-secondary-foreground">
      <span className="size-1.5 rounded-full bg-destructive" /> 미입력
    </span>
  );
}

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365VesselsPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  const [page, setPage] = React.useState(1);
  // 페이지당 행 수 — 기본 15, 푸터 드롭업에서 변경(2026-08-26)
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);
  const PAGE_COUNT = Math.max(1, Math.ceil(TOTAL / pageSize));
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [extraShown, setExtraShown] = React.useState<string[]>([]);

  // 헤더 정렬 실동작 — hull·인도 예정일
  const [sort, setSort] = React.useState<"hull" | "deliveryOn">("hull");
  const [sortAsc, setSortAsc] = React.useState(true);
  const sortBy = (f: "hull" | "deliveryOn") => {
    if (sort === f) setSortAsc((a) => !a);
    else {
      setSort(f);
      setSortAsc(true);
    }
  };
  const q = keyword.trim().toLowerCase();
  const rows = (view === "empty" ? [] : [...ROWS])
    .filter((r) => {
      if (
        q &&
        !r.hull.toLowerCase().includes(q) &&
        !(r.shipName ?? "").toLowerCase().includes(q) &&
        !(r.imo ?? "").includes(q)
      )
        return false;
      const owners = splitVal(filterValues.owner);
      if (owners.length && !owners.includes(r.owner)) return false;
      const types = splitVal(filterValues.shipType);
      if (types.length && !types.includes(r.shipType)) return false;
      // 선급 — 기본은 하나라도 일치, [선급 기준: 주선급만]이면 첫 항목(★)만 대상
      const classes = splitVal(filterValues.shipClass);
      if (classes.length) {
        const target = filterValues.classBasis === "주선급만" ? [r.classes[0]] : r.classes;
        if (!target.some((c) => classes.includes(c))) return false;
      }
      const series = splitVal(filterValues.seriesCode);
      if (series.length && !series.includes(r.seriesCode ?? "—")) return false;
      if (filterValues.missing === "미입력만 보기" && r.shipName && r.imo) return false;
      return true;
    })
    .sort((a, b) => {
      const c = a[sort].localeCompare(b[sort]);
      return sortAsc ? c : -c;
    });

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">계약 호선</h1>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* ── 툴바 — 새 규칙(2026-08-26): 필터는 전부 여기, 헤더는 정렬만 ── */}
      <FilterBar
        searchPlaceholder="Hull · 호선명 · IMO 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={VESSEL_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          <Button asChild>
            <Link href={`${BASE}/contracts/new`}>
              <Plus className="size-4" /> 호선 등록
            </Link>
          </Button>
        }
      />

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">계약 호선 목록을 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="계약 호선 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>등록된 계약 호선이 없습니다.</EmptyTitle>
            <EmptyDescription>
              계약 등록 위저드의 호선 생성 단계에서 호선을 만들면 이 목록에 표시됩니다.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={`${BASE}/contracts/new`}>
              <Plus className="size-4" /> 호선 등록
            </Link>
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <>
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("hull")}>
                    Hull Number {sort === "hull" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </TableHead>
                <TableHead>호선명</TableHead>
                <TableHead>IMO</TableHead>
                {/* 새 규칙(2026-08-26): 헤더는 정렬 전담 — 필터는 FilterBar로 이동 */}
                <TableHead>선주</TableHead>
                <TableHead>선종</TableHead>
                <TableHead>선급</TableHead>
                <TableHead>시리즈 코드</TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("deliveryOn")}>
                    인도 예정일 {sort === "deliveryOn" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.hull}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`${BASE}/vessels/detail`)}
                >
                  <TableCell>
                    <Link
                      href={`${BASE}/vessels/detail`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.hull}
                    </Link>
                  </TableCell>
                  <TableCell>{r.shipName ?? <MissingMark />}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {r.imo ?? <MissingMark />}
                  </TableCell>
                  <TableCell>{r.owner}</TableCell>
                  <TableCell>{r.shipType}</TableCell>
                  <TableCell>
                    {/* 첫 항목 = ★ 주선급, 복수는 " / " 연결 */}
                    {r.classes.join(" / ")}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {r.seriesCode ?? <span className="text-secondary-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.yard ?? <span className="italic text-secondary-foreground">미정</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.deliveryOn}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            {/* 좌: 페이지당 표시 + 전체 건수 · 우: 페이지네이션 (2026-08-26 확정) */}
            <RowsPerPage
              value={pageSize}
              onChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              summary={
                <span className="inline-flex items-center gap-1">
                  전체 {TOTAL}척 (<span className="size-1.5 rounded-full bg-destructive" />
                  미입력 {MISSING}척)
                </span>
              }
            />
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                </PaginationItem>
                {[1, 2, 3].map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink href="#" isActive={p === page} onClick={() => setPage(p)}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={page === PAGE_COUNT}
                    onClick={() => setPage(PAGE_COUNT)}
                  >
                    {PAGE_COUNT}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={page >= PAGE_COUNT}
                    onClick={() => setPage((p) => Math.min(PAGE_COUNT, p + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </div>
  );
}
