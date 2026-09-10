"use client";

// 컴포넌트 프리뷰 레지스트리 — 단일 원천.
// 두 소비자가 같은 노드를 그린다:
//   ① 허브(/hub) 채택 카드 — FitScale로 카드 프레임에 맞춰 실물 렌더 (사진 아님)
//   ② /shadcn-preview 캡처 페이지 — 원래의 #pv-<slug> 섹션 (헤드리스 캡처·QA용)
// 원본: 구 shadcn-preview/page.tsx의 인라인 섹션들을 이식(2026-08-26 허브 실렌더 전환).
// key = 채택 카드 슬러그(data-comp). captureId가 있으면 캡처 페이지 id만 그 값을 쓴다(구 캡처 스크립트 호환).
// hubOnly = 캡처 페이지 순서에 없던 신규 항목(오버레이 iframe 등).

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@ds/ui/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ds/ui/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ds/ui/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@ds/ui/ui/alert";
import { ChartContainer, type ChartConfig } from "@ds/ui/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ds/ui/ui/empty";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
// 스파이크(2026-09-07) — 버튼 6개 어휘는 이 파일이 아니라 FE 쪽 스토리 파일에서 그린다.
// CSF 형식이지만 @storybook/* 를 안 쓰는 순수 객체라 새 의존성이 붙지 않는다.
import * as buttonStories from "@ds/ui/ui/button.stories";
import * as filterBarStories from "@ds/ui/ui/filter-bar.stories";
import * as inputStories from "@ds/ui/ui/input.stories";
import * as textareaStories from "@ds/ui/ui/textarea.stories";
import * as checkboxStories from "@ds/ui/ui/checkbox.stories";
import * as radioGroupStories from "@ds/ui/ui/radio-group.stories";
import * as switchStories from "@ds/ui/ui/switch.stories";
import * as selectStories from "@ds/ui/ui/select.stories";
import * as commandStories from "@ds/ui/ui/command.stories";
import * as toggleGroupStories from "@ds/ui/ui/toggle-group.stories";
import * as inputGroupStories from "@ds/ui/ui/input-group.stories";
import * as calendarStories from "@ds/ui/ui/calendar.stories";
import * as iconSelectStories from "@ds/ui/ui/icon-select.stories";
import * as badgeStories from "@ds/ui/ui/badge.stories";
import * as tableStories from "@ds/ui/ui/table.stories";
import * as paginationStories from "@ds/ui/ui/pagination.stories";
import * as progressStories from "@ds/ui/ui/progress.stories";
import * as cardStories from "@ds/ui/ui/card.stories";
import * as itemStories from "@ds/ui/ui/item.stories";
import * as accordionStories from "@ds/ui/ui/accordion.stories";
import * as collapsibleStories from "@ds/ui/ui/collapsible.stories";
import * as tabsStories from "@ds/ui/ui/tabs.stories";
import * as chartStories from "@ds/ui/ui/chart.stories";
import * as popoverStories from "@ds/ui/ui/popover.stories";
import * as tooltipStories from "@ds/ui/ui/tooltip.stories";
import * as sonnerStories from "@ds/ui/ui/sonner.stories";
import * as alertStories from "@ds/ui/ui/alert.stories";
import * as errorStateStories from "@ds/ui/ui/error-state.stories";
import * as emptyStories from "@ds/ui/ui/empty.stories";
import * as skeletonStories from "@ds/ui/ui/skeleton.stories";
import * as errorConsoleStories from "@ds/ui/ui/error-console.stories";
import * as statusBadgeStories from "@ds/ui/ui/status-badge.stories";
import * as sidebarStories from "@ds/ui/ui/sidebar.stories";
import * as breadcrumbStories from "@ds/ui/ui/breadcrumb.stories";
import * as rowsPerPageStories from "@ds/ui/ui/rows-per-page.stories";
import * as timelineStories from "@ds/ui/ui/timeline.stories";
import { Card, CardContent, CardDescription, CardTitle } from "@ds/ui/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ds/ui/ui/collapsible";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@ds/ui/ui/item";
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
import { Stepper, StepperItem } from "@ds/ui/ui/stepper";
import { Tabs, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Timeline, TimelineItem, TimelineMeta, TimelineTitle } from "@ds/ui/ui/timeline";
import { ButtonGroup } from "@ds/ui/ui/button-group";
import { Calendar } from "@ds/ui/ui/calendar";
import { Checkbox } from "@ds/ui/ui/checkbox";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Field, FieldLabel } from "@ds/ui/ui/field";
import { IconSelect } from "@ds/ui/ui/icon-select";
import { Input } from "@ds/ui/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";
import { Label } from "@ds/ui/ui/label";
import { RadioGroup, RadioGroupItem } from "@ds/ui/ui/radio-group";
import { RowsPerPage } from "@ds/ui/ui/rows-per-page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ds/ui/ui/select";
import { Separator } from "@ds/ui/ui/separator";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import { Spinner } from "@ds/ui/ui/spinner";
import { Switch } from "@ds/ui/ui/switch";
import { Textarea } from "@ds/ui/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileText,
  Globe,
  Inbox,
  Info,
  KeyRound,
  LayoutDashboard,
  Maximize2,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Ship,
  Star,
  Trash2,
  X,
} from "lucide-react";

/* ── 공용 데모 데이터·조각 ─────────────────────────────────────────── */

const lineData = [
  { d: "07-21", v: 24 }, { d: "07-22", v: 31 }, { d: "07-23", v: 28 },
  { d: "07-24", v: 42 }, { d: "07-25", v: 38 }, { d: "07-26", v: 47 }, { d: "07-27", v: 44 },
];
const lineConfig = { v: { label: "CPU", color: "var(--foreground)" } } satisfies ChartConfig;
const pieData = [
  { name: "v3.2.1", value: 37.5, fill: "var(--foreground)" },
  { name: "v3.2.0", value: 29.2, fill: "var(--muted-foreground)" },
  { name: "v3.1.8", value: 18.8, fill: "var(--border)" },
  { name: "기타", value: 14.5, fill: "var(--accent)" },
];
const pieConfig = {} satisfies ChartConfig;

function NavGroups() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>운영</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <LayoutDashboard />
                <span>대시보드</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Activity />
                <span>자가 진단</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>호선 관리</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Ship />
                <span>납품 호선</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <RefreshCw />
                <span>업데이트</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

function DemoBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">테스트 호선</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">SHIP_A</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>업데이트</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function RowsPerPageDemo() {
  const [v, setV] = React.useState(15);
  return (
    <RowsPerPage
      value={v}
      onChange={setV}
      summary={<>전체 247척 (<span className="text-destructive">●</span> 미입력 38척)</>}
    />
  );
}

/* ── 레지스트리 타입 ───────────────────────────────────────────────── */

export type Pv = {
  /** 섹션 래퍼 클래스 (캡처 페이지 원본 그대로) */
  className: string;
  style?: React.CSSProperties;
  node: React.ReactNode;
  /** 캡처 페이지 섹션 id가 슬러그와 다를 때 (#pv-data-timeline 등 구 스크립트 호환) */
  captureId?: string;
  /** 캡처 페이지 순서에 없던 신규 — 허브 카드에서만 쓴다 */
  hubOnly?: boolean;
};

const BOX = "border border-border bg-background";
const strip: Pv["style"] = { width: 560, height: 120 };

/* ── 스토리 → 카드 (2026-09-07 스파이크) ──────────────────────────────
 * 액자(className·style)는 365가 계속 소유한다 — 스토리에는 액자 개념이 없다.
 * 스토리는 "무엇을 그릴지"만 주고, "어느 크기 액자에 넣을지"는 여기서 정한다.
 * 게이트: 카드 목록 자체가 approved.json 에서 나오므로, 미채택 어휘를 적은 스토리는
 * 조회조차 되지 않는다(필터로 거르는 게 아니라 구조로 닫힌다). */

type Story = {
  args?: Record<string, unknown>;
  parameters?: { vocab?: string };
  render?: () => React.ReactNode;
};

/** 한 어휘 슬러그에 속한 스토리를 선언 순서대로 모아 한 카드로 그린다.
 *  순서 주의 — Object.keys(모듈)은 알파벳 순이라 선언 순서가 사라진다.
 *  스토리 파일의 __namedExportsOrder(Storybook이 컴파일러로 만드는 것과 같은 배열)를 우선한다. */
function fromStories(slug: string, mod: Record<string, unknown>, frame: Omit<Pv, "node">): Pv {
  const Comp = (mod.default as { component: React.ElementType }).component;
  const names = (mod.__namedExportsOrder as string[] | undefined) ?? Object.keys(mod);
  const picked = names
    .map((k) => [k, mod[k] as Story] as [string, Story])
    .filter(([k, v]) => k !== "default" && !!v && v.parameters?.vocab === slug);
  return {
    ...frame,
    node: (
      <>
        {picked.map(([name, s]) =>
          s.render
            ? <React.Fragment key={name}>{s.render()}</React.Fragment>
            : <Comp key={name} {...s.args} />,
        )}
      </>
    ),
  };
}

const BTN_FRAME: Omit<Pv, "node"> = { className: "flex items-center justify-center gap-3 " + BOX, style: strip };

/* ── 레지스트리 ────────────────────────────────────────────────────── */

export const PREVIEWS: Record<string, Pv> = {
  // 배치 6 — app-shell · sidebar-nav · breadcrumb · rows-per-page · timeline 은 스토리 원문(2026-09-10)
  "app-shell": fromStories("app-shell", sidebarStories, { className: "w-fit " + BOX }),
  "sidebar-nav": fromStories("sidebar-nav", sidebarStories, { className: "w-fit " + BOX }),
  "page-header": {
    className: "flex items-center justify-between " + BOX + " px-6",
    style: { width: 960, height: 76 },
    node: (
      <>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">SHIP_A</h1>
          <Star className="size-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <KeyRound /> 비밀번호
          </Button>
          <Button variant="outline" size="sm">
            도구 및 관리 <ChevronDown />
          </Button>
          <Button variant="secondary" size="sm">
            자가 진단
          </Button>
          <Button size="sm">업데이트</Button>
        </div>
      </>
    ),
  },
  breadcrumb: fromStories("breadcrumb", breadcrumbStories, { className: "flex items-center " + BOX + " px-6", style: { width: 640, height: 56 } }),
  "icon-select": fromStories("icon-select", iconSelectStories, { className: "flex items-center justify-center " + BOX, style: strip, hubOnly: true }),

  /* ── 버튼 ── */
  /* 버튼 6종 — 스파이크(2026-09-07): 여기서 직접 그리지 않고 button.stories.tsx 를 읽는다.
     FE가 스토리를 추가하면 이 파일을 안 고쳐도 카드에 나타난다(확인 항목 4번). */
  "btn-basic": fromStories("btn-basic", buttonStories, BTN_FRAME),
  "btn-destructive": fromStories("btn-destructive", buttonStories, BTN_FRAME),
  "btn-states": fromStories("btn-states", buttonStories, BTN_FRAME),
  "btn-split": fromStories("btn-split", buttonStories, BTN_FRAME),
  "btn-icon": fromStories("btn-icon", buttonStories, BTN_FRAME),
  "btn-dashed": fromStories("btn-dashed", buttonStories, BTN_FRAME),
  /* ── 피드백(인라인)·시각화 ── */
  // 배치 5 — 피드백 카드는 alert · error-state · empty · skeleton · error-console .stories 원문(2026-09-10)
  "fb-banner": fromStories("fb-banner", alertStories, { className: "flex flex-col gap-3 " + BOX + " p-6", style: { width: 640 } }),
  "fb-empty": fromStories("fb-empty", emptyStories, { className: BOX + " p-4", style: { width: 560 } }),
  "error-state": fromStories("error-state", errorStateStories, { className: BOX + " p-6", style: { width: 720 }, hubOnly: true }),
  "fb-console": fromStories("fb-console", errorConsoleStories, { className: BOX + " p-6", style: { width: 640 } }),
  skeleton: fromStories("skeleton", skeletonStories, { className: BOX + " p-6", style: { width: 640 }, hubOnly: true }),
  "header-filter": {
    className: BOX + " p-6",
    style: { width: 620 },
    hubOnly: true,
    // 스토리 원문(ContractList — 세일즈 365 PRD 6.1) — 허브 카드와 Storybook이 같은 파일을 읽는다(2026-09-09)
    node: filterBarStories.ContractList.render(),
  },
  "viz-line": fromStories("viz-line", chartStories, { className: BOX + " p-6", style: { width: 640 } }),
  "viz-donut": fromStories("viz-donut", chartStories, { className: BOX + " p-6", style: { width: 560 } }),

  /* ── 폼 ── */
  // form-* 카드 — 스토리 원문(input · textarea · checkbox · radio-group · switch · select · command .stories) 을 읽는다(2026-09-09 배치 1)
  "form-text": fromStories("form-text", inputStories, { className: "flex items-center " + BOX + " px-10", style: { width: 560, height: 150 } }),
  "form-number": fromStories("form-number", inputStories, { className: "flex items-center gap-4 " + BOX + " px-10", style: { width: 560, height: 150 } }),
  "form-search": fromStories("form-search", inputGroupStories, { className: "flex items-center " + BOX + " px-10", style: { width: 560, height: 120 } }),
  "form-textarea": fromStories("form-textarea", textareaStories, { className: "flex items-center " + BOX + " px-10", style: { width: 560, height: 190 } }),
  // 두 파일을 합쳐 읽는 카드 — select(셀렉트) + command(콤보박스 트리거)
  "form-select": {
    className: "flex items-center gap-4 " + BOX + " px-10",
    style: { width: 560, height: 130 },
    node: (
      <>
        {selectStories.Default.render()}
        {commandStories.Combobox.render()}
      </>
    ),
  },
  // 세 파일을 합쳐 읽는 카드 — checkbox · radio-group · switch
  "form-controls": {
    className: "flex items-center justify-center gap-8 " + BOX + " px-8",
    style: { width: 560, height: 140 },
    node: (
      <>
        {checkboxStories.Checked.render()}
        {radioGroupStories.Horizontal.render()}
        {switchStories.On.render()}
      </>
    ),
  },
  "form-choicecard": {
    className: "flex items-center justify-center gap-4 " + BOX + " px-8",
    style: { width: 560, height: 150 },
    node: (
      <RadioGroup defaultValue="new" className="grid w-full grid-cols-2 gap-4">
        <Label htmlFor="cc1" className="flex items-center gap-3 rounded-lg border border-primary bg-accent p-4">
          <RadioGroupItem value="new" id="cc1" />
          <span className="flex items-center gap-2"><Ship className="size-4" /> 신조</span>
        </Label>
        <Label htmlFor="cc2" className="flex items-center gap-3 rounded-lg border border-border p-4">
          <RadioGroupItem value="retrofit" id="cc2" />
          <span className="flex items-center gap-2"><RefreshCw className="size-4" /> 개조</span>
        </Label>
      </RadioGroup>
    ),
  },
  // 배치 2 — toggle-group · input-group · calendar · icon-select 스토리 원문(2026-09-10)
  "form-segment": fromStories("form-segment", toggleGroupStories, { className: "flex items-center justify-center " + BOX, style: { width: 560, height: 120 } }),
  "form-tags": fromStories("form-tags", inputStories, { className: "flex items-center " + BOX + " px-10", style: { width: 560, height: 130 } }),
  "form-daterange": fromStories("form-daterange", calendarStories, { className: "flex w-fit items-center justify-center " + BOX + " p-4" }),
  "form-file": fromStories("form-file", inputStories, { className: "flex items-center " + BOX + " px-10", style: { width: 560, height: 150 } }),
  "form-chipgrid": fromStories("form-chipgrid", toggleGroupStories, { className: "flex items-center justify-center " + BOX + " p-6", style: { width: 560, height: 200 } }),

  /* ── 데이터 표시 ── */
  // 셀 변형·정렬 헤더 흡수(2026-09-03) — 정렬 버튼 헤더 + 링크 셀·2줄 셀·행 액션을 한 표로
  "data-table": fromStories("data-table", tableStories, { className: BOX + " p-6", style: { width: 640 } }),
  "data-kv": fromStories("data-kv", itemStories, { className: BOX + " p-4", style: { width: 560 } }),
  "data-status": fromStories("data-status", statusBadgeStories, { className: "flex items-center justify-center gap-3 " + BOX, style: strip }),
  // 사용방식 3가지 병합(2026-09-03) — ① 일반 칩 ② 버전 칩(mono) ③ 역할 태그(제거 X)
  // 배치 3 — data-* · viz-* 카드는 badge · table · pagination · progress · card · item · accordion · collapsible · tabs · chart .stories 원문(2026-09-10)
  "data-badge": fromStories("data-badge", badgeStories, { className: "flex flex-wrap items-center justify-center gap-3 " + BOX + " px-6 py-4", style: { width: 640 } }),
  "data-matrix": fromStories("data-matrix", tableStories, { className: BOX + " p-6", style: { width: 640 } }),
  "data-perm": fromStories("data-perm", tableStories, { className: BOX + " p-6", style: { width: 640 } }),
  "data-stat": fromStories("data-stat", cardStories, { className: "grid grid-cols-2 gap-4 " + BOX + " p-6", style: { width: 640 } }),
  "data-accordion": fromStories("data-accordion", accordionStories, { className: BOX + " px-6 py-2", style: { width: 560 } }),
  "data-tabs": fromStories("data-tabs", tabsStories, { className: "flex flex-col items-start gap-4 " + BOX + " p-6", style: { width: 560 } }),
  "data-pagination": fromStories("data-pagination", paginationStories, { className: "flex items-center justify-center " + BOX, style: { width: 560, height: 110 } }),
  "rows-per-page": fromStories("rows-per-page", rowsPerPageStories, { className: "flex items-center justify-center " + BOX, style: { width: 560, height: 110 }, hubOnly: true }),
  "data-progress": fromStories("data-progress", progressStories, { className: "flex items-center gap-4 " + BOX + " px-10", style: { width: 560, height: 110 } }),
  "data-tree": fromStories("data-tree", collapsibleStories, { className: BOX + " p-4", style: { width: 400 } }),
  timeline: fromStories("timeline", timelineStories, { className: BOX + " p-6", style: { width: 400 }, captureId: "data-timeline" }),
  stepper: {
    className: BOX + " p-6",
    style: { width: 720 },
    captureId: "data-stepper",
    node: (
      <Stepper>
        <StepperItem step={1} state="completed">업데이트 옵션 설정</StepperItem>
        <StepperItem step={2} state="completed">업데이트 내용</StepperItem>
        <StepperItem step={3} state="completed">업데이트 항목 조회</StepperItem>
        <StepperItem step={4} state="current">이미지 다운로드</StepperItem>
        <StepperItem step={5} state="upcoming">업데이트 적용</StepperItem>
      </Stepper>
    ),
  },
  "data-listrow": fromStories("data-listrow", itemStories, { className: BOX + " p-4", style: { width: 480 } }),

  /* ── 오버레이 — 실물 렌더는 격리가 필요해 프리뷰 라우트를 iframe으로 담는다
        (포털·z-index가 카드 그리드를 침범하지 않게) ── */
  "ov-dialog": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/overlay/?c=dialog" /> },
  "ov-sheet": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/overlay/?c=sheet" /> },
  "detail-panel": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/detail-panel/" /> },
  "ov-menus": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/overlay/?c=menus" /> },
  "ov-notif": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/notification-panel/" w={420} h={500} /> },
  "search-box": {
    className: "",
    hubOnly: true,
    node: <RouteFrame src="/shadcn-preview/search-box/" w={560} h={420} />,
  },
  "version-filter-chip": {
    className: "",
    hubOnly: true,
    node: <RouteFrame src="/shadcn-preview/version-filter-chip/" w={480} h={520} />,
  },
  // 배치 4 — 포털형은 iframe 유지, 정적 조립 3장(popover · tooltip · toast)은 스토리 Static 원문(2026-09-10)
  "ov-popover": fromStories("ov-popover", popoverStories, { className: "flex items-start justify-center gap-2 " + BOX + " p-6", style: { width: 400 }, hubOnly: true }),
  "ov-toast": fromStories("ov-toast", sonnerStories, { className: "flex items-center justify-center " + BOX, style: { width: 560, height: 140 }, hubOnly: true }),
  "ov-tooltip": fromStories("ov-tooltip", tooltipStories, { className: "flex flex-col items-center justify-center gap-2 " + BOX, style: { width: 560, height: 140 }, hubOnly: true }),
};

/* 캡처 페이지 전용 — 카드 슬러그가 아니지만 기존 캡처 대상이던 섹션 */
export const CAPTURE_EXTRAS: Record<string, Pv> = {
  "data-pagination-stock": {
    className:
      "flex items-center justify-center " + BOX +
      " [&_a]:font-medium [&_a]:text-foreground [&_[aria-current=page]]:border [&_[aria-current=page]]:bg-background",
    style: { width: 560, height: 110 },
    node: (
      <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
          <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationLink href="#">7</PaginationLink></PaginationItem>
          <PaginationItem><PaginationNext href="#" /></PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
  },
};

/* 캡처 페이지 섹션 순서 — 구 페이지의 원래 순서 그대로 (hubOnly 제외) */
export const CAPTURE_ORDER = [
  "app-shell", "sidebar-nav", "page-header", "breadcrumb",
  "btn-basic", "btn-destructive", "btn-states", "btn-split", "btn-icon", "btn-dashed",
  "fb-banner", "fb-empty", "fb-console", "viz-line", "viz-donut",
  "form-text", "form-number", "form-search", "form-textarea", "form-select", "form-controls",
  "form-choicecard", "form-segment", "form-tags", "form-daterange", "form-file",
  "data-table", "data-kv", "data-status", "data-badge",
  "data-matrix", "data-perm", "data-stat", "data-accordion",
  "data-tabs", "data-pagination", "data-pagination-stock", "data-progress", "data-tree",
  "timeline", "stepper", "data-listrow", "form-chipgrid",
];

/* ── 카드 프레임 맞춤 렌더 ─────────────────────────────────────────── */

/** 프리뷰 라우트를 카드 안에 격리 렌더 — 항상 최신, 포털은 iframe 안에 갇힌다 */
function RouteFrame({ src, w = 1280, h = 800 }: { src: string; w?: number; h?: number }) {
  return (
    <div className="routeframe" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <iframe
        src={src}
        loading="lazy"
        tabIndex={-1}
        style={{ width: w, height: h, border: 0, transformOrigin: "top left", pointerEvents: "none" }}
        data-fit-frame={`${w}x${h}`}
        title="컴포넌트 미리보기"
      />
    </div>
  );
}

/** 자연 크기로 그린 뒤 카드 박스에 맞춰 축소 — 사진의 object-fit: contain 등가물 */
export function FitScale({ pv }: { pv: Pv }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);

  React.useEffect(() => {
    const box = boxRef.current, inner = innerRef.current;
    if (!box || !inner) return;
    const fit = () => {
      const bw = box.clientWidth, bh = box.clientHeight;
      const iw = inner.offsetWidth || 1, ih = inner.offsetHeight || 1;
      // 여백 8% — 사진 시절의 padding 4% 등가
      setScale(Math.min((bw * 0.92) / iw, (bh * 0.92) / ih, 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box); ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  // RouteFrame은 스스로 absolute 채움 — FitScale 측정 없이 그대로
  if (React.isValidElement(pv.node) && pv.node.type === RouteFrame) {
    return <RouteFrameFitted node={pv.node} />;
  }

  return (
    <div ref={boxRef} className="fitbox">
      <div
        ref={innerRef}
        className={pv.className}
        style={{ ...pv.style, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        {pv.node}
      </div>
    </div>
  );
}

/** iframe 프리뷰의 축소 — 박스 크기에 맞춰 scale 계산 */
function RouteFrameFitted({ node }: { node: React.ReactElement }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);
  const props = node.props as { src: string; w?: number; h?: number };
  const w = props.w ?? 1280, h = props.h ?? 800;

  React.useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => setScale(Math.min(box.clientWidth / w, box.clientHeight / h));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [w, h]);

  return (
    <div ref={boxRef} className="fitbox" style={{ alignItems: "flex-start", justifyContent: "flex-start" }}>
      <iframe
        src={props.src}
        loading="lazy"
        tabIndex={-1}
        title="컴포넌트 미리보기"
        style={{
          width: w, height: h, border: 0, pointerEvents: "none",
          transform: `scale(${scale})`, transformOrigin: "top left",
          visibility: scale ? "visible" : "hidden",
        }}
      />
    </div>
  );
}
