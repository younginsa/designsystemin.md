"use client";

// S1 계약 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트 본문)
// 원천: hinas365 와이어프레임 wireframe_s1_contract_list.html
//
// 와이어프레임 대조 메모
// - 새 규칙(2026-08-26): 헤더는 정렬 전담(계약명·척수·계약일) · 필터는 전부 FilterBar
//   (취소 여부 base 기본 정상 · 담당 base · 고객·계약 유형은 [+ 필터 추가])
// - 행: 계약명(링크+ID 서브) / 고객 / 유형 칩 / 담당(프로필+이름, 2026-09-04) / 척수(유효 슬롯 수 하나 — v2: 전체 병기 금지) /
//   계약일 / 취소 여부. 취소 행은 흐림 + 사유 서브
// - 행 클릭 → S3 계약 상세
// - 내보내기는 목록 공통 요소 규칙(CSV/XLSX 드롭다운)으로 통일 — 와이어프레임은 플레인 버튼
//
// 2026-09-07 디자이너 확정 3건
// ① 계약명은 자동 생성(2026-09-09 개정 — "{계약일} {고객} {제품 이행단축, …} N척 / …", _detail/contract-name).
//    사람이 입력하지 않으므로 글자 수 제한은 없고 항목이 늘면 100자를 훌쩍 넘는다. 목록 셀은 max-w-xs + 2줄까지,
//    넘치면 말줄임(line-clamp-2). 전체 이름은 계약 상세가 답한다. (종전 40자 입력 제한은 폐기)
// ② 취소 여부 = 취소된 행만 「취소됨」 표기 · 정상은 빈 칸(도트도 없음).
//    9건 중 8건이 "정상"을 반복하던 노이즈 제거 — 예외만 눈에 띄게. 납품 목록도 같은 문법.
// ③ 이 페이지만 무한 스크롤 — 푸터 RowsPerPage 폐기, 건수는 툴바 우측으로 이동.
//    design.md 「목록 푸터」 규칙의 유일한 예외다(실험). 다른 목록은 푸터 문법 유지.
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { Skeleton, TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
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

// 사람 요소 잠금(2026-09-04): 담당 = 프로필(이니셜) + 이름 — _detail/person 공유
import { Person } from "../../_detail/person";
// 계약명 자동 생성 규칙(2026-09-09) — 생성 폼·상세와 같은 부품. 샘플은 패키지 + 척수를 적고 제품별 이행 종류는 기본값
import { contractName, itemFromPackage } from "../../_detail/contract-name";

const BASE = "/gallery/sales365";

/** 무한 스크롤 한 번에 불러오는 행 수 */
const PAGE = 20;

// 계약명은 저장값이 아니라 파생값 — items(패키지·척수)에서 contractName()으로 조립(2026-09-09 개정)
type Row = {
  id: string;
  name: string;
  cancelled: boolean;
  cancelReason: string | null;
  customer: string;
  ctype: "신조" | "개조";
  date: string;
  owner: string;
  /** 계약 항목별 패키지·척수 — 계약명의 원천(제품별 이행 종류는 itemFromPackage 기본값) */
  items: { pkg: string; count: number }[];
  vessels: { valid: number; total: number };
};
/** 행 조립 — name은 항상 규칙에서 나온다(손으로 적지 않는다) */
const row = (r: Omit<Row, "name">): Row => ({
  ...r,
  name: contractName(r.date, r.customer, r.items.map((i) => itemFromPackage(i.pkg, i.count))),
});

const CUSTOMERS = [
  "대양해운",
  "한성해운",
  "동보선사",
  "우진해운",
  "신광해운",
  "태평조선",
  "서해해운",
  "명진선사",
  "청해선사",
];
const OWNERS = ["홍길동", "김담당", "이대리"];
// 패키지 — 생성 폼 PKG_COMPOSITION의 키. 단품 계약(Cloud)은 직접 선택이라 제품명이 그대로 온다
const PACKAGES = ["Enterprise", "Smart Standard", "Safety Forward", "Safety Around", "Cloud"];

// 대표 행 — 이름 길이 경계와 취소 건을 손으로 박아 둔다.
// · 항목 2개(C-2026-047, Enterprise 3제품 + Safety Forward 2제품) = 100자를 넘기는 가장 긴 이름 → 2줄을 넘겨 말줄임
// · 항목 2개(C-2026-041, 2제품씩) = 2줄 안에 드는 케이스
// · 취소 6건 — 기본 필터가 「정상」이라 칩을 「취소됨」으로 바꿔야 보인다
const FEATURED: Row[] = [
  // 항목 2개 — 말줄임 확인용(가장 긴 이름)
  row({ id: "C-2026-047", cancelled: false, cancelReason: null, customer: "서해해운", ctype: "신조", date: "2026-08-20", owner: "홍길동", items: [{ pkg: "Enterprise", count: 4 }, { pkg: "Safety Forward", count: 3 }], vessels: { valid: 7, total: 7 } }),
  row({ id: "C-2026-046", cancelled: false, cancelReason: null, customer: "대양해운", ctype: "신조", date: "2026-08-05", owner: "김담당", items: [{ pkg: "Smart Standard", count: 12 }], vessels: { valid: 12, total: 12 } }),
  row({ id: "C-2026-045", cancelled: false, cancelReason: null, customer: "신광해운", ctype: "개조", date: "2026-07-28", owner: "이대리", items: [{ pkg: "Enterprise", count: 9 }], vessels: { valid: 9, total: 9 } }),
  row({ id: "C-2026-043", cancelled: false, cancelReason: null, customer: "청해선사", ctype: "신조", date: "2026-06-30", owner: "홍길동", items: [{ pkg: "Enterprise", count: 13 }], vessels: { valid: 13, total: 13 } }),

  row({ id: "C-2026-044", cancelled: false, cancelReason: null, customer: "우진해운", ctype: "신조", date: "2026-07-20", owner: "홍길동", items: [{ pkg: "Safety Forward", count: 2 }], vessels: { valid: 2, total: 2 } }),
  // 항목 2개 — 2줄에 꽉 차되 잘리지 않는 케이스
  row({ id: "C-2026-041", cancelled: false, cancelReason: null, customer: "한성해운", ctype: "개조", date: "2026-07-02", owner: "김담당", items: [{ pkg: "Safety Forward", count: 4 }, { pkg: "Safety Around", count: 4 }], vessels: { valid: 8, total: 8 } }),
  row({ id: "C-2026-038", cancelled: false, cancelReason: null, customer: "대양해운", ctype: "신조", date: "2026-06-18", owner: "홍길동", items: [{ pkg: "Enterprise", count: 12 }], vessels: { valid: 11, total: 12 } }),
  row({ id: "C-2026-031", cancelled: false, cancelReason: null, customer: "대양해운", ctype: "신조", date: "2026-05-10", owner: "홍길동", items: [{ pkg: "Cloud", count: 2 }], vessels: { valid: 2, total: 2 } }),
  row({ id: "C-2026-024", cancelled: false, cancelReason: null, customer: "청해선사", ctype: "신조", date: "2026-04-07", owner: "이대리", items: [{ pkg: "Smart Standard", count: 6 }], vessels: { valid: 6, total: 6 } }),
  row({ id: "C-2026-017", cancelled: false, cancelReason: null, customer: "한성해운", ctype: "신조", date: "2026-03-01", owner: "김담당", items: [{ pkg: "Safety Around", count: 3 }], vessels: { valid: 3, total: 3 } }),
  // C-2026-001 — 계약 상세·계정 상세·유저 상세·구독·납품 상세가 같은 이름을 쓴다(2026-01-15 대양해운 Control 신규 납품·구독, SVM 신규 납품·구독, Cloud 구독 5척)
  row({ id: "C-2026-001", cancelled: false, cancelReason: null, customer: "대양해운", ctype: "신조", date: "2026-01-15", owner: "홍길동", items: [{ pkg: "Enterprise", count: 5 }], vessels: { valid: 4, total: 5 } }),
  row({ id: "C-2025-031", cancelled: false, cancelReason: null, customer: "동보선사", ctype: "개조", date: "2025-11-03", owner: "이대리", items: [{ pkg: "Smart Standard", count: 3 }], vessels: { valid: 3, total: 3 } }),
  row({ id: "C-2025-008", cancelled: false, cancelReason: null, customer: "동보선사", ctype: "신조", date: "2025-04-18", owner: "이대리", items: [{ pkg: "Smart Standard", count: 2 }], vessels: { valid: 2, total: 2 } }),
  row({ id: "C-2024-092", cancelled: false, cancelReason: null, customer: "신광해운", ctype: "신조", date: "2024-09-05", owner: "홍길동", items: [{ pkg: "Enterprise", count: 4 }], vessels: { valid: 4, total: 4 } }),
  row({ id: "C-2024-019", cancelled: false, cancelReason: null, customer: "대양해운", ctype: "개조", date: "2024-02-28", owner: "이대리", items: [{ pkg: "Safety Around", count: 3 }], vessels: { valid: 3, total: 3 } }),

  // 취소 6건 — 사유는 각각 다르다(사유가 있으면 칩 아래 보조 줄로 붙는다)
  row({ id: "C-2026-036", cancelled: true, cancelReason: "선박 매각으로 발주 취소", customer: "우진해운", ctype: "개조", date: "2026-06-05", owner: "이대리", items: [{ pkg: "Smart Standard", count: 3 }], vessels: { valid: 0, total: 3 } }),
  row({ id: "C-2026-022", cancelled: true, cancelReason: "예산 미승인", customer: "서해해운", ctype: "신조", date: "2026-03-24", owner: "홍길동", items: [{ pkg: "Cloud", count: 2 }], vessels: { valid: 0, total: 2 } }),
  row({ id: "C-2025-077", cancelled: true, cancelReason: "계약 협상 결렬로 계약 취소", customer: "태평조선", ctype: "신조", date: "2025-08-14", owner: "김담당", items: [{ pkg: "Safety Forward", count: 2 }], vessels: { valid: 0, total: 2 } }),
  row({ id: "C-2025-064", cancelled: true, cancelReason: "발주처 사업 계획 변경", customer: "명진선사", ctype: "개조", date: "2025-07-01", owner: "이대리", items: [{ pkg: "Enterprise", count: 4 }], vessels: { valid: 0, total: 4 } }),
  row({ id: "C-2024-071", cancelled: true, cancelReason: "조선소 건조 계약 해지", customer: "신광해운", ctype: "신조", date: "2024-06-11", owner: "김담당", items: [{ pkg: "Safety Around", count: 4 }], vessels: { valid: 0, total: 4 } }),
  row({ id: "C-2024-046", cancelled: true, cancelReason: "중복 발주 확인 후 취소", customer: "청해선사", ctype: "신조", date: "2024-04-02", owner: "홍길동", items: [{ pkg: "Safety Around", count: 2 }], vessels: { valid: 0, total: 2 } }),
];

// 무한 스크롤 시연용 볼륨 — 대표 행 뒤에 규칙적으로 채운다(대표 21 + 채움 39 = 총 60건)
const FILLER: Row[] = Array.from({ length: 39 }, (_, i): Row => {
  const customer = CUSTOMERS[i % CUSTOMERS.length];
  const pkg = PACKAGES[i % PACKAGES.length];
  const count = (i % 5) + 1;
  const year = 2025 - Math.floor(i / 24);
  const month = (i % 12) + 1;
  const day = ((i * 7) % 27) + 1;
  return row({
    id: `C-${year}-${String(300 + i)}`,
    cancelled: false,
    cancelReason: null,
    customer,
    ctype: i % 6 === 0 ? "개조" : "신조",
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    owner: OWNERS[i % OWNERS.length],
    items: [{ pkg, count }],
    vessels: { valid: count, total: count },
  });
});

const ROWS: Row[] = [...FEATURED, ...FILLER];

// 필터 스펙 표 6.1 계약 리스트(2026-09-08) — 정본 filter-bar.stories.tsx CONTRACT_FILTERS.
// 연산자·유형·순서·base는 스펙, 옵션 목록은 이 페이지 데이터, 값 표기는 현행(정상·취소됨) 유지(디자이너 확정).
// 척수(Number)는 정렬 전용이라 필터 아님. 2026-09-07: 취소 값 라벨을 표기와 맞춰 「취소됨」으로 통일.
const CONTRACT_FILTERS: FilterDef[] = [
  { name: "cancelled", label: "취소 여부", options: ["정상", "취소됨"], operators: OPS_SELECT, base: true },
  { name: "name", label: "계약명", kind: "text", operators: OPS_TEXT, placeholder: "계약명" },
  { name: "customer", label: "고객", options: CUSTOMERS, multi: true, operators: OPS_SELECT },
  { name: "ctype", label: "계약 유형", options: ["신조", "개조"], multi: true, operators: OPS_SELECT },
  { name: "owner", label: "담당", options: OWNERS, multi: true, operators: OPS_SELECT },
  { name: "date", label: "계약일", kind: "date", operators: OPS_DATE, now: BASE_NOW },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365ContractsPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  const [keyword, setKeyword] = React.useState("");
  // 기본: 취소 제외(정상만) — 값 문법 "<op> <value>"
  const [filterValues, setFilterValues] = React.useState<FilterValues>({ cancelled: "is 정상" });
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
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

  // 검색가능 열(스펙): 계약명 · 고객 · 담당
  const q = keyword.trim().toLowerCase();
  const rows = (view === "empty" ? [] : ROWS)
    .filter(
      (r) =>
        (!q || `${r.name} ${r.customer} ${r.owner}`.toLowerCase().includes(q)) &&
        passSelect(filterValues.cancelled, r.cancelled ? "취소됨" : "정상") &&
        passText(filterValues.name, r.name) &&
        passSelect(filterValues.customer, r.customer) &&
        passSelect(filterValues.ctype, r.ctype) &&
        passSelect(filterValues.owner, r.owner) &&
        passDate(filterValues.date, r.date),
    )
    .sort((a, b) => {
      const c =
        sort === "vessels"
          ? a.vessels.valid - b.vessels.valid
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : a.date.localeCompare(b.date);
      return sortAsc ? c : -c;
    });
  // 취소 제외가 기본값이므로 건수 옆에 밝혀 둔다 (와이어프레임 2.3) — 취소됨 행이 걸러지는 조건이면 참
  const cancelExcluded = Boolean(filterValues.cancelled) && !passSelect(filterValues.cancelled, "취소됨");

  /* ── 무한 스크롤(2026-09-07, 이 페이지 한정) ──────────────────────────
     감시자(IntersectionObserver)가 목록 끝 센티넬을 보면 PAGE만큼 더 채운다.
     shown이 늘 때마다 감시자를 다시 걸어, 화면이 커서 센티넬이 계속 보이는
     경우에도 다음 묶음이 이어서 로드된다(관찰 시작 시 즉시 1회 콜백).
     지연 400ms는 스켈레톤이 보이게 하려는 시늉 — 실제 API 대체 지점. */
  const [shown, setShown] = React.useState(PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const total = rows.length;
  const hasMore = shown < total;

  // 조건이 바뀌면 처음부터 다시 — 필터를 좁혔는데 아래쪽만 남는 일 방지
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
  const listVisible = view !== "loading" && view !== "error" && view !== "empty";

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
        searchPlaceholder="계약명 · 고객 · 담당 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={CONTRACT_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          <>
            {/* 건수 — 무한 스크롤이라 푸터가 없다. 푸터 규칙의 이 페이지 한정 예외(2026-09-07) */}
            {/* mr-3 — 액션 행이 gap-2라 mr-1이면 CTA와 12px밖에 안 떨어져 버튼처럼 붙어 읽혔다(2026-09-07) */}
            {listVisible && (
              <span className="mr-3 text-sm text-secondary-foreground">
                전체 {total}건{cancelExcluded ? " (취소 제외)" : ""}
              </span>
            )}
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

      {/* 열 폭 고정 + 표 최소 폭 1136px(= 선언 폭 합계, 2026-09-07 교정).
          table-fixed는 내용을 무시하고 폭을 나눠서, 창이 좁아지면 계약명 뒤 열들이
          0에 가깝게 눌리고 nowrap 글자가 서로 겹쳐 깨졌다. min-w로 바닥을 깔면
          그 아래에서는 표가 더 줄지 않고 래퍼(overflow-x-auto)가 가로 스크롤을 낸다.
          창이 넓으면 선언 폭 비율대로 함께 커진다 */}
      {listVisible && (
        <Table className="min-w-284 table-fixed bg-card">
          <TableHeader>
            <TableRow>
              {/* 계약명 384px — 좁아지면 2줄로 접히도록 여유를 준 값(종전 600은 한 줄 고정) */}
              <TableHead className="w-96">
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("name")}>
                    계약명 {sort === "name" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </span>
              </TableHead>
              {/* 아래 폭 선언의 합 = 표 min-w. 하나라도 바꾸면 min-w도 같이 고쳐야 한다 */}
              <TableHead className="w-28">고객</TableHead>
              <TableHead className="w-28">계약 유형</TableHead>
              <TableHead className="w-32">담당</TableHead>
              <TableHead className="w-20">
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("vessels")}>
                    척수 {sort === "vessels" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </span>
              </TableHead>
              <TableHead className="w-32">
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:bg-accent" onClick={() => sortBy("date")}>
                    계약일 {sort === "date" ? (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 text-secondary-foreground" />}
                  </button>
                </span>
              </TableHead>
              {/* 취소 여부 192px */}
              <TableHead className="w-48">취소 여부</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow
                key={r.id}
                className={"cursor-pointer hover:bg-accent" + (r.cancelled ? " opacity-60" : "")}
                onClick={() => router.push(`${BASE}/contracts/detail`)}
              >
                {/* 계약명 — 남는 가로 공간을 이 열이 전부 먹는다(헤더 w-full).
                    폭을 임의로 묶으면(예: max-w-xs) 옆에 빈 공간을 두고도 짧은 이름까지 접혀
                    표가 지저분해진다 — 2026-09-07 교정. nowrap만 풀고 2줄 클램프로 상한을 건다 */}
                <TableCell className="whitespace-normal">
                  <Link
                    href={`${BASE}/contracts/detail`}
                    className="line-clamp-2 font-medium text-primary hover:underline"
                    title={r.name}
                  >
                    {r.name}
                  </Link>
                  <div className="font-mono text-xs text-secondary-foreground">{r.id}</div>
                </TableCell>
                <TableCell>{r.customer}</TableCell>
                {/* 계약 유형 — 신조=회색 채움 / 개조=테두리만(2026-09-07 확정).
                    outline 변형은 테두리가 border 토큰, 글자가 foreground 토큰이라
                    "테두리는 글자보다 약하게" 요건을 DS 기본값 그대로 만족한다. 색 구분 없음 */}
                <TableCell>
                  <Badge variant={r.ctype === "개조" ? "outline" : "secondary"} className="font-normal">
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
                {/* 취소 여부 — 예외만 표기(2026-09-07). 정상은 빈 칸: 도트도 글자도 없다 */}
                <TableCell>
                  {r.cancelled && (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                        <span className="size-2 rounded-full bg-destructive" /> 취소됨
                      </span>
                      {r.cancelReason && (
                        <div className="whitespace-normal text-xs text-secondary-foreground">
                          {r.cancelReason}
                        </div>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {/* 다음 묶음 로딩 — 열 정렬을 유지하려 표 안에 스켈레톤 행으로 둔다 */}
            {loadingMore &&
              [0, 1, 2].map((i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-1.5 h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      {/* 스크롤 센티넬 — 여기가 보이면 다음 묶음을 부른다 */}
      {listVisible && hasMore && <div ref={sentinelRef} aria-hidden />}
    </div>
  );
}
