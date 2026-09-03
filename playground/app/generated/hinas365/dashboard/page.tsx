"use client";

// 대시보드 — ① HiNAS 365 메인 레이아웃 + 대시보드 본문(카드 그리드)
// 원천: Avikus Design library 「대시보드」 캡처 1/2
//
// 원본 대조 메모
// - 우측 상단: "업데이트 15:43:02 (KST)" + [새로고침]
// - 1행: 운영 현황(전체/데이터 수신/인터넷 미연결) · 진단 결과(Camera 이상/장비 이상/Normal)
//        · 업데이트 현황(대기→다운로드→적용 대기→적용 중 | 완료·실패/롤백·취소)
// - 2행: SVM(빈)·Control·Navigation 버전 현황 + 선주별 납품 현황, 카드마다 [전체 보기]
// - 진단 위계(2026-08-24 확정): Camera 이상 = 최심각(숫자·라벨 빨강) · 장비 이상 = 기본색 (CAUTION 폐기)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { CardGridSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ChevronDown, Download, Info, RefreshCw } from "lucide-react";
import { Label as RechartsLabel, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@ds/ui/ui/chart";

import { Button } from "@ds/ui/ui/button";
import {
  Dialog,
  DialogContent,
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
import { ErrorState } from "@ds/ui/ui/error-state";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

// 버전 현황 3종 — 도넛(중앙 설치 수·아래 전체 수) + 범례 색 리스트 (viz-donut 채택 후 개편)
type VersionDonut = {
  title: string;
  installed: number;
  total: number;
  rows: { version: string; ships: number }[];
};

const VERSION_DONUTS: VersionDonut[] = [
  {
    title: "SVM 버전 현황",
    installed: 48,
    total: 56,
    rows: [
      { version: "v3.2.1", ships: 18 },
      { version: "v3.2.0", ships: 14 },
      { version: "v3.1.8", ships: 9 },
      { version: "v3.1.7", ships: 5 },
      { version: "v3.0.9", ships: 2 },
    ],
  },
  {
    // 6종 초과 케이스 시연용 — 카드는 상위 5개, [더보기] 모달이 전체 9종을 보여준다
    title: "Control 버전 현황",
    installed: 10,
    total: 56,
    rows: [
      { version: "v3.0.0-rc.5", ships: 2 },
      { version: "v3.0.0-rc.8", ships: 1 },
      { version: "v3.99.17-anduril", ships: 1 },
      { version: "v3.99.18-anduril", ships: 1 },
      { version: "v3.99.20-anduril", ships: 1 },
      { version: "v3.99.21-anduril", ships: 1 },
      { version: "v3.99.22-anduril", ships: 1 },
      { version: "v2.8.4", ships: 1 },
      { version: "v2.7.1", ships: 1 },
    ],
  },
  {
    title: "Navigation 버전 현황",
    installed: 4,
    total: 56,
    rows: [
      { version: "v3.7.0-rc.7", ships: 1 },
      { version: "v3.99.6-anduril", ships: 1 },
      { version: "v3.99.7-anduril", ships: 1 },
      { version: "v3.99.9-anduril", ships: 1 },
    ],
  },
];

// 선주별 납품 현황 — 버전이 아니므로 리스트 유지
const OWNER_ROWS: [string, string][] = [
  ["Anduril", "3척"],
  ["DEV_CONTROL_ENC", "1척"],
  ["DEV_CONTROL_TEST", "1척"],
  ["gpu_update_test_1", "1척"],
  ["REAL_REAL_FINAL_TEST", "1척"],
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function DashboardPage() {
  const [view, setView] = React.useState<ViewState>("default");
  // [더보기] 모달 — 세 카드가 하나의 Dialog를 공유(열린 카드만 담는다)
  const [detailCard, setDetailCard] = React.useState<VersionDonut | null>(null);

  return (
    <TooltipProvider>
      {/* 섹션 리듬 — 전 페이지 공통 24px(사용자 확정). shadow-card 55%는 토큰에 정식 등재됨 */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-bold">대시보드</h1>
          <div className="flex items-center gap-2">
            <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
            <span className="text-sm text-secondary-foreground">업데이트 15:43:02 (KST)</span>
            <Button variant="ghost" size="sm">
              <RefreshCw className="size-4" /> 새로고침
            </Button>
          </div>
        </div>

        {view === "loading" && <CardGridSkeleton />}
        {view === "progress" && (
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <Progress value={62} className="flex-1" />
              <span className="font-mono text-sm text-secondary-foreground">62%</span>
            </div>
            <p className="text-sm text-secondary-foreground">대시보드 데이터를 불러오는 중입니다…</p>
          </div>
        )}

        {view === "error" && (
          <ErrorState
            title="대시보드를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {view === "empty" && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>표시할 데이터가 없습니다.</EmptyTitle>
              <EmptyDescription>연결된 호선이 등록되면 현황이 표시됩니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {view === "default" && (
          <>
            {/* ── 1행: 진단 결과 · 업데이트 현황 (피그마 172-3899 실측)
                균등 2분할 · 보더 없음+연한 그림자 · 항목 flex-1 균등 분할 ·
                첫 항목 pl-4(16px), 컨테이너 px-2 · 마지막 항목 border-l+pl-8 · footer 선 없음 pl-6 ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg bg-card shadow-card">
                <div className="flex items-center gap-1.5 px-4 pb-1 pt-3">
                  <h2 className="text-sm font-medium text-secondary-foreground">총 설치호선 (27) 진단</h2>
                  <Info className="size-3.5 text-secondary-foreground" />
                </div>
                <div className="flex items-stretch px-2 pb-6 pt-4">
                  {/* CAUTION 폐기(2026-08-24) — 원인 기반 2분: Camera 이상(최심각, 글자까지 빨강)·장비 이상 */}
                  {(
                    [
                      ["1", "Camera 이상", "text-destructive", "text-destructive", "pl-4"],
                      ["3", "장비 이상", "", "text-secondary-foreground", "pl-2"],
                    ] as const
                  ).map(([value, label, numTone, labelTone, inset]) => (
                    <Link
                      key={label}
                      href={`/generated/hinas365/diagnostics?status=${label}`}
                      className={"min-w-0 flex-1 rounded-md py-1 hover:bg-accent " + inset}
                    >
                      <p className={"text-2xl font-bold " + numTone}>{value}</p>
                      <p className={"mt-1 truncate text-sm " + labelTone}>{label}</p>
                    </Link>
                  ))}
                  {/* 인터넷 미연결 — 클릭 비활성, 좌측 구분선 + pl-8 */}
                  <div className="min-w-0 flex-1 border-l py-1 pl-8">
                    <p className="text-2xl font-bold">0</p>
                    <p className="mt-1 truncate text-sm text-secondary-foreground">인터넷 미연결</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg bg-card shadow-card">
                <div className="flex items-center gap-1.5 px-4 pb-1 pt-3">
                  <h2 className="text-sm font-medium text-secondary-foreground">업데이트 현황</h2>
                  <Info className="size-3.5 text-secondary-foreground" />
                </div>
                <div className="flex items-stretch px-2 pb-6 pt-4">
                  {(
                    [
                      ["15", "실패/롤백", "text-destructive", "pl-4"],
                      ["22", "완료", "text-success", "pl-2"],
                    ] as const
                  ).map(([value, label, tone, inset]) => (
                    <div key={label} className={"min-w-0 flex-1 py-1 " + inset}>
                      <p className={"text-2xl font-bold " + tone}>{value}</p>
                      <p className="mt-1 truncate text-sm text-secondary-foreground">{label}</p>
                    </div>
                  ))}
                  <div className="min-w-0 flex-1 border-l py-1 pl-8">
                    <p className="text-2xl font-bold">9</p>
                    <p className="mt-1 truncate text-sm text-secondary-foreground">취소</p>
                  </div>
                </div>
                {/* 진행 파이프라인 — 숫자만 볼드, 호버 전체 밑줄 → 업데이트 페이지 */}
                <Link
                  href="/generated/hinas365/updates"
                  className="flex flex-wrap items-center gap-3 pb-3 pl-6 text-sm hover:underline"
                >
                  <span>
                    대기(<span className="font-bold">8</span>)
                  </span>
                  <span className="text-secondary-foreground">›</span>
                  <span>
                    다운로드(<span className="font-bold">1</span>)
                  </span>
                  <span className="text-secondary-foreground">›</span>
                  <span>
                    적용 대기(<span className="font-bold">1</span>)
                  </span>
                  <span className="text-secondary-foreground">›</span>
                  <span>
                    적용 중(<span className="font-bold">0</span>)
                  </span>
                </Link>
              </section>
            </div>

            {/* ── 2행: 버전 도넛 3종 ── */}
            <div className="grid gap-4 lg:grid-cols-3">
              {VERSION_DONUTS.map((card) => (
                <VersionDonutCard key={card.title} card={card} onMore={() => setDetailCard(card)} />
              ))}
            </div>

            {/* ── 버전 현황 [더보기] 모달 — 전체 버전 리스트 + 다운로드(PNG·Excel) ── */}
            <Dialog open={detailCard !== null} onOpenChange={(o) => !o && setDetailCard(null)}>
              <DialogContent className="sm:max-w-md" showCloseButton={false}>
                {detailCard && (
                  <>
                    <DialogHeader>
                      <div className="flex items-center justify-between gap-2">
                        <DialogTitle className="text-base">
                          {detailCard.title} — 전체 {detailCard.total}척
                        </DialogTitle>
                        {/* 다운로드 — 시각 스펙(실제 파일 생성은 제품 몫) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Download className="size-4" /> 다운로드
                              <ChevronDown className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>.png</DropdownMenuItem>
                            <DropdownMenuItem>.xlsx</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </DialogHeader>

                    {/* 카드와 같은 도넛 — 모달에서도 분포를 한눈에 (2026-08-25) */}
                    <VersionDonutChart card={detailCard} />

                    {/* 전체 버전 리스트 — 카드 범례와 같은 행 문법. 상위 5개만 도넛 색, 이후는 중립 도트 */}
                    <ol className="max-h-80 space-y-1 overflow-y-auto">
                      {detailCard.rows.map((r, i) => (
                        <li
                          key={r.version}
                          className="flex items-center justify-between gap-2 border-b px-2 py-2 text-sm last:border-b-0"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className={"size-2 shrink-0 rounded-full" + (i >= 5 ? " bg-border" : "")}
                              style={i < 5 ? { backgroundColor: `var(--chart-${i + 1})` } : undefined}
                            />
                            <span className="truncate font-mono">{r.version}</span>
                          </span>
                          <span className="shrink-0 font-medium">
                            {r.ships}척{" "}
                            <span className="font-normal text-secondary-foreground">
                              ({((r.ships / detailCard.installed) * 100).toFixed(1).replace(/\.0$/, "")}%)
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>

                    <DialogFooter>
                      {/* 모달 닫기 = secondary CTA (2026-08-25 확정 — 전 모달 통일) */}
                      <Button variant="secondary" onClick={() => setDetailCard(null)}>
                        닫기
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* ── 3행: 선주별 납품 현황 — 테이블 ── */}
            <section className="space-y-3">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-medium text-secondary-foreground">선주별 납품 현황</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="선주별 납품 현황 설명">
                      <Info className="size-3.5 text-secondary-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>납품 호선 수 기준 상위 5개</TooltipContent>
                </Tooltip>
              </div>
              {/* 경량 표 — Table variant="plain" 공식화(D 대시보드 패턴)로 수제 표 대체.
                  납품 호선 컬럼은 좌측 정렬 + 최소 200px(w-52) */}
              <div className="overflow-x-auto rounded-lg bg-card shadow-card">
                <Table variant="plain" className="bg-card">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">순위</TableHead>
                      <TableHead>선주</TableHead>
                      <TableHead className="w-52">납품 호선</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {OWNER_ROWS.map(([name, count], i) => (
                      <TableRow key={name}>
                        <TableCell className="text-secondary-foreground">{i + 1}</TableCell>
                        <TableCell className="font-mono font-medium">{name}</TableCell>
                        <TableCell className="w-52 font-medium">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// 도넛 본체 — 카드·[더보기] 모달이 공유. 상위 5개 조각 + 중앙 설치 수 (viz-donut)
function VersionDonutChart({ card }: { card: VersionDonut }) {
  const top = card.rows.slice(0, 5);
  const config = {
    ships: { label: "호선" },
    ...Object.fromEntries(
      top.map((r, i) => [
        `v${i}`,
        { label: r.version, color: `var(--chart-${i + 1})` },
      ]),
    ),
  } satisfies ChartConfig;

  const data = top.map((r, i) => ({
    key: `v${i}`,
    version: r.version,
    ships: r.ships,
    fill: `var(--chart-${i + 1})`,
  }));

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-44 w-full">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="version" />} />
        <Pie data={data} dataKey="ships" nameKey="version" innerRadius={48} strokeWidth={4}>
          {/* 중앙 = 설치 수 단독 — "전체 N척"은 카드 헤더로 이동(2026-08-25) */}
          <RechartsLabel
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 6}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {card.installed}
                    </tspan>
                    {/* 단위는 숫자 아래 줄 (2026-08-25) */}
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 16}
                      className="fill-secondary-foreground text-sm"
                    >
                      척
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// 버전 도넛 카드 — 중앙 설치 호선 수, 하단 범례 색 리스트 (viz-donut)
// 도넛·범례는 상위 5개만(chart-1~5 색 한계), 전체 리스트는 [더보기] 모달이 담당
function VersionDonutCard({ card, onMore }: { card: VersionDonut; onMore: () => void }) {
  const top = card.rows.slice(0, 5);

  return (
    <section className="flex flex-col rounded-lg bg-card shadow-card">
      {/* 헤더 — 선 없음, 타이틀 회색·medium (피그마 실측). 총 척수는 도넛 중앙에서 이동해 옴 */}
      <div className="flex items-center gap-1.5 px-4 py-3">
        <h2 className="text-sm font-medium text-secondary-foreground">{card.title}</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={`${card.title} 설명`}>
              <Info className="size-3.5 text-secondary-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>설치 호선 수 기준 상위 5개 버전 점유율</TooltipContent>
        </Tooltip>
        <span className="text-sm text-secondary-foreground">· 전체 {card.total}척</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto -mr-2 text-secondary-foreground"
          onClick={onMore}
        >
          더보기
        </Button>
      </div>

      {card.rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center p-4 text-sm text-secondary-foreground">
          해당 제품이 비어있습니다.
        </p>
      ) : (
        <div className="flex flex-1 flex-col p-2">
          <VersionDonutChart card={card} />

          {/* 범례 리스트 — 순위 숫자 대신 도넛 조각 색 도트, 설치 수 기준 비중 병기. 상위 5개만 */}
          <ol className="mt-1 space-y-1">
            {top.map((r, i) => (
              <li
                key={r.version}
                className="flex items-center justify-between gap-2 border-b px-2 py-2 text-sm last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--chart-${i + 1})` }}
                  />
                  <span className="truncate font-mono">{r.version}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {r.ships}척{" "}
                  <span className="font-normal text-secondary-foreground">
                    ({((r.ships / card.installed) * 100).toFixed(1).replace(/\.0$/, "")}%)
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

