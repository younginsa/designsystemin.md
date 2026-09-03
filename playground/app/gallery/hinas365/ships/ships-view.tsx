"use client";

// 호선 관리 — 납품 / 테스트 호선 목록 + 신규 호선 생성(3단계)
// 원천: Avikus Design library 「호선 관리」 기획 보드 (붙여넣은 캡처 6장 + 요구사항 텍스트)
// 셸(GNB·사이드바)은 ../layout.tsx 가 담당한다.
//
// 기획 보드 요구사항 반영
// - 주요 액션: 호선 검색 / 호선 생성(테스트 호선 only) / 호선 필터링 / 목록 파일 추출
// - 주요 정보: IMO · HULL · Ship Name · 설치 제품 및 버전(버전은 tooltip) · 구독 상태 ·
//   업데이트 날짜 · 생성 날짜
// - 필수 기능: 검색 / 날짜 정렬 / 구독 상태 필터 / 버전·옵션 필터
// → [호선 생성]은 목록 유형이 '테스트'일 때만 노출한다.
//
// 어휘 게이트 메모
// - skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용
// - stepper 미채택(DES-207) → 생성 모달 3단계 표시는 data-tabs 로 대체
// - warning 톤 없음(DES-206) → 구독 PENDING 은 primary 도트로 대체
// - 원본 primary 는 네이비지만 DS 토큰(zinc-900)을 그대로 쓴다 — 토큰 반영 시 자동 추종

import * as React from "react";
import { StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Download,
  Info,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Checkbox } from "@ds/ui/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
    EmptyTitle,
} from "@ds/ui/ui/empty";
import { Input } from "@ds/ui/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";
import { Label } from "@ds/ui/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ds/ui/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@ds/ui/ui/popover";
import { Progress } from "@ds/ui/ui/progress";
import { RadioGroup, RadioGroupItem } from "@ds/ui/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ds/ui/ui/select";
import { Separator } from "@ds/ui/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

import {
  DATE_PRESETS,
  FilterBar,
  resolveDateRange,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";
import { SearchBox } from "@ds/ui/ui/search-box";
import {
  ROWS_PER_PAGE_DEFAULT,
  RowsPerPage,
} from "@ds/ui/ui/rows-per-page";
import {
  VersionFilterChip,
  type VersionRow,
} from "@ds/ui/ui/version-filter-chip";

/* ---------------------------------------------------------------- 상수 */

const SEARCHABLE_FIELDS = ["Name", "IMO Number", "Hull Number", "Ship Owner", "Tags"];

const PRODUCT_NAMES = ["control", "navigation", "svm"] as const;
type ProductName = (typeof PRODUCT_NAMES)[number];

const COMMON_VERSIONS = ["1.0.0", "1.2.0", "2.0.0", "2.1.0"];
const PRODUCT_VERSIONS: Record<ProductName, string[]> = {
  control: ["1.0.0", "1.1.4", "2.0.0", "2.3.1"],
  navigation: ["1.0.0", "1.5.2", "2.0.0"],
  svm: ["0.9.8", "1.0.0", "1.1.0"],
};

type SubscriptionStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "NONE";

// warning 토큰 부재 → PENDING 은 primary 도트 (DES-206)
const SUBSCRIPTION_DOT: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-success",
  PENDING: "bg-primary",
  EXPIRED: "bg-destructive",
  NONE: "bg-muted-foreground",
};
const SUBSCRIPTION_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  EXPIRED: "Expired",
  NONE: "None",
};

// 기본 = PRODUCT 하나(계층 칩: 제품 → 공통버전 → 제품버전, 2026-08-26 확정).
// 나머지는 전부 [+ 필터 추가]에서 꺼내 쓴다.
// 새 규칙(2026-08-26): 정렬은 헤더 전담 · 필터는 전부 FilterBar — 구독도 여기로 편입.
const SHIP_FILTERS: FilterDef[] = [
  { name: "subscription", label: "구독", options: ["None", "Pending", "Active", "Expired"] },
  { name: "statusUpdated", label: "상태 갱신일", kind: "date", presets: DATE_PRESETS },
  { name: "created", label: "생성일", kind: "date", presets: DATE_PRESETS },
  { name: "security", label: "사이버 보안", options: ["설치됨", "미설치"] },
  { name: "cloud", label: "클라우드", options: ["설치됨", "미설치"] },
];

/* ------- 신규 호선 생성 선택지 (기획 캡처에서 읽은 값) */
const SHIP_TYPES = ["PCTC", "LNG Carrier", "Container", "Bulk", "VLCC", "RORO"];
const YARDS = ["HMD", "HHI", "HSHI", "DSME", "SHI"];
const CLASSES = ["KR", "DNV", "ABS", "LR", "NK", "BV"];
const CLIENT_PC_COUNTS = ["0", "1", "2", "3", "4"];
const ENGINE_COUNTS = ["single", "twin"];
const ENGINE_TYPES = ["diesel", "dual-fuel", "LNG", "electric"];
const ECDIS_MAKERS = ["JRC", "Furuno", "Sperry", "Wärtsilä"];
const AUTOPILOT_MAKERS = ["Tokyokeiki", "Yokogawa", "Raytheon"];
const AMS_MAKERS = ["not_installed", "Kongsberg", "Nabtesco", "Samsung"];
const BMS_MAKERS = ["Nabtesco", "Kongsberg", "not_installed"];

const SYSTEM_OPTIONS = [
  { name: "cloud", label: "Cloud 연동 활성화" },
  { name: "security", label: "보안 모듈 활성화" },
  { name: "telemetry", label: "데이터 수집 모듈 활성화" },
] as const;
type SystemOptionName = (typeof SYSTEM_OPTIONS)[number]["name"];

const CREATE_STEPS = [
  { id: "basic", label: "기본 정보·제원" },
  { id: "equip", label: "장비·엔진" },
  { id: "review", label: "입력 검토" },
] as const;

/* ---------------------------------------------------------------- 샘플 데이터 */

type ShipRow = {
  imo: string;
  hull: string | null;
  shipName: string;
  products: { name: ProductName; version: string; commonVersion: string }[];
  subscription: SubscriptionStatus;
  security: boolean; // 사이버 보안 설치 여부
  cloud: boolean; // 클라우드 설치 여부
  statusUpdated: string;
  statusUpdatedAgo: string;
  createdAt: string;
  createdAgo: string;
};

const DELIVERY_SHIPS: ShipRow[] = [
  {
    imo: "9800137",
    hull: "H2101",
    shipName: "HYUNDAI GLOBE 001",
    products: [
      { name: "navigation", version: "2.0.0", commonVersion: "2.1.0" },
      { name: "control", version: "2.3.1", commonVersion: "2.1.0" },
    ],
    subscription: "ACTIVE",
    security: true,
    cloud: true,
    statusUpdated: "2026-08-12 14:20",
    statusUpdatedAgo: "2일 전",
    createdAt: "2025-11-04 09:12",
    createdAgo: "9개월 전",
  },
  {
    imo: "9800274",
    hull: "H2102",
    shipName: "MAERSK SEOUL 002",
    products: [{ name: "navigation", version: "1.5.2", commonVersion: "2.0.0" }],
    subscription: "PENDING",
    security: false,
    cloud: true,
    statusUpdated: "2026-08-09 03:41",
    statusUpdatedAgo: "5일 전",
    createdAt: "2026-01-22 17:55",
    createdAgo: "7개월 전",
  },
  {
    imo: "9800411",
    hull: null,
    shipName: "EVER GIVEN 003",
    products: [
      { name: "control", version: "1.1.4", commonVersion: "1.2.0" },
      { name: "navigation", version: "1.0.0", commonVersion: "1.2.0" },
      { name: "svm", version: "1.1.0", commonVersion: "1.2.0" },
    ],
    subscription: "EXPIRED",
    security: false,
    cloud: false,
    statusUpdated: "2026-06-30 11:02",
    statusUpdatedAgo: "약 2개월 전",
    createdAt: "2025-03-18 08:30",
    createdAgo: "1년 전",
  },
  {
    imo: "9800548",
    hull: "H2104",
    shipName: "HMM ALGECIRAS 004",
    products: [{ name: "svm", version: "0.9.8", commonVersion: "1.0.0" }],
    subscription: "NONE",
    security: false,
    cloud: false,
    statusUpdated: "2026-07-21 22:10",
    statusUpdatedAgo: "24일 전",
    createdAt: "2026-02-11 13:44",
    createdAgo: "6개월 전",
  },
  {
    imo: "9800685",
    hull: "H2105",
    shipName: "ONE APUS 005",
    products: [
      { name: "navigation", version: "2.0.0", commonVersion: "2.1.0" },
      { name: "svm", version: "1.0.0", commonVersion: "2.1.0" },
    ],
    subscription: "ACTIVE",
    security: true,
    cloud: true,
    statusUpdated: "2026-08-13 06:05",
    statusUpdatedAgo: "1일 전",
    createdAt: "2026-04-02 10:19",
    createdAgo: "4개월 전",
  },
  {
    imo: "9800822",
    hull: "H2106",
    shipName: "COSCO PRIDE 006",
    products: [{ name: "control", version: "2.0.0", commonVersion: "2.0.0" }],
    subscription: "ACTIVE",
    security: true,
    cloud: false,
    statusUpdated: "2026-08-01 19:33",
    statusUpdatedAgo: "13일 전",
    createdAt: "2025-09-27 15:02",
    createdAgo: "11개월 전",
  },
  {
    imo: "9800959",
    hull: null,
    shipName: "MSC GULSUN 007",
    products: [
      { name: "navigation", version: "1.0.0", commonVersion: "1.0.0" },
      { name: "control", version: "1.0.0", commonVersion: "1.0.0" },
    ],
    subscription: "PENDING",
    security: false,
    cloud: true,
    statusUpdated: "2026-05-14 08:47",
    statusUpdatedAgo: "3개월 전",
    createdAt: "2025-06-08 11:26",
    createdAgo: "1년 전",
  },
];

// 테스트 호선 — 기획 캡처의 목록(CONTROL_TEST, SVM_TEST… )을 따른다
const TEST_SHIPS: ShipRow[] = [
  {
    imo: "CONTROL_TEST",
    hull: "CONTROL_TEST",
    shipName: "CONTROL_TEST",
    products: [{ name: "control", version: "2.3.1", commonVersion: "2.1.0" }],
    subscription: "NONE",
    security: false,
    cloud: false,
    statusUpdated: "2026-07-28 15:00",
    statusUpdatedAgo: "3분 전",
    createdAt: "2026-07-28 12:09",
    createdAgo: "2시간 전",
  },
  {
    imo: "INSTALL_LATER_24H",
    hull: "INSTALL_L",
    shipName: "INSTALL_LATER_24H",
    products: [],
    subscription: "NONE",
    security: false,
    cloud: false,
    statusUpdated: "-",
    statusUpdatedAgo: "-",
    createdAt: "2026-07-28 11:04",
    createdAgo: "4시간 전",
  },
  {
    imo: "CONTROL_CLIENT_TEST",
    hull: "CONTROL_CLIENT_TEST",
    shipName: "CONTROL_CLIENT_TEST",
    products: [{ name: "control", version: "2.0.0", commonVersion: "2.0.0" }],
    subscription: "PENDING",
    security: true,
    cloud: false,
    statusUpdated: "2026-07-27 14:05",
    statusUpdatedAgo: "1일 1시간 전",
    createdAt: "2026-07-24 18:15",
    createdAgo: "3일 20시간 전",
  },
  {
    imo: "SVM_BUSAN_1",
    hull: "SVM_BUSAN_1",
    shipName: "SVM_BUSAN_1",
    products: [{ name: "svm", version: "1.1.0", commonVersion: "2.1.0" }],
    subscription: "ACTIVE",
    security: true,
    cloud: true,
    statusUpdated: "2026-07-27 15:03",
    statusUpdatedAgo: "1일 0시간 전",
    createdAt: "2026-07-23 13:44",
    createdAgo: "1일 1시간 전",
  },
  {
    imo: "SVM_LOW_SPEC",
    hull: "1234",
    shipName: "SVM_LOW_SPEC",
    products: [{ name: "svm", version: "0.9.8", commonVersion: "1.0.0" }],
    subscription: "NONE",
    security: false,
    cloud: false,
    statusUpdated: "2026-07-27 17:29",
    statusUpdatedAgo: "1일 1시간 전",
    createdAt: "2026-07-24 17:37",
    createdAgo: "3일 21시간 전",
  },
  {
    imo: "SVM_TEST2",
    hull: "SVM_TEST2",
    shipName: "SVM_TEST2",
    products: [{ name: "svm", version: "1.0.0", commonVersion: "1.2.0" }],
    subscription: "NONE",
    security: false,
    cloud: true,
    statusUpdated: "-",
    statusUpdatedAgo: "-",
    createdAt: "2026-07-23 13:03",
    createdAgo: "5일 2시간 전",
  },
];

const TOTALS = { delivery: 143, test: 27 };

/* ---------------------------------------------------------------- 타입 */

type ListKind = "delivery" | "test";
type ViewState = "default" | "loading" | "progress" | "error" | "empty" | "no-result";
type SortField = "status_updated_at" | "created_at";
type SortOrder = "asc" | "desc";

type NewShip = {
  imo: string;
  owner: string;
  shipName: string;
  callSign: string;
  hull: string;
  yard: string;
  shipClass: string;
  build: string;
  shipType: string;
  loa: string;
  lbp: string;
  beam: string;
  depth: string;
  draught: string;
  clientPc: string;
  systemOptions: SystemOptionName[];
  engineCount: string;
  engineType: string;
  ecdisMaker: string;
  autopilotMaker: string;
  amsMaker: string;
  bmsMaker: string;
};

const EMPTY_SHIP: NewShip = {
  imo: "",
  owner: "",
  shipName: "",
  callSign: "",
  hull: "",
  yard: "",
  shipClass: "",
  build: "신조",
  shipType: "PCTC",
  loa: "200",
  lbp: "180",
  beam: "35",
  depth: "10",
  draught: "6",
  clientPc: "0",
  systemOptions: [],
  engineCount: "single",
  engineType: "diesel",
  ecdisMaker: "JRC",
  autopilotMaker: "Tokyokeiki",
  amsMaker: "not_installed",
  bmsMaker: "Nabtesco",
};

/* ---------------------------------------------------------------- 페이지 */

// 납품/테스트는 라우트로 분리 — kind 는 각 라우트 페이지가 prop 으로 넘긴다
// (페이지 내 탭 전환 제거: 사이드바 메뉴 이중 활성 문제 해소)
export default function ShipsView({ kind }: { kind: ListKind }) {
  const [view, setView] = React.useState<ViewState>("default");

  const [keyword, setKeyword] = React.useState("");

  const [sort, setSort] = React.useState<SortField>("status_updated_at");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  // PRODUCT 계층 필터 — 캐스케이드 칩(VersionFilterChip)이 소유, 빈 배열 = 미적용
  const [versionRows, setVersionRows] = React.useState<VersionRow[]>([]);

  // header-filter 시스템 상태 — 칩 값 + 추가로 꺼내둔 필터
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [extraShown, setExtraShown] = React.useState<string[]>([]);

  const [exportFormat, setExportFormat] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState("production-ships-2026-08-14");
  const [fileNameError, setFileNameError] = React.useState(false);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  // 페이지당 행 수 — 기본 15, 푸터 드롭업에서 변경(2026-08-26)
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);

  const isTest = kind === "test";
  const total = isTest ? TOTALS.test : TOTALS.delivery;
  const PAGE_COUNT = Math.max(1, Math.ceil(total / pageSize));
  const source = isTest ? TEST_SHIPS : DELIVERY_SHIPS;
  // 검색 제안 후보 — 검색 가능 필드(IMO·호선명) 값에서 도출, Hull은 보조줄
  const searchCandidates = React.useMemo(
    () => [
      ...source.map((s) => ({ label: s.imo, sub: s.hull ?? undefined })),
      ...source.map((s) => ({ label: s.shipName })),
    ],
    [source],
  );
  // 날짜 필터 — 칩 값(프리셋·직접 지정)을 실제 기간으로 풀어 두 날짜 컬럼에 적용
  const inRange = (dateStr: string, v?: string) => {
    if (!v) return true;
    const r = resolveDateRange(v);
    if (!r) return true;
    const d = new Date(dateStr.replace(" ", "T"));
    return d >= r.from && d <= r.to;
  };
  // 검색 — IMO·호선명·Hull 부분 일치 (선사 필드는 샘플 데이터에 없어 미적용)
  const q = keyword.trim().toLowerCase();
  const keywordOk = (s: ShipRow) =>
    !q ||
    s.imo.toLowerCase().includes(q) ||
    s.shipName.toLowerCase().includes(q) ||
    (s.hull ?? "").toLowerCase().includes(q);
  // 설치 여부 칩 — "설치됨"/"미설치" 값 ↔ boolean 필드
  const installOk = (v: string | undefined, installed: boolean) =>
    !v || (v === "설치됨") === installed;
  // PRODUCT 캐스케이드 — 제품 간 AND · 같은 제품 조건끼리 OR(모달 시절 규칙 승계).
  // 조건의 버전 미선택(빈 값)은 전체 허용.
  const versionOk = (s: ShipRow) => {
    if (versionRows.length === 0) return true;
    const byProduct = new Map<string, VersionRow[]>();
    versionRows.forEach((r) => {
      byProduct.set(r.product, [...(byProduct.get(r.product) ?? []), r]);
    });
    for (const conds of byProduct.values()) {
      const hit = conds.some((c) =>
        s.products.some(
          (p) =>
            p.name === c.product &&
            (!c.commonVersion || p.commonVersion === c.commonVersion) &&
            (!c.productVersion || p.version === c.productVersion),
        ),
      );
      if (!hit) return false;
    }
    return true;
  };
  const rows = (view === "empty" || view === "no-result" ? [] : source)
    .filter(
      (s) =>
        keywordOk(s) &&
        (!filterValues.subscription ||
          SUBSCRIPTION_LABEL[s.subscription] === filterValues.subscription) &&
        versionOk(s) &&
        installOk(filterValues.security, s.security) &&
        installOk(filterValues.cloud, s.cloud) &&
        inRange(s.statusUpdated, filterValues.statusUpdated) &&
        inRange(s.createdAt, filterValues.created),
    )
    // 헤더 정렬 실동작 — YYYY-MM-DD HH:mm 문자열은 사전순 = 시간순
    .sort((a, b) => {
      const f = sort === "status_updated_at" ? "statusUpdated" : "createdAt";
      const c = a[f].localeCompare(b[f]);
      return sortOrder === "asc" ? c : -c;
    });

  // 결과 없음 = 미리보기 강제 상태 + 실제 필터링이 0건으로 수렴한 경우
  const showNoResult = view === "no-result" || (view === "default" && rows.length === 0);



  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── 페이지 헤더 ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-bold">
            {isTest ? "테스트 호선 리스트" : "납품 호선 리스트"}
          </h1>
          <StatePreview
            value={view}
            onChange={(v) => setView(v as ViewState)}
            states={[
              { value: "default", label: "기본" },
              { value: "empty", label: "빈" },
              { value: "loading", label: "로딩" },
              { value: "progress", label: "프로그레스 바" },
              { value: "error", label: "에러" },
              { value: "no-result", label: "결과 없음" },
            ]}
          />
        </div>

        {/* ── 툴바 — header-filter 시스템 + searchSlot 주입(SearchBox 프리셋) ── */}
        <FilterBar
          searchSlot={
            <>
              <SearchBox
                placeholder="IMO · 호선명 · Hull · 선사 검색"
                value={keyword}
                onChange={setKeyword}
                candidates={searchCandidates}
                recentInitial={["9800137", "9800274", "HYUNDAI GLOBE 001"]}
                quick={["HYUNDAI GLOBE", "MAERSK", "SVM", "BUSAN", "TEST"]}
              />
              {/* PRODUCT 계층 필터 칩 — 모달 폐기, 캐스케이드 패널(2026-08-26) */}
              <VersionFilterChip
                label="제품"
                products={[...PRODUCT_NAMES]}
                commonVersions={COMMON_VERSIONS}
                productVersions={PRODUCT_VERSIONS as Record<string, string[]>}
                value={versionRows}
                onChange={setVersionRows}
              />
            </>
          }
          searchPlaceholder="IMO · 호선명 · Hull · 선사 검색"
          keyword={keyword}
          onKeyword={setKeyword}
          filters={SHIP_FILTERS}
          values={filterValues}
          onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
          extraShown={extraShown}
          onExtraShownChange={setExtraShown}
          actions={
            <>
              {/* CTA 순서 관례: Primary는 맨 오른쪽, secondary(outline)는 그 왼쪽 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="size-4" /> 내보내기
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setExportFormat("csv")}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setExportFormat("xlsx")}>XLSX</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* 기획 규칙: 호선 생성은 테스트 호선에서만 */}
              {isTest && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" /> 호선 생성
                </Button>
              )}
            </>
          }
        />

        {/* ── 상태별 본문 ── */}
        {view === "loading" && <TableSkeleton />}
        {view === "progress" && <LoadingTable />}

        {view === "error" && (
          <ErrorState
            title="호선 정보를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {view === "empty" && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>등록된 데이터가 없습니다.</EmptyTitle>
              <EmptyDescription>
                {isTest
                  ? "테스트 호선을 생성하면 이 목록에 표시됩니다."
                  : "납품된 호선이 등록되면 이 목록에 표시됩니다."}
              </EmptyDescription>
            </EmptyHeader>
            {isTest && (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> 호선 생성
              </Button>
            )}
          </Empty>
        )}

        {showNoResult && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>검색 결과 없음</EmptyTitle>
              <EmptyDescription>다른 조건으로 검색해주세요.</EmptyDescription>
            </EmptyHeader>
            <Button
              variant="outline"
              onClick={() => {
                setKeyword("");
                setVersionRows([]);
                setFilterValues({});
                setView("default");
              }}
            >
              조건 초기화
            </Button>
          </Empty>
        )}

        {view === "default" && !showNoResult && (
          <>
            <ShipTable
              rows={rows}
              sort={sort}
              sortOrder={sortOrder}
              onSort={(f) => {
                if (sort === f) setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
                else {
                  setSort(f);
                  setSortOrder("desc");
                }
              }}
            />

            <div className="flex items-center justify-between gap-4">
              {/* 좌: 페이지당 표시 + 전체 건수 · 우: 페이지네이션 (2026-08-26 확정) */}
              <RowsPerPage
                value={pageSize}
                onChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
                summary={`전체 ${total.toLocaleString()}척`}
              />
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      aria-disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    />
                  </PaginationItem>
                  {page > 2 && (
                    <PaginationItem>
                      <PaginationLink href="#" onClick={() => setPage(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {[page - 1, page, page + 1]
                    .filter((p) => p >= 1 && p <= PAGE_COUNT)
                    .map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink href="#" isActive={p === page} onClick={() => setPage(p)}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  {page < PAGE_COUNT - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {page < PAGE_COUNT - 1 && (
                    <PaginationItem>
                      <PaginationLink href="#" onClick={() => setPage(PAGE_COUNT)}>
                        {PAGE_COUNT}
                      </PaginationLink>
                    </PaginationItem>
                  )}
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


      {/* ── 내보내기 파일명 ── */}
      <Dialog
        open={exportFormat !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExportFormat(null);
            setFileNameError(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>내보내기 파일명</DialogTitle>
            <DialogDescription>
              {exportFormat?.toUpperCase()} 형식으로 현재 조회 결과를 내려받습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="export-name">파일명</Label>
            <div className="flex items-center gap-2">
              <Input
                id="export-name"
                value={fileName}
                aria-invalid={fileNameError || undefined}
                onChange={(e) => {
                  setFileName(e.target.value);
                  setFileNameError(false);
                }}
              />
              <span className="text-sm text-secondary-foreground">.{exportFormat}</span>
            </div>
            {fileNameError && (
              <p className="text-sm text-destructive">저장할 파일명을 입력해 주세요.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportFormat(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                if (!fileName.trim()) {
                  setFileNameError(true);
                  return;
                }
                setExportFormat(null);
              }}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 신규 호선 생성 ── */}
      <CreateShipDialog open={createOpen} onOpenChange={setCreateOpen} />
    </TooltipProvider>
  );
}

/* ---------------------------------------------------------------- 표 */

function ShipTable({
  rows,
  sort,
  sortOrder,
  onSort,
}: {
  rows: ShipRow[];
  sort: SortField;
  sortOrder: SortOrder;
  onSort: (f: SortField) => void;
}) {
  return (
    <div>
      <Table className="bg-card">
        <TableHeader>
          <TableRow>
            <TableHead className="uppercase">IMO Number (Hull)</TableHead>
            <TableHead>호선명</TableHead>
            <TableHead>제품</TableHead>
            {/* 새 규칙(2026-08-26): 헤더는 정렬 전담 — 구독 필터는 FilterBar로 이동 */}
            <TableHead>구독</TableHead>
            <TableHead>
              <SortHeader
                label="상태 갱신일"
                field="status_updated_at"
                sort={sort}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>
              <SortHeader
                label="생성일"
                field="created_at"
                sort={sort}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.imo}>
              <TableCell>
                <a href="#" className="block font-medium text-primary hover:underline">
                  {s.imo}
                </a>
                <p className="text-xs text-secondary-foreground">{s.hull ?? "-"}</p>
              </TableCell>
              <TableCell>
                <p className="max-w-52 truncate font-medium" title={s.shipName}>
                  {s.shipName}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {s.products.length === 0 && (
                    <span className="text-sm text-secondary-foreground">-</span>
                  )}
                  {s.products.map((p) => (
                    <Tooltip key={p.name}>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          {p.name.toUpperCase()}
                          <Info className="size-3" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>common version: {p.commonVersion}</p>
                        <p>
                          {p.name} version: {p.version}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {/* data-status 색 쌍 규칙 — 위험·에러 계열은 텍스트도 같은 색 */}
                <span
                  className={
                    "flex items-center gap-1.5 text-sm" +
                    (s.subscription === "EXPIRED" ? " text-destructive" : "")
                  }
                >
                  <span className={`size-2 rounded-full ${SUBSCRIPTION_DOT[s.subscription]}`} />
                  {SUBSCRIPTION_LABEL[s.subscription]}
                </span>
              </TableCell>
              <TableCell>
                <p className="text-sm">{s.statusUpdated}</p>
                {s.statusUpdatedAgo !== "-" && (
                  <p className="text-xs text-secondary-foreground">({s.statusUpdatedAgo})</p>
                )}
              </TableCell>
              <TableCell>
                <p className="text-sm">{s.createdAt}</p>
                <p className="text-xs text-secondary-foreground">({s.createdAgo})</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SortHeader({
  label,
  field,
  sort,
  sortOrder,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  sortOrder: SortOrder;
  onSort: (f: SortField) => void;
}) {
  const active = sort === field;
  const Icon = active ? (sortOrder === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 uppercase"
      title={active && sortOrder === "asc" ? "오름차순으로 정렬함" : "내림차순으로 정렬함"}
      onClick={() => onSort(field)}
    >
      {label}
      <Icon className={active ? "size-4" : "size-4 text-secondary-foreground"} />
    </Button>
  );
}

// 로딩 — skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용
function LoadingTable() {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-4">
        <Progress value={62} className="flex-1" />
        <span className="font-mono text-sm text-secondary-foreground">62%</span>
      </div>
      <p className="text-sm text-secondary-foreground">호선 목록을 불러오는 중입니다…</p>
    </div>
  );
}


/* ---------------------------------------------------------------- 신규 호선 생성 (3단계) */

function CreateShipDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = React.useState(0);
  const [ship, setShip] = React.useState<NewShip>(EMPTY_SHIP);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [done, setDone] = React.useState(false);

  const patch = (p: Partial<NewShip>) => {
    setShip((prev) => ({ ...prev, ...p }));
    setErrors({});
  };

  const toggleSystemOption = (name: SystemOptionName) =>
    patch({
      systemOptions: ship.systemOptions.includes(name)
        ? ship.systemOptions.filter((o) => o !== name)
        : [...ship.systemOptions, name],
    });

  const validateBasic = () => {
    const e: Record<string, string> = {};
    if (!ship.imo.trim()) e.imo = "IMO Number를 입력하세요.";
    if (!ship.owner.trim()) e.owner = "선주를 입력하세요.";
    if (!ship.shipName.trim()) e.shipName = "호선명을 입력하세요.";
    if (!ship.callSign.trim()) e.callSign = "Call Sign을 입력하세요.";
    if (!ship.hull.trim()) e.hull = "Hull Number를 입력하세요.";
    return e;
  };

  const goNext = () => {
    if (step === 0) {
      const e = validateBasic();
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    setStep((s) => Math.min(s + 1, CREATE_STEPS.length - 1));
  };

  const close = () => {
    onOpenChange(false);
    setStep(0);
    setErrors({});
    setDone(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>신규 호선 생성</DialogTitle>
          <DialogDescription>
            {step === 2
              ? "입력하신 정보를 확인하고 생성을 진행하세요. 섹션별로 수정할 수 있습니다."
              : "설치할 호선의 기본 정보와 제원, 장비 구성을 입력합니다."}
          </DialogDescription>
        </DialogHeader>

        {/* 단계 표시 — stepper 미채택(DES-207)이라 data-tabs 로 대체 */}
        <Tabs value={CREATE_STEPS[step].id}>
          <TabsList className="w-full justify-start">
            {CREATE_STEPS.map((s, i) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                disabled={i > step}
                className="gap-2"
                onClick={() => i <= step && setStep(i)}
              >
                <span>{i + 1}</span>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {done && (
          <Alert>
            <AlertTitle className="text-success">호선이 생성되었습니다</AlertTitle>
            <AlertDescription>
              <p>
                {ship.shipName || "이름 없음"} · IMO {ship.imo || "-"} 가 테스트 호선 목록에
                추가되었습니다.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* 1단계 — 기본 정보·제원 */}
        {step === 0 && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">기본 정보</p>
              <FieldText
                id="cs-imo"
                label="IMO Number"
                required
                placeholder="예: 1234567"
                value={ship.imo}
                error={errors.imo}
                onChange={(v) => patch({ imo: v })}
              />
              <FieldText
                id="cs-owner"
                label="선주"
                required
                placeholder="예: Avikus"
                value={ship.owner}
                error={errors.owner}
                onChange={(v) => patch({ owner: v })}
              />
              <FieldText
                id="cs-name"
                label="호선명"
                required
                placeholder="예: Avikus Ship"
                value={ship.shipName}
                error={errors.shipName}
                onChange={(v) => patch({ shipName: v })}
              />
              <FieldText
                id="cs-call"
                label="Call Sign"
                required
                placeholder="예: ABCD"
                value={ship.callSign}
                error={errors.callSign}
                onChange={(v) => patch({ callSign: v })}
              />
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                Ship Yard &amp; Construction
              </p>
              <FieldText
                id="cs-hull"
                label="Hull Number"
                required
                placeholder="예: H-1234"
                value={ship.hull}
                error={errors.hull}
                onChange={(v) => patch({ hull: v })}
              />
              <FieldSelect
                id="cs-yard"
                label="Yard"
                value={ship.yard}
                placeholder="Yard 선택"
                options={YARDS}
                onChange={(v) => patch({ yard: v })}
              />
              <FieldSelect
                id="cs-class"
                label="선급"
                value={ship.shipClass}
                placeholder="예: KR"
                options={CLASSES}
                onChange={(v) => patch({ shipClass: v })}
              />
              <div className="space-y-2">
                <Label>신조 / 개조</Label>
                <RadioGroup value={ship.build} onValueChange={(v) => patch({ build: v })}>
                  {["신조", "개조"].map((b) => (
                    <Label
                      key={b}
                      className={
                        "flex items-center gap-3 rounded-lg border p-3 font-normal " +
                        (ship.build === b ? "border-primary font-medium" : "text-secondary-foreground")
                      }
                    >
                      <RadioGroupItem value={b} />
                      {b}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">선박 제원</p>
              <FieldSelect
                id="cs-type"
                label="선종"
                value={ship.shipType}
                options={SHIP_TYPES}
                onChange={(v) => patch({ shipType: v })}
              />
              <div className="grid grid-cols-2 gap-2">
                <FieldNumber
                  id="cs-loa"
                  label="LOA (m)"
                  value={ship.loa}
                  onChange={(v) => patch({ loa: v })}
                />
                <FieldNumber
                  id="cs-lbp"
                  label="LBP (m)"
                  value={ship.lbp}
                  onChange={(v) => patch({ lbp: v })}
                />
              </div>
              <FieldNumber
                id="cs-beam"
                label="Beam (m)"
                value={ship.beam}
                onChange={(v) => patch({ beam: v })}
              />
              <FieldNumber
                id="cs-depth"
                label="Depth (m)"
                value={ship.depth}
                onChange={(v) => patch({ depth: v })}
              />
              <FieldNumber
                id="cs-draught"
                label="Scantling Draught (m)"
                value={ship.draught}
                onChange={(v) => patch({ draught: v })}
              />
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">시스템 설정</p>
              <div className="space-y-2">
                <Label>
                  시스템 옵션{" "}
                  <span className="text-secondary-foreground">복수 선택 가능</span>
                </Label>
                {SYSTEM_OPTIONS.map((o) => {
                  const checked = ship.systemOptions.includes(o.name);
                  return (
                    <Label
                      key={o.name}
                      className={
                        "flex items-center gap-3 rounded-lg border p-3 font-normal " +
                        (checked ? "border-primary font-medium" : "text-secondary-foreground")
                      }
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleSystemOption(o.name)} />
                      {o.label}
                    </Label>
                  );
                })}
              </div>
              <FieldSelect
                id="cs-pc"
                label="클라이언트 PC 수량"
                value={ship.clientPc}
                options={CLIENT_PC_COUNTS}
                onChange={(v) => patch({ clientPc: v })}
              />
            </section>
          </div>
        )}

        {/* 2단계 — 장비·엔진 (기획 캡처 없음: 3단계 검토 항목에서 역산) */}
        {step === 1 && (
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">엔진</p>
              <FieldSelect
                id="cs-ecount"
                label="엔진 수량"
                value={ship.engineCount}
                options={ENGINE_COUNTS}
                onChange={(v) => patch({ engineCount: v })}
              />
              <FieldSelect
                id="cs-etype"
                label="엔진 타입"
                value={ship.engineType}
                options={ENGINE_TYPES}
                onChange={(v) => patch({ engineType: v })}
              />
            </section>
            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                ECDIS &amp; Auto Pilot
              </p>
              <FieldSelect
                id="cs-ecdis"
                label="ECDIS Maker"
                value={ship.ecdisMaker}
                options={ECDIS_MAKERS}
                onChange={(v) => patch({ ecdisMaker: v })}
              />
              <FieldSelect
                id="cs-autopilot"
                label="Auto Pilot Maker"
                value={ship.autopilotMaker}
                options={AUTOPILOT_MAKERS}
                onChange={(v) => patch({ autopilotMaker: v })}
              />
            </section>
            <section className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">AMS &amp; BMS</p>
              <FieldSelect
                id="cs-ams"
                label="AMS Maker"
                value={ship.amsMaker}
                options={AMS_MAKERS}
                onChange={(v) => patch({ amsMaker: v })}
              />
              <FieldSelect
                id="cs-bms"
                label="BMS Maker"
                value={ship.bmsMaker}
                options={BMS_MAKERS}
                onChange={(v) => patch({ bmsMaker: v })}
              />
            </section>
            <p className="text-sm text-secondary-foreground lg:col-span-3">
              이 단계는 기획 보드에 캡처가 없어 3단계 「입력 검토」에 나타난 항목으로 구성했습니다.
              실제 화면이 확정되면 교체가 필요합니다.
            </p>
          </div>
        )}

        {/* 3단계 — 입력 검토 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-primary p-4 text-primary-foreground">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Info className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{ship.shipName || "이름 없음"}</p>
                <p className="text-sm">
                  IMO {ship.imo || "—"} &nbsp; Hull {ship.hull || "—"} &nbsp; 선주{" "}
                  {ship.owner || "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ReviewCard title="기본 정보·제원" onEdit={() => setStep(0)}>
                <ReviewGroup label="기본 정보">
                  <ReviewRow k="IMO Number" v={ship.imo} />
                  <ReviewRow k="선주" v={ship.owner} />
                  <ReviewRow k="호선명" v={ship.shipName} />
                  <ReviewRow k="Call Sign" v={ship.callSign} />
                </ReviewGroup>
                <Separator />
                <ReviewGroup label="Ship Yard & Construction">
                  <ReviewRow k="Hull Number" v={ship.hull} />
                  <ReviewRow k="Yard" v={ship.yard} />
                  <ReviewRow k="선급" v={ship.shipClass} />
                  <ReviewRow k="신조 / 개조" v={ship.build} />
                </ReviewGroup>
                <Separator />
                <ReviewGroup label="선박 제원">
                  <ReviewRow k="선종" v={ship.shipType} />
                  <ReviewRow k="LOA / LBP" v={`${ship.loa} / ${ship.lbp}`} />
                  <ReviewRow k="Beam / Depth" v={`${ship.beam} / ${ship.depth}`} />
                  <ReviewRow k="Scantling Draught" v={ship.draught} />
                </ReviewGroup>
                <Separator />
                <ReviewGroup label="시스템 설정">
                  <ReviewRow
                    k="시스템 옵션"
                    v={
                      ship.systemOptions.length === 0
                        ? ""
                        : SYSTEM_OPTIONS.filter((o) => ship.systemOptions.includes(o.name))
                            .map((o) => o.label)
                            .join(", ")
                    }
                  />
                  <ReviewRow k="클라이언트 PC 수량" v={ship.clientPc} />
                </ReviewGroup>
              </ReviewCard>

              <ReviewCard title="장비·엔진" onEdit={() => setStep(1)}>
                <ReviewGroup label="엔진">
                  <ReviewRow k="엔진 수량" v={ship.engineCount} />
                  <ReviewRow k="엔진 타입" v={ship.engineType} />
                </ReviewGroup>
                <Separator />
                <ReviewGroup label="ECDIS & Auto Pilot">
                  <ReviewRow k="ECDIS Maker" v={ship.ecdisMaker} />
                  <ReviewRow k="Auto Pilot Maker" v={ship.autopilotMaker} />
                </ReviewGroup>
                <Separator />
                <ReviewGroup label="AMS & BMS">
                  <ReviewRow k="AMS Maker" v={ship.amsMaker} />
                  <ReviewRow k="BMS Maker" v={ship.bmsMaker} />
                </ReviewGroup>
              </ReviewCard>
            </div>
          </div>
        )}

        <DialogFooter className="items-center sm:justify-between">
          <Button variant="ghost" size="sm" className="text-secondary-foreground" onClick={close}>
            취소
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={done}>
                이전
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={goNext}>다음</Button>
            ) : (
              <Button onClick={() => setDone(true)} disabled={done}>
                호선 생성
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- 공통 조각 */

function FieldText({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {/* layout 관례: 인풋 최대 폭 max-w-sm */}
      <Input
        id={id}
        className="max-w-sm"
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error) || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function FieldNumber({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        className="max-w-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full max-w-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium text-secondary-foreground">{title}</h3>
        <Button variant="ghost" size="sm" className="text-secondary-foreground" onClick={onEdit}>
          수정
        </Button>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

function ReviewGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <p className="text-xs font-semibold uppercase text-secondary-foreground">{label}</p>
      <div className="space-y-1 sm:col-span-2">{children}</div>
    </div>
  );
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-secondary-foreground">{k}</span>
      {v ? (
        <span className="text-sm font-medium">{v}</span>
      ) : (
        <span className="text-sm text-secondary-foreground">— 미입력</span>
      )}
    </div>
  );
}

