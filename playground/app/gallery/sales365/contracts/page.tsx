"use client";

// S1 계약 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트 본문)
// 원천: hinas365 와이어프레임 wireframe_s1_contract_list.html
//
// 와이어프레임 대조 메모
// - 부제 "총 N건 (취소 제외)" — 취소 여부 필터 기본값이 '정상'이라 건수 옆에 명시
// - 새 규칙(2026-08-26): 헤더는 정렬 전담(계약명·척수·계약일) · 필터는 전부 FilterBar
//   (취소 여부 base 기본 정상 · 담당 base · 고객·계약 유형은 [+ 필터 추가])
// - 행: 계약명(링크+ID 서브) / 고객 / 유형 칩 / 담당(프로필+이름, 2026-09-04) / 척수(유효 슬롯 수 하나 — v2: 전체 병기 금지) /
//   계약일 / 취소 여부. 취소 행은 흐림 + 사유 서브
// - 행 클릭 → S3 계약 상세(추후 생성 — 링크는 자리만)
// - 내보내기는 목록 공통 요소 규칙(CSV/XLSX 드롭다운)으로 통일 — 와이어프레임은 플레인 버튼
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Info,
  Plus,
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

// 사람 요소 잠금(2026-09-04): 담당 = 프로필(이니셜) + 이름 — _detail/person 공유
import { Person } from "../../_detail/person";

const BASE = "/gallery/sales365";

type Row = {
  id: string;
  name: string;
  cancelled: boolean;
  cancelReason: string | null;
  customer: string;
  ctype: "신조" | "개조";
  date: string;
  owner: string;
  vessels: { valid: number; total: number };
};

// 와이어프레임 ROWS 이식 — 정상 8건 + 취소 1건
const ROWS: Row[] = [
  { id: "C-2026-044", name: "☆☆해운 Navi 2척", cancelled: false, cancelReason: null, customer: "☆☆해운", ctype: "신조", date: "2026-07-20", owner: "홍길동", vessels: { valid: 2, total: 2 } },
  { id: "C-2026-031", name: "○○해운 Cloud 구독", cancelled: false, cancelReason: null, customer: "○○해운", ctype: "신조", date: "2026-05-10", owner: "홍길동", vessels: { valid: 2, total: 2 } },
  { id: "C-2026-017", name: "△△해운 SVM 3척", cancelled: false, cancelReason: null, customer: "△△해운", ctype: "신조", date: "2026-03-01", owner: "김담당", vessels: { valid: 3, total: 3 } },
  { id: "C-2026-001", name: "○○해운 Navi + SVM 구독 5척", cancelled: false, cancelReason: null, customer: "○○해운", ctype: "신조", date: "2026-01-15", owner: "홍길동", vessels: { valid: 4, total: 5 } },
  { id: "C-2025-031", name: "▲▲선사 Control 개조", cancelled: false, cancelReason: null, customer: "▲▲선사", ctype: "개조", date: "2025-11-03", owner: "이대리", vessels: { valid: 3, total: 3 } },
  { id: "C-2025-008", name: "▲▲선사 Control 2척", cancelled: false, cancelReason: null, customer: "▲▲선사", ctype: "신조", date: "2025-04-18", owner: "이대리", vessels: { valid: 2, total: 2 } },
  { id: "C-2024-092", name: "□□해운 Navi + SVM 시리즈", cancelled: false, cancelReason: null, customer: "□□해운", ctype: "신조", date: "2024-09-05", owner: "홍길동", vessels: { valid: 4, total: 4 } },
  { id: "C-2024-019", name: "○○해운 SVM 3척 (개조)", cancelled: false, cancelReason: null, customer: "○○해운", ctype: "개조", date: "2024-02-28", owner: "이대리", vessels: { valid: 3, total: 3 } },
  { id: "C-2025-077", name: "◆◆조선 Navi 시험 계약", cancelled: true, cancelReason: "계약 협상 결렬로 계약 취소", customer: "◆◆조선", ctype: "신조", date: "2025-08-14", owner: "김담당", vessels: { valid: 0, total: 2 } },
];

// 새 규칙(2026-08-26): 필터는 전부 FilterBar — 컬럼 헤더 필터(FD_CONFIG) 편입.
// 기본값이 있는 취소 여부(취소 제외)·담당(내 계약만 안내)은 base 칩, 나머지는 [+ 필터 추가].
const CONTRACT_FILTERS: FilterDef[] = [
  { name: "cancelled", label: "취소 여부", options: ["정상", "취소"], base: true },
  { name: "owner", label: "담당", options: ["홍길동", "김담당", "이대리"], multi: true, base: true },
  { name: "customer", label: "고객", options: ["○○해운", "△△해운", "▲▲선사", "☆☆해운", "□□해운", "◆◆조선"], multi: true },
  { name: "ctype", label: "계약 유형", options: ["신조", "개조"], multi: true },
];

// 다중 값은 ", " 병합 문자열 — 목록으로 되돌린다
const splitVal = (v?: string) => (v ? v.split(", ") : []);

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365ContractsPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  // 푸터 페이지네이션 문법(2026-08-26) — 페이지네이션 없어도 페이지당·전체 건수는 하단
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);
  const [keyword, setKeyword] = React.useState("");
  // 기본: 취소 제외(정상만)
  const [filterValues, setFilterValues] = React.useState<FilterValues>({ cancelled: "정상" });
  const [extraShown, setExtraShown] = React.useState<string[]>([]);

  const q = keyword.trim().toLowerCase();
  const rows = (view === "empty" ? [] : ROWS).filter((r) => {
    if (q && !r.name.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
    if (filterValues.cancelled && (r.cancelled ? "취소" : "정상") !== filterValues.cancelled)
      return false;
    const owners = splitVal(filterValues.owner);
    if (owners.length && !owners.includes(r.owner)) return false;
    const customers = splitVal(filterValues.customer);
    if (customers.length && !customers.includes(r.customer)) return false;
    const ctypes = splitVal(filterValues.ctype);
    if (ctypes.length && !ctypes.includes(r.ctype)) return false;
    return true;
  });
  // 헤더 정렬 실동작 — 계약명·척수·계약일
  const [sort, setSort] = React.useState<"name" | "vessels" | "date">("date");
  const [sortAsc, setSortAsc] = React.useState(false);
  const sortBy = (f: "name" | "vessels" | "date") => {
    if (sort === f) setSortAsc((a) => !a);
    else {
      setSort(f);
      setSortAsc(false);
    }
  };
  rows.sort((a, b) => {
    const c =
      sort === "vessels" ? a.vessels.valid - b.vessels.valid : sort === "name" ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date);
    return sortAsc ? c : -c;
  });
  // 취소 제외가 기본값이므로 건수 옆에 밝혀 둔다 (와이어프레임 2.3)
  const cancelExcluded = filterValues.cancelled === "정상";


  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">계약</h1>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* ── 툴바 — 새 규칙(2026-08-26): 필터는 전부 여기, 헤더는 정렬만 ── */}
      <FilterBar
        searchPlaceholder="계약명 · 계약 ID 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={CONTRACT_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          <>
            {/* CTA 순서 관례: Primary 맨 오른쪽 · 내보내기는 목록 공통 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="size-4" /> 내보내기
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>XLSX</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href={`${BASE}/contracts/new`}>
                <Plus className="size-4" /> 계약 등록
              </Link>
            </Button>
          </>
        }
      />

      {/* ── 상태별 본문 ── */}
      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">계약 목록을 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        /* 에러 상태 — ErrorState 프리셋(확정 시안의 컴포넌트화, 손 구현 금지) */
        <ErrorState
          title="계약 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>등록된 계약이 없습니다.</EmptyTitle>
            <EmptyDescription>계약을 등록하면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={`${BASE}/contracts/new`}>
              <Plus className="size-4" /> 계약 등록
            </Link>
          </Button>
        </Empty>
      )}

      {view !== "loading" && view !== "error" && view !== "empty" && (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              {/* 계약명은 텍스트 필터(와이어프레임) — 뼈대 단계는 정렬·필터 아이콘 시각만 */}
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("name")}>
                    계약명 {sort === "name" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </span>
              </TableHead>
              <TableHead>고객</TableHead>
              <TableHead>계약 유형</TableHead>
              <TableHead>담당</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("vessels")}>
                    척수 {sort === "vessels" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("date")}>
                    계약일 {sort === "date" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </span>
              </TableHead>
              <TableHead>취소 여부</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              return (
                <TableRow
                  key={r.id}
                  className={"cursor-pointer hover:bg-accent" + (r.cancelled ? " opacity-60" : "")}
                  onClick={() => router.push(`${BASE}/contracts/detail`)}
                >
                  <TableCell>
                    {/* 계약 상세(S3) 연결 — 샘플 상세는 C-2026-001 기준 */}
                    <Link
                      href="/gallery/sales365/contracts/detail"
                      className="font-medium text-primary hover:underline"
                    >
                      {r.name}
                    </Link>
                    <div className="font-mono text-xs text-secondary-foreground">{r.id}</div>
                  </TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {r.ctype}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Person name={r.owner} />
                  </TableCell>
                  <TableCell>
                    {/* v2: 척수 = 취소되지 않은 유효 슬롯 수 하나 — 전체 병기 금지.
                        원래 몇 척이었는지는 계약 상세의 취소된 슬롯이 답한다 */}
                    <span className="font-medium">{r.vessels.valid}척</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.date}</TableCell>
                  <TableCell>
                    {r.cancelled ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                          <span className="size-2 rounded-full bg-destructive" /> 취소
                        </span>
                        {r.cancelReason && (
                          <div className="whitespace-normal text-xs text-secondary-foreground">
                            {r.cancelReason}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className="size-2 rounded-full bg-muted-foreground" /> 정상
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* ── 푸터 — 건수는 하단 규칙(2026-08-26): 페이지네이션 없어도 여기 ── */}
      {view !== "loading" && view !== "error" && view !== "empty" && (
        <RowsPerPage
          value={pageSize}
          onChange={setPageSize}
          summary={`총 ${rows.length}건${cancelExcluded ? " (취소 제외)" : ""}`}
        />
      )}
    </div>
  );
}
