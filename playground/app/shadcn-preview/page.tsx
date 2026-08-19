"use client";

// 내부 도구 페이지 — 365 탭 § 03 카드에 넣을 shadcn 기본형 미리보기를 렌더링한다.
// browse 헤드리스 캡처 대상: #pv-app-shell, #pv-sidebar-nav, #pv-page-header, #pv-breadcrumb
// 제품 페이지가 아니므로 배포 내비에 연결하지 않는다.

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
import {
  ChartContainer,
  type ChartConfig,
} from "@ds/ui/ui/chart";
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
import { Field, FieldLabel } from "@ds/ui/ui/field";
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
import { Spinner } from "@ds/ui/ui/spinner";
import { Switch } from "@ds/ui/ui/switch";
import { Textarea } from "@ds/ui/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";
import {
  Activity,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  Inbox,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileText,
  Filter,
  Info,
  Monitor,
  Search,
  X,
  KeyRound,
  LayoutDashboard,
  Maximize2,
  Pencil,
  Plus,
  RefreshCw,
  Ship,
  Star,
  Trash2,
} from "lucide-react";

function Strip({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="flex items-center justify-center gap-3 border border-border bg-background"
      style={{ width: 560, height: 120 }}
    >
      {children}
    </section>
  );
}

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

export default function ShadcnPreview() {
  return (
    <main className="flex flex-col gap-10 bg-background p-10 text-foreground">
      {/* 캡처 오염 방지 — Next dev 인디케이터 숨김 */}
      <style>{`nextjs-portal { display: none; }`}</style>
      {/* 1. 앱 셸 — Sidebar + SidebarInset */}
      <section id="pv-app-shell" className="w-fit border border-border">
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
      </section>

      {/* 2. 사이드바 내비 — SidebarMenu 단독 */}
      <section id="pv-sidebar-nav" className="w-fit border border-border">
        <SidebarProvider className="min-h-0 w-fit">
          <Sidebar collapsible="none" style={{ height: 480 }}>
            <SidebarContent>
              <NavGroups />
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </section>

      {/* 3. 페이지 헤더 — 조합 (직접 대응 컴포넌트 없음) */}
      <section
        id="pv-page-header"
        className="flex items-center justify-between border border-border bg-background px-6"
        style={{ width: 960, height: 76 }}
      >
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
      </section>

      {/* 4. 브레드크럼 — Breadcrumb */}
      <section
        id="pv-breadcrumb"
        className="flex items-center border border-border bg-background px-6"
        style={{ width: 640, height: 56 }}
      >
        <DemoBreadcrumb />
      </section>

      {/* ── 버튼 배치 ── */}
      <Strip id="pv-btn-basic">
        <Button>채움</Button>
        <Button variant="outline">아웃라인</Button>
        <Button variant="ghost">텍스트</Button>
      </Strip>
      <Strip id="pv-btn-destructive">
        <Button variant="destructive">삭제</Button>
        <Button variant="destructive-outline">제품 삭제</Button>
      </Strip>
      <Strip id="pv-btn-states">
        <Button disabled>비활성</Button>
        <Button disabled>
          <Spinner /> 처리 중…
        </Button>
      </Strip>
      <Strip id="pv-btn-split">
        <ButtonGroup>
          <Button variant="outline">
            <Download /> 내보내기
          </Button>
          <Button variant="outline" size="icon" aria-label="옵션">
            <ChevronDown />
          </Button>
        </ButtonGroup>
      </Strip>
      <Strip id="pv-btn-icon">
        <Button variant="ghost" size="icon" aria-label="복사"><Copy /></Button>
        <Button variant="ghost" size="icon" aria-label="새로고침"><RefreshCw /></Button>
        <Button variant="ghost" size="icon" aria-label="편집"><Pencil /></Button>
        <Button variant="ghost" size="icon" aria-label="삭제"><Trash2 /></Button>
        <Button variant="ghost" size="icon" aria-label="전체화면"><Maximize2 /></Button>
      </Strip>
      <Strip id="pv-btn-dashed">
        <Button variant="outline" className="w-2/3 border-dashed">
          <Plus /> Source 추가
        </Button>
      </Strip>
      <Strip id="pv-btn-fab">
        <Button size="icon" className="size-12 rounded-full" aria-label="리포트">
          <FileText />
        </Button>
      </Strip>

      {/* ── 피드백(인라인)·시각화 배치 ── */}
      <section id="pv-fb-banner" className="flex flex-col gap-3 border border-border bg-background p-6" style={{ width: 640 }}>
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
      </section>
      <section id="pv-fb-note" className="border border-border bg-background p-6" style={{ width: 640 }}>
        <Alert>
          <Info className="size-4" />
          <AlertTitle>안내</AlertTitle>
          <AlertDescription>별 아이콘을 눌러 권장 버전을 설정할 수 있습니다. 모든 변경사항은 즉시 반영됩니다.</AlertDescription>
        </Alert>
      </section>
      <section id="pv-fb-empty" className="border border-border bg-background p-4" style={{ width: 560 }}>
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
            <EmptyTitle>등록된 메모가 없습니다</EmptyTitle>
            <EmptyDescription>새 메모를 추가하면 여기에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" size="sm"><Plus /> 새 메모</Button>
        </Empty>
      </section>
      <section id="pv-fb-console" className="border border-border bg-background p-6" style={{ width: 640 }}>
        <div className="relative rounded-lg bg-foreground p-4 font-mono text-xs text-background">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 size-6 text-background hover:bg-background/20" aria-label="복사"><Copy /></Button>
          <div>[2026-07-28 15:23:01] update requested (id: 7b74)</div>
          <div>[2026-07-28 15:23:04] pulling image hidom-2.0-backend:v3.5.0</div>
          <div className="text-destructive">[2026-07-28 15:24:12] ERROR: agent unreachable</div>
        </div>
      </section>
      <section id="pv-viz-line" className="border border-border bg-background p-6" style={{ width: 640 }}>
        <ChartContainer config={lineConfig} className="h-56 w-full">
          <LineChart data={lineData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={8} />
            <Line dataKey="v" type="monotone" stroke="var(--foreground)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </section>
      <section id="pv-viz-donut" className="border border-border bg-background p-6" style={{ width: 560 }}>
        <ChartContainer config={pieConfig} className="mx-auto h-56 w-full">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
              {pieData.map((e) => (<Cell key={e.name} fill={e.fill} />))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </section>

      {/* ── 폼 배치 ── */}
      <section id="pv-form-text" className="flex items-center border border-border bg-background px-10" style={{ width: 560, height: 150 }}>
        <Field>
          <FieldLabel htmlFor="f-name">호선명 <span className="text-destructive">*</span></FieldLabel>
          <Input id="f-name" placeholder="예: Avikus Ship" />
        </Field>
      </section>
      <section id="pv-form-number" className="flex items-center gap-4 border border-border bg-background px-10" style={{ width: 560, height: 150 }}>
        <Field>
          <FieldLabel htmlFor="f-loa">LOA (m)</FieldLabel>
          <Input id="f-loa" type="number" defaultValue={200} />
        </Field>
        <Field>
          <FieldLabel htmlFor="f-lbp">LBP (m)</FieldLabel>
          <Input id="f-lbp" type="number" defaultValue={180} />
        </Field>
      </section>
      <section id="pv-form-search" className="flex items-center border border-border bg-background px-10" style={{ width: 560, height: 120 }}>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="키워드 검색" />
        </InputGroup>
      </section>
      <section id="pv-form-textarea" className="flex items-center border border-border bg-background px-10" style={{ width: 560, height: 190 }}>
        <Field>
          <FieldLabel htmlFor="f-desc">설명</FieldLabel>
          <Textarea id="f-desc" placeholder="변경 사항을 입력하세요" rows={3} />
          <div className="text-right text-xs text-muted-foreground">0 / 200</div>
        </Field>
      </section>
      <section id="pv-form-select" className="flex items-center gap-4 border border-border bg-background px-10" style={{ width: 560, height: 130 }}>
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
      </section>
      <section id="pv-form-controls" className="flex items-center justify-center gap-8 border border-border bg-background px-8" style={{ width: 560, height: 140 }}>
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
      </section>
      <section id="pv-form-choicecard" className="flex items-center justify-center gap-4 border border-border bg-background px-8" style={{ width: 560, height: 150 }}>
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
      </section>
      <section id="pv-form-segment" className="flex items-center justify-center border border-border bg-background" style={{ width: 560, height: 120 }}>
        <ToggleGroup type="single" defaultValue="all" variant="outline">
          <ToggleGroupItem value="all">전체</ToggleGroupItem>
          <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
          <ToggleGroupItem value="not">미설치</ToggleGroupItem>
        </ToggleGroup>
      </section>
      <section id="pv-form-tags" className="flex items-center border border-border bg-background px-10" style={{ width: 560, height: 130 }}>
        <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-input px-3 py-2 shadow-xs">
          <Badge variant="secondary">NAVIGATION <X className="size-3" /></Badge>
          <Badge variant="secondary">SVM <X className="size-3" /></Badge>
          <span className="text-sm text-muted-foreground">새 태그 입력…</span>
        </div>
      </section>
      <section id="pv-form-daterange" className="flex w-fit items-center justify-center border border-border bg-background p-4">
        <Calendar
          mode="range"
          numberOfMonths={1}
          defaultMonth={new Date(2026, 6, 1)}
          selected={{ from: new Date(2026, 6, 7), to: new Date(2026, 6, 21) }}
        />
      </section>
      <section id="pv-form-file" className="flex items-center border border-border bg-background px-10" style={{ width: 560, height: 150 }}>
        <Field>
          <FieldLabel htmlFor="f-file">첨부 파일</FieldLabel>
          <Input id="f-file" type="file" />
        </Field>
      </section>
      {/* ── 데이터 표시 배치 ── */}
      <section id="pv-data-table" className="border border-border bg-background p-6" style={{ width: 640 }}>
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
      </section>
      <section id="pv-data-kv" className="border border-border bg-background p-4" style={{ width: 560 }}>
        <ItemGroup>
          <Item size="sm"><ItemContent><ItemDescription>IMO</ItemDescription><ItemTitle>9876543</ItemTitle></ItemContent></Item>
          <Item size="sm"><ItemContent><ItemDescription>호선명</ItemDescription><ItemTitle>SVM_BUSAN_1</ItemTitle></ItemContent></Item>
          <Item size="sm"><ItemContent><ItemDescription>Yard</ItemDescription><ItemTitle>HMD</ItemTitle></ItemContent></Item>
        </ItemGroup>
      </section>
      <section id="pv-data-colhead" className="border border-border bg-background p-6" style={{ width: 560 }}>
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
      </section>
      <section id="pv-data-cells" className="border border-border bg-background p-6" style={{ width: 640 }}>
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
      </section>
      <section id="pv-data-status" className="flex items-center justify-center gap-3 border border-border bg-background" style={{ width: 560, height: 120 }}>
        <Badge variant="secondary"><span className="size-1.5 rounded-full bg-success"></span> 정상</Badge>
        <Badge variant="secondary"><span className="size-1.5 rounded-full bg-destructive"></span> 이상</Badge>
        <Badge variant="outline">CAUTION</Badge>
        <Badge variant="outline">COMPLETED</Badge>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-success"></span> Ready</span>
      </section>
      <section id="pv-data-badge" className="flex items-center justify-center gap-3 border border-border bg-background" style={{ width: 560, height: 120 }}>
        <Badge>NAVIGATION</Badge>
        <Badge variant="secondary">SVM</Badge>
        <Badge variant="outline">CONTROL</Badge>
        <Badge variant="destructive">HIGH 9</Badge>
        <Badge variant="secondary" className="rounded-full">34</Badge>
      </section>
      <section id="pv-data-verchip" className="flex items-center justify-center gap-3 border border-border bg-background" style={{ width: 560, height: 120 }}>
        <Badge variant="outline" className="font-mono">v3.5.0-test.15</Badge>
        <ArrowRight className="size-4 text-muted-foreground" />
        <Badge variant="outline" className="font-mono">v4.0.0-update.1</Badge>
      </section>
      <section id="pv-data-roletag" className="flex items-center justify-center gap-2 border border-border bg-background" style={{ width: 560, height: 120 }}>
        <Badge variant="secondary">avikus <X className="size-3" /></Badge>
        <Badge variant="secondary">qa <X className="size-3" /></Badge>
        <Badge variant="secondary">service_engineer <X className="size-3" /></Badge>
        <Badge variant="outline">+ 역할 추가</Badge>
      </section>
      <section id="pv-data-matrix" className="border border-border bg-background p-6" style={{ width: 640 }}>
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
      </section>
      <section id="pv-data-perm" className="border border-border bg-background p-6" style={{ width: 640 }}>
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
      </section>
      <section id="pv-data-stat" className="grid grid-cols-2 gap-4 border border-border bg-background p-6" style={{ width: 640 }}>
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
      </section>
      <section id="pv-data-accordion" className="border border-border bg-background px-6 py-2" style={{ width: 560 }}>
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
      </section>
      <section id="pv-data-tabs" className="flex flex-col items-start gap-4 border border-border bg-background p-6" style={{ width: 560 }}>
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
      </section>
      <section id="pv-data-pagination" className="flex items-center justify-center border border-border bg-background" style={{ width: 560, height: 110 }}>
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
      </section>
      <section id="pv-data-progress" className="flex items-center gap-4 border border-border bg-background px-10" style={{ width: 560, height: 110 }}>
        <Progress value={62} className="flex-1" />
        <span className="font-mono text-sm text-muted-foreground">62%</span>
        <Spinner className="text-muted-foreground" />
      </section>
      <section id="pv-data-tree" className="border border-border bg-background p-4" style={{ width: 400 }}>
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
      </section>
      <section id="pv-data-timeline" className="border border-border bg-background p-6" style={{ width: 400 }}>
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
      </section>
      <section id="pv-data-stepper" className="border border-border bg-background p-6" style={{ width: 720 }}>
        <Stepper>
          <StepperItem step={1} state="completed">업데이트 옵션 설정</StepperItem>
          <StepperItem step={2} state="completed">업데이트 내용</StepperItem>
          <StepperItem step={3} state="completed">업데이트 항목 조회</StepperItem>
          <StepperItem step={4} state="current">이미지 다운로드</StepperItem>
          <StepperItem step={5} state="upcoming">업데이트 적용</StepperItem>
        </Stepper>
      </section>
      <section id="pv-data-listrow" className="border border-border bg-background p-4" style={{ width: 480 }}>
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
      </section>

      <section id="pv-form-chipgrid" className="flex items-center justify-center border border-border bg-background p-6" style={{ width: 560, height: 200 }}>
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
      </section>
    </main>
  );
}
