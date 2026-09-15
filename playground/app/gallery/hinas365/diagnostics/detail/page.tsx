"use client";

// 자가 진단 — 호선 진단 상세 (SVM_TEST3 · SVM)
// ① HiNAS 365 메인 레이아웃 + B 상세 본문 (좌 진단 패널 + 우 차트·히트맵)
// 원천: Avikus Design library 「자가 진단」 캡처 (6)(7)(8)(9)(10)
//
// 원본 대조 메모
// - 좌 패널: REFERENCE TIME(Latest / 시점 선택 시 SELECTED TIME 파랑 헤더) ·
//   RECORDED AT · DIAGNOSIS DETAILS 아코디언(항목별 정상/이상 칩, SYSTEM 펼침:
//   CPU·Memory + 진단 기준 + [상세 정보 확인]→System JSON 모달) ·
//   SYSTEM TOOLS & RESOURCES(Remote Support·Docker Image List·Storage Data List)
// - 우 본문: System·Disk Usage 라인 차트(viz-line 미채택 → 자리표시) ·
//   Network Status(빈 상태) · Camera Status 히트맵 · Pod Status 히트맵(Expand All)
// - 우하단 고정: 제품 선택 + 조회 기간(3H/24H/3D/1W/2W/1M) — 본문 컬럼 내 sticky
// - Product Quick View 패널(캡처 (9)) → 제목 옆 버튼으로 열리는 시트
// - 히트맵 톤: NORMAL=success · ABNORMAL=destructive · UNDETERMINABLE/Succeeded=primary
//   · Pending(노랑)=primary 대체(DES-206) · NoData=muted
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { Card } from "@ds/ui/ui/card";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import {
  ChevronRight,
  Code,
  Container,
  HardDrive,
  Info,
  Monitor,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ds/ui/ui/accordion";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@ds/ui/ui/item";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";

// System JSON 원본(목업) — 모달의 상세 테이블과 같은 값. 원본 JSON 탭이 실제로 이 값을 보여준다(2026-09-15, 종전엔 토글이 장식이었다)
const SYSTEM_RAW = {
  network: {
    status: false,
    list: [
      { name: "Desktop", address: "10.0.100.101", status: false },
      { name: "Jetson", address: "10.0.100.10", status: false },
      { name: "Firewall", address: "10.0.100.1", status: false },
    ],
  },
  disk: { status: true },
};

/* ---------------------------------------------------------------- 상수 */

const DIAG_ITEMS: { key: string; status: "정상" | "이상" }[] = [
  { key: "CAMERA", status: "이상" },
  { key: "SYSTEM", status: "정상" },
  { key: "SENSOR", status: "이상" },
  { key: "STORAGE", status: "정상" },
  { key: "NTP", status: "정상" },
  { key: "POD", status: "정상" },
];

const TOOLS = [
  { icon: Monitor, label: "Remote Support (Rustdesk)", count: null },
  { icon: Container, label: "Docker Image List", count: 34 },
  { icon: HardDrive, label: "Storage Data List", count: null },
];

// 히트맵 톤 — DES-206: 노랑·파랑 계열은 primary 대체
type Cell = "ok" | "bad" | "mid" | "none";
const CELL_CLS: Record<Cell, string> = {
  ok: "bg-success",
  bad: "bg-destructive",
  mid: "bg-primary",
  none: "bg-muted",
};

const DAYS = ["07-21", "07-22", "07-23", "07-24", "07-25", "07-26", "07-27", "07-28"];

const CAMERA_ROWS: { name: string; cells: Cell[] }[] = [
  { name: "bow", cells: ["none", "bad", "bad", "bad", "bad", "none", "none", "none"] },
  { name: "port-1", cells: ["none", "ok", "bad", "bad", "bad", "none", "none", "none"] },
  { name: "port-2", cells: ["none", "bad", "bad", "bad", "bad", "none", "none", "none"] },
  { name: "stbd-1", cells: ["none", "ok", "bad", "bad", "bad", "none", "none", "none"] },
  { name: "stbd-2", cells: ["none", "ok", "bad", "bad", "bad", "none", "none", "none"] },
  { name: "stern", cells: ["none", "bad", "bad", "bad", "bad", "none", "none", "none"] },
];

const POD_ROWS: { name: string; group?: boolean; cells: Cell[] }[] = [
  { name: "adta-0", cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "adta-frontend-0", cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "argocd", group: true, cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "auth", group: true, cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "codecommit-creds-refresh", cells: ["mid", "none", "none", "none", "none", "none", "none", "none"] },
  { name: "codecommit-creds-refresh-2", cells: ["none", "mid", "none", "none", "none", "none", "none", "none"] },
  { name: "core-redis", cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "core-engram-0", cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "coredns", group: true, cells: ["none", "ok", "ok", "ok", "ok", "none", "none", "none"] },
  { name: "disk-manager", group: true, cells: ["none", "ok", "bad", "ok", "ok", "none", "none", "none"] },
];

const PERIODS = [
  { value: "3H", hint: "3시간" },
  { value: "24H", hint: "24시간" },
  { value: "3D", hint: "3일" },
  { value: "1W", hint: "1주" },
  { value: "2W", hint: "2주" },
  { value: "1M", hint: "1개월" },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

/* ---------------------------------------------------------------- 페이지 */

export default function DiagnosticDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [period, setPeriod] = React.useState("1W");

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold">
          SVM_TEST3 <span className="text-secondary-foreground">· SVM</span>
        </h1>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          <Button variant="outline" size="sm" onClick={() => setQuickOpen(true)}>
            <Info className="size-4" /> Product Quick View
          </Button>
        </div>
      </div>

      {view === "loading" && <BlockSkeleton />}
      {view === "progress" && (
        <Card variant="flat" className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">진단 데이터를 불러오는 중입니다…</p>
        </Card>
      )}

      {view === "error" && (
        <ErrorState
            title="진단 데이터를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>선택한 기간에 수집된 데이터가 없습니다</EmptyTitle>
            <EmptyDescription>제품이나 조회 기간을 변경해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <div className="flex flex-col items-start gap-4 xl:flex-row">
          {/* ── 좌: 진단 패널 ── */}
          <aside className="w-full shrink-0 space-y-4 xl:w-72">
            <Card variant="flat" className="space-y-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-secondary-foreground">
                  Reference Time
                </p>
                <p className="font-medium">Latest</p>
              </div>
              <p className="text-xs text-secondary-foreground">
                타임라인에서 시점을 선택하면 해당 시점의 진단 결과를 확인할 수 있습니다.
              </p>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-semibold uppercase text-secondary-foreground">Recorded At</p>
                <p className="text-sm font-medium">2026-07-24 10:06:44 KST</p>
                <p className="text-xs text-secondary-foreground">4일 5시간 전</p>
              </div>
            </Card>

            <Card variant="flat" className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                Diagnosis Details
              </p>
              <Accordion type="multiple" defaultValue={["SYSTEM"]}>
                {DIAG_ITEMS.map((d) => (
                  <AccordionItem key={d.key} value={d.key}>
                    <AccordionTrigger className="py-3 text-sm hover:no-underline">
                      <span className="flex w-full items-center justify-between pr-2">
                        <span className="font-semibold">{d.key}</span>
                        {/* data-status — DS StatusBadge(아웃라인 없음, 도트 8px + text-sm), 2026-09-14 부품으로 통일 */}
                        {d.status === "정상" ? (
                          <StatusBadge label="정상" tone="success" bg={false} className="font-normal" />
                        ) : (
                          <StatusBadge label="이상" tone="error" bg={false} className="font-normal" />
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {d.key === "SYSTEM" ? (
                        <>
                          <p className="text-xs font-medium uppercase text-secondary-foreground">
                            주요 진단 정보
                          </p>
                          <ItemGroup>
                            <Item size="sm">
                              <ItemContent>
                                <ItemDescription>CPU Usage</ItemDescription>
                              </ItemContent>
                              <span className="text-sm font-medium">9.2%</span>
                            </Item>
                            <Item size="sm">
                              <ItemContent>
                                <ItemDescription>Memory Usage</ItemDescription>
                              </ItemContent>
                              <span className="text-sm font-medium">25.0%</span>
                            </Item>
                          </ItemGroup>
                          <div className="rounded-lg bg-muted p-3 text-xs text-secondary-foreground">
                            <p className="mb-1 font-medium text-foreground">설명 및 진단 기준</p>
                            CPU 및 메모리 사용량이 75% 미만인지 확인합니다.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setJsonOpen(true)}
                          >
                            <Code className="size-4" /> 상세 정보 확인
                          </Button>
                        </>
                      ) : (
                        <p className="text-xs text-secondary-foreground">
                          진단 항목 상세 — 원본 캡처에서 접혀 있어 자리만 잡아 둡니다.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            <Card variant="flat" className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                System Tools &amp; Resources
              </p>
              <div className="space-y-1">
                {TOOLS.map(({ icon: Icon, label, count }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-secondary-foreground" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {count !== null && (
                      <span className="text-xs text-secondary-foreground">{count}</span>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-secondary-foreground" />
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          {/* ── 우: 차트·히트맵 ── */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* System 차트 — viz-line 미채택 */}
            <ChartCard
              title="System"
              desc="CPU 및 메모리 사용률 추이"
              legend={[
                ["CPU Usage 9%", "bg-foreground"],
                ["Memory Usage 24%", "bg-primary"],
              ]}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard
                title="Disk Usage"
                desc="디스크 볼륨별 읽기/쓰기 사용량 추이"
                legend={[
                  ["SSD Storage Usage 15%", "bg-primary"],
                  ["HDD Storage Usage 0%", "bg-success"],
                ]}
              />
              <Card variant="flat" className="p-4">
                <h2 className="text-sm font-medium text-secondary-foreground">Network Status</h2>
                <p className="text-xs text-secondary-foreground">
                  네트워크 인터페이스별 인/아웃바운드 트래픽 추이
                </p>
                <Empty className="mt-4 border-none">
                  <EmptyHeader>
                    <EmptyTitle>선택한 기간에 수집된 데이터가 없습니다</EmptyTitle>
                    <EmptyDescription>제품이나 조회 기간을 변경해 보세요.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Card>
            </div>

            {/* Camera Status 히트맵 */}
            <HeatmapCard
              title="Camera Status"
              desc="연결된 카메라의 시간대별 동작 상태"
              legend={[
                ["NORMAL", "bg-success"],
                ["NO_DATA", "bg-muted"],
                ["UNDETERMINABLE", "bg-primary"],
                ["ABNORMAL", "bg-destructive"],
              ]}
              rows={CAMERA_ROWS}
              colLabel="Camera"
            />

            {/* Pod Status 히트맵 */}
            <HeatmapCard
              title="Pod Status"
              desc="각 파드의 시간대별 실행 상태"
              legend={[
                ["Running", "bg-success"],
                ["Succeeded / Completed", "bg-primary"],
                ["Pending / NotReady", "bg-primary"],
                ["Error", "bg-destructive"],
                ["NoData", "bg-muted"],
              ]}
              rows={POD_ROWS}
              colLabel="Pod"
              expandAll
            />

            {/* 우하단 고정 — 본문 컬럼 내 sticky (전폭 고정 금지) */}
            <div className="sticky bottom-4 flex justify-end">
              <div className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-sm">
                <Select defaultValue="SVM">
                  <SelectTrigger size="sm" aria-label="제품 선택" className="w-28">
                    <span className="text-xs text-secondary-foreground">제품</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["SVM", "Control", "Navigation"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger size="sm" aria-label="조회 기간" className="w-28">
                    <span className="text-xs text-secondary-foreground">기간</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.value} <span className="text-secondary-foreground">({p.hint})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── System JSON 모달 ── */}
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>System JSON</DialogTitle>
            <DialogDescription>SYSTEM 진단의 원본 데이터입니다.</DialogDescription>
          </DialogHeader>
          {/* 표 | JSON 전환 = DS line 탭(2026-09-15 관리자 지시 — ToggleGroup 폐기). 탭이 실제로 패널을 바꾼다 */}
          <Tabs defaultValue="table">
            <div className="border-b">
              <TabsList variant="line">
                <TabsTrigger value="table">상세 테이블</TabsTrigger>
                <TabsTrigger value="json">원본 JSON</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="json">
              <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 font-mono text-xs">
                {JSON.stringify(SYSTEM_RAW, null, 2)}
              </pre>
            </TabsContent>
            <TabsContent value="table">
          <div className="max-h-96 overflow-y-auto rounded-lg border">
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">Property</TableHead>
                  <TableHead className="uppercase">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SectionRow label="NETWORK" />
                <KVRow k="Status" v={<BoolChip ok={false} />} />
                <SectionRow label="DATA · NETWORK STATUS LIST" />
                {(
                  [
                    ["Desktop", "10.0.100.101"],
                    ["Jetson", "10.0.100.10"],
                    ["Firewall", "10.0.100.1"],
                  ] as const
                ).map(([name, addr]) => (
                  <React.Fragment key={name}>
                    <KVRow k="Name" v={name} />
                    <KVRow k="Address" v={<span className="font-mono">{addr}</span>} />
                    <KVRow k="Status" v={<BoolChip ok={false} />} />
                  </React.Fragment>
                ))}
                <SectionRow label="DISK" />
                <KVRow k="Status" v={<BoolChip ok />} />
              </TableBody>
            </Table>
          </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Product Quick View — DetailPanel 프리셋(md 요약형, 채택 51종째) ── */}
      <DetailPanel
        open={quickOpen}
        onOpenChange={setQuickOpen}
        size="md"
        control={
          <span className="text-xs font-medium uppercase text-secondary-foreground">
            Product Quick View
          </span>
        }
        title="SVM"
        meta={<span>SVM_TEST3의 svm 정보를 빠르게 확인합니다.</span>}
      >
        <>
            <section className="space-y-1">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">Ship 정보</p>
              <ItemGroup>
                <QV k="Name" v="SVM_TEST3" />
                <QV k="IMO" v="SVM_TEST3" />
                <QV k="Hull" v="SVM_TEST3" />
                <QV k="Product" v="SVM" />
              </ItemGroup>
            </section>
            <section className="space-y-1">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">제품 버전 정보</p>
              <ItemGroup>
                <QV k="Common Version" v="v4.0.0-test.161" mono />
                <QV k="Product Version" v="v2.0.0-rc.4" mono />
                <QV k="Server Type" v="NUVO-10108GC-NX" mono />
                <QV k="Created At" v="2026-07-23 13:36 (5일 1시간 전)" />
                <QV k="Created By" v="Seonghun Jung (seonghun.jung@avikus.ai)" />
              </ItemGroup>
            </section>
            <section className="space-y-1">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">제품 옵션 정보</p>
              <ItemGroup>
                <QV k="Dta Mode" v="standard" />
                <QV k="Dta Expire" v="10" />
              </ItemGroup>
            </section>
        </>
      </DetailPanel>
    </div>
  );
}

/* ---------------------------------------------------------------- 조각 */

// 라인 차트 — viz-line 미채택 어휘 → 회색 점선 자리표시 + 범례만
function ChartCard({
  title,
  desc,
  legend,
}: {
  title: string;
  desc: string;
  legend: [string, string][];
}) {
  return (
    <Card variant="flat" className="p-4">
      <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>
      <p className="text-xs text-secondary-foreground">{desc}</p>
      <div className="mt-2 flex flex-wrap gap-4">
        {legend.map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1.5 text-sm">
            <span className={"size-2 rounded-full " + cls} />
            {label}
          </span>
        ))}
      </div>
      {/* 미채택 어휘 자리표시 = DS Empty size=sm(2026-09-15) — 차트 높이만 유지 */}
      <Empty size="sm" className="mt-3 h-48 justify-center">
        <p className="text-center">
          미채택: viz-line
          <br />
          <span className="text-xs">라인 차트 자리 — 어휘 채택 후 렌더</span>
        </p>
      </Empty>
    </Card>
  );
}

function HeatmapCard({
  title,
  desc,
  legend,
  rows,
  colLabel,
  expandAll,
}: {
  title: string;
  desc: string;
  legend: [string, string][];
  rows: { name: string; group?: boolean; cells: Cell[] }[];
  colLabel: string;
  expandAll?: boolean;
}) {
  return (
    <Card variant="flat" className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>
          <p className="text-xs text-secondary-foreground">{desc}</p>
        </div>
        {expandAll && (
          <Button variant="ghost" size="sm" className="text-secondary-foreground">
            Expand All
          </Button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-4">
        {legend.map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-secondary-foreground">
            <span className={"size-2 rounded-full " + cls} />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-48 py-2 text-left text-xs font-medium uppercase text-secondary-foreground">
                {colLabel}
              </th>
              {DAYS.map((d) => (
                <th key={d} className="py-2 text-left text-xs font-normal text-secondary-foreground">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="max-w-48 truncate py-1 pr-4 font-mono text-sm">
                  {r.group && <span className="mr-1 text-secondary-foreground">+</span>}
                  {r.name}
                </td>
                {r.cells.map((c, i) => (
                  <td key={i} className="py-1 pr-1">
                    {c === "none" ? (
                      <span className="block h-5 w-full min-w-8 rounded-sm bg-muted opacity-40" />
                    ) : (
                      <span
                        className={"block h-5 w-full min-w-8 rounded-sm " + CELL_CLS[c]}
                        title={`${r.name} · ${DAYS[i]}`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <TableRow className="bg-muted hover:bg-muted">
      <TableCell colSpan={2} className="py-2 text-xs font-semibold uppercase text-secondary-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function KVRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-sm text-secondary-foreground">• {k}</TableCell>
      <TableCell className="text-sm">{v}</TableCell>
    </TableRow>
  );
}

// data-status 확정 스펙 — 아웃라인 없음, 도트+텍스트(위험만 동색)
function BoolChip({ ok }: { ok: boolean }) {
  return ok ? (
    <StatusBadge label="TRUE" tone="success" bg={false} mono />
  ) : (
    <StatusBadge label="FALSE" tone="error" bg={false} mono />
  );
}

function QV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <Item size="sm">
      <ItemContent>
        <ItemDescription>{k}</ItemDescription>
        <ItemTitle className={mono ? "font-mono" : undefined}>{v}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

