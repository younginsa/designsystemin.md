"use client";

// 자가 진단 — 시스템 진단 호선 목록 (① HiNAS 365 메인 레이아웃 + A 리스트)
// 원천: Avikus Design library 「자가 진단」 캡처 (23)(24)
//
// 원본 대조 메모
// - 검색(IMO/호선명/Hull/선사) + 필터 4개(Level·해결 상태·Cloud·Security) + [내보내기▾]
// - 행: 호선 정보(이름→상세, 업데이트 시각, WARNING 칩+원인 부제) / 해결 상태(미확인·문제 없음) /
//   진단 상태(Navigation·Control 행 — 항목 칩: Camera·System·Sensor·Storage·NTP·control·pod)
// - 행 클릭 → 우측 시트: 현재 진단 상태 · 제품 정보 · 진단 상태 히스토리(페이지네이션)
//   · 해결 상태 히스토리 (캡처 (24))
// - 칩 톤: 정상=success · 이상=destructive · 주의=warning(DES-206 해소) · 무데이터=muted
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  ExternalLink,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ds/ui/ui/select";
import { DetailPanel } from "@ds/ui/ui/detail-panel";
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
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

import { FilterBar, type FilterDef, type FilterValues } from "@ds/ui/ui/filter-bar";

const BASE = "/generated/hinas365";

// 진단 항목 셀 톤 — 고정 6슬롯 3×2 그리드, 아웃라인 없이 배경 틴트 + 텍스트 동색(색 쌍)
// 정상 success / 이상·주의 destructive(칩은 빨간 글자 통일) / 무데이터 muted
type ItemTone = "ok" | "bad" | "warn" | "none";
// 칩은 면적이 작아 위계 전달이 약함 — warn도 빨간 글자로 통일(2026-08-24 확정).
// 주의/에러 위계는 행의 상태 라벨(도트+텍스트)이 전담한다.
const TONE_CLS: Record<ItemTone, string> = {
  ok: "bg-success/12 text-success",
  bad: "bg-destructive/12 text-destructive",
  warn: "bg-destructive/12 text-destructive",
  none: "bg-muted text-secondary-foreground",
};

// 점검 시각은 '지금으로부터 N분 전' 오프셋으로 저장 — 절대·상대 표기를 렌더 시점에
// 함께 도출해 두 표기가 항상 일치한다(시각 스펙용 목데이터)
type ProductRow = { product: string; atMin: number | null; items: [string, ItemTone][] };

const pad2 = (n: number) => String(n).padStart(2, "0");
const atDate = (min: number) => new Date(Date.now() - min * 60_000);
const fmtAbs = (min: number) => {
  const d = atDate(min);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
// 상대 표기 3단계(피그마 205-12407): N분 전 / N시간 M분 전 / N일 M시간 전
const fmtRel = (min: number) => {
  if (min < 60) return `${min}분 전`;
  if (min < 1440) return `${Math.floor(min / 60)}시간 ${min % 60}분 전`;
  return `${Math.floor(min / 1440)}일 ${Math.floor((min % 1440) / 60)}시간 전`;
};

// 상태 3종 — WARNING(이상 있음) / UNREAD(미확인) / NORMAL. CAUTION은 폐기(2026-08-24 확정).
// 위계는 원인이 가른다(제품 확인: Camera 이상 = 최심각): Camera 이상만 라벨 글자까지 빨강,
// 그 외 장비 이상은 도트만 빨강 + 기본 글자. 원인 부제는 이상 항목에서 자동 산출.
// 대시보드 진단 결과 클릭 → ?status= 쿼리로 이 화면 필터와 연동
type ShipStatus = "WARNING" | "UNREAD" | "NORMAL";

type ShipDiag = {
  name: string;
  updatedAt: string;
  ago: string;
  status: ShipStatus;
  /** 활성 서비스 — 활성 컬럼 배지 + 활성 필터(AND)의 원천 */
  active: ("Cloud" | "Security")[];
  products: ProductRow[];
};

// 산출 — 상태 위계·원인 부제를 이상 항목(bad·warn)에서 계산한다(하드코딩 아님)
const shipIssues = (s: ShipDiag): string[] => {
  const labels: string[] = [];
  for (const p of s.products)
    for (const [label, tone] of p.items)
      if ((tone === "bad" || tone === "warn") && !labels.includes(label)) labels.push(label);
  return labels;
};
const isCameraWarning = (s: ShipDiag) => shipIssues(s).includes("Camera");
// 상태 컬럼·필터·패널 드롭다운이 공유하는 산출 상태 — Unread는 상태가 아니라 확인 여부(호선정보 도트 담당)
const diagStatusOf = (s: ShipDiag): "WARNING_CAMERA" | "WARNING" | "NORMAL" =>
  shipIssues(s).length === 0 ? "NORMAL" : isCameraWarning(s) ? "WARNING_CAMERA" : "WARNING";

const NAV_EMPTY: [string, ItemTone][] = [
  ["Camera", "none"],
  ["System", "none"],
  ["Sensor", "none"],
  ["Storage", "none"],
  ["NTP", "none"],
  ["pod", "none"],
];

const SHIPS: ShipDiag[] = [
  {
    name: "Anduril_11F_Test_01",
    updatedAt: "2026-07-26 04:23",
    ago: "2일 11시간 전",
    status: "UNREAD",
    active: ["Cloud", "Security"],
    products: [
      { product: "Navigation", atMin: null, items: NAV_EMPTY },
      {
        product: "Control",
        atMin: 32,
        items: [
          ["System", "ok"],
          ["Sensor", "none"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["control", "none"],
          ["pod", "bad"],
        ],
      },
    ],
  },
  {
    name: "Anduril_Alpha",
    updatedAt: "2026-07-28 15:33",
    ago: "8분 전",
    status: "UNREAD",
    active: ["Security"],
    products: [
      { product: "Navigation", atMin: null, items: NAV_EMPTY },
      {
        product: "Control",
        atMin: 63,
        items: [
          ["System", "ok"],
          ["Sensor", "bad"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["control", "none"],
          ["pod", "bad"],
        ],
      },
      {
        product: "SVM",
        atMin: 3125,
        items: [
          ["Camera", "bad"],
          ["System", "ok"],
          ["Sensor", "ok"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["pod", "ok"],
        ],
      },
    ],
  },
  {
    name: "DEV_CONTROL_ENC",
    updatedAt: "2026-07-28 15:33",
    ago: "8분 전",
    status: "WARNING",
    active: [],
    products: [
      {
        product: "Control",
        atMin: 95,
        items: [
          ["System", "ok"],
          ["Sensor", "bad"],
          ["Storage", "ok"],
          ["NTP", "none"],
          ["control", "bad"],
          ["pod", "bad"],
        ],
      },
      // Camera 이상 예시 — 최심각(라벨 글자까지 빨강) 표기 확인용 샘플
      {
        product: "SVM",
        atMin: 3125,
        items: [
          ["Camera", "bad"],
          ["System", "ok"],
          ["Sensor", "ok"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["pod", "ok"],
        ],
      },
    ],
  },
  {
    name: "DEV_CONTROL_TEST",
    updatedAt: "2026-07-28 10:33",
    ago: "5시간 전",
    status: "WARNING",
    active: [],
    products: [
      { product: "Navigation", atMin: null, items: NAV_EMPTY },
      {
        product: "Control",
        atMin: 312,
        items: [
          ["System", "none"],
          ["Sensor", "bad"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["control", "bad"],
          ["pod", "warn"],
        ],
      },
    ],
  },
  {
    name: "Anduril_HQ_Main",
    updatedAt: "2026-07-02 03:22",
    ago: "26일 12시간 전",
    status: "NORMAL",
    active: ["Cloud", "Security"],
    products: [
      { product: "Navigation", atMin: null, items: NAV_EMPTY },
      {
        product: "Control",
        atMin: 43980,
        items: [
          ["System", "ok"],
          ["Sensor", "ok"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["control", "ok"],
          ["pod", "ok"],
        ],
      },
      {
        product: "SVM",
        atMin: 43980,
        items: [
          ["Camera", "ok"],
          ["System", "ok"],
          ["Sensor", "ok"],
          ["Storage", "ok"],
          ["NTP", "ok"],
          ["pod", "ok"],
        ],
      },
    ],
  },
];

// 제품별 버전 mock — 시트 '제품 정보'는 '현재 진단 상태'와 같은 제품 목록에서 파생(개수 일치)
const PRODUCT_VERSIONS: Record<string, [string, string]> = {
  Navigation: ["v3.99.6-anduril", "v3.99.9-anduril"],
  Control: ["v3.99.17-anduril", "v3.99.9-anduril"],
  SVM: ["v2.0.0-rc.4", "v3.99.9-anduril"],
};

// 해결 상태 히스토리 초기값 — Normal 전환 확정 시 맨 위에 실시간 행이 추가된다(시연용)
const RESOLUTION_HISTORY: [string, string, string, string][] = [
  ["2026-07-27 05:43", "Seonghun Jung", "문제 없음 -> 미확인", "진단 상태 변경이 감지되어 해결 상태를 미확인으로 초기화했습니다."],
  ["2026-07-27 05:33", "Jiyoung Yoon", "미확인 -> 문제 없음", "진단 상태가 정상으로 복구되어 문제없음으로 자동 변경되었습니다."],
  ["2026-07-14 22:53", "Seonghun Jung", "문제 없음 -> 미확인", "진단 상태 변경이 감지되어 해결 상태를 미확인으로 초기화했습니다."],
  ["2026-07-12 09:18", "Jiyoung Yoon", "미확인 -> 문제 없음", "현장 확인 결과 이상 없음으로 처리했습니다."],
  ["2026-07-03 17:02", "Seonghun Jung", "문제 없음 -> 미확인", "진단 상태 변경이 감지되어 해결 상태를 미확인으로 초기화했습니다."],
  ["2026-06-28 11:40", "Jiyoung Yoon", "미확인 -> 문제 없음", "센서 재부팅 후 정상 확인."],
  ["2026-06-20 08:15", "Seonghun Jung", "문제 없음 -> 미확인", "진단 상태 변경이 감지되어 해결 상태를 미확인으로 초기화했습니다."],
];
const RES_PAGE_SIZE = 5;

const DIAG_HISTORY: [string, string, string][] = [
  ["2026-07-26 04:23", "System", "이상 -> 정상"],
  ["2026-07-26 04:13", "System", "정상 -> 이상"],
  ["2026-07-26 04:03", "System", "이상 -> 정상"],
  ["2026-07-26 02:13", "System", "정상 -> 이상"],
  ["2026-07-26 01:53", "System", "이상 -> 정상"],
];

const STATUS_OPTIONS = ["전체", "Camera 이상", "장비 이상", "Normal"];
// header-filter 시스템(FilterBar) 정의 — 자가 진단은 4종 전부 기본 노출(디자이너 확정)
const DIAG_FILTERS: FilterDef[] = [
  { name: "status", label: "상태", options: STATUS_OPTIONS.filter((o) => o !== "전체"), base: true },
  // Cloud·Security 병합(2026-08-25 확정) — 다중 체크, 복수 선택 = AND(둘 다 활성인 호선만)
  { name: "active", label: "활성", options: ["Cloud", "Security"], base: true, multi: true },
  { name: "resolution", label: "해결 상태", options: ["미확인", "문제 없음"], base: true },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function DiagnosticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter(); // 현재 진단 상태 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  // 푸터 페이지네이션 문법(2026-08-26 전역 규칙) — 건수·페이지당은 하단
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);
  const [keyword, setKeyword] = React.useState("");
  const [selected, setSelected] = React.useState<ShipDiag | null>(null);
  // 대시보드에서 ?status=Camera 이상 등으로 진입하면 필터가 걸린 채로 열린다
  const [filterValues, setFilterValues] = React.useState<FilterValues>(() => {
    const q = searchParams.get("status");
    return q && q !== "전체" ? { status: q } : {};
  });
  const statusFilter = filterValues.status ?? "전체";

  // ── 시트 상태 드롭다운 (Warning·Camera / Warning·장비 / Normal) ──
  // Normal 전환 시 알람 항목 리스트 확인 모달 → 확정하면 알람 셀이 전부 정상(초록)으로
  type PanelStatus = "WARNING_CAMERA" | "WARNING" | "NORMAL";
  const [panelStatus, setPanelStatus] = React.useState<PanelStatus>("WARNING");
  const [normalized, setNormalized] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  // 해결 상태 히스토리 — Normal 전환 확정 시 실시간으로 행이 추가된다
  const [resolutionLog, setResolutionLog] = React.useState(RESOLUTION_HISTORY);
  // 해결 상태 히스토리 페이지네이션 + 진단 히스토리 시간 정렬 (2026-08-25)
  const [resPage, setResPage] = React.useState(1);
  // 진단 히스토리 4컬럼 정렬 — 테스트호선 문법(비활성 ChevronsUpDown · 활성 방향 화살표)
  const [histField, setHistField] = React.useState<"time" | "product" | "item" | "change">("time");
  const [histAsc, setHistAsc] = React.useState(false);
  const histSortBy = (f: typeof histField) => {
    if (histField === f) setHistAsc((a) => !a);
    else {
      setHistField(f);
      setHistAsc(false);
    }
  };
  React.useEffect(() => {
    if (selected) {
      setPanelStatus(diagStatusOf(selected)); // 상태 컬럼과 같은 산출 원천
      setNormalized(false);
      setResolutionLog(RESOLUTION_HISTORY);
    }
  }, [selected]);
  // 제품별 알람 그룹 — 모달에 "제품 - 항목1, 항목2" 형태로 열거
  const alarmGroups = selected
    ? selected.products
        .map((p) => ({
          product: p.product,
          labels: p.items
            .filter(([, tone]) => tone === "bad" || tone === "warn")
            .map(([label]) => label),
        }))
        .filter((g) => g.labels.length > 0)
    : [];
  const handlePanelStatusChange = (v: string) => {
    if (v === "NORMAL" && !normalized && alarmGroups.length > 0) setConfirmOpen(true);
    else setPanelStatus(v as PanelStatus);
  };
  // 정상 확정 후에는 알람 톤을 정상 톤으로 치환해 렌더
  const paneTone = (tone: ItemTone): ItemTone =>
    normalized && (tone === "bad" || tone === "warn") ? "ok" : tone;

  // 활성 필터 — 다중 체크는 AND: 체크한 서비스가 전부 활성인 호선만
  const activeFilter = filterValues.active ? filterValues.active.split(", ") : [];
  const rows = (view === "empty" ? [] : SHIPS).filter(
    (s) =>
      (statusFilter === "전체" ||
        (statusFilter === "Camera 이상" && diagStatusOf(s) === "WARNING_CAMERA") ||
        (statusFilter === "장비 이상" && diagStatusOf(s) === "WARNING") ||
        (statusFilter === "Normal" && diagStatusOf(s) === "NORMAL")) &&
      activeFilter.every((a) => (s.active as string[]).includes(a)),
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── 페이지 헤더 ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            시스템 진단 호선
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="설명">
                  <Info className="size-4 text-secondary-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>호선별 자가 진단 결과와 해결 상태를 관리합니다.</TooltipContent>
            </Tooltip>
          </h1>
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
        </div>

        {/* ── 툴바 — header-filter 시스템(FilterBar 시안) ── */}
        <FilterBar
          searchPlaceholder="IMO · 호선명 · Hull · 선사 검색"
          keyword={keyword}
          onKeyword={setKeyword}
          filters={DIAG_FILTERS}
          values={filterValues}
          onChange={(name, v) =>
            setFilterValues((prev) => ({ ...prev, [name]: v }))
          }
          actions={
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
            <p className="text-sm text-secondary-foreground">진단 현황을 불러오는 중입니다…</p>
          </div>
        )}

        {view === "error" && (
          <ErrorState
            title="진단 현황을 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {view === "empty" && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>진단 데이터가 없습니다.</EmptyTitle>
              <EmptyDescription>호선이 데이터를 보내오면 진단 결과가 표시됩니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {/* 2026-08-19 피그마(159-2296) 반영 — 제품별 컬럼 테이블로 재편:
            호선 정보 / 해결 상태(Level 칩 — 도트+텍스트 색 쌍, data-status 규칙) /
            Navigation / Control / SVM. 제품 미설치 칸은 "-".
            상태 위계: Camera 이상만 글자까지 빨강(2026-08-24, CAUTION 폐기). */}
        {view === "default" && (
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">활성</TableHead>
                <TableHead>호선 정보</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>Navigation</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>SVM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const nav = s.products.find((p) => p.product === "Navigation");
                const ctl = s.products.find((p) => p.product === "Control");
                const svm = s.products.find((p) => p.product === "SVM");
                const unread = s.status === "UNREAD";
                return (
                  // 배경은 전 행 화이트 통일 — 미확인 강조는 볼드 + Unread 필이 담당
                  <TableRow
                    key={s.name}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelected(s)}
                  >
                    {/* 활성 컬럼 — 켜진 서비스만 모노 배지로, 없으면 공백 (피그마 205-12407) */}
                    <TableCell className="py-4 align-top">
                      {s.active.length > 0 && (
                        <div className="flex flex-col items-start gap-1">
                          {s.active.map((a) => (
                            <Badge key={a} variant="outline" className="rounded-sm font-mono font-normal">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-72 py-4 align-top">
                      <button
                        type="button"
                        className={
                          // 표 주 텍스트 문법(text-sm) — 16px 단독 이탈 교정(2026-08-25)
                          "flex items-center gap-1.5 text-sm hover:underline " +
                          (unread ? "font-bold" : "font-medium")
                        }
                        onClick={() => setSelected(s)}
                      >
                        {/* 이메일식 미확인 도트 — 제목 앞 (info 토큰) */}
                        {unread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                        {s.name} <ArrowRight className="size-4 text-secondary-foreground" />
                      </button>
                      {/* 보조 정보 — text-xs (DS: 보조 정보에만 허용) */}
                      <p className="mt-1 truncate text-xs">
                        <span className="text-secondary-foreground">호선명</span> {s.name}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      {/* 상태 = 산출 진단 상태만 — 패널 상단 드롭다운과 동일 원천.
                          Unread 표기는 호선정보의 도트+볼드가 전담(2026-08-25 확정) */}
                      <StatusPill
                        status={diagStatusOf(s) === "NORMAL" ? "NORMAL" : "WARNING"}
                        camera={isCameraWarning(s)}
                        cause={
                          diagStatusOf(s) !== "NORMAL"
                            ? shipIssues(s).join("·") + " 이상"
                            : undefined
                        }
                      />
                    </TableCell>
                    <DiagProductCell row={nav} />
                    <DiagProductCell row={ctl} />
                    <DiagProductCell row={svm} />
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* ── 푸터 — 건수는 하단 규칙(2026-08-26 전역) ── */}
        {view === "default" && (
          <RowsPerPage value={pageSize} onChange={setPageSize} summary={`전체 ${rows.length}척`} />
        )}
      </div>

      {/* ── 상세 패널 — DetailPanel 프리셋(4xl 상세형, 채택 51종째) ── */}
      <DetailPanel
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        size="4xl"
        control={
          selected && (
            /* '호선 정보' 라벨 자리 → 상태 선택 드롭다운. Normal 전환 시 확인 모달 */
            <Select value={panelStatus} onValueChange={handlePanelStatusChange}>
              {/* 전체 텍스트+도트가 잘리지 않게 — 우측 여백 충분(2026-08-25) */}
              <SelectTrigger size="sm" className="w-48" aria-label="상태 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* 상태 도트 — 목록 표기와 동일 위계: Camera 이상만 글자까지 빨강 */}
                <SelectItem value="WARNING_CAMERA">
                  <span className="size-2 rounded-full bg-destructive" />{" "}
                  <span className="text-destructive">Warning · Camera</span>
                </SelectItem>
                <SelectItem value="WARNING">
                  <span className="size-2 rounded-full bg-destructive" /> Warning · 장비
                </SelectItem>
                <SelectItem value="NORMAL">
                  <span className="size-2 rounded-full bg-success" /> Normal
                </SelectItem>
              </SelectContent>
            </Select>
          )
        }
        title={selected?.name}
        titleLink={
          <Button asChild variant="ghost" size="sm" className="text-secondary-foreground">
            <Link href={`${BASE}/diagnostics/detail`}>
              호선 상세 페이지 <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        }
        meta={
          selected && (
            <>
              {/* 라벨 = muted 칩 + 값 (피그마 205-12083 — 계약호선 헤더와 공통 문법) */}
              <span className="flex items-center gap-1.5">
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs">Ship Name</span>
                <span className="text-foreground">{selected.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs">Hull Number</span>
                <span className="text-foreground">{selected.name}</span>
              </span>
            </>
          )
        }
        utils={
          <Button variant="ghost" size="sm">
            <RefreshCw className="size-4" /> 새로고침
          </Button>
        }
      >
        {selected && (
          <>
                {/* 현재 진단 상태 — 타이틀 + 표준 표 (다른 섹션과 동일 구조) */}
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-secondary-foreground">현재 진단 상태</h3>
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow>
                        <TableHead>제품</TableHead>
                        <TableHead>진단 시각</TableHead>
                        <TableHead>항목</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.products.map((p) => (
                        // 행 = 클릭 가능(→와 같은 목적지) → hover 잉크 (A 문법)
                        <TableRow
                          key={p.product}
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => router.push(`${BASE}/diagnostics/detail`)}
                        >
                          <TableCell className="font-medium">{p.product}</TableCell>
                          <TableCell
                            className="font-mono text-xs text-secondary-foreground"
                            suppressHydrationWarning
                          >
                            {p.atMin !== null ? `${fmtAbs(p.atMin)} (${fmtRel(p.atMin)})` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {p.items.map(([label, tone]) => (
                                <span
                                  key={label}
                                  className={
                                    "flex h-7 w-16 items-center justify-center truncate rounded-sm text-xs " +
                                    TONE_CLS[paneTone(tone)]
                                  }
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              aria-label={`${p.product} 상세`}
                            >
                              <Link href={`${BASE}/diagnostics/detail`}>
                                <ArrowRight className="size-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>

                {/* 제품 정보 — 표준 표(외곽선+헤더 배경), 행은 현재 진단 상태와 같은 소스 */}
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-secondary-foreground">제품 정보</h3>
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow>
                        <TableHead>제품</TableHead>
                        <TableHead>제품 버전</TableHead>
                        <TableHead>공통 버전</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.products.map((p) => {
                        const [pv, cv] = PRODUCT_VERSIONS[p.product] ?? ["-", "-"];
                        return (
                          <TableRow key={p.product}>
                            <TableCell>{p.product}</TableCell>
                            <TableCell className="font-mono text-sm">{pv}</TableCell>
                            <TableCell className="font-mono text-sm">{cv}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </section>

                {/* 진단 상태 히스토리 — 표준 표, 변경은 화살표 표기 + 결과에만 색 */}
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-secondary-foreground">진단 상태 히스토리</h3>
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow>
                        {/* 4컬럼 정렬 — 테스트호선 문법(HistSortHead) */}
                        <TableHead>
                          <HistSortHead label="시간" field="time" cur={histField} asc={histAsc} onSort={histSortBy} />
                        </TableHead>
                        <TableHead>
                          <HistSortHead label="제품" field="product" cur={histField} asc={histAsc} onSort={histSortBy} />
                        </TableHead>
                        <TableHead>
                          <HistSortHead label="항목" field="item" cur={histField} asc={histAsc} onSort={histSortBy} />
                        </TableHead>
                        <TableHead>
                          <HistSortHead label="변경" field="change" cur={histField} asc={histAsc} onSort={histSortBy} />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...DIAG_HISTORY]
                        .sort((a, b) => {
                          const i = { time: 0, product: -1, item: 1, change: 2 }[histField];
                          const c = i < 0 ? 0 : a[i].localeCompare(b[i]); // 제품은 단일값 — 순서 유지
                          return histAsc ? c : -c;
                        })
                        .map(([time, item, change]) => {
                        const [from, to] = change.split(" -> ");
                        return (
                          <TableRow key={time}>
                            <TableCell className="font-mono text-sm">{time}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono font-normal">
                                CONTROL
                              </Badge>
                            </TableCell>
                            <TableCell>{item}</TableCell>
                            <TableCell>
                              {from} <span className="text-secondary-foreground">→</span>{" "}
                              <span
                                className={to === "정상" ? "text-success" : "text-destructive"}
                              >
                                {to}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end pt-1">
                    <Pagination className="mx-0 w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#" isActive>
                            1
                          </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#">2</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#">53</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext href="#" />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </section>

                {/* 해결 상태 히스토리 — 시간·변경자 폭 축소, 변경은 화살표에서 줄바꿈, 메모 최대 폭 */}
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-secondary-foreground">해결 상태 히스토리</h3>
                  {/* 참고 스샷(운영 패널) 구조 — 시간 작은 글씨·옅은 색 한 줄, 변경 한 줄, 메모 최대 폭 */}
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-36">시간</TableHead>
                        <TableHead className="w-24">변경자</TableHead>
                        <TableHead className="w-40">변경</TableHead>
                        <TableHead>메모</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolutionLog
                        .slice((resPage - 1) * RES_PAGE_SIZE, resPage * RES_PAGE_SIZE)
                        .map(([time, actor, change, memo], i) => {
                        const [rsFrom, rsTo] = change.split(" -> ");
                        return (
                          <TableRow key={time + i}>
                            <TableCell className="font-mono text-xs text-secondary-foreground">
                              {time}
                            </TableCell>
                            <TableCell>{actor}</TableCell>
                            <TableCell className="whitespace-normal">
                              {rsFrom} <span className="whitespace-nowrap">→ {rsTo}</span>
                            </TableCell>
                            <TableCell className="whitespace-normal text-secondary-foreground">
                              {memo}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* 해결 히스토리 페이지네이션 — 실동작 (2026-08-25) */}
                  <div className="flex justify-end pt-1">
                    <Pagination className="mx-0 w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setResPage((p) => Math.max(1, p - 1));
                            }}
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: Math.ceil(resolutionLog.length / RES_PAGE_SIZE) },
                          (_, i) => i + 1,
                        ).map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === resPage}
                              onClick={(e) => {
                                e.preventDefault();
                                setResPage(p);
                              }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setResPage((p) =>
                                Math.min(Math.ceil(resolutionLog.length / RES_PAGE_SIZE), p + 1),
                              );
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </section>
          </>
        )}
      </DetailPanel>

      {/* Normal 전환 확인 모달 — 알람 항목 리스트 + 정상 전환 안내 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>상태를 Normal로 변경할까요?</DialogTitle>
            <DialogDescription>
              아래 항목이 모두 정상 작동으로 상태가 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md bg-muted p-3 text-sm">
            {alarmGroups.map((g) => (
              <li key={g.product} className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-destructive" />
                {g.product} - {g.labels.join(", ")}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
                const fromLabel = panelStatus.charAt(0) + panelStatus.slice(1).toLowerCase();
                const count = alarmGroups.reduce((n, g) => n + g.labels.length, 0);
                setResolutionLog((prev) => [
                  [
                    stamp,
                    "Jiyoung Yoon",
                    `${fromLabel} -> Normal`,
                    `알람 항목 ${count}건이 정상 작동으로 확인되어 상태를 변경했습니다.`,
                  ],
                  ...prev,
                ]);
                setPanelStatus("NORMAL");
                setNormalized(true);
                setConfirmOpen(false);
              }}
            >
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// 상태 표기 — 도트(상태색) + 텍스트 · text-sm. CAUTION 폐기(2026-08-24):
// 위계는 색이 가른다 — Camera 이상(최심각)만 라벨 글자까지 빨강, 그 외 Warning은 도트만.
// 원인 부제(이상 항목 요약)를 라벨 아래 줄에 표기.
// 히스토리 정렬 헤더 — 테스트호선 SortHeader와 같은 문법
function HistSortHead({
  label,
  field,
  cur,
  asc,
  onSort,
}: {
  label: string;
  field: "time" | "product" | "item" | "change";
  cur: string;
  asc: boolean;
  onSort: (f: "time" | "product" | "item" | "change") => void;
}) {
  const Icon = cur === field ? (asc ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <Button variant="ghost" size="sm" className="-ml-2" onClick={() => onSort(field)}>
      {label} <Icon className="size-3.5" />
    </Button>
  );
}

function StatusPill({
  status,
  camera,
  cause,
}: {
  status: ShipStatus;
  camera?: boolean;
  cause?: string;
}) {
  if (status === "WARNING") {
    return (
      <span className="inline-flex flex-col gap-0.5 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-destructive" />
          <span className={camera ? "text-destructive" : undefined}>WARNING</span>
        </span>
        {cause && <span className="pl-3.5 text-xs text-secondary-foreground">{cause}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="size-2 rounded-full bg-success" /> Normal
    </span>
  );
}

// 제품 컬럼 셀 — 항목 칩 먼저, 아래 셋째 줄에 수집 시각 ✓ (작고 연하게). 미설치면 "-"
function DiagProductCell({ row }: { row: ProductRow | undefined }) {
  if (!row) {
    return <TableCell className="py-4 align-top text-secondary-foreground">-</TableCell>;
  }
  return (
    <TableCell className="py-4 align-top">
      {/* 고정 6슬롯 — 3×2 그리드, 같은 위치 = 같은 기능 */}
      <div className="grid w-fit grid-cols-3 gap-1">
        {row.items.map(([label, tone]) => (
          <span
            key={label}
            className={
              "flex h-7 w-16 items-center justify-center truncate rounded-sm text-xs " +
              TONE_CLS[tone]
            }
          >
            {label}
          </span>
        ))}
      </div>
      {/* 점검 시각 — ✓ 아이콘 대신 (N분 전) 상대 표기 (피그마 205-12407 · 분 단위는 자가진단 전용) */}
      {row.atMin !== null && (
        <p className="pt-4 text-xs text-secondary-foreground" suppressHydrationWarning>
          {fmtAbs(row.atMin)} <span>({fmtRel(row.atMin)})</span>
        </p>
      )}
    </TableCell>
  );
}

