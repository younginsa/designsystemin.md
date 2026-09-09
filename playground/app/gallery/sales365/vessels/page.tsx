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
import { Skeleton, TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown, Info, Plus } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Progress } from "@ds/ui/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

// 빈 값 규칙(2026-09-08 디자이너 확정): 목록 표의 빈 칸은 전부 흐린 대시(—) — 「미입력」 표기는
// 상세·모달(값을 채우는 면)에서만 쓴다. 종전 MissingMark(2026-09-07)는 이 목록에서 뺐다.
const EMPTY = <span className="text-muted-foreground">—</span>;
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
  hull: string;
  shipName: string | null;
  imo: string | null;
  owner: string;
  yard: string | null;
  shipType: string;
  classes: string[]; // 첫 항목 = ★ 주선급
  seriesCode: string | null;
  /** 인도 예정일 — 미확정이면 null(미입력 표기). 발주 초기 호선은 대체로 비어 있다 */
  deliveryOn: string | null;
};

const ROWS: Row[] = [
  { hull: "1001", shipName: "MV EXAMPLE", imo: "9876543", owner: "대양해운", yard: "한빛중공업", shipType: "Container", classes: ["KR", "DNV"], seriesCode: "SER-2026-A", deliveryOn: "2027-06-01" },
  { hull: "1002", shipName: "MV PIONEER", imo: "9876544", owner: "대양해운", yard: "한빛중공업", shipType: "Container", classes: ["KR"], seriesCode: "SER-2026-A", deliveryOn: "2027-09-01" },
  { hull: "1003", shipName: null, imo: null, owner: "대양해운", yard: "한빛중공업", shipType: "Container", classes: ["KR"], seriesCode: "SER-2026-A", deliveryOn: "2027-12-01" },
  { hull: "1004", shipName: null, imo: null, owner: "대양해운", yard: "한빛중공업", shipType: "Container", classes: ["KR"], seriesCode: "SER-2026-A", deliveryOn: "2028-02-01" },
  { hull: "HN-2025-001", shipName: "OCEAN STAR", imo: "9765432", owner: "서해해운", yard: "대건조선", shipType: "Bulk Carrier", classes: ["BV"], seriesCode: "SER-2025-B", deliveryOn: "2026-03-15" },
  { hull: "HN-2025-002", shipName: "OCEAN MOON", imo: "9765433", owner: "서해해운", yard: "대건조선", shipType: "Bulk Carrier", classes: ["BV"], seriesCode: "SER-2025-B", deliveryOn: "2026-06-15" },
  { hull: "HN-2026-010", shipName: null, imo: null, owner: "명진선사", yard: null, shipType: "Tanker", classes: ["NK"], seriesCode: null, deliveryOn: null },
  { hull: "HN-2026-011", shipName: null, imo: null, owner: "명진선사", yard: null, shipType: "Tanker", classes: ["NK"], seriesCode: null, deliveryOn: null },
  { hull: "2001", shipName: "BLUE HORIZON", imo: "8123456", owner: "청해선사", yard: "금강중공업", shipType: "Container", classes: ["LR", "ABS"], seriesCode: "SER-2024-C", deliveryOn: "2025-11-01" },
  { hull: "2002", shipName: "RED HORIZON", imo: "8123457", owner: "청해선사", yard: "금강중공업", shipType: "Container", classes: ["LR"], seriesCode: "SER-2024-C", deliveryOn: "2026-01-01" },
];

// 무한 스크롤 볼륨(2026-09-07) — 종전엔 행 10개인데 푸터만 "전체 247척"이라 숫자가 거짓말이었다.
// 실제 247행을 만들고 건수·미입력 수를 데이터에서 뽑는다.
const OWNERS = ["대양해운", "서해해운", "명진선사", "청해선사"];
const YARDS = ["한빛중공업", "대건조선", "금강중공업", null];
const SHIP_TYPES = ["Container", "Bulk Carrier", "Tanker", "LNG Carrier", "RoRo"];
const CLASS_SETS = [["KR"], ["LR", "ABS"], ["BV"], ["NK"], ["DNV", "KR"], ["ABS"]];
const SERIES = ["SER-2026-A", "SER-2025-B", "SER-2024-C", null];

const FILLER: Row[] = Array.from({ length: 237 }, (_, i): Row => {
  // 7행마다 식별자 미입력 — 237/7 = 34행(대표 4행과 합쳐 38척)
  const missing = i % 7 === 0;
  const year = 2026 + (i % 3);
  return {
    hull: `HN-${2025 + (i % 4)}-${String(100 + i).padStart(3, "0")}`,
    shipName: missing ? null : `MV ${["ARIA", "BOREAS", "CIRRUS", "DELTA", "EOS", "FALCON"][i % 6]} ${i + 1}`,
    imo: missing ? null : String(9500000 + i),
    owner: OWNERS[i % OWNERS.length],
    yard: YARDS[i % YARDS.length],
    shipType: SHIP_TYPES[i % SHIP_TYPES.length],
    classes: CLASS_SETS[i % CLASS_SETS.length],
    seriesCode: SERIES[i % SERIES.length],
    // 인도 예정일 미입력 약 30% — 10행 중 3행(i%10 < 3)
    deliveryOn:
      i % 10 < 3
        ? null
        : `${year}-${String((i % 12) + 1).padStart(2, "0")}-${String(((i * 5) % 27) + 1).padStart(2, "0")}`,
  };
});

const ALL_ROWS: Row[] = [...ROWS, ...FILLER];
/** 무한 스크롤 한 번에 불러오는 행 수 */
const PAGE = 20;

// 필터 스펙 표 6.2 계약 호선 리스트(2026-09-08) — 정본 filter-bar.stories.tsx VESSEL_FILTERS.
// 연산자·유형·순서·base는 스펙, 옵션은 이 페이지 데이터. 식별자(미입력만 보기) 칩은 스펙의 선명 placeholder가
// "미입력 식별자 필터 별도"라고 인정하므로 맨 뒤에 유지, 선급 기준(주선급만)은 제거 — 선급 is/is not이 대신한다(디자이너 확정).
const YARD_OPTIONS = YARDS.filter((y): y is string => y !== null);
const VESSEL_FILTERS: FilterDef[] = [
  { name: "hull", label: "Hull No.", kind: "text", operators: OPS_TEXT, placeholder: "Hull No." },
  { name: "shipName", label: "선명", kind: "text", operators: OPS_TEXT, placeholder: "선명(미입력 식별자 필터 별도)" },
  { name: "imo", label: "IMO", kind: "text", operators: OPS_TEXT, placeholder: "IMO" },
  { name: "owner", label: "선주", options: OWNERS, multi: true, operators: OPS_SELECT, base: true },
  { name: "yard", label: "조선소", options: YARD_OPTIONS, multi: true, operators: OPS_SELECT },
  { name: "shipType", label: "선종", options: SHIP_TYPES, multi: true, operators: OPS_SELECT },
  { name: "shipClass", label: "선급", options: ["KR", "BV", "NK", "LR", "DNV", "ABS"], multi: true, operators: OPS_SELECT },
  { name: "seriesCode", label: "시리즈 코드", kind: "text", operators: OPS_TEXT, placeholder: "SER-2026-A" },
  { name: "deliveryOn", label: "인도 예정일", kind: "date", operators: OPS_DATE, now: BASE_NOW },
  { name: "missing", label: "식별자", options: ["미입력만 보기"] },
];

// 미입력 표기는 공용 부품으로 이관(2026-09-07) — 납품 제품 목록도 같은 표기를 쓴다

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365VesselsPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
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
  // 검색가능 열(스펙): Hull No. · 선명 · IMO · 선주 · 조선소 · 시리즈 코드
  const q = keyword.trim().toLowerCase();
  const rows = (view === "empty" ? [] : [...ALL_ROWS])
    .filter(
      (r) =>
        (!q ||
          `${r.hull} ${r.shipName ?? ""} ${r.imo ?? ""} ${r.owner} ${r.yard ?? ""} ${r.seriesCode ?? ""}`
            .toLowerCase()
            .includes(q)) &&
        passText(filterValues.hull, r.hull) &&
        passText(filterValues.shipName, r.shipName) &&
        passText(filterValues.imo, r.imo) &&
        passSelect(filterValues.owner, r.owner) &&
        passSelect(filterValues.yard, r.yard) &&
        passSelect(filterValues.shipType, r.shipType) &&
        // 선급 — 한 행에 여러 값. is = 하나라도 일치 / is not = 하나도 없음
        passSelect(filterValues.shipClass, r.classes) &&
        passText(filterValues.seriesCode, r.seriesCode) &&
        passDate(filterValues.deliveryOn, r.deliveryOn) &&
        !(filterValues.missing === "미입력만 보기" && r.shipName && r.imo),
    )
    .sort((a, b) => {
      // 인도 예정일 미입력(null)은 정렬 방향과 무관하게 맨 아래 — 납품 제품 목록과 같은 규칙
      const av = a[sort];
      const bv = b[sort];
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      const c = av.localeCompare(bv);
      return sortAsc ? c : -c;
    });

  /* 무한 스크롤(2026-09-07) — 계약 목록과 같은 문법. 푸터 페이지네이션 폐기,
     건수는 툴바 우측. 센티넬이 보이면 PAGE만큼 더 채우고, shown이 늘 때마다
     감시자를 다시 걸어 화면이 커도 이어서 로드된다. 400ms는 스켈레톤용 시늉 */
  const [shown, setShown] = React.useState(PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const shownTotal = rows.length;
  const hasMore = shown < shownTotal;

  React.useEffect(() => {
    setShown(PAGE);
  }, [keyword, filterValues, sort, sortAsc, view]);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setLoadingMore(true);
        window.setTimeout(() => {
          setShown((n) => Math.min(n + PAGE, shownTotal));
          setLoadingMore(false);
        }, 400);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shownTotal, shown]);

  const visible = rows.slice(0, shown);

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
        searchPlaceholder="Hull No. · 선명 · IMO · 선주 · 조선소 · 시리즈 코드 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={VESSEL_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          <>
            {/* 건수 — 무한 스크롤이라 푸터가 없다. 미입력 보조 카운트는 제거(2026-09-07 확정):
                표 안에서 이미 행마다 미입력을 표시하고 있어 상단 숫자는 중복이었다 */}
            {/* mr-3 — 액션 행이 gap-2라 mr-1이면 CTA와 12px밖에 안 떨어져 버튼처럼 붙어 읽혔다(2026-09-07) */}
            {view === "default" && (
              <span className="mr-3 text-sm text-secondary-foreground">전체 {shownTotal}척</span>
            )}
            <Button asChild>
              <Link href={`${BASE}/contracts/new`}>
                <Plus className="size-4" /> 호선 등록
              </Link>
            </Button>
          </>
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
        /* TooltipProvider — 주선급 점의 툴팁이 붙는다(DS Tooltip은 Provider를 품지 않는다) */
        <TooltipProvider>
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
                {/* 조선소 헤더 누락 교정(2026-09-04) — 본문 9열 vs 헤더 8열이라 마지막 헤더 칸이 비어 흰색으로 보였다 */}
                <TableHead>조선소</TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("deliveryOn")}>
                    인도 예정일 {sort === "deliveryOn" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
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
                  <TableCell>{r.shipName ?? EMPTY}</TableCell>
                  <TableCell className="font-mono text-sm">{r.imo ?? EMPTY}</TableCell>
                  <TableCell>{r.owner}</TableCell>
                  <TableCell>{r.shipType}</TableCell>
                  {/* 선급 칩(2026-09-08 디자이너 확정) — 선급마다 outline 배지. 첫 항목이 주선급이며
                      복수일 때만 그 칩 안에 중립 진회색 점(bg-foreground)을 넣고 칩 전체가 툴팁 트리거.
                      빨강 점은 쓰지 않는다(오류로 읽힘). 단일 선급은 구분할 게 없어 점 없음 */}
                  <TableCell>
                    <span className="inline-flex flex-wrap items-center gap-1">
                      {r.classes.map((c, i) => {
                        const primary = r.classes.length > 1 && i === 0;
                        const chip = (
                          <Badge variant="outline" className="cursor-default gap-1.5 font-normal">
                            {primary && <span className="size-1.5 shrink-0 rounded-full bg-foreground" />}
                            {c}
                          </Badge>
                        );
                        return primary ? (
                          <Tooltip key={c}>
                            <TooltipTrigger asChild>{chip}</TooltipTrigger>
                            <TooltipContent>주선급 — 승인도면 제출 상대</TooltipContent>
                          </Tooltip>
                        ) : (
                          <React.Fragment key={c}>{chip}</React.Fragment>
                        );
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.seriesCode ?? EMPTY}</TableCell>
                  <TableCell>{r.yard ?? EMPTY}</TableCell>
                  <TableCell className="font-mono text-sm">{r.deliveryOn ?? EMPTY}</TableCell>
                </TableRow>
              ))}

              {/* 다음 묶음 로딩 — 열 정렬을 유지하려 표 안에 스켈레톤 행으로 둔다 */}
              {loadingMore &&
                [0, 1, 2].map((i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* 스크롤 센티넬 — 여기가 보이면 다음 묶음을 부른다 */}
          {hasMore && <div ref={sentinelRef} aria-hidden />}
        </TooltipProvider>
      )}
    </div>
  );
}
