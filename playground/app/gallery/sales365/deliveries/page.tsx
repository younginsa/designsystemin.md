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
import { Skeleton, TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, Info } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Checkbox } from "@ds/ui/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Progress } from "@ds/ui/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

// 미입력 표기 잠금(2026-09-07) — 계약 호선 목록과 같은 부품
// 빈 값 규칙(2026-09-08 디자이너 확정): 목록 표의 빈 칸은 전부 흐린 대시(—) — 「미입력」 표기는
// 상세·모달(값을 채우는 면)에서만 쓴다. 종전 MissingMark(2026-09-07)는 이 목록에서 뺐다.
const EMPTY = <span className="text-muted-foreground">—</span>;
// 이행 종류 표기 잠금(2026-09-07 · 5종 2026-09-09) — 4곳 공유. 옵션 배열도 같은 원천
import { DELIVERY_KINDS, DeliveryType } from "../../_detail/delivery-type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
// 새 규칙(2026-08-26): 정렬은 헤더 전담 · 필터는 전부 FilterBar(2026-08-26 승격 완료)
import {
  FilterBar,
  OPS_DATE,
  OPS_SELECT,
  OPS_TEXT,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";
// 상세 조건 매처(2026-09-08) — 여섯 목록 공용
import { BASE_NOW, passDate, passSelect, passText } from "../_filter";

const BASE = "/gallery/sales365";

type Row = {
  id: string;
  name: string;
  product: string;
  hull: string;
  delivery: string;
  contract: string;
  dueOn: string | null;
  commissioningOn: string | null;
  /** 올라온 도면 종류(2026-09-07) — 건수만으로는 무엇이 들어왔는지 알 수 없다는 리뷰 반영 */
  drawings: DrawingKind[];
  cancelled: boolean;
};

/** 도면 3종 — 순서 고정(승인 → 작업 → 최종). 표의 고정 슬롯 순서도 이 배열이 정한다 */
type DrawingKind = "승인" | "작업" | "최종";
const DRAWING_KINDS: DrawingKind[] = ["승인", "작업", "최종"];
const DRAWING_SETS: DrawingKind[][] = [
  [],
  ["승인"],
  ["승인", "작업"],
  ["승인", "작업", "최종"],
];

const ROWS: Row[] = [
  { id: "D-001", name: "Hull 1001 · Control", product: "Control", hull: "Hull 1001", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", dueOn: "2027-03-01", commissioningOn: "2027-05-01", drawings: ["승인", "작업", "최종"], cancelled: false },
  { id: "D-002", name: "Hull 1001 · SVM", product: "SVM", hull: "Hull 1001", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", dueOn: "2027-03-01", commissioningOn: null, drawings: ["승인"], cancelled: false },
  { id: "D-003", name: "Hull 1002 · Control", product: "Control", hull: "Hull 1002", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", dueOn: "2027-06-01", commissioningOn: null, drawings: [], cancelled: false },
  { id: "D-004", name: "Hull 1002 · SVM", product: "SVM", hull: "Hull 1002", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", dueOn: null, commissioningOn: null, drawings: [], cancelled: false },
  { id: "D-005", name: "HN-2025-001 · SVM", product: "SVM", hull: "HN-2025-001", delivery: "제품 신규 납부", contract: "C-2026-017", dueOn: "2026-02-01", commissioningOn: "2026-03-01", drawings: ["승인", "작업"], cancelled: false },
  { id: "D-006", name: "HN-2025-002 · SVM", product: "SVM", hull: "HN-2025-002", delivery: "제품 신규 납부", contract: "C-2026-017", dueOn: "2026-05-01", commissioningOn: null, drawings: [], cancelled: false },
  { id: "D-007", name: "2001 · Control", product: "Control", hull: "2001", delivery: "구독 갱신·신규 전환", contract: "C-2025-003", dueOn: "2025-10-01", commissioningOn: "2025-10-20", drawings: ["승인"], cancelled: false },
  { id: "D-008", name: "Hull 1004 · Control", product: "Control", hull: "Hull 1004", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", dueOn: null, commissioningOn: null, drawings: [], cancelled: true },
];

// 무한 스크롤 볼륨(2026-09-07) — 종전엔 행 8개인데 푸터만 "총 23건"이라 숫자가 거짓말이었다.
// 호선 × 제품 조합으로 채우고 건수는 데이터에서 뽑는다. 대표 행과 겹치는 조합은 걸러낸다.
const HULLS = [
  "Hull 1001", "Hull 1002", "Hull 1003", "Hull 1004",
  "HN-2025-001", "HN-2025-002", "HN-2026-010", "HN-2026-011",
  "2001", "2002", "HN-2026-104", "HN-2026-118",
];
const PRODUCTS = ["Control", "SVM", "Navigation", "Cloud"];
// 이행 종류 5종(2026-09-09 피그마 코멘트) — DeliveryType 배지·필터 옵션·계약 생성 폼이 같은 배열
const DTYPES: string[] = [...DELIVERY_KINDS];
const CONTRACT_IDS = ["C-2026-001", "C-2026-017", "C-2025-003", "C-2026-043", "C-2026-046"];

const FILLER: Row[] = Array.from({ length: HULLS.length * PRODUCTS.length }, (_, i): Row => {
  const hull = HULLS[i % HULLS.length];
  const product = PRODUCTS[Math.floor(i / HULLS.length)];
  const noDue = i % 9 === 0;
  return {
    id: `D-${String(100 + i)}`,
    name: `${hull} · ${product}`,
    product,
    hull,
    delivery: DTYPES[i % DTYPES.length],
    contract: CONTRACT_IDS[i % CONTRACT_IDS.length],
    dueOn: noDue ? null : `${2026 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-01`,
    commissioningOn: noDue || i % 3 === 0 ? null : `${2026 + (i % 2)}-${String(((i + 2) % 12) + 1).padStart(2, "0")}-15`,
    drawings: DRAWING_SETS[i % DRAWING_SETS.length],
    cancelled: i % 11 === 0,
  };
}).filter((f) => !ROWS.some((r) => r.name === f.name));

const ALL_ROWS: Row[] = [...ROWS, ...FILLER];
/** 무한 스크롤 한 번에 불러오는 행 수 */
const PAGE = 20;

// 필터 스펙 표 6.3 납품 제품 리스트(2026-09-08) — 정본 filter-bar.stories.tsx DELIVERY_FILTERS.
// 연산자·유형·순서·base는 스펙, 옵션은 이 페이지 데이터, 라벨·값 표기는 현행(정상·취소됨 · 납품 유형) 유지(디자이너 확정).
// 도면 옵션은 스펙 문구(승인도면·작업도면·최종도면·도면 없음) — 행의 도면 종류(승인·작업·최종)에 "도면"을 붙여 대조한다.
const DRAWING_OPTIONS = [...DRAWING_KINDS.map((k) => `${k}도면`), "도면 없음"];
const drawingCells = (r: Row) => (r.drawings.length ? r.drawings.map((k) => `${k}도면`) : ["도면 없음"]);
const PAGE_FILTERS: FilterDef[] = [
  { name: "cancelled", label: "취소 여부", options: ["정상", "취소됨"], multi: true, operators: OPS_SELECT, base: true },
  { name: "productName", label: "납품 제품 이름", kind: "text", operators: OPS_TEXT, placeholder: "납품 제품 이름" },
  { name: "product", label: "제품", options: PRODUCTS, multi: true, operators: OPS_SELECT },
  { name: "vessel", label: "호선", options: HULLS, multi: true, operators: OPS_SELECT },
  { name: "dtype", label: "이행 종류", options: DTYPES, multi: true, operators: OPS_SELECT },
  { name: "contract", label: "계약", options: CONTRACT_IDS, multi: true, operators: OPS_SELECT },
  { name: "dueOn", label: "납품 예정일", kind: "date", operators: OPS_DATE, now: BASE_NOW },
  { name: "commissioningOn", label: "커미셔닝 예정일", kind: "date", operators: OPS_DATE, now: BASE_NOW },
  { name: "drawing", label: "도면", options: DRAWING_OPTIONS, multi: true, operators: OPS_SELECT },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365DeliveriesPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({ cancelled: "is 정상" });
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  const [checked, setChecked] = React.useState<string[]>([]);

  // 헤더 정렬 실동작 — 납품 예정일
  const [sortAsc, setSortAsc] = React.useState(true);
  // 검색가능 열(스펙): 납품 제품 이름 · 호선 · 계약
  const q = keyword.trim().toLowerCase();
  // 필터 실동작(2026-09-07 신설, 2026-09-08 상세 조건 층) — 종전엔 칩만 있고 거르지 않아, 「정상」인데도 취소 건이 섞였다
  const rows = (view === "empty" ? [] : [...ALL_ROWS])
    .filter(
      (r) =>
        (!q || `${r.name} ${r.hull} ${r.contract}`.toLowerCase().includes(q)) &&
        passSelect(filterValues.cancelled, r.cancelled ? "취소됨" : "정상") &&
        passText(filterValues.productName, r.name) &&
        passSelect(filterValues.product, r.product) &&
        passSelect(filterValues.vessel, r.hull) &&
        passSelect(filterValues.dtype, r.delivery) &&
        passSelect(filterValues.contract, r.contract) &&
        passDate(filterValues.dueOn, r.dueOn) &&
        passDate(filterValues.commissioningOn, r.commissioningOn) &&
        passSelect(filterValues.drawing, drawingCells(r)),
    )
    .sort((a, b) => {
      // 예정일 미정(null)은 정렬 방향과 무관하게 맨 아래
      if (!a.dueOn && !b.dueOn) return 0;
      if (!a.dueOn) return 1;
      if (!b.dueOn) return -1;
      const c = a.dueOn.localeCompare(b.dueOn);
      return sortAsc ? c : -c;
    });
  const toggleRow = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /* 무한 스크롤(2026-09-07) — 계약·계약 호선 목록과 같은 문법 */
  const [shown, setShown] = React.useState(PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const total = rows.length;
  const hasMore = shown < total;
  // 취소됨 행이 걸러지는 조건이면 건수 옆에 밝힌다
  const cancelExcluded = Boolean(filterValues.cancelled) && !passSelect(filterValues.cancelled, "취소됨");

  React.useEffect(() => {
    setShown(PAGE);
  }, [keyword, filterValues, sortAsc, view]);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setLoadingMore(true);
        window.setTimeout(() => {
          setShown((n) => Math.min(n + PAGE, total));
          setLoadingMore(false);
        }, 400);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, total, shown]);

  const visible = rows.slice(0, shown);


  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 자동 생성 안내를 제목 옆 [i]로 접었다(2026-09-07) — 상시 문단이 툴바를 밀어내고 있었다.
            트리거는 button이라 hover뿐 아니라 키보드 포커스로도 열린다.
            TooltipContent는 w-fit이라 max-w-xs로 줄바꿈 폭을 준다(대시보드 선례와 같은 구조) */}
        <div className="flex items-center gap-1.5">
          <h1 className="text-lg font-bold">납품 제품</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="납품 제품 설명">
                <Info className="size-4 text-secondary-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              납품 제품은 호선 배정 시 자동 생성되며, 이 화면에서는 납품·커미셔닝 예정일과 도면을
              관리합니다. 직접 만들거나 지울 수 없습니다.
            </TooltipContent>
          </Tooltip>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* ── 툴바 — 새 규칙(2026-08-26): 필터는 전부 여기, 헤더는 정렬만 ── */}
      <FilterBar
        searchPlaceholder="납품 제품 이름 · 호선 · 계약 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={PAGE_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          /* 건수 + 선택 액션(2026-09-07) — 종전엔 선택 바가 표 위 별도 줄에 떠 있었다.
             design.md 목록 문법(84행)이 목록 액션을 FilterBar actions 슬롯에 두라고 하므로
             계약·계약 호선의 CTA 자리와 같은 곳으로 옮긴다. 건수는 mr-3으로 액션과 띄운다.
             버튼은 default 크기 — 다른 목록의 액션 행과 높이를 맞춘다(CTA 사이즈 통일 규칙) */
          view === "default" ? (
            <>
              <span className="text-sm text-secondary-foreground">
                전체 {total}건{cancelExcluded ? " (취소 제외)" : ""}
              </span>
              {/* 건수와 선택 상태 구분 — h-5 세로 하선. 좌우 여백은 액션 행의 gap-2가 대칭으로 잡는다.
                  DS Separator를 쓰지 않는 이유: vertical 변형이 h-full이라 부모 높이가 정해져 있어야
                  보인다(셸 상단바는 h-16이라 됐다). 이 액션 행은 높이가 없어 0px로 사라진다 —
                  DS의 RowsPerPage도 같은 이유로 같은 span을 쓴다(2026-09-07) */}
              <span className="mx-2 h-5 w-px shrink-0 bg-border" aria-hidden />
              <span className="text-sm text-secondary-foreground">
                {checked.length}건 선택됨
              </span>
              <Button variant="outline" disabled={checked.length === 0}>
                <CalendarDays className="size-4" /> 예정일 일괄 수정
              </Button>
              {checked.length > 0 && (
                <Button variant="ghost" onClick={() => setChecked([])}>
                  선택 해제
                </Button>
              )}
            </>
          ) : undefined
        }
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
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                {/* 전체 선택 = 화면에 불러온 행 기준(무한 스크롤이라 아직 안 부른 행은 제외) */}
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="전체 선택"
                    checked={checked.length === visible.length && visible.length > 0}
                    onCheckedChange={(v) => setChecked(v ? visible.map((r) => r.id) : [])}
                  />
                </TableHead>
                <TableHead>납품 제품 이름</TableHead>
                <TableHead>제품</TableHead>
                <TableHead>호선</TableHead>
                <TableHead>이행 종류</TableHead>
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
              {visible.map((r) => (
                <TableRow
                  key={r.id}
                  className={"cursor-pointer hover:bg-accent" + (r.cancelled ? " opacity-60" : "")}
                  onClick={() => router.push(`${BASE}/deliveries/detail`)}
                >
                  {/* 선택 칸은 행 이동과 목적이 다르다 — 셀에서 이벤트를 끊는다(2026-09-07 버그 교정).
                      체크박스가 아니라 셀에 거는 이유: 체크박스 주변 여백을 눌러도 이동하지 않게 */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                  {/* 제품 = 회색 배지 — 계약·계정·유저 목록의 상품 열과 같은 문법(2026-09-09 피그마 코멘트) */}
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {r.product}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.hull}</TableCell>
                  {/* 이행 종류 — 원자 칩 조합(2026-09-07 · 5종 2026-09-09). "제품 신규 납부 + 구독"은 칩 두 개로 갈린다 */}
                  <TableCell>
                    <DeliveryType value={r.delivery} />
                  </TableCell>
                  {/* 계약 → 계약 상세. 행 클릭은 납품 상세로 가므로 이벤트를 끊는다
                      (구독 목록이 같은 이유로 쓰는 관례) */}
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`${BASE}/contracts/detail`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.contract}
                    </Link>
                  </TableCell>
                  {/* 예정일 빈 칸 — 목록 규칙대로 대시(2026-09-08). 호선 상세 납품 탭에서는 미입력 표기 */}
                  <TableCell className="font-mono text-sm">{r.dueOn ?? EMPTY}</TableCell>
                  <TableCell className="font-mono text-sm">{r.commissioningOn ?? EMPTY}</TableCell>
                  {/* 도면 — 3종 고정 슬롯(승인 → 작업 → 최종)을 항상 그리고 올라온 종류만 강조(2026-09-08 피그마 리뷰
                      반영). 자리가 고정이라 행끼리 위치로 비교되고, 빈 행도 대시 대신 회색 슬롯 3개로 읽힌다.
                      강조 = primary/5 틴트(선택 강조 칩 용도로 선언됨) + primary 테두리·글자 / 비강조 = muted 면 +
                      secondary-foreground. 도면은 시간이 지나며 올라오는 것이라 빈 슬롯은 누락이 아니다 — 빨강 없음 */}
                  <TableCell>
                    <span className="inline-flex gap-1">
                      {DRAWING_KINDS.map((d) => {
                        const on = r.drawings.includes(d);
                        return (
                          <Badge
                            key={d}
                            variant="outline"
                            className={
                              "font-normal " +
                              (on
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-transparent bg-muted text-secondary-foreground")
                            }
                          >
                            {d}
                          </Badge>
                        );
                      })}
                    </span>
                  </TableCell>
                  {/* 취소 여부 — 예외만 표기(2026-09-07 확정, 계약 목록과 같은 문법).
                      정상은 빈 칸: 도트도 글자도 없다 */}
                  <TableCell>
                    {r.cancelled && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                        <span className="size-2 rounded-full bg-destructive" /> 취소됨
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {/* 다음 묶음 로딩 — 열 정렬을 유지하려 표 안에 스켈레톤 행으로 둔다 */}
              {loadingMore &&
                [0, 1, 2].map((i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="size-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* 스크롤 센티넬 — 여기가 보이면 다음 묶음을 부른다 */}
          {hasMore && <div ref={sentinelRef} aria-hidden />}
        </>
      )}
    </div>
    </TooltipProvider>
  );
}
