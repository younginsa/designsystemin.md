"use client";

// 업데이트 리스트 — ① HiNAS 365 메인 레이아웃 + A 리스트 본문
// 원천: Avikus Design library 「업데이트」 캡처
//
// 원본 대조 메모
// - IMO 검색 + "호선·제품별 최신 항목만 보기" 스위치(기본 켬)
// - 컬럼: UPDATE ID(정렬) · IMO NUMBER(정렬·링크) · PRODUCT(필터) · STATUS(필터)
//   · DATE RANGE(캘린더 팝오버: 오늘/최근 일주일/최근 한달 + From/To + 적용 + Reset)
// - 상태: IMAGE READY(주황=warning → DES-206 부재로 primary 대체) ·
//   PENDING(무채색) · DOWNLOAD REQUESTED(파랑 칩 → secondary 칩)
// - START/END 날짜 + (n개월 전)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronsUpDown,
  ListFilter,
} from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ds/ui/ui/pagination";
import { Progress } from "@ds/ui/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ds/ui/ui/select";
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
import {
  DATE_PRESETS,
  FilterBar,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

type UpdateStatus = "IMAGE READY" | "PENDING" | "DOWNLOAD REQUESTED";

// data-status 확정 스펙 — 도트 8px + 기본색 텍스트(text-sm), 배경·색 텍스트 없음
// success=준비 완료 · muted=대기 · info=요청/진행(원본 파랑 칩과 일치 — 계약 '진행 중'과 동일 계열)
const STATUS_RENDER: Record<UpdateStatus, React.ReactNode> = {
  "IMAGE READY": (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="size-2 rounded-full bg-success" /> IMAGE READY
    </span>
  ),
  PENDING: (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="size-2 rounded-full bg-muted-foreground" /> PENDING
    </span>
  ),
  "DOWNLOAD REQUESTED": (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="size-2 rounded-full bg-primary" /> DOWNLOAD REQUESTED
    </span>
  ),
};

const ROWS: {
  id: string;
  imo: string;
  product: string;
  status: UpdateStatus;
  start: string;
  startAgo: string;
  end: string | null;
}[] = [
  { id: "068b1f66", imo: "SVM_V120_RC1", product: "SVM", status: "IMAGE READY", start: "2026-01-05 11:20", startAgo: "7개월 전", end: null },
  { id: "28a322fb", imo: "UPDATE_TEST", product: "SVM", status: "PENDING", start: "2026-01-09 16:44", startAgo: "6개월 전", end: null },
  { id: "c25d4239", imo: "SVM_UPDATE_TEST_324234", product: "SVM", status: "PENDING", start: "2026-01-12 09:31", startAgo: "6개월 전", end: null },
  { id: "2b6aebd6", imo: "SVM_UPDATE_TEST_324234342", product: "SVM", status: "PENDING", start: "2026-01-14 08:55", startAgo: "6개월 전", end: null },
  { id: "88188521", imo: "LIBRARY_UPDATE_TEST", product: "SVM", status: "DOWNLOAD REQUESTED", start: "2026-01-28 00:53", startAgo: "6개월 전", end: null },
  { id: "00478e55", imo: "LIBRARY_UPDATE_TEST_2", product: "SVM", status: "DOWNLOAD REQUESTED", start: "2026-01-28 01:06", startAgo: "6개월 전", end: null },
  { id: "1158ead1", imo: "LIBRARY_UPDATE_TEST", product: "SVM", status: "DOWNLOAD REQUESTED", start: "2026-01-29 08:41", startAgo: "5개월 전", end: null },
];

const YEARS = ["2025년", "2026년"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const DAYS = ["1일", "7일", "14일", "21일", "28일"];

// 새 규칙(2026-08-26): 정렬은 헤더 전담 · 필터는 전부 FilterBar.
// 최신만 보기는 기본값이 있는 필터라 base 칩(값 상시 노출).
const UPDATE_FILTERS: FilterDef[] = [
  { name: "latest", label: "표시", options: ["최신 항목만", "전체 이력"], base: true },
  { name: "product", label: "제품", options: ["SVM", "Control", "Navigation"] },
  { name: "status", label: "상태", options: ["Image Ready", "Pending", "Download Requested"] },
  { name: "requested", label: "요청 기간", kind: "date", presets: DATE_PRESETS },
];

type SortField = "id" | "imo";
type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function UpdatesPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [keyword, setKeyword] = React.useState("");
  const [sort, setSort] = React.useState<SortField>("id");
  const [sortAsc, setSortAsc] = React.useState(false);
  const [filterValues, setFilterValues] = React.useState<FilterValues>({ latest: "최신 항목만" });
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  // 페이지당 행 수 — 기본 15, 푸터 드롭업에서 변경(2026-08-26)
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);

  // 헤더 정렬 실동작 — id·imo 문자열 사전순
  const rows = (view === "empty" ? [] : [...ROWS]).sort((a, b) => {
    const c = a[sort].localeCompare(b[sort]);
    return sortAsc ? c : -c;
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-bold">업데이트 리스트</h1>
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
        </div>

        {/* ── 툴바 — header-filter 시스템. 새 규칙(2026-08-26): 필터는 전부 여기,
             헤더는 정렬만. 구 헤더 필터(PRODUCT·STATUS·기간)·최신만 스위치 편입 ── */}
        <FilterBar
          searchPlaceholder="IMO 검색"
          keyword={keyword}
          onKeyword={setKeyword}
          filters={UPDATE_FILTERS}
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
            <p className="text-sm text-secondary-foreground">업데이트 목록을 불러오는 중입니다…</p>
          </div>
        )}

        {view === "error" && (
          <ErrorState
            title="업데이트 목록을 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {view === "empty" && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>업데이트 이력이 없습니다.</EmptyTitle>
              <EmptyDescription>업데이트가 요청되면 이 목록에 표시됩니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {view === "default" && (
          <>
            <div>
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    {/* 새 규칙(2026-08-26): 헤더는 정렬 전담 — 필터는 FilterBar로 이동 */}
                    <TableHead>
                      <SortBtn label="업데이트 ID" active={sort === "id"} asc={sortAsc} onClick={() => { setSort("id"); setSortAsc((a) => sort === "id" ? !a : false); }} />
                    </TableHead>
                    <TableHead>
                      <SortBtn label="IMO" active={sort === "imo"} asc={sortAsc} onClick={() => { setSort("imo"); setSortAsc((a) => sort === "imo" ? !a : false); }} />
                    </TableHead>
                    <TableHead>제품</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>요청 기간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id + r.start}>
                      <TableCell className="font-mono text-sm">{r.id}</TableCell>
                      <TableCell>
                        <a href="#" className="font-medium text-primary hover:underline">
                          {r.imo}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.product}</Badge>
                      </TableCell>
                      <TableCell>{STATUS_RENDER[r.status]}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-sm">
                          <p className="flex items-baseline gap-2">
                            <span className="text-xs uppercase text-secondary-foreground">Start</span>
                            <span className="font-mono">{r.start}</span>
                            <span className="text-xs text-secondary-foreground">({r.startAgo})</span>
                          </p>
                          <p className="flex items-baseline gap-2">
                            <span className="text-xs uppercase text-secondary-foreground">End</span>
                            <span className="font-mono">{r.end ?? "-"}</span>
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* 좌: 페이지당 표시 + 전체 건수 · 우: 페이지네이션 (2026-08-26 확정) */}
              <RowsPerPage value={pageSize} onChange={setPageSize} summary={`전체 ${rows.length}건`} />
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" aria-disabled={page <= 1} onClick={() => setPage(1)} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={() => setPage(1)} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

function SortBtn({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  const Icon = active ? (asc ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <Button variant="ghost" size="sm" className="-ml-2 uppercase" onClick={onClick}>
      {label}
      <Icon className={active ? "size-4" : "size-4 text-secondary-foreground"} />
    </Button>
  );
}
