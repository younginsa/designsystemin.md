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
import { FilterBar, DATE_PRESETS, type FilterDef, type FilterValues } from "@ds/ui/ui/filter-bar";
import { IconSelect } from "@ds/ui/ui/icon-select";
import { Input } from "@ds/ui/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";
import { Label } from "@ds/ui/ui/label";
import { RadioGroup, RadioGroupItem } from "@ds/ui/ui/radio-group";
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
  Filter,
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

// header-filter 데모 — FilterBar는 controlled라 상태 래퍼가 필요하다
const DEMO_FILTERS: FilterDef[] = [
  { name: "status", label: "상태", options: ["Pending", "Active", "Expired"], base: true },
  { name: "product", label: "제품", options: ["Cloud", "Security", "NAS"], multi: true, base: true },
  { name: "updated", label: "상태 갱신일", kind: "date", presets: DATE_PRESETS, base: true },
];
function FilterBarDemo() {
  const [keyword, setKeyword] = React.useState("");
  const [values, setValues] = React.useState<FilterValues>({ status: "Pending", product: "Cloud, NAS" });
  return (
    <FilterBar
      searchPlaceholder="계약 검색"
      keyword={keyword}
      onKeyword={setKeyword}
      filters={DEMO_FILTERS}
      values={values}
      onChange={(n, v) => setValues((s) => ({ ...s, [n]: v }))}
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

/* ── 레지스트리 ────────────────────────────────────────────────────── */

export const PREVIEWS: Record<string, Pv> = {
  "app-shell": {
    className: "w-fit " + BOX,
    node: (
      <SidebarProvider className="min-h-0 w-fit">
        <div className="flex" style={{ width: 960, height: 540 }}>
          <Sidebar collapsible="none" className="border-r border-border">
            <SidebarHeader>
              <div className="px-2 py-1 text-sm font-semibold">HiNAS 365</div>
            </SidebarHeader>
            <SidebarContent>
              <NavGroups />
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="min-h-0">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DemoBreadcrumb />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-video rounded-lg bg-muted" />
                <div className="aspect-video rounded-lg bg-muted" />
                <div className="aspect-video rounded-lg bg-muted" />
              </div>
              <div className="min-h-0 flex-1 rounded-lg bg-muted" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    ),
  },
  "sidebar-nav": {
    className: "w-fit " + BOX,
    node: (
      <SidebarProvider className="min-h-0 w-fit">
        <Sidebar collapsible="none" style={{ height: 480 }}>
          <SidebarContent>
            <NavGroups />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    ),
  },
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
  breadcrumb: {
    className: "flex items-center " + BOX + " px-6",
    style: { width: 640, height: 56 },
    node: <DemoBreadcrumb />,
  },
  "icon-select": {
    className: "flex items-center justify-center " + BOX,
    style: strip,
    hubOnly: true,
    node: (
      <IconSelect
        icon={Globe}
        value="kst"
        sub="2026-07-30"
        items={[
          { value: "kst", label: "KST +9" },
          { value: "utc", label: "UTC +0" },
        ]}
      />
    ),
  },

  /* ── 버튼 ── */
  "btn-basic": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Button>채움</Button>
        <Button variant="outline">아웃라인</Button>
        <Button variant="ghost">텍스트</Button>
      </>
    ),
  },
  "btn-destructive": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Button variant="destructive">삭제</Button>
        <Button variant="destructive-outline">제품 삭제</Button>
      </>
    ),
  },
  "btn-states": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Button disabled>비활성</Button>
        <Button disabled>
          <Spinner /> 처리 중…
        </Button>
      </>
    ),
  },
  "btn-split": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <ButtonGroup>
        <Button variant="outline">
          <Download /> 내보내기
        </Button>
        <Button variant="outline" size="icon" aria-label="옵션">
          <ChevronDown />
        </Button>
      </ButtonGroup>
    ),
  },
  "btn-icon": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Button variant="ghost" size="icon" aria-label="복사"><Copy /></Button>
        <Button variant="ghost" size="icon" aria-label="새로고침"><RefreshCw /></Button>
        <Button variant="ghost" size="icon" aria-label="편집"><Pencil /></Button>
        <Button variant="ghost" size="icon" aria-label="삭제"><Trash2 /></Button>
        <Button variant="ghost" size="icon" aria-label="전체화면"><Maximize2 /></Button>
      </>
    ),
  },
  "btn-dashed": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <Button variant="outline" className="w-2/3 border-dashed">
        <Plus /> Source 추가
      </Button>
    ),
  },
  "btn-fab": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <Button size="icon" className="size-12 rounded-full" aria-label="리포트">
        <FileText />
      </Button>
    ),
  },

  /* ── 피드백(인라인)·시각화 ── */
  "fb-banner": {
    className: "flex flex-col gap-3 " + BOX + " p-6",
    style: { width: 640 },
    node: (
      <>
        <Alert>
          <CheckCircle2 />
          <AlertTitle>업데이트 완료</AlertTitle>
          <AlertDescription>common v4.0.0 적용이 끝났습니다.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>업데이트 실패</AlertTitle>
          <AlertDescription>Agent 로그를 확인해 주세요.</AlertDescription>
        </Alert>
      </>
    ),
  },
  "fb-note": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <Alert>
        <Info className="size-4" />
        <AlertTitle>안내</AlertTitle>
        <AlertDescription>별 아이콘을 눌러 권장 버전을 설정할 수 있습니다. 모든 변경사항은 즉시 반영됩니다.</AlertDescription>
      </Alert>
    ),
  },
  "fb-empty": {
    className: BOX + " p-4",
    style: { width: 560 },
    node: (
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
          <EmptyTitle>등록된 메모가 없습니다</EmptyTitle>
          <EmptyDescription>새 메모를 추가하면 여기에 표시됩니다.</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm"><Plus /> 새 메모</Button>
      </Empty>
    ),
  },
  "error-state": {
    className: BOX + " p-6",
    style: { width: 720 },
    hubOnly: true,
    node: (
      <ErrorState
        title="계약 목록을 불러오지 못했습니다"
        description="서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
        onRetry={() => {}}
      />
    ),
  },
  "fb-console": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <div className="relative rounded-lg bg-foreground p-4 font-mono text-xs text-background">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 size-6 text-background hover:bg-background/20" aria-label="복사"><Copy /></Button>
        <div>[2026-07-28 15:23:01] update requested (id: 7b74)</div>
        <div>[2026-07-28 15:23:04] pulling image hidom-2.0-backend:v3.5.0</div>
        <div className="text-destructive">[2026-07-28 15:24:12] ERROR: agent unreachable</div>
      </div>
    ),
  },
  skeleton: {
    className: BOX + " p-6",
    style: { width: 640 },
    hubOnly: true,
    node: <TableSkeleton rows={3} />,
  },
  "header-filter": {
    className: BOX + " p-6",
    style: { width: 620 },
    hubOnly: true,
    node: <FilterBarDemo />,
  },
  "viz-line": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <ChartContainer config={lineConfig} className="h-56 w-full">
        <LineChart data={lineData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={8} />
          <Line dataKey="v" type="monotone" stroke="var(--foreground)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    ),
  },
  "viz-donut": {
    className: BOX + " p-6",
    style: { width: 560 },
    node: (
      <ChartContainer config={pieConfig} className="mx-auto h-56 w-full">
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
            {pieData.map((e) => (<Cell key={e.name} fill={e.fill} />))}
          </Pie>
        </PieChart>
      </ChartContainer>
    ),
  },

  /* ── 폼 ── */
  "form-text": {
    className: "flex items-center " + BOX + " px-10",
    style: { width: 560, height: 150 },
    node: (
      <Field>
        <FieldLabel htmlFor="f-name">호선명 <span className="text-destructive">*</span></FieldLabel>
        <Input id="f-name" placeholder="예: Avikus Ship" />
      </Field>
    ),
  },
  "form-number": {
    className: "flex items-center gap-4 " + BOX + " px-10",
    style: { width: 560, height: 150 },
    node: (
      <>
        <Field>
          <FieldLabel htmlFor="f-loa">LOA (m)</FieldLabel>
          <Input id="f-loa" type="number" defaultValue={200} />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-lbp">LBP (m)</FieldLabel>
          <Input id="f-lbp" type="number" defaultValue={180} />
        </Field>
      </>
    ),
  },
  "form-search": {
    className: "flex items-center " + BOX + " px-10",
    style: { width: 560, height: 120 },
    node: (
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput placeholder="키워드 검색" />
      </InputGroup>
    ),
  },
  "form-textarea": {
    className: "flex items-center " + BOX + " px-10",
    style: { width: 560, height: 190 },
    node: (
      <Field>
        <FieldLabel htmlFor="f-desc">설명</FieldLabel>
        <Textarea id="f-desc" placeholder="변경 사항을 입력하세요" rows={3} />
        <div className="text-right text-xs text-muted-foreground">0 / 200</div>
      </Field>
    ),
  },
  "form-select": {
    className: "flex items-center gap-4 " + BOX + " px-10",
    style: { width: 560, height: 130 },
    node: (
      <>
        <Select defaultValue="nav">
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nav">Navigation</SelectItem>
            <SelectItem value="svm">SVM</SelectItem>
            <SelectItem value="ctrl">Control</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" role="combobox" className="w-56 justify-between font-normal text-muted-foreground">
          버전 검색… <ChevronDown className="opacity-50" />
        </Button>
      </>
    ),
  },
  "form-controls": {
    className: "flex items-center justify-center gap-8 " + BOX + " px-8",
    style: { width: 560, height: 140 },
    node: (
      <>
        <div className="flex items-center gap-2">
          <Checkbox id="c1" defaultChecked />
          <Label htmlFor="c1">Cloud 연동</Label>
        </div>
        <RadioGroup defaultValue="a" className="flex gap-6">
          <div className="flex items-center gap-2"><RadioGroupItem value="a" id="r1" /><Label htmlFor="r1">신조</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="b" id="r2" /><Label htmlFor="r2">개조</Label></div>
        </RadioGroup>
        <div className="flex items-center gap-2">
          <Switch id="s1" defaultChecked />
          <Label htmlFor="s1">활성화</Label>
        </div>
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
  "form-segment": {
    className: "flex items-center justify-center " + BOX,
    style: { width: 560, height: 120 },
    node: (
      <ToggleGroup type="single" defaultValue="all" variant="outline">
        <ToggleGroupItem value="all">전체</ToggleGroupItem>
        <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
        <ToggleGroupItem value="not">미설치</ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  "form-tags": {
    className: "flex items-center " + BOX + " px-10",
    style: { width: 560, height: 130 },
    node: (
      <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-input px-3 py-2 shadow-xs">
        <Badge variant="secondary">NAVIGATION <X className="size-3" /></Badge>
        <Badge variant="secondary">SVM <X className="size-3" /></Badge>
        <span className="text-sm text-muted-foreground">새 태그 입력…</span>
      </div>
    ),
  },
  "form-daterange": {
    className: "flex w-fit items-center justify-center " + BOX + " p-4",
    node: (
      <Calendar
        mode="range"
        numberOfMonths={1}
        defaultMonth={new Date(2026, 6, 1)}
        selected={{ from: new Date(2026, 6, 7), to: new Date(2026, 6, 21) }}
      />
    ),
  },
  "form-file": {
    className: "flex items-center " + BOX + " px-10",
    style: { width: 560, height: 150 },
    node: (
      <Field>
        <FieldLabel htmlFor="f-file">첨부 파일</FieldLabel>
        <Input id="f-file" type="file" />
      </Field>
    ),
  },
  "form-chipgrid": {
    className: "flex items-center justify-center " + BOX + " p-6",
    style: { width: 560, height: 200 },
    node: (
      <ToggleGroup type="multiple" defaultValue={["v350", "v342"]} variant="outline" className="grid grid-cols-4 gap-2">
        <ToggleGroupItem value="v350" className="font-mono text-xs">v3.5.0</ToggleGroupItem>
        <ToggleGroupItem value="v342" className="font-mono text-xs">v3.4.2</ToggleGroupItem>
        <ToggleGroupItem value="v341" className="font-mono text-xs">v3.4.1</ToggleGroupItem>
        <ToggleGroupItem value="v331" className="font-mono text-xs">v3.3.1</ToggleGroupItem>
        <ToggleGroupItem value="v330" className="font-mono text-xs">v3.3.0</ToggleGroupItem>
        <ToggleGroupItem value="v320" className="font-mono text-xs">v3.2.0</ToggleGroupItem>
        <ToggleGroupItem value="v312" className="font-mono text-xs">v3.1.2</ToggleGroupItem>
        <ToggleGroupItem value="v360" className="font-mono text-xs">v3.6.0</ToggleGroupItem>
      </ToggleGroup>
    ),
  },

  /* ── 데이터 표시 ── */
  "data-table": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMO NUMBER</TableHead>
            <TableHead>SHIP NAME</TableHead>
            <TableHead>PRODUCT</TableHead>
            <TableHead className="text-right">CREATED</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-xs">9876543</TableCell>
            <TableCell>SVM_BUSAN_1</TableCell>
            <TableCell><Badge variant="secondary">SVM</Badge></TableCell>
            <TableCell className="text-right text-muted-foreground">2026-07-27</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">9876544</TableCell>
            <TableCell>CONTROL_TEST</TableCell>
            <TableCell><Badge variant="secondary">CONTROL</Badge></TableCell>
            <TableCell className="text-right text-muted-foreground">2026-07-23</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  "data-kv": {
    className: BOX + " p-4",
    style: { width: 560 },
    node: (
      <ItemGroup>
        <Item size="sm"><ItemContent><ItemDescription>IMO</ItemDescription><ItemTitle>9876543</ItemTitle></ItemContent></Item>
        <Item size="sm"><ItemContent><ItemDescription>호선명</ItemDescription><ItemTitle>SVM_BUSAN_1</ItemTitle></ItemContent></Item>
        <Item size="sm"><ItemContent><ItemDescription>Yard</ItemDescription><ItemTitle>HMD</ItemTitle></ItemContent></Item>
      </ItemGroup>
    ),
  },
  "data-colhead": {
    className: BOX + " p-6",
    style: { width: 560 },
    node: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" size="sm" className="-ml-2">STATUS <ArrowUpDown /></Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="-ml-2">PRODUCT <Filter /></Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell className="text-muted-foreground" colSpan={2}>…</TableCell></TableRow>
        </TableBody>
      </Table>
    ),
  },
  "data-cells": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell><a href="#" className="text-primary underline underline-offset-4">SVM_BUSAN_1</a></TableCell>
            <TableCell>
              <div>REAL_FINAL_TEST</div>
              <div className="text-xs text-muted-foreground">REAL_FINAL_TEST_1</div>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" aria-label="편집"><Pencil /></Button>
              <Button variant="ghost" size="icon" aria-label="삭제"><Trash2 /></Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  "data-status": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Badge variant="secondary"><span className="size-1.5 rounded-full bg-success"></span> 정상</Badge>
        <Badge variant="secondary"><span className="size-1.5 rounded-full bg-destructive"></span> 이상</Badge>
        <Badge variant="outline">CAUTION</Badge>
        <Badge variant="outline">COMPLETED</Badge>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-success"></span> Ready</span>
      </>
    ),
  },
  "data-badge": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Badge>NAVIGATION</Badge>
        <Badge variant="secondary">SVM</Badge>
        <Badge variant="outline">CONTROL</Badge>
        <Badge variant="destructive">HIGH 9</Badge>
        <Badge variant="secondary" className="rounded-full">34</Badge>
      </>
    ),
  },
  "data-verchip": {
    className: "flex items-center justify-center gap-3 " + BOX,
    style: strip,
    node: (
      <>
        <Badge variant="outline" className="font-mono">v3.5.0-test.15</Badge>
        <ArrowRight className="size-4 text-muted-foreground" />
        <Badge variant="outline" className="font-mono">v4.0.0-update.1</Badge>
      </>
    ),
  },
  "data-roletag": {
    className: "flex items-center justify-center gap-2 " + BOX,
    style: strip,
    node: (
      <>
        <Badge variant="secondary">avikus <X className="size-3" /></Badge>
        <Badge variant="secondary">qa <X className="size-3" /></Badge>
        <Badge variant="secondary">service_engineer <X className="size-3" /></Badge>
        <Badge variant="outline">+ 역할 추가</Badge>
      </>
    ),
  },
  "data-matrix": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>COMMON</TableHead><TableHead>NAVIGATION</TableHead><TableHead>SVM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-xs">v4.0.0</TableCell>
            <TableCell><Badge variant="outline" className="font-mono">v3.5.3 ★</Badge></TableCell>
            <TableCell><Button variant="ghost" size="icon" aria-label="추가"><Plus /></Button></TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">v3.5.0</TableCell>
            <TableCell><Badge variant="outline" className="font-mono">v3.5.0 ★</Badge></TableCell>
            <TableCell><Badge variant="outline" className="font-mono">v1.2.0</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  "data-perm": {
    className: BOX + " p-6",
    style: { width: 640 },
    node: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission</TableHead>
            <TableHead className="text-center">qa</TableHead>
            <TableHead className="text-center">dev</TableHead>
            <TableHead className="text-center">admin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-xs">account:read</TableCell>
            <TableCell className="text-center"><Checkbox /></TableCell>
            <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
            <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-xs">account:update</TableCell>
            <TableCell className="text-center"><Checkbox /></TableCell>
            <TableCell className="text-center"><Checkbox /></TableCell>
            <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  "data-stat": {
    className: "grid grid-cols-2 gap-4 " + BOX + " p-6",
    style: { width: 640 },
    node: (
      <>
        <Card className="py-4">
          <CardContent className="px-4">
            <CardDescription>운영 호선</CardDescription>
            <CardTitle className="text-3xl font-mono">48</CardTitle>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <CardDescription>업데이트 진행</CardDescription>
            <CardTitle className="text-3xl font-mono">6</CardTitle>
          </CardContent>
        </Card>
      </>
    ),
  },
  "data-accordion": {
    className: BOX + " px-6 py-2",
    style: { width: 560 },
    node: (
      <Accordion type="single" collapsible defaultValue="sys">
        <AccordionItem value="cam">
          <AccordionTrigger>CAMERA</AccordionTrigger>
          <AccordionContent>카메라 진단 상세</AccordionContent>
        </AccordionItem>
        <AccordionItem value="sys">
          <AccordionTrigger>SYSTEM</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">CPU 9.2% · Memory 25.0%</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  "data-tabs": {
    className: "flex flex-col items-start gap-4 " + BOX + " p-6",
    style: { width: 560 },
    node: (
      <>
        <Tabs defaultValue="common">
          <TabsList>
            <TabsTrigger value="common">COMMON</TabsTrigger>
            <TabsTrigger value="nav">NAVIGATION</TabsTrigger>
            <TabsTrigger value="svm">SVM</TabsTrigger>
          </TabsList>
        </Tabs>
        <ToggleGroup type="single" defaultValue="user" variant="outline" size="sm">
          <ToggleGroupItem value="user">사용자용</ToggleGroupItem>
          <ToggleGroupItem value="dev">개발자용</ToggleGroupItem>
        </ToggleGroup>
      </>
    ),
  },
  "data-pagination": {
    className: "flex items-center justify-center " + BOX,
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
  "data-progress": {
    className: "flex items-center gap-4 " + BOX + " px-10",
    style: { width: 560, height: 110 },
    node: (
      <>
        <Progress value={62} className="flex-1" />
        <span className="font-mono text-sm text-muted-foreground">62%</span>
        <Spinner className="text-muted-foreground" />
      </>
    ),
  },
  "data-tree": {
    className: BOX + " p-4",
    style: { width: 400 },
    node: (
      <>
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
            <ChevronDown className="size-4" /> v4.0 <Badge variant="secondary" className="ml-auto rounded-full">9</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-4 border-l border-border pl-3">
            <div className="rounded-md bg-accent px-2 py-1.5 font-mono text-xs">v4.0.0-test.96</div>
            <div className="px-2 py-1.5 font-mono text-xs text-muted-foreground">v4.0.0-test.95</div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
            <ChevronRight className="size-4" /> v1.0 <Badge variant="secondary" className="ml-auto rounded-full">1</Badge>
          </CollapsibleTrigger>
        </Collapsible>
      </>
    ),
  },
  timeline: {
    className: BOX + " p-6",
    style: { width: 400 },
    captureId: "data-timeline",
    node: (
      <Timeline>
        <TimelineItem status="error">
          <TimelineTitle>SYSTEM ROLLBACK FAILED</TimelineTitle>
          <TimelineMeta>20일 20시간 전</TimelineMeta>
        </TimelineItem>
        <TimelineItem status="error">
          <TimelineTitle>SYSTEM ROLLING BACK</TimelineTitle>
          <TimelineMeta>20일 20시간 전 · 소요 1분 37초</TimelineMeta>
        </TimelineItem>
        <TimelineItem>
          <TimelineTitle>SYSTEM UPDATING</TimelineTitle>
          <TimelineMeta>20일 20시간 전 · 소요 3분 4초</TimelineMeta>
        </TimelineItem>
      </Timeline>
    ),
  },
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
  "data-listrow": {
    className: BOX + " p-4",
    style: { width: 480 },
    node: (
      <ItemGroup className="gap-2">
        <Item variant="outline" size="sm">
          <ItemMedia><Monitor className="size-4" /></ItemMedia>
          <ItemContent><ItemTitle>Remote Support</ItemTitle></ItemContent>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Item>
        <Item variant="outline" size="sm">
          <ItemMedia><Boxes className="size-4" /></ItemMedia>
          <ItemContent><ItemTitle>Docker Image List</ItemTitle></ItemContent>
          <Badge variant="secondary" className="rounded-full">34</Badge>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Item>
        <Item variant="outline" size="sm">
          <ItemMedia><Database className="size-4" /></ItemMedia>
          <ItemContent><ItemTitle>Storage Data List</ItemTitle></ItemContent>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Item>
      </ItemGroup>
    ),
  },

  /* ── 오버레이 — 실물 렌더는 격리가 필요해 프리뷰 라우트를 iframe으로 담는다
        (포털·z-index가 카드 그리드를 침범하지 않게) ── */
  "ov-dialog": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/overlay/?c=dialog" /> },
  "ov-sheet": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/overlay/?c=sheet" /> },
  "detail-panel": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/detail-panel/" /> },
  "ov-menus": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/overlay/?c=menus" /> },
  "ov-notif": { className: "", hubOnly: true, node: <RouteFrame src="/shadcn-preview/notification-panel/" /> },
  "ov-popover": {
    className: "flex items-start justify-center gap-2 " + BOX + " p-6",
    style: { width: 400 },
    hubOnly: true,
    node: (
      // 정적 조립 — Popover 실물은 포털이라 카드 안에 가둘 수 없다. PopoverContent와 같은 클래스.
      <div className="flex flex-col items-center gap-2">
        <Button variant="outline" size="sm">KST +9 <ChevronDown /></Button>
        <div className="w-56 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
          <div className="text-sm font-medium">타임존</div>
          <div className="mt-2 rounded-md bg-accent px-2 py-1.5 text-sm">KST +9 · 2026-07-30</div>
          <div className="px-2 py-1.5 text-sm text-muted-foreground">UTC +0 · 2026-07-30</div>
        </div>
      </div>
    ),
  },
  "ov-toast": {
    className: "flex items-center justify-center " + BOX,
    style: { width: 560, height: 140 },
    hubOnly: true,
    node: (
      // 정적 조립 — Sonner 토스트 룩(뷰포트 고정이라 카드 안 실물 불가)
      <div className="w-80 rounded-lg border border-border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
        <div className="text-sm font-medium">업데이트가 시작되었습니다</div>
        <div className="text-sm text-muted-foreground">SVM_BUSAN_1 · common v4.0.0</div>
      </div>
    ),
  },
  "ov-tooltip": {
    className: "flex flex-col items-center justify-center gap-2 " + BOX,
    style: { width: 560, height: 140 },
    hubOnly: true,
    node: (
      // 정적 조립 — TooltipContent와 같은 표면(bg-foreground류는 shadcn v4 primary 계열)
      <>
        <Info className="size-4 text-muted-foreground" />
        <div className="w-fit rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
          권장 버전은 별표(★)로 표시됩니다
        </div>
      </>
    ),
  },
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
  "btn-basic", "btn-destructive", "btn-states", "btn-split", "btn-icon", "btn-dashed", "btn-fab",
  "fb-banner", "fb-note", "fb-empty", "fb-console", "viz-line", "viz-donut",
  "form-text", "form-number", "form-search", "form-textarea", "form-select", "form-controls",
  "form-choicecard", "form-segment", "form-tags", "form-daterange", "form-file",
  "data-table", "data-kv", "data-colhead", "data-cells", "data-status", "data-badge",
  "data-verchip", "data-roletag", "data-matrix", "data-perm", "data-stat", "data-accordion",
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
