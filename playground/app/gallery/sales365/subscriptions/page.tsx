"use client";

// S11 구독 만료 임박 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트 본문)
// 원천: hinas365 와이어프레임 v2 wireframe_s11_subscription_list.html
//
// 와이어프레임 대조 메모
// - 조회 전용 화면 — 기간을 움직이는 액션(중단·재개·크레딧·조기 종료)은 전부
//   계약 호선 상세 ② 구독 탭이 맡는다. 행 클릭 = 그 화면으로 이동.
// - 필터 축은 둘 — 만료일 범위(프리셋 앞으로 30·60·90일 · 이미 만료 · 직접 지정, 전체 = 칩 초기화)와 상태(다중).
//   기본 = 앞으로 60일 · 취소 제외. 2026-09-08 FilterBar(DS 프리셋)로 이식 — 종전 ToggleGroup·개별 캘린더 폐기.
//   FilterBar 초기화 = 조건 없음(전체 + 취소 포함). 검색(Hull·호선명·제품·계약)은 이식 때 추가.
// - 상태·D-day는 저장하지 않고 조회 시점 계산 — 만료일 = 시작일 + 기간 + 조정일,
//   조기 종료가 있으면 지정 고정값. 시작일 미정이면 만료일 미정(범위 필터에 안 잡힘 → 전체에서만).
// - 유효 기간 끝은 만료일 - 1일로 표시(만료일 당일 = 만료).
// - 조회 전용이라 프로그레스 바 없음 — 4상태(DEFAULT_STATES).

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
// 필터는 전부 FilterBar(2026-09-08 이식) — 날짜 kind + 다중 select, 기준일은 화면 TODAY
import {
  FilterBar,
  resolveDateRange,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";
import { ErrorState } from "@ds/ui/ui/error-state";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import { DEFAULT_STATES, StatePreview } from "@ds/ui/ui/state-preview";
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

const BASE = "/gallery/sales365";

/* ---------------------------------------------------------------- 날짜 유틸 (UTC 고정) */

const TODAY = "2026-08-21"; // 와이어프레임 기준일 — S7과 같은 값
// FilterBar 날짜 프리셋 기준일 — D-day와 같은 시계(로컬 자정)
const BASE_DATE = new Date(TODAY + "T00:00:00");

const d = (s: string) => new Date(s + "T00:00:00Z");
const iso = (dt: Date) => dt.toISOString().slice(0, 10);
const addMonths = (s: string, n: number) => {
  const t = d(s);
  t.setUTCMonth(t.getUTCMonth() + n);
  return iso(t);
};
const addDays = (s: string, n: number) => {
  const t = d(s);
  t.setUTCDate(t.getUTCDate() + n);
  return iso(t);
};
const fmtLocal = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
const dayDiff = (a: string, b: string) =>
  Math.round((d(b).getTime() - d(a).getTime()) / 86400000);

/* ---------------------------------------------------------------- 샘플 데이터 */

type Row = {
  id: number;
  vessel: { hull: string; name: string | null };
  product: string;
  contract: { id: string; name: string };
  item: string;
  start: string | null;
  termMonths: number;
  adjDays: number;
  early: { end: string; label: string } | null;
  pauses: { from: string; to: string | null }[];
  cancelled: boolean;
};

// 와이어프레임 ROWS 이식 — Hull 1001 다섯 건은 S7 구독 탭과 같은 데이터
const ROWS: Row[] = [
  { id: 1, vessel: { hull: "Hull 1006", name: "MV FRONTIER" }, product: "Control", contract: { id: "C-2025-008", name: "동보선사 Control 2척" }, item: "C-2025-008-01", start: "2024-09-05", termMonths: 24, adjDays: 0, early: null, pauses: [], cancelled: false },
  { id: 2, vessel: { hull: "Hull 1008", name: "MV ATLAS" }, product: "SVM", contract: { id: "C-2023-071", name: "대양해운 SVM 구독 4척" }, item: "C-2023-071-01", start: "2023-10-01", termMonths: 36, adjDays: 0, early: null, pauses: [], cancelled: false },
  { id: 3, vessel: { hull: "Hull 1007", name: "MV HORIZON" }, product: "Cloud", contract: { id: "C-2024-016", name: "대양해운 Cloud 구독" }, item: "C-2024-016-02", start: "2024-10-15", termMonths: 24, adjDays: 0, early: null, pauses: [], cancelled: false },
  // 중단 중 + 만료 임박 — 열린 중단은 재개 시 연장 여부에 따라 만료일이 밀릴 수 있다
  { id: 4, vessel: { hull: "Hull 1002", name: "MV PIONEER" }, product: "Navigation", contract: { id: "C-2024-033", name: "우진해운 Navi 3척" }, item: "C-2024-033-01", start: "2024-10-20", termMonths: 24, adjDays: 0, early: null, pauses: [{ from: "2026-06-01", to: null }], cancelled: false },
  { id: 5, vessel: { hull: "Hull 1009", name: null }, product: "Navigation", contract: { id: "C-2024-044", name: "우진해운 Navi 2척" }, item: "C-2024-044-01", start: "2024-11-14", termMonths: 24, adjDays: 0, early: null, pauses: [], cancelled: false },
  // 이미 만료 · 갱신 계약 없음 — 갱신 영업의 핵심 대상
  { id: 6, vessel: { hull: "Hull 1010", name: "MV VOYAGER" }, product: "Control", contract: { id: "C-2022-019", name: "동보선사 Control 1척" }, item: "C-2022-019-01", start: "2024-08-01", termMonths: 24, adjDays: 0, early: null, pauses: [], cancelled: false },
  { id: 7, vessel: { hull: "Hull 1001", name: "MV EXAMPLE" }, product: "Control", contract: { id: "C-2026-001", name: "대양해운 Navi + SVM 구독 5척" }, item: "C-2026-001-01", start: "2026-07-01", termMonths: 36, adjDays: 65, early: null, pauses: [{ from: "2027-01-10", to: "2027-03-01" }], cancelled: false },
  // 시작일 미정 → 만료일 미정 — 만료 임박이 아니라 정체된 건
  { id: 8, vessel: { hull: "Hull 1001", name: "MV EXAMPLE" }, product: "SVM", contract: { id: "C-2026-001", name: "대양해운 Navi + SVM 구독 5척" }, item: "C-2026-001-01", start: null, termMonths: 12, adjDays: 0, early: null, pauses: [], cancelled: false },
  { id: 9, vessel: { hull: "Hull 1001", name: "MV EXAMPLE" }, product: "Navigation", contract: { id: "C-2025-004", name: "대양해운 Navi 갱신" }, item: "C-2025-004-01", start: "2025-03-01", termMonths: 24, adjDays: 0, early: null, pauses: [{ from: "2026-08-01", to: null }], cancelled: false },
  // 조기 종료 — 만료일이 사용자 지정 고정값
  { id: 10, vessel: { hull: "Hull 1001", name: "MV EXAMPLE" }, product: "Cloud", contract: { id: "C-2024-016", name: "대양해운 Cloud 구독" }, item: "C-2024-016-01", start: "2024-02-01", termMonths: 36, adjDays: 0, early: { end: "2026-05-31", label: "선박 매각" }, pauses: [], cancelled: false },
  { id: 11, vessel: { hull: "Hull 1001", name: "MV EXAMPLE" }, product: "Shield", contract: { id: "C-2023-020", name: "대양해운 Shield 2척" }, item: "C-2023-020-01", start: "2024-03-01", termMonths: 24, adjDays: 0, early: null, pauses: [], cancelled: false },
  { id: 12, vessel: { hull: "Hull 1005", name: "MV SEABIRD" }, product: "Control", contract: { id: "C-2025-012", name: "한성해운 Control 2척" }, item: "C-2025-012-01", start: "2025-01-10", termMonths: 24, adjDays: 0, early: null, pauses: [], cancelled: false },
  // 시작일 미도래 → 예정
  { id: 13, vessel: { hull: "Hull 1003", name: null }, product: "Control", contract: { id: "C-2026-001", name: "대양해운 Navi + SVM 구독 5척" }, item: "C-2026-001-01", start: "2026-12-01", termMonths: 36, adjDays: 0, early: null, pauses: [], cancelled: false },
  // 취소 — 기본 숨김(상태 필터 기본값에서 제외)
  { id: 14, vessel: { hull: "Hull 1004", name: null }, product: "SVM", contract: { id: "C-2026-001", name: "대양해운 Navi + SVM 구독 5척" }, item: "C-2026-001-03", start: "2026-05-01", termMonths: 36, adjDays: 0, early: null, pauses: [], cancelled: true },
];

/* ---------------------------------------------------------------- 조회 시점 계산 */

// 계약상 만기일 = 시작일 + 기간 + 조정 일수
const contractEndOf = (r: Row) =>
  r.start ? addDays(addMonths(r.start, r.termMonths), r.adjDays) : null;
// 구독 만료일 — 조기 종료가 있으면 지정 고정값
const expiryOf = (r: Row) => (r.start ? (r.early ? r.early.end : contractEndOf(r)) : null);

// 만료일이 어디서 나온 값인지 — 셀 보조줄 근거 문구
const expiryWhy = (r: Row) => {
  if (!r.start) return "시작일이 정해지면 산출됩니다";
  if (r.early) return `조기 종료 · ${r.early.label} · 계약상 만기일 ${contractEndOf(r)}`;
  return r.adjDays ? `${r.termMonths}개월 + 조정 ${r.adjDays}일` : `${r.termMonths}개월`;
};

type Status = "진행 중" | "중단" | "예정" | "만료" | "취소";
const ST_ALL: Status[] = ["진행 중", "중단", "예정", "만료", "취소"];

// 상태 판정 — 위에서부터 먼저 맞는 것 하나. 시작일 당일 = 진행 중, 만료일 당일 = 만료
const statusOf = (r: Row): Status => {
  if (r.cancelled) return "취소";
  if (!r.start || r.start > TODAY) return "예정";
  if (r.pauses.some((p) => p.from <= TODAY && (!p.to || TODAY < p.to))) return "중단";
  const e = expiryOf(r);
  if (e && e <= TODAY) return "만료";
  return "진행 중";
};

const ST_DOT: Record<Status, string> = {
  "진행 중": "bg-success",
  중단: "bg-muted-foreground",
  예정: "bg-primary",
  만료: "bg-destructive",
  취소: "bg-destructive",
};

/* ---------------------------------------------------------------- 화면 */

type ViewState = "default" | "empty" | "loading" | "error";

// 필터 정의 — 기본 칩 2개. 만료일은 앞을 보는 프리셋 세트(전체 = 칩 초기화), 상태는 다중
const EXPIRY_PRESETS = ["앞으로 30일", "앞으로 60일", "앞으로 90일", "이미 만료", "직접 지정"];
const PAGE_FILTERS: FilterDef[] = [
  { name: "expiry", label: "만료일", kind: "date", base: true, presets: EXPIRY_PRESETS, now: BASE_DATE },
  { name: "status", label: "상태", options: ST_ALL, multi: true, base: true },
];
// 기본값 = 앞으로 60일 · 취소 제외(와이어프레임). FilterBar 초기화는 이 값이 아니라 조건 없음으로 간다
const FILTER_DEFAULTS: FilterValues = {
  expiry: "앞으로 60일",
  status: ST_ALL.filter((s) => s !== "취소").join(", "),
};
const splitVal = (v?: string) => (v ? v.split(", ") : []);

export default function SubscriptionListPage() {
  const router = useRouter();
  const [view, setView] = React.useState<ViewState>("default");
  // 푸터 페이지네이션 문법(2026-08-26) — 페이지네이션 없어도 페이지당·전체 건수는 하단
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);

  // 기본 = 앞으로 60일 · 취소 제외 — FilterBar 값 맵. 빈 상태의 [필터 초기화]는 기본값으로 되돌린다
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>(FILTER_DEFAULTS);

  const resetFilters = () => {
    setKeyword("");
    setFilterValues(FILTER_DEFAULTS);
  };

  // 칩 값 → 기간(화면 기준일). 값 없음 = 범위 없음(전체). 이미 만료는 열린 과거(2000년~)라 표시는 끝만
  const range = filterValues.expiry ? resolveDateRange(filterValues.expiry, BASE_DATE) : null;
  const from = range ? fmtLocal(range.from) : "";
  const to = range ? fmtLocal(range.to) : "";
  const states = splitVal(filterValues.status);

  // 만료일 미정 건은 범위에 걸 값이 없다 — 범위를 안 건 경우(전체)에만 보인다
  const passRange = (expiry: string | null) => {
    if (!range) return true;
    if (!expiry) return false;
    return expiry >= from && expiry <= to;
  };
  const q = keyword.trim().toLowerCase();
  const passKeyword = (r: Row) =>
    !q ||
    [r.vessel.hull, r.vessel.name ?? "", r.product, r.contract.id, r.contract.name, r.item]
      .join(" ")
      .toLowerCase()
      .includes(q);

  const rows = ROWS.filter(
    (r) =>
      (states.length === 0 || states.includes(statusOf(r))) &&
      passRange(expiryOf(r)) &&
      passKeyword(r),
  )
    // 가장 임박한 것이 위 — 만료일 없는 건은 맨 아래
    .sort((a, b) => {
      const x = expiryOf(a);
      const y = expiryOf(b);
      if (!x && !y) return 0;
      if (!x) return 1;
      if (!y) return -1;
      return x.localeCompare(y);
    });

  const span = !range
    ? "만료일 전체"
    : from < "2001"
      ? `만료일 ~ ${to}`
      : `만료일 ${from} ~ ${to}`;
  const cancelExcluded = states.length > 0 && !states.includes("취소");

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">구독 만료 임박</h1>
        </div>
        {/* 조회 전용 — CTA 없음. 상태 미리보기만 */}
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={DEFAULT_STATES} />
      </div>

      {/* ── 필터 — FilterBar(2026-09-08 이식): 검색 + 기본 칩 2개(만료일 date · 상태 multi).
          만료일 프리셋은 앞을 보는 세트, 전체 = 칩 초기화. 바의 [초기화]는 DS 문법대로 조건 없음 ── */}
      <FilterBar
        searchPlaceholder="Hull · 호선명 · 제품 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={PAGE_FILTERS}
        values={filterValues}
        onChange={(name, value) => setFilterValues((v) => ({ ...v, [name]: value }))}
      />

      {/* ── 상태별 본문 ── */}
      {view === "loading" && <TableSkeleton />}

      {view === "error" && (
        <ErrorState
          title="구독 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>구독이 없습니다.</EmptyTitle>
            <EmptyDescription>계약 항목에 구독이 생기면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && rows.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>조건에 맞는 구독이 없습니다.</EmptyTitle>
            <EmptyDescription>만료일 범위나 상태 필터를 조정해 보세요.</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={resetFilters}>
            필터 초기화
          </Button>
        </Empty>
      )}

      {view === "default" && rows.length > 0 && (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead>호선</TableHead>
              <TableHead>제품</TableHead>
              <TableHead>구독 만료일</TableHead>
              <TableHead>만료까지</TableHead>
              <TableHead>유효 기간</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>계약</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const st = statusOf(r);
              const expiry = expiryOf(r);
              return (
                <TableRow
                  key={r.id}
                  className={"cursor-pointer" + (r.cancelled ? " opacity-60" : "")}
                  onClick={() => router.push(`${BASE}/vessels/detail`)}
                >
                  <TableCell>
                    <div className="font-medium">{r.vessel.hull}</div>
                    <div className="text-xs text-secondary-foreground">
                      {r.vessel.name ?? "선명 미입력"}
                    </div>
                  </TableCell>
                  <TableCell>{r.product}</TableCell>
                  <TableCell>
                    {expiry ? (
                      <>
                        <div className="font-medium">{expiry}</div>
                        <div className="text-xs text-secondary-foreground">{expiryWhy(r)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-secondary-foreground">미정</div>
                        <div className="text-xs text-destructive">
                          시작일이 비어 있어 후속 구독을 열 수 없습니다
                        </div>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <DdayCell expiry={expiry} />
                  </TableCell>
                  <TableCell>
                    {r.start && expiry ? (
                      // 유효 기간 끝 = 만료일 - 1일(만료일 당일은 만료)
                      <span>
                        {r.start} ~ {addDays(expiry, -1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        "inline-flex items-center gap-1.5 text-sm" +
                        (st === "취소" ? " text-destructive" : "")
                      }
                    >
                      <span className={`size-2 rounded-full ${ST_DOT[st]}`} /> {st}
                    </span>
                    {st === "중단" && (
                      <div className="text-xs text-secondary-foreground">
                        재개 시 연장을 고르면 만료일이 밀립니다
                      </div>
                    )}
                    {st === "만료" && !r.cancelled && (
                      <div className="text-xs text-secondary-foreground">
                        갱신 계약 없음 · 이 구독이 가장 최근입니다
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* 계약 배지는 행 클릭과 다른 목적지 — 이벤트 격리 */}
                    <Link
                      href={`${BASE}/contracts/detail`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block"
                    >
                      <Badge variant="secondary" className="font-normal">
                        {r.contract.id}
                      </Badge>
                    </Link>
                    <div className="mt-0.5 text-xs text-secondary-foreground">{r.item}</div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* ── 푸터 — 건수는 하단 규칙(2026-08-26) ── */}
      {(view === "default" || view === "empty") && (
        <RowsPerPage
          value={pageSize}
          onChange={setPageSize}
          summary={`총 ${rows.length}건 · ${span}${cancelExcluded ? " · 취소 제외" : ""}`}
        />
      )}
    </div>
  );
}

/* D-day — 30일 이내·지남·오늘 = 빨강, 60일 이내 = 파랑, 그 밖 = 회색 */
function DdayCell({ expiry }: { expiry: string | null }) {
  if (!expiry) return <span className="text-muted-foreground">—</span>;
  const n = dayDiff(TODAY, expiry);
  if (n < 0) return <span className="font-medium text-destructive">{-n}일 지남</span>;
  if (n === 0) return <span className="font-medium text-destructive">오늘 만료</span>;
  const tone =
    n <= 30 ? "text-destructive" : n <= 60 ? "text-primary" : "text-secondary-foreground";
  return <span className={`font-medium ${tone}`}>D-{n}</span>;
}
