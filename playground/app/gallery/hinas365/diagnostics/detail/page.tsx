"use client";

// 자가 진단 — 호선 진단 상세 (DEV_CONTROL_ENC)
// ① HiNAS 365 메인 레이아웃 + B 상세 본문 — 3단: 좌 섹션 내비(scroll-spy) · 가운데 차트·히트맵(한 줄에 하나) · 우 진단 레일(sticky)
//   2026-10-08 토스증권 종목정보 구성을 참고해 개편(디자이너 지시) — 종전 「좌 레일 + 우 칩 탭」
//   반응형(2026-10-08): 1536px 이상 = 3단 / 미만 = 좌 내비 → 가운데 열 맨 위 상단 탭(sticky, 12개 두 줄 줄바꿈) / 1280px 미만 = 레일이 아래로
//   기간 = 최근 24시간 ~ 최근 6개월. 기간에 따라 그래프 점 간격·히트맵 칸 크기가 바뀌고, 히트맵은 칸 자동 축소로 스크롤 없이 한눈에
// 원천: 실물 캡처(2026-10-07, hinas365 v1.3.0 LOCAL) — 페이지 전체를 이 캡처에 다시 맞췄다(2026-10-07 디자이너 지시)
//
// 2026-10-07 디자이너 확정
// - 제목 행 우측 = 제품 셀렉트 · 기간 피커 · 원본 데이터 · 그래프 캡처. 종전 우하단 고정 패널과
//   Product Quick View 시트는 없앴다. 제목(호선명)이 호선 상세 링크다(2026-10-07, 종전 우상단 「호선 정보 ↗」 대체)
// - 기간 피커 = 실물의 「1주」 셀렉트 + 「상세 조회」 버튼(3시간 모달)을 하나로 합친 것. FE 리뷰용 제안 샘플이다.
//   DS 날짜 패널의 프리셋 모드(좌 프리셋 레일 + 우 두 달 캘린더 + 취소·적용)를 그대로 복제하고,
//   레일 = 최근 24시간 · 오늘 · 어제 · 최근 7일 · 최근 14일 | 직접 지정(3시간) (2026-10-07 개정, 기본값 최근 7일).
//   프리셋은 범위가 저절로 잡히고(캘린더는 미리보기 전용), 직접 지정만 사용자가 고른다 — 우측이 실물 상세 조회처럼
//   [월 캘린더(주 이동)] + [주간 7일 × 24시간 그리드]로 바뀌고 패널이 넓어진다. 칸을 누르면 그 시각부터 3시간. 시각 기준 UTC
// - DS 밖(제안) 부분: 최근 24시간(시간 단위 프리셋) · 직접 지정(3시간) · 주간 시간 그리드 · 오늘 회색 테두리.
//   화면 표시(점선·「DS에 없음」 라벨)는 피커를 어지럽혀 뺐고(2026-10-08 디자이너 지시), data-ds="fallback" 속성만 남겨 검사 도구가 찾는다.
//   오늘·어제·최근 7일·최근 14일은 DS 프리셋 그대로다(components/src/ui/filter-bar.tsx DATE_PRESETS · resolveDateRange)
// - 그래프: 1시간 간격 데이터 + 마우스를 따라오는 DS 툴팁(시각 UTC · 상대 시간 · 단위 붙은 값).
//   그래프를 누르면 그 시각이 골라져 레일 맨 위에 SELECTED TIME · RECORDED AT 이 나타나고 세 그래프에 점선이 선다.
//   고른 시각이 없을 때 SELECTED TIME 은 숨기고, RECORDED AT 은 최신 수집 시각 + Latest 배지로 항상 보인다
//   (2026-10-08 Recorded At 상시 노출 — 동료 피드백, 2026-10-07 「진단 상세부터 시작」을 개정)
// - 제목 행 = 호선명 링크 + IMO · Hull(같은 줄). 버전 3종(Common·Product·Server Type)은 우 레일 「버전 정보」(Recorded At 아래, 2026-10-08)
// - [원본 데이터] = 다운로드 모달(시작·종료 시각 · 파일 형식, 최대 14일) — 피그마 「d 1」(2026-10-08)
// - 차트 색은 DS chart 토큰(파랑 5단계)만 — 실물의 보라·주황·초록은 토큰이 없다(네트워크 모달과 같은 처리, 2026-09-29)
// - 히트맵 톤: NORMAL=success · ABNORMAL=destructive · UNDETERMINABLE·Pending=caution(노랑, 2026-10-12 HeatmapGrid caution 톤 d4622a6 — 종전 DES-206 primary 대체 해제) · NO DATA=none
//
// 상태: 진단 실행에 실제 진행률이 있는 화면이라 PROGRESS_STATES 5종(기본·빈·로딩·프로그레스·에러)

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Code,
  Copy,
  Download,
  HardDrive,
  Info,
  Layers,
  Monitor,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ds/ui/ui/accordion";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Calendar } from "@ds/ui/ui/calendar";
import { Card } from "@ds/ui/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@ds/ui/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { HeatmapLegend, type HeatmapTone } from "@ds/ui/ui/heatmap-grid";
import { Item, ItemContent, ItemDescription, ItemGroup } from "@ds/ui/ui/item";
import { PageHeader } from "@ds/ui/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@ds/ui/ui/popover";
import { Progress } from "@ds/ui/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ds/ui/ui/select";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import { PROGRESS_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ds/ui/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Label } from "@ds/ui/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";

import { TODAY_CLASS } from "../../../_detail/calendar-today";

const BASE = "/gallery/hinas365";

// 기준 시각 — 실물 캡처의 RECORDED AT(2026-10-07 01:17 UTC). 기간 프리셋과 상대 시간은 전부 이 시각 기준.
// 아래 시계열이 모듈 로드 때 계산되므로 맨 위에 둔다
const NOW = new Date(Date.UTC(2026, 9, 7, 1, 17));
const DAY = 86_400_000;
const HOUR = 3_600_000;
const pad = (n: number) => String(n).padStart(2, "0");

/* ---------------------------------------------------------------- 목업 데이터 */

const VESSEL = {
  name: "DEV_CONTROL_ENC",
  imo: "DEV_CONTROL_ENC",
  hull: "HULL1234",
  common: "v3.3.4",
  product: "v2.0.3",
  server: "XE4",
};

// System JSON 원본(목업) — 모달의 상세 테이블과 같은 값
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

// 진단 상세 · 클라이언트 상태 — 실물 캡처 순서. 상태 톤: 정상=success · 미수집=neutral · 응답 없음=error
type DiagStatus = "정상" | "미수집" | "응답 없음";
const STATUS_TONE: Record<DiagStatus, "success" | "neutral" | "error"> = {
  정상: "success",
  미수집: "neutral",
  "응답 없음": "error",
};
const DIAG_ITEMS: { key: string; status: DiagStatus }[] = [
  { key: "SYSTEM", status: "미수집" },
  { key: "SENSOR", status: "미수집" },
  { key: "STORAGE", status: "미수집" },
  { key: "NTP", status: "정상" },
  { key: "POD", status: "미수집" },
  { key: "CONTROL", status: "미수집" },
];
const CLIENTS: { key: string; status: DiagStatus }[] = [
  { key: "CLIENT 1", status: "정상" },
  { key: "CLIENT 2", status: "정상" },
  { key: "CLIENT 3", status: "응답 없음" },
];

// 시스템 도구 및 리소스 2×2 — 위 작은 글자 = 부가 정보, 아래 굵은 글자 = 도구 이름. 누르면 각 모달(2026-10-08 실물 캡처 기준)
type ToolKey = "remote" | "images" | "storage" | "pods";
const TOOLS: { key: ToolKey; meta: string; label: string }[] = [
  { key: "remote", meta: "Rustdesk", label: "Remote Support" },
  { key: "images", meta: "25", label: "Docker Images" },
  { key: "storage", meta: "목록", label: "Storage Data List" },
  { key: "pods", meta: "CPU / 메모리", label: "Pod 리소스 사용량" },
];

// 좌 섹션 내비 항목(2026-10-08 상단 칩 → 좌 내비) — 누르면 해당 섹션으로 이동. 자리만 잡은 섹션은 비활성
const CHIPS = [
  "System",
  "Disk",
  "Network",
  "Sensor",
  "Camera",
  "Control",
  "Pod",
  "Memory",
  "Disk SMART",
  "Thermal Temp",
  "Thermal Clock",
  "Thermal Power",
];

// 선 그래프 — 고른 기간에서 만들어 낸다(2026-10-08, 종전 고정 7일치). 점 간격은 기간에 따라 1·3·6·12시간(rangeOf).
// 10-03 06:00~11:00 은 수집 공백(null) — 선이 끊긴다. 색은 chart 토큰만
// x 값은 "MM-DD HH:00" 문자열 — DS 툴팁 머리글이 문자열 라벨일 때만 x 값을 그대로 넘겨 주기 때문이다
const EPOCH = Date.UTC(2026, 3, 1); // 물결 위상 기준 — 기간이 바뀌어도 같은 시각은 같은 값
const tLabel = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:00`;
};
const tMs = (t: string) => {
  const [md, hm] = t.split(" ");
  const [m, d] = md.split("-").map(Number);
  return Date.UTC(2026, m - 1, d, Number(hm.slice(0, 2)));
};
// 결정적 물결 — 새로고침해도 같은 모양. 잔물결은 약하고 느리게(약 16시간 주기) — 실물처럼 완만하게
const wave = (i: number, base: number, amp: number, period: number, phase = 0) =>
  base + amp * Math.sin((i + phase) / period) + (amp / 5) * Math.sin((i + phase * 2) / 2.5);
const inGap = (ms: number) => ms >= Date.UTC(2026, 9, 3, 6) && ms <= Date.UTC(2026, 9, 3, 11);

// 기간 → 선 그래프 점 간격(step) · 히트맵 칸 크기(cell). 2026-10-08 검토 표(디자이너 승인):
// ~7일 = 1시간·1시간 / 14일 = 1시간·6시간 / 1개월 = 3시간·1일 / 3개월 = 6시간·1일 / 6개월 = 12시간·1일
type Range = { from: number; to: number; step: number; cell: number };
function rangeOf(a: Applied): Range {
  if (a.preset === "직접 지정") {
    const s = (a.start ?? DEFAULT_SLOT).getTime();
    return { from: s, to: s + 3 * HOUR, step: HOUR, cell: HOUR };
  }
  const p = PRESETS.find((x) => x.key === a.preset) ?? PRESETS[3];
  const span = p.to - p.from;
  const step = span <= 15 * DAY ? HOUR : span <= 32 * DAY ? 3 * HOUR : span <= 93 * DAY ? 6 * HOUR : 12 * HOUR;
  const cell = span <= 8 * DAY ? HOUR : span <= 15 * DAY ? 6 * HOUR : DAY;
  return { from: p.from, to: p.to, step, cell };
}

function seriesFor(r: Range, make: (i: number) => Record<string, number>) {
  const out: Record<string, string | number | null>[] = [];
  for (let ms = Math.ceil(r.from / r.step) * r.step; ms <= r.to; ms += r.step) {
    const row = make((ms - EPOCH) / HOUR);
    const o: Record<string, string | number | null> = { t: tLabel(ms) };
    for (const k of Object.keys(row)) o[k] = inGap(ms) ? null : Math.round(row[k] * 100) / 100;
    out.push(o);
  }
  return out;
}

// x 눈금 — 6개 안팎을 고르게. 하루를 넘는 기간은 매일 같은 시각에 맞춘다(눈금이 시각마다 흔들리지 않게)
function ticksFor(data: Record<string, string | number | null>[], r: Range) {
  const ts = data.map((d) => String(d.t));
  if (r.to - r.from <= DAY) return ts.filter((_, i) => i % Math.max(1, Math.ceil(ts.length / 6)) === 0);
  const days = Math.ceil((r.to - r.from) / DAY);
  const every = Math.max(1, Math.ceil(days / 6));
  const anchor = tLabel(Math.ceil(r.from / DAY) * DAY).slice(6); // 첫 자정 시각("00:00")
  return ts.filter((t, i) => t.endsWith(anchor) && Math.floor(i / (DAY / r.step)) % every === 0);
}

type LineConfig = Record<string, { label: string; color: string }>;
const SYSTEM_CONFIG = {
  cpu: { label: "CPU Usage", color: "var(--chart-1)" },
  memory: { label: "Memory Usage", color: "var(--chart-3)" },
} satisfies ChartConfig;
const DISK_CONFIG = {
  root: { label: "/", color: "var(--chart-1)" },
  kubelet: { label: "/var/lib/kubelet", color: "var(--chart-2)" },
  data: { label: "/data", color: "var(--chart-3)" },
  log: { label: "/var/log", color: "var(--chart-4)" },
} satisfies ChartConfig;
const NET_CONFIG = {
  download: { label: "Download Speed", color: "var(--chart-1)" },
  upload: { label: "Upload Speed", color: "var(--chart-4)" },
} satisfies ChartConfig;

// 상대 시간 — 툴팁·RECORDED AT 의 둘째 줄("7일 6시간 전")
function ago(ms: number) {
  const diff = Math.max(0, NOW.getTime() - ms);
  const d = Math.floor(diff / DAY);
  const h = Math.floor((diff % DAY) / HOUR);
  if (d === 0 && h === 0) return "방금 전";
  return d > 0 ? `${d}일 ${h}시간 전` : `${h}시간 전`;
}

// 히트맵 — 데이터 ok·bad·mid·none → DS HeatmapGrid 톤
type Cell = "ok" | "bad" | "mid" | "none";
const CELL_TONE: Record<Cell, HeatmapTone> = {
  ok: "success",
  bad: "destructive",
  mid: "caution",
  none: "none",
};
// 히트맵 행 — 기간에서 만들어 낸다(2026-10-08, 종전 고정 8일치). 6시간 덩어리마다 결정적 난수로 상태를 정하고(새로고침해도 같다),
// bad·mid = 그 덩어리가 이상·판정불가일 확률, since·until = 그 밖은 수집 없음(NO DATA)
type HeatRow = { name: string; group?: boolean; seed: number; bad: number; mid: number; since?: number; until?: number };
const SENSOR_ROWS: HeatRow[] = [
  { name: "gps-1", seed: 11, bad: 0.01, mid: 0.01 },
  { name: "gyro", seed: 12, bad: 0.01, mid: 0.05 },
  { name: "ais", seed: 13, bad: 0.07, mid: 0.03 },
  { name: "radar-1", seed: 14, bad: 0.03, mid: 0.01 },
  { name: "anemometer", seed: 15, bad: 0.02, mid: 0.01, since: Date.UTC(2026, 6, 20) },
];
const CAMERA_ROWS: HeatRow[] = [
  { name: "bow", seed: 21, bad: 0.5, mid: 0, until: Date.UTC(2026, 9, 5) },
  { name: "port-1", seed: 22, bad: 0.35, mid: 0, until: Date.UTC(2026, 9, 5) },
  { name: "port-2", seed: 23, bad: 0.5, mid: 0, until: Date.UTC(2026, 9, 5) },
  { name: "stbd-1", seed: 24, bad: 0.35, mid: 0, until: Date.UTC(2026, 9, 5) },
  { name: "stern", seed: 25, bad: 0.5, mid: 0, until: Date.UTC(2026, 9, 5) },
];
const POD_ROWS: HeatRow[] = [
  { name: "adta-0", seed: 31, bad: 0.005, mid: 0.005, until: Date.UTC(2026, 9, 5) },
  { name: "argocd", group: true, seed: 32, bad: 0.005, mid: 0.01, until: Date.UTC(2026, 9, 5) },
  { name: "auth", group: true, seed: 33, bad: 0.005, mid: 0.005, until: Date.UTC(2026, 9, 5) },
  { name: "codecommit-creds-refresh", seed: 34, bad: 0, mid: 0.3, until: Date.UTC(2026, 9, 1) },
  { name: "core-redis", seed: 35, bad: 0.005, mid: 0.005, until: Date.UTC(2026, 9, 5) },
  { name: "disk-manager", group: true, seed: 36, bad: 0.04, mid: 0.01, until: Date.UTC(2026, 9, 5) },
];

const hash01 = (a: number, b: number) => {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
};
function hourState(r: HeatRow, ms: number): Cell {
  if (inGap(ms) || (r.since && ms < r.since) || (r.until && ms >= r.until)) return "none";
  const x = hash01(r.seed, Math.floor(ms / (6 * HOUR)));
  return x < r.bad ? "bad" : x < r.bad + r.mid ? "mid" : "ok";
}
// 칸 하나에 여러 시간이 묶이면 가장 나쁜 상태가 이긴다 — 한 번이라도 이상이면 숨기지 않는다(2026-10-08 디자이너 승인)
const RANK: Record<Cell, number> = { bad: 3, mid: 2, ok: 1, none: 0 };
const cellStarts = (r: Range) => {
  const out: number[] = [];
  for (let ms = Math.floor(r.from / r.cell) * r.cell; ms < r.to; ms += r.cell) out.push(ms);
  return out;
};
function cellsFor(row: HeatRow, r: Range, starts: number[]): Cell[] {
  return starts.map((c) => {
    let worst: Cell = "none";
    for (let ms = c; ms < Math.min(c + r.cell, r.to); ms += HOUR) {
      const s = hourState(row, ms);
      if (RANK[s] > RANK[worst]) worst = s;
    }
    return worst;
  });
}

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

/* ---------------------------------------------------------------- 페이지 */

export default function DiagnosticDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  // 시스템 도구 모달 — 레일의 2×2 카드가 연다
  const [tool, setTool] = React.useState<ToolKey | null>(null);
  // 그래프에서 고른 시각("MM-DD HH:00") — 없으면 레일은 진단 상세부터 시작한다(2026-10-07 디자이너 확정)
  const [selected, setSelected] = React.useState<string | null>(null);
  // 조회 기간 — 기간 피커가 [적용]으로 바꾸고, 그래프·히트맵이 이 기간으로 다시 만들어진다(2026-10-08)
  const [period, setPeriod] = React.useState<Applied>({ preset: "최근 7일" });
  const range = React.useMemo(() => rangeOf(period), [period]);
  const charts = React.useMemo(
    () => ({
      system: seriesFor(range, (i) => ({ cpu: wave(i, 15, 3, 9), memory: wave(i, 28, 1.5, 14, 4) })),
      disk: seriesFor(range, (i) => ({
        root: wave(i, 68, 2, 20),
        kubelet: wave(i, 86, 2, 20, 6),
        data: wave(i, 78, 2, 20, 12),
        log: wave(i, 66, 1.5, 20, 18),
      })),
      net: seriesFor(range, (i) => ({ download: wave(i, 42, 12, 10), upload: wave(i, 15, 3, 10, 3) })),
    }),
    [range],
  );
  const ticks = React.useMemo(() => ticksFor(charts.system, range), [charts, range]);

  return (
    <div className="space-y-6">
      <PageHeader
        // 제목이 곧 호선 상세 링크다(2026-10-07 디자이너 지정) — 우상단 「호선 정보 ↗」를 없애고 이리로 옮겼다.
        // 문법은 저장소 링크 그대로(text-primary + 호버 밑줄)
        // IMO · Hull 은 제목 옆 같은 줄(2026-10-08) — 버전 3종은 우 레일 「버전 정보」로 옮겼다
        title={
          <span className="flex flex-wrap items-baseline gap-x-3">
            {/* ↗ = 다른 페이지(호선 상세)로 간다는 표시 — sales365/vessels/detail 계약 링크와 같은 마크업, 제목 크기라 size-4(2026-10-08) */}
            <Link href={`${BASE}/ships/detail`} className="inline-flex items-center gap-1 text-primary hover:underline">
              {VESSEL.name} <ArrowUpRight className="size-4" />
            </Link>
            <span className="text-sm font-normal text-secondary-foreground">
              IMO {VESSEL.imo} · Hull {VESSEL.hull}
            </span>
          </span>
        }
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select defaultValue="control">
                <SelectTrigger aria-label="제품 선택" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["control", "svm", "navigation"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <PeriodPicker
                applied={period}
                onApply={(a) => {
                  setPeriod(a);
                  setSelected(null); // 기간이 바뀌면 고른 시각은 새 축에 없을 수 있어 비운다
                }}
              />
              <Button variant="outline" onClick={() => setDownloadOpen(true)}>
                <Download className="size-4" /> 원본 데이터
              </Button>
              <Button variant="outline">
                <Camera className="size-4" /> 그래프 캡처
              </Button>
            </div>
            <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={PROGRESS_STATES} />
          </div>
        }
      />

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
        <Empty>
          <EmptyHeader>
            <EmptyTitle>선택한 기간에 수집된 데이터가 없습니다</EmptyTitle>
            <EmptyDescription>제품이나 조회 기간을 변경해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        // 3단 — 좌 섹션 내비 · 가운데 차트 · 우 진단 레일(2026-10-08 토스증권 종목정보 구성 참고, 디자이너 지시).
        // DOM 순서는 내비 → 레일 → 가운데지만 order 로 내비(first) · 가운데 · 레일(last)로 놓는다. xl 미만은 내비를 숨기고 레일이 아래로
        <div className="flex flex-col items-start gap-4 xl:flex-row">
          <SectionNav />

          {/* ── 우: 진단 레일 — 차트를 읽는 동안 붙어 있다(sticky) ── */}
          {/* top-20 = 셸 헤더 h-16 + 여백 — top-4 면 헤더 밑으로 레일 머리가 숨었다 */}
          <aside className="order-last w-full shrink-0 xl:sticky xl:top-20 xl:w-80">
            <Card variant="flat" className="overflow-hidden">
              {/* 고른 시각 — 그래프를 누르면 레일 맨 위에 나타난다. × 로 지우면 기본(Recorded At = Latest)으로 돌아간다.
                  면은 선택 강조 틴트 primary/5(contrast-pairs.json tints.allowed — 선택 강조 칩) */}
              {selected && (
                <div className="flex items-start justify-between gap-2 border-b bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase text-secondary-foreground">Selected Time</p>
                    {/* 날짜 + 시각(초까지) 한 줄 — 실물 형식 「2026-10-02 12:00:00」(2026-10-08 디자이너 지정) */}
                    <p className="text-base font-semibold text-primary">2026-{selected}:00</p>
                  </div>
                  <Button variant="ghost" size="icon-xs" aria-label="선택 해제" onClick={() => setSelected(null)}>
                    <X />
                  </Button>
                </div>
              )}
              <div className="space-y-6 p-4">
                {/* Recorded At 은 항상 보인다(2026-10-08 동료 피드백 — 첫 진입 때 보이는 데이터가 언제 기록됐는지 알려야 한다).
                    고른 시각이 없으면 최신 수집 시각(NOW) + Latest 배지, 고르면 그 시각으로 바뀌고 배지가 빠진다 */}
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-secondary-foreground">
                    <Clock className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs uppercase text-secondary-foreground">
                      Recorded At
                      {!selected && (
                        <Badge variant="secondary" className="font-normal normal-case">
                          Latest
                        </Badge>
                      )}
                    </p>
                    <p className="font-mono text-sm">
                      {selected
                        ? `2026-${selected}:00` /* selected 는 "MM-DD HH:00" — 초 :00 만 붙인다 */
                        : `2026-${mmdd(NOW)} ${pad(NOW.getUTCHours())}:${pad(NOW.getUTCMinutes())}:${pad(NOW.getUTCSeconds())}`}{" "}
                      <span className="text-xs text-secondary-foreground">UTC</span>
                    </p>
                    <p className="text-xs text-secondary-foreground">{selected ? ago(tMs(selected)) : ago(NOW.getTime())}</p>
                  </div>
                </div>

              {/* 버전 정보 — 종전 헤더 설명 줄에서 옮겼다(2026-10-08). 진단 상세와 같은 테두리 행 목록 문법 */}
              <section className="space-y-2">
                <h2 className="text-sm font-medium text-secondary-foreground">버전 정보</h2>
                <dl className="divide-y rounded-lg border px-3">
                  {[
                    ["Common Ver.", VESSEL.common],
                    ["Product Ver.", VESSEL.product],
                    ["Server Type", VESSEL.server],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-3">
                      <dt className="text-xs font-semibold uppercase">{k}</dt>
                      <dd className="font-mono text-sm">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <StatusList
                title="진단 상세"
                items={DIAG_ITEMS}
                onDetail={() => setJsonOpen(true)}
              />
              <StatusList title="클라이언트 상태" items={CLIENTS} />

              <section className="space-y-2">
                <h2 className="text-sm font-medium text-secondary-foreground">시스템 도구 및 리소스</h2>
                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setTool(t.key)}
                      className="space-y-2 rounded-lg border p-3 text-left hover:bg-accent"
                    >
                      <span className="block text-xs text-secondary-foreground">{t.meta}</span>
                      <span className="block text-sm font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              </div>
            </Card>
          </aside>

          {/* ── 가운데: 차트·히트맵 — 그래프는 한 줄에 하나(2026-10-08) ──
              바깥 카드 없이 섹션 카드가 캔버스에 바로 놓인다 — 상자 3겹(바깥·섹션·플롯 테두리)을 1겹으로(2026-10-08 디자이너 확정) */}
          <div className="w-full min-w-0 flex-1 space-y-4">
            <SectionTabs />
            {/* 세 그래프는 같은 시간축이다 — 어느 그래프를 눌러도 같은 시각이 골라지고 세 곳 모두에 점선이 선다 */}
            <LineCard id="diag-system" title="System" config={SYSTEM_CONFIG} data={charts.system} ticks={ticks} range={range} unit="%" selected={selected} onSelect={setSelected} />
            <LineCard id="diag-disk" title="Disk Usage" config={DISK_CONFIG} data={charts.disk} ticks={ticks} range={range} unit="%" selected={selected} onSelect={setSelected} />
            <LineCard id="diag-network" title="Network Status" config={NET_CONFIG} data={charts.net} ticks={ticks} range={range} unit="Mbps" selected={selected} onSelect={setSelected} />

            <HeatmapCard
              id="diag-sensor"
              title="Sensor Status"
              desc="연결된 센서의 시간대별 동작 상태"
              legend={[
                { label: "NORMAL", tone: "success" },
                { label: "NO DATA", tone: "none" },
                { label: "UNDETERMINABLE", tone: "caution" },
                { label: "ABNORMAL", tone: "destructive" },
              ]}
              rows={SENSOR_ROWS}
              range={range}
              colLabel="Sensor"
            />
            <HeatmapCard
              id="diag-camera"
              title="Camera Status"
              desc="연결된 카메라의 시간대별 동작 상태"
              legend={[
                { label: "NORMAL", tone: "success" },
                { label: "NO DATA", tone: "none" },
                { label: "UNDETERMINABLE", tone: "caution" },
                { label: "ABNORMAL", tone: "destructive" },
              ]}
              rows={CAMERA_ROWS}
              range={range}
              colLabel="Camera"
            />
            <HeatmapCard
              id="diag-pod"
              title="Pod Status"
              desc="각 파드의 시간대별 실행 상태"
              legend={[
                { label: "Running", tone: "success" },
                { label: "Pending / NotReady", tone: "caution" },
                { label: "Error", tone: "destructive" },
                { label: "NoData", tone: "none" },
              ]}
              rows={POD_ROWS}
              range={range}
              colLabel="Pod"
            />
          </div>
        </div>
      )}

      {/* ── System JSON 모달 — 진단 상세 SYSTEM 의 [상세 정보 확인] ── */}
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className={`${MODAL_FIT} sm:max-w-xl`}>
          <DialogHeader>
            <DialogTitle>System JSON</DialogTitle>
            <DialogDescription>SYSTEM 진단의 원본 데이터입니다.</DialogDescription>
          </DialogHeader>
          <RawTabs raw={SYSTEM_RAW} file="system">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="uppercase">Property</TableHead>
                    <TableHead className="uppercase">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SYSTEM_RAW.network.list.map((n) => (
                    <TableRow key={n.name}>
                      <TableCell className="text-sm text-secondary-foreground">{n.name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-sm">{n.address}</span>
                          <StatusBadge label="FALSE" tone="error" bg={false} mono />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="text-sm text-secondary-foreground">Disk</TableCell>
                    <TableCell>
                      <StatusBadge label="TRUE" tone="success" bg={false} mono />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
          </RawTabs>
        </DialogContent>
      </Dialog>

      <RawDownloadDialog open={downloadOpen} onOpenChange={setDownloadOpen} />

      {/* ── 시스템 도구 모달 4종 ── */}
      <RemoteSupportDialog open={tool === "remote"} onOpenChange={(v) => !v && setTool(null)} />
      <ImageInventoryDialog open={tool === "images"} onOpenChange={(v) => !v && setTool(null)} />
      <StorageMapDialog open={tool === "storage"} onOpenChange={(v) => !v && setTool(null)} />
      <PodResourceDialog open={tool === "pods"} onOpenChange={(v) => !v && setTool(null)} range={range} ticks={ticks} />
    </div>
  );
}

/* ---------------------------------------------------------------- 좌 섹션 내비 */

// 종전 상단 칩 줄을 대신한다(2026-10-08). 스크롤을 따라 강조가 옮겨 간다(scroll-spy) — 누르면 그 섹션으로 이동.
// 아직 섹션이 없는 항목(Control·Memory·Disk SMART·Thermal 3종)은 목록은 보이되 비활성.
// DS Button(ghost) 링크 조합 — 기간 피커 레일과 같은 문법이라 새 컴포넌트가 아니다
const sectionId = (c: string) => `diag-${c.toLowerCase().replace(/\s+/g, "-")}`;
const BUILT = new Set(["System", "Disk", "Network", "Sensor", "Camera", "Pod"]);

// scroll-spy — 기준선을 지난 섹션 중 마지막 것이 지금 섹션. 맨 아래에 닿으면 마지막 섹션.
// 기준선: 2xl(좌 내비) = 셸 헤더 64 + 여백 → 160px · 그 미만(상단 탭 두 줄이 헤더 밑에 붙음) → 240px
function useActiveSection() {
  const [active, setActive] = React.useState("System");
  React.useEffect(() => {
    const names = CHIPS.filter((c) => BUILT.has(c));
    const onScroll = () => {
      const line = window.innerWidth >= 1536 ? 160 : 240;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return setActive(names[names.length - 1]);
      let current = names[0];
      for (const c of names) {
        const el = document.getElementById(sectionId(c));
        if (el && el.getBoundingClientRect().top <= line) current = c;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return [active, setActive] as const;
}

// 항목 하나 — 세로 내비·상단 탭이 같은 마크업(DS Button ghost). 섹션 없는 항목은 비활성
function SectionLink({ c, active, onPick, block }: { c: string; active: string; onPick: (c: string) => void; block?: boolean }) {
  const base = (block ? "w-full justify-start " : "") + "font-normal ";
  if (!BUILT.has(c))
    return (
      <Button variant="ghost" size="sm" disabled className={base}>
        {c}
      </Button>
    );
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={base + (active === c ? "bg-accent font-medium text-foreground" : "text-secondary-foreground")}
    >
      <a href={`#${sectionId(c)}`} aria-current={active === c ? "true" : undefined} onClick={() => onPick(c)}>
        {c}
      </a>
    </Button>
  );
}

// 넓은 화면(1536px 이상) — 좌 세로 내비
function SectionNav() {
  const [active, setActive] = useActiveSection();
  return (
    <nav aria-label="진단 항목 바로가기" className="order-first hidden w-40 shrink-0 space-y-0.5 2xl:sticky 2xl:top-20 2xl:block">
      {CHIPS.map((c) => (
        <SectionLink key={c} c={c} active={active} onPick={setActive} block />
      ))}
    </nav>
  );
}

// 좁은 화면(1536px 미만) — 가운데 열 맨 위 상단 탭, 셸 헤더 바로 밑에 붙는다(토스증권 종목정보 탭 참고, 2026-10-08).
// 12개 전부 줄바꿈(두 줄) — 메뉴는 한눈에 보여야 해서 가로 스크롤을 쓰지 않는다(디자이너 지정). 면 = 캔버스색(밑으로 지나가는 카드를 가린다)
function SectionTabs() {
  const [active, setActive] = useActiveSection();
  return (
    <nav aria-label="진단 항목 바로가기" className="sticky top-16 z-20 -mt-2 flex flex-wrap gap-1 bg-secondary py-2 2xl:hidden">
      {CHIPS.map((c) => (
        <SectionLink key={c} c={c} active={active} onPick={setActive} />
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------- 시스템 도구 모달 4종 (2026-10-08 실물 캡처 기준) */

// 스크롤 모달 공용 틀 — 창 높이의 11/12 를 넘지 않고, 머리는 고정 · 본문만 스크롤(2026-10-08 Pod 모달 아래 잘림 지적 → 4개 모달 전부)
const MODAL_FIT = "flex max-h-11/12 flex-col";

// 「상세 테이블 / 원본 JSON」 탭 — SYSTEM · Image Inventory · Storage Map 세 모달 공용(요소 단위 통일).
// JSON 칸 = 저장소 기존 문법(bg-muted 상자, 실물의 검정 코드 에디터 대신 — DS 에 코드 블록이 없다) + 우상단 [Copy] [Download]
function RawTabs({ raw, file, children }: { raw: unknown; file: string; children: React.ReactNode }) {
  const text = JSON.stringify(raw, null, 2);
  const copy = async () => {
    await navigator.clipboard?.writeText(text);
    toast("복사했습니다");
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = `${file}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    // 높이 = 모달이 창 높이에 맞춰 잘리지 않게 남은 높이를 채우고 그 안에서만 스크롤(2026-10-08 — 고정 max-h-120 은 낮은 창에서 모달 아래가 잘렸다).
    // 모달 쪽은 DialogContent 에 MODAL_FIT(flex · max-h-11/12) 을 단다
    <Tabs defaultValue="table" className="min-h-0 flex-1">
      <div className="border-b">
        <TabsList variant="line">
          <TabsTrigger value="table">상세 테이블</TabsTrigger>
          <TabsTrigger value="json">원본 JSON</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="table" className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </TabsContent>
      <TabsContent value="json" className="relative flex min-h-0 flex-1 flex-col">
        <div className="absolute right-3 top-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy className="size-4" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="size-4" /> Download
          </Button>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted p-4 pt-14 font-mono text-xs">{text}</pre>
      </TabsContent>
    </Tabs>
  );
}

// ① Remote Support — Rustdesk 접속 ID 를 크게 보여 주고 복사
const RUSTDESK_ID = "1429633244";
function RemoteSupportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="size-5 text-secondary-foreground" /> Remote Support
          </DialogTitle>
          <DialogDescription>Rustdesk 에 아래 ID 를 입력해 원격 지원에 접속합니다.</DialogDescription>
        </DialogHeader>
        <InputGroup className="h-12">
          <InputGroupInput
            readOnly
            aria-label="Rustdesk ID"
            value={RUSTDESK_ID}
            className="text-center font-mono text-title-m font-semibold tracking-widest"
          />
          <InputGroupAddon align="inline-end">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="ID 복사"
              onClick={async () => {
                await navigator.clipboard?.writeText(RUSTDESK_ID);
                toast("복사했습니다");
              }}
            >
              <Copy />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </DialogContent>
    </Dialog>
  );
}

// ② Image Inventory — 저장소/이미지 이름 · 시스템 태그(버전 칩)
const IMAGES: { name: string; tag: string[] }[] = [
  { name: "auth-front", tag: ["v3.1.0-rc.7"] },
  { name: "avikus-ams", tag: ["v1.1.0-rc.2"] },
  { name: "avikus-auth", tag: ["v1.7.0-rc.6"] },
  { name: "avikus-data-transfer-app", tag: ["v2.1.0-rc.7"] },
  { name: "avikus-data-transfer-app-proto", tag: ["v1.1.1"] },
  { name: "avikus-sensor-fusion", tag: ["v1.0.18-rc.3"] },
  { name: "aws-signing-helper", tag: ["1.8.4-slim"] },
  { name: "collector", tag: ["v2.0.0-rc.8"] },
  { name: "detector-app", tag: ["v1.2.0-rc.4"] },
  { name: "hidom-2.0-aws", tag: ["v2.0.0-dev.14"] },
  { name: "video-recorder-server", tag: ["v1.4.2", "latest"] },
];
function ImageInventoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${MODAL_FIT} sm:max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5 text-secondary-foreground" /> Image Inventory
          </DialogTitle>
          <DialogDescription>호선에 설치된 Docker 이미지와 태그입니다.</DialogDescription>
        </DialogHeader>
        <RawTabs raw={IMAGES} file="image-inventory">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase">Repository / Name</TableHead>
                <TableHead className="uppercase">System Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IMAGES.map((im) => (
                <TableRow key={im.name}>
                  <TableCell className="font-mono text-sm">{im.name}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1">
                      {im.tag.map((t) => (
                        <Badge key={t} variant="outline" className="font-mono font-normal">
                          {t}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </RawTabs>
      </DialogContent>
    </Dialog>
  );
}

// ③ System Storage Map — 원본 JSON 을 그대로 펼친 PROPERTY / VALUE 표.
// 객체 = 회색 그룹 머리(대문자) + 한 단 들여쓴 하위 행, 배열 = 항목을 차례로, 값 = 한 행. 키는 snake_case → Title Case
const STORAGE_RAW = {
  auth: [
    {
      key: "auth:session:3948d699_ebc6_4832_b628_23bc07610b36",
      value: {
        session_id: "3948d699_ebc6_4832_b628_23bc07610b36",
        user_id: "avikus",
        role: "admin",
        name: "default_admin",
        client_id: "control_app",
        created_at: "2026-10-07 07:51:34.178596+00:00",
        last_logged_in: "2026-09-08 01:40:48.862493+00:00",
        expiry_time: 52560000,
      },
    },
  ],
  recorder: { storage_path: "/data/hdd/recorder", retention_days: 30, used_gb: 412.6, quota_gb: 1024 },
};
const INDENT = ["pl-3", "pl-6", "pl-9", "pl-12"];
const titleCase = (k: string) => k.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
function storageRows(v: unknown, depth = 0, label?: string): React.ReactNode[] {
  const pad = INDENT[Math.min(depth, INDENT.length - 1)];
  if (Array.isArray(v)) return v.flatMap((item, i) => storageRows(item, depth, label && `${label} ${i + 1}`));
  if (v && typeof v === "object") {
    const head = label ? [
      <TableRow key={`h-${label}-${depth}`} className="bg-muted hover:bg-muted">
        <TableCell colSpan={2} className={`${pad} text-xs font-semibold uppercase tracking-wide text-secondary-foreground`}>
          {label}
        </TableCell>
      </TableRow>,
    ] : [];
    return [...head, ...Object.entries(v).flatMap(([k, x]) => storageRows(x, label ? depth + 1 : depth, titleCase(k)))];
  }
  return [
    <TableRow key={`r-${label}-${depth}-${String(v)}`}>
      <TableCell className={`${pad} w-48 align-top text-sm text-secondary-foreground`}>{label}</TableCell>
      <TableCell className="break-all font-mono text-sm whitespace-normal">{String(v)}</TableCell>
    </TableRow>,
  ];
}
function StorageMapDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${MODAL_FIT} sm:max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="size-5 text-secondary-foreground" /> System Storage Map
          </DialogTitle>
          <DialogDescription>호선 시스템 저장소(Redis)에 기록된 키와 값입니다.</DialogDescription>
        </DialogHeader>
        <RawTabs raw={STORAGE_RAW} file="system-storage-map">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48 uppercase">Property</TableHead>
                <TableHead className="uppercase">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{storageRows(STORAGE_RAW)}</TableBody>
          </Table>
        </RawTabs>
      </DialogContent>
    </Dialog>
  );
}

// ④ Pod 리소스 사용량 — 모듈마다 CPU(m) · Memory(MiB) 선 그래프 한 쌍. 그래프는 본문 LineCard 재사용(툴팁·조회 기간 동일).
// 선 색은 chart 토큰 5단계(파랑)만 — Pod 가 6개 이상이면 색이 한 바퀴 돈다(실물의 보라·청록은 토큰 없음)
const POD_MODULES: { name: string; pods: string[]; cpu: number; mem: number }[] = [
  { name: "adta-0", pods: ["adta-0"], cpu: 8, mem: 230 },
  { name: "adta-frontend-0", pods: ["adta-frontend-0"], cpu: 1, mem: 88 },
  { name: "auth", pods: ["auth-deployment-7c9d8-2kqzp", "auth-deployment-7c9d8-x8w4n"], cpu: 6, mem: 140 },
  { name: "core-redis", pods: ["core-redis-0"], cpu: 12, mem: 310 },
  {
    name: "video-recorder-server",
    pods: ["9xpfb", "gg5rc", "hr6xk", "jgcwt", "lm7cc", "szw45"].map((s) => `video-recorder-server-deployment-6bf55bb95b-${s}`),
    cpu: 4,
    mem: 160,
  },
];
function PodResourceDialog({
  open,
  onOpenChange,
  range,
  ticks,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  range: Range;
  ticks: string[];
}) {
  const [q, setQ] = React.useState("");
  const shown = POD_MODULES.filter(
    (m) => !q.trim() || [m.name, ...m.pods].some((s) => s.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const podCount = POD_MODULES.reduce((n, m) => n + m.pods.length, 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${MODAL_FIT} sm:max-w-5xl`}>
        <DialogHeader>
          <DialogTitle>Pod 리소스 사용량</DialogTitle>
          <DialogDescription>모듈별로 묶인 Pod의 CPU / 메모리 사용량 추이입니다.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-4 border-y py-3">
          <InputGroup className="w-72">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="모듈 또는 Pod 이름 검색" aria-label="모듈 또는 Pod 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          </InputGroup>
          <span className="text-xs uppercase text-secondary-foreground">
            {POD_MODULES.length} modules · {podCount} pods
          </span>
          <span className="ml-auto text-xs uppercase text-secondary-foreground">CPU (m) · Memory (MiB)</span>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
          {shown.length === 0 && <p className="py-8 text-center text-sm text-secondary-foreground">검색 결과가 없습니다.</p>}
          {shown.map((m, mi) => {
            const config = Object.fromEntries(
              m.pods.map((p, i) => [`p${i}`, { label: p, color: `var(--chart-${(i % 5) + 1})` }]),
            ) as LineConfig;
            const series = (base: number, amp: number) =>
              seriesFor(range, (i) =>
                Object.fromEntries(m.pods.map((_, pi) => [`p${pi}`, Math.max(0, wave(i, base + pi * 0.6, amp, 11 + pi * 2, mi * 7 + pi * 3))])),
              );
            return (
              <section key={m.name} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{m.name}</h3>
                  {m.pods.length > 1 ? (
                    <Badge variant="secondary" className="font-normal">
                      {m.pods.length} pods
                    </Badge>
                  ) : (
                    <span className="font-mono text-xs text-secondary-foreground">{m.pods[0]}</span>
                  )}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <LineCard id={`pod-${m.name}-cpu`} title="CPU" config={config} data={series(m.cpu, m.cpu * 0.4)} ticks={ticks} range={range} unit="m" selected={null} onSelect={() => {}} />
                  <LineCard id={`pod-${m.name}-mem`} title="Memory" config={config} data={series(m.mem, m.mem * 0.08)} ticks={ticks} range={range} unit="MiB" selected={null} onSelect={() => {}} />
                </div>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- 원본 데이터 다운로드 모달 */

// 원천: 피그마 「d 1」(1035:6178, 2026-10-08) — 제목 행 [원본 데이터]가 연다.
// 시작·종료 시각 = 날짜(팝오버 달력) + 시각(1시간 단위 셀렉트, UTC) · 파일 형식 = CSV/JSON · [취소] [다운로드]
// 최대 조회 기간 14일 — 넘거나 종료가 시작보다 앞서면 안내 문구 + [다운로드] 비활성
const HOURS = Array.from({ length: 24 }, (_, h) => `${pad(h)}:00`);
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function RawDownloadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // 기본값 = 지금부터 24시간 전 ~ 지금(시 단위로 내림)
  const [fromDay, setFromDay] = React.useState(new Date(2026, 9, 6));
  const [fromHour, setFromHour] = React.useState("01:00");
  const [toDay, setToDay] = React.useState(new Date(2026, 9, 7));
  const [toHour, setToHour] = React.useState("01:00");
  const [format, setFormat] = React.useState("csv");

  const at = (d: Date, h: string) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), Number(h.slice(0, 2)));
  const span = at(toDay, toHour) - at(fromDay, fromHour);
  const problem =
    span <= 0 ? "종료 시각은 시작 시각보다 뒤여야 합니다." : span > 14 * DAY ? "최대 조회 기간은 14일입니다." : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>원본 데이터 다운로드</DialogTitle>
          <DialogDescription>
            선택한 기간 동안 수신된 원본 상태 메시지를 파일로 내려받습니다. 최대 조회 기간은 14일입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <DateHourField label="시작 시각" day={fromDay} onDay={setFromDay} hour={fromHour} onHour={setFromHour} />
          <DateHourField label="종료 시각" day={toDay} onDay={setToDay} hour={toHour} onHour={setToHour} />
          <div className="space-y-2">
            <Label>파일 형식</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger aria-label="파일 형식" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {problem && <p className="text-sm text-destructive">{problem}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button disabled={!!problem} onClick={() => onOpenChange(false)}>
            다운로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DateHourField({
  label,
  day,
  onDay,
  hour,
  onHour,
}: {
  label: string;
  day: Date;
  onDay: (d: Date) => void;
  hour: string;
  onHour: (h: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start font-normal">
              <CalendarIcon className="size-4 text-secondary-foreground" />
              {ymd(day)}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              today={CAL_TODAY}
              classNames={TODAY_CLASS}
              defaultMonth={day}
              disabled={{ after: CAL_TODAY }}
              selected={day}
              onSelect={(d: Date | undefined) => {
                if (d) onDay(d);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <Select value={hour} onValueChange={onHour}>
          <SelectTrigger aria-label={`${label} 시각`} className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h} UTC
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 기간 피커 (FE 리뷰용 제안) */

// 레일 6칸(2026-10-07 디자이너 확정) — 최근 24시간 · 오늘 · 어제 · 최근 7일 · 최근 14일 · 직접 지정(3시간).
// 오늘·어제·최근 7일·최근 14일은 DS 날짜 패널 프리셋 그대로(이름·범위 모두 filter-bar.tsx resolveDateRange 와 같다).
// 최근 24시간(시간 단위)과 직접 지정(3시간 칸 고르기)만 DS 밖 — 점선 마커.
// 직접 지정 외에는 범위가 저절로 잡히고 캘린더는 미리보기 전용이다. 확정은 [적용](DS 「고르고 적용」 문법)
// 1·3·6개월 추가(2026-10-08 디자이너 지정 — 실물 기간 셀렉트에 3개월·6개월이 있다). 레일 순서 = 짧은 기간 → 긴 기간
type Preset =
  | "최근 24시간"
  | "오늘"
  | "어제"
  | "최근 7일"
  | "최근 14일"
  | "최근 1개월"
  | "최근 3개월"
  | "최근 6개월"
  | "직접 지정";
type Applied = { preset: Preset; start?: Date };
const TODAY0 = Date.UTC(2026, 9, 7);
const PRESETS: { key: Preset; from: number; to: number; hour?: boolean; fallback?: boolean }[] = [
  { key: "최근 24시간", from: NOW.getTime() - 24 * HOUR, to: NOW.getTime(), hour: true, fallback: true },
  { key: "오늘", from: TODAY0, to: NOW.getTime() },
  { key: "어제", from: TODAY0 - DAY, to: TODAY0 - 1 },
  { key: "최근 7일", from: TODAY0 - 6 * DAY, to: NOW.getTime() },
  { key: "최근 14일", from: TODAY0 - 13 * DAY, to: NOW.getTime() },
  { key: "최근 1개월", from: Date.UTC(2026, 8, 8), to: NOW.getTime(), fallback: true },
  { key: "최근 3개월", from: Date.UTC(2026, 6, 8), to: NOW.getTime(), fallback: true },
  { key: "최근 6개월", from: Date.UTC(2026, 3, 8), to: NOW.getTime(), fallback: true },
];

const mmdd = (d: Date) => `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const hhmm = (d: Date) => `${pad(d.getUTCHours())}:00`;
// 캘린더는 로컬 날짜로 그린다 — UTC 날짜를 같은 연·월·일의 로컬 Date 로 옮겨 넘긴다
const toLocalDay = (d: Date) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const startOfWeekUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay()));

// 3시간 기본값 — 지금 직전의 3시간 칸(10-06 21:00 ~ 24:00)
const DEFAULT_SLOT = new Date(Date.UTC(2026, 9, 6, 21));

// 캘린더 공통 — 오늘은 목업 기준일(10-07)로 고정해 실제 날짜가 바뀌어도 샘플이 흔들리지 않게 한다.
// 오늘 표시 = 테두리 + 굵은 글자(2026-10-07 디자이너 지정). DS Calendar 의 today 는 bg-accent 채움이라
// 범위 띠·주 띠(같은 bg-accent)와 구분되지 않았다 — DS 캘린더 6곳 공통 문제라 FE 요청 항목이다(이 화면만 제안으로 적용)
const CAL_TODAY = toLocalDay(NOW);
// 오늘 표시 클래스는 로컬 공용 상수(_detail/calendar-today.ts) — 생성 화면의 달력 전부가 같은 것을 쓴다(2026-10-08)
// 직접 지정은 오늘부터 최근 3개월까지만(실물 상세 조회 「최근 3개월」) — 미래 날을 고르면 데이터 없는 칸이 잡혔다
const SLOT_DISABLED = [{ after: CAL_TODAY }, { before: new Date(2026, 6, 7) }];

// 확정값(applied)은 페이지가 쥔다 — 그래프·히트맵이 고른 기간을 따라 다시 그려진다(2026-10-08)
function PeriodPicker({ applied, onApply }: { applied: Applied; onApply: (a: Applied) => void }) {
  const [open, setOpen] = React.useState(false);
  const setApplied = onApply;
  // 패널 안의 미리보기 — [적용]으로 확정, [취소]로 버린다(DS 날짜 패널과 같은 문법)
  const [preset, setPreset] = React.useState<Preset>(applied.preset);
  const [start, setStart] = React.useState<Date>(applied.start ?? DEFAULT_SLOT);

  const onOpenChange = (v: boolean) => {
    if (v) {
      setPreset(applied.preset);
      setStart(applied.start ?? DEFAULT_SLOT);
    }
    setOpen(v);
  };

  const label =
    applied.preset === "직접 지정" && applied.start
      ? `3시간 · ${mmdd(applied.start)} ${hhmm(applied.start)}`
      : applied.preset;
  const isSlot = preset === "직접 지정";
  const range = PRESETS.find((p) => p.key === preset) ?? PRESETS[3];
  const from = new Date(range.from);
  const to = new Date(range.to);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-32 justify-between font-normal" aria-label="조회 기간">
          {label}
          <ChevronDown className="size-4 text-secondary-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          {/* 프리셋 레일 — DS 날짜 패널 프리셋 모드와 같은 마크업(✓ 오른쪽).
              DS 밖 칸(최근 24시간 · 직접 지정)은 화면 표시 없이 data-ds="fallback" 속성만 단다 —
              점선 상자·「DS에 없음」 라벨이 피커를 어지럽혀 뺐다(2026-10-08 디자이너 지시). 검사 도구는 속성으로 찾는다 */}
          <div className="w-40 space-y-0.5 border-r p-2">
            {PRESETS.map((p) =>
              p.fallback ? (
                <div key={p.key} data-ds="fallback">
                  <RailItem label={p.key} checked={preset === p.key} onClick={() => setPreset(p.key)} />
                </div>
              ) : (
                <RailItem key={p.key} label={p.key} checked={preset === p.key} onClick={() => setPreset(p.key)} />
              ),
            )}
            {/* 직접 지정 — 프리셋과 성격이 달라(사용자가 고른다) 구분선 아래에 둔다 */}
            <div className="my-1 border-t" />
            <div data-ds="fallback">
              <RailItem label="직접 지정 (3시간)" checked={isSlot} onClick={() => setPreset("직접 지정")} />
            </div>
          </div>

          <div className="flex flex-col p-3">
            {isSlot ? (
              <SlotPicker start={start} onStart={setStart} />
            ) : (
              <>
                <div className="flex items-center gap-2 pb-2 text-sm">
                  <span className="text-secondary-foreground">From</span>
                  <span className="rounded-md border px-2 py-1 font-mono text-xs">
                    {mmdd(from)}
                    {range.hour ? ` ${pad(from.getUTCHours())}:${pad(from.getUTCMinutes())}` : ""}
                  </span>
                  <span className="text-secondary-foreground">to</span>
                  <span className="rounded-md border px-2 py-1 font-mono text-xs">
                    {mmdd(to)}
                    {range.hour ? ` ${pad(to.getUTCHours())}:${pad(to.getUTCMinutes())}` : ""}
                  </span>
                  <span className="text-xs text-secondary-foreground">UTC</span>
                </div>
                {/* 프리셋은 범위가 저절로 잡힌다 — 캘린더는 미리보기 전용. onSelect 는 빈 함수로 둔다:
                    react-day-picker 는 onSelect 가 없으면 selected 를 첫 렌더에만 읽어(비제어) 프리셋을 바꿔도
                    범위가 따라오지 않았다(2026-10-07 디자이너 지적). 빈 함수 = 제어 모드 + 날짜 클릭은 무시 */}
                {/* showOutsideDays 끔 — 두 달을 나란히 보일 때 9월 끝줄에 10월 1~3일이 넘쳐 들어와
                    범위 시작(10-01)이 두 달력에 동시에 칠해졌다(2026-10-08 디자이너 지적: 「시작점이 3개」).
                    두 달을 완전히 나눈다. 한 달짜리 직접 지정 달력은 주 띠를 보여야 해서 그대로 둔다 */}
                {/* 왼쪽 = 시작일이 있는 달 · 오른쪽 = 종료일이 있는 달(2026-10-08 디자이너 지적 — 9·10월 고정이라 3·6개월의 시작일이 안 보였다).
                    두 달 보기(numberOfMonths=2)는 이어진 달만 그려서 한 달짜리 둘로 나눴다. 같은 달 안의 기간이면 왼쪽은 전달.
                    key = 프리셋 — defaultMonth 는 처음 그릴 때만 읽혀서 프리셋을 바꾸면 다시 그린다 */}
                <div className="flex gap-4">
                  {(() => {
                    const end = new Date(to.getUTCFullYear(), to.getUTCMonth(), 1);
                    const startM = new Date(from.getUTCFullYear(), from.getUTCMonth(), 1);
                    const left = startM.getTime() === end.getTime() ? new Date(end.getFullYear(), end.getMonth() - 1, 1) : startM;
                    return [left, end].map((m) => (
                      <Calendar
                        key={`${preset}-${m.getTime()}`}
                        mode="range"
                        numberOfMonths={1}
                        showOutsideDays={false}
                        defaultMonth={m}
                        today={CAL_TODAY}
                        classNames={TODAY_CLASS}
                        selected={{ from: toLocalDay(from), to: toLocalDay(to) }}
                        onSelect={() => {}}
                      />
                    ));
                  })()}
                </div>
              </>
            )}

            <div className="mt-auto flex items-center justify-between pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-secondary-foreground"
                onClick={() => {
                  setPreset("최근 7일");
                  setStart(DEFAULT_SLOT);
                }}
              >
                초기화
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setApplied({ preset, start: isSlot ? start : undefined });
                    setOpen(false);
                  }}
                >
                  적용
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RailItem({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
    >
      {label}
      <Check className={"ml-auto size-4 " + (checked ? "opacity-100" : "opacity-0")} />
    </button>
  );
}

// 3시간 구간 — 실물 「상세 조회」 모달의 판을 패널 안으로 옮겼다.
// 좌 월 캘린더 = 주 이동(고른 날이 속한 주가 그리드에 나온다) · 우 주간 그리드 = 칸이 곧 시작 시각
function SlotPicker({ start, onStart }: { start: Date; onStart: (d: Date) => void }) {
  const weekStart = startOfWeekUTC(start);
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY));
  const end = new Date(start.getTime() + 3 * HOUR);
  const picked = (d: Date) => d.getTime() >= start.getTime() && d.getTime() < end.getTime();
  const weekEnd = days[6];
  // 호버 미리보기 — 올린 칸부터 3칸(누르면 잡힐 구간)을 함께 칠한다(2026-10-07 디자이너 지정). 자정을 넘으면 다음 날 열로 이어진다
  const [hover, setHover] = React.useState<number | null>(null);
  const previewed = (d: Date) => hover !== null && d.getTime() >= hover && d.getTime() < hover + 3 * HOUR;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-secondary-foreground">선택한 구간</span>
        <Badge variant="secondary" className="font-normal">
          3시간
        </Badge>
        <span className="font-mono text-xs">
          {mmdd(start)} {hhmm(start)} ~ {mmdd(end)} {hhmm(end)}
        </span>
        <span className="text-xs text-secondary-foreground">UTC</span>
      </div>

      <div className="flex gap-4">
        <Calendar
          mode="single"
          numberOfMonths={1}
          defaultMonth={toLocalDay(start)}
          today={CAL_TODAY}
          classNames={TODAY_CLASS}
          disabled={SLOT_DISABLED}
          selected={toLocalDay(start)}
          onSelect={(d: Date | undefined) => {
            if (!d) return;
            // 날을 바꿔도 시작 시각은 유지한다. 다만 오늘로 오면서 미래 시각이 되면 지금 직전 칸으로 당긴다
            const next = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), start.getUTCHours());
            const lastHour = Math.floor(NOW.getTime() / HOUR) * HOUR;
            onStart(new Date(Math.min(next, lastHour)));
          }}
          // 고른 날이 속한 주 전체를 옅게 — 그리드가 보여 주는 7일이 어디인지 캘린더에서도 읽힌다
          modifiers={{
            week: (d: Date) => {
              const t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
              return t >= weekStart.getTime() && t <= weekEnd.getTime();
            },
          }}
          modifiersClassNames={{ week: "bg-accent" }}
        />

        {/* 주간 시간 그리드 — DS 밖. 화면 표시 없이 data-ds="fallback" 속성만(2026-10-08) */}
        <div data-ds="fallback" className="space-y-1">
          <p className="text-xs text-secondary-foreground">
            {mmdd(days[0])} ~ {mmdd(weekEnd)} · UTC
          </p>
          <div className="flex">
            {/* 시각 눈금 — 3시간마다 */}
            <div className="w-8 shrink-0 pt-8">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="h-3.5 text-xs leading-none text-secondary-foreground">
                  {h % 3 === 0 ? `${h}시` : ""}
                </div>
              ))}
            </div>
            <div className="grid flex-1 grid-cols-7 border-l border-t">
              {days.map((d) => (
                <div key={d.getTime()} className="w-16 border-r">
                  <div className="flex h-8 flex-col items-center justify-center border-b text-xs leading-tight text-secondary-foreground">
                    <span>{"일월화수목금토"[d.getUTCDay()]}</span>
                    <span>
                      {d.getUTCMonth() + 1}/{d.getUTCDate()}
                    </span>
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = new Date(d.getTime() + h * HOUR);
                    const on = picked(cell);
                    const future = cell.getTime() >= NOW.getTime();
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={future}
                        aria-label={`${mmdd(cell)} ${hhmm(cell)} 부터 3시간`}
                        onClick={() => onStart(cell)}
                        onMouseEnter={() => setHover(cell.getTime())}
                        onMouseLeave={() => setHover(null)}
                        // 미래 칸은 미리보기 안에 들어와도 회색 그대로 — 구간이 지금을 넘어가는지 보이게
                        className={
                          "block h-3.5 w-full border-b " +
                          (on ? "bg-primary" : future ? "bg-muted" : previewed(cell) ? "bg-accent" : "")
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-secondary-foreground">
            왼쪽 달력으로 주를 옮기고, 칸을 누르면 그 시각부터 3시간을 조회합니다. (최근 3개월)
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 조각 */

// 진단 상세 · 클라이언트 상태 — 테두리 한 장 안의 아코디언 행. 상태는 도트+텍스트
function StatusList({
  title,
  items,
  onDetail,
}: {
  title: string;
  items: { key: string; status: DiagStatus }[];
  onDetail?: () => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>
      <Accordion type="multiple" className="rounded-lg border px-3">
        {items.map((d) => (
          <AccordionItem key={d.key} value={d.key}>
            <AccordionTrigger className="py-3 text-sm hover:no-underline">
              <span className="flex w-full items-center justify-between pr-2">
                <span className="text-xs font-semibold">{d.key}</span>
                <StatusBadge label={d.status} tone={STATUS_TONE[d.status]} bg={false} className="font-normal" />
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {d.key === "SYSTEM" && onDetail ? (
                <>
                  <ItemGroup>
                    <Item size="sm">
                      <ItemContent>
                        <ItemDescription>CPU Usage</ItemDescription>
                      </ItemContent>
                      <span className="text-sm font-medium">55%</span>
                    </Item>
                    <Item size="sm">
                      <ItemContent>
                        <ItemDescription>Memory Usage</ItemDescription>
                      </ItemContent>
                      <span className="text-sm font-medium">72%</span>
                    </Item>
                  </ItemGroup>
                  <Button variant="outline" size="sm" className="w-full" onClick={onDetail}>
                    <Code className="size-4" /> 상세 정보 확인
                  </Button>
                </>
              ) : (
                <p className="text-xs text-secondary-foreground">
                  항목 상세 — 실물 캡처에서 접혀 있어 자리만 잡아 둡니다.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

// 값 표기 — % 는 정수, Mbps 는 소수 둘째 자리(실물 캡처와 같은 자리수)
// Pod 모달의 m(밀리코어)·MiB 는 정수로(실물 「33 m」 · 「257 MiB」)
const fmtVal = (v: number, unit: string) =>
  unit === "%" ? `${Math.round(v)}%` : unit === "m" || unit === "MiB" ? `${Math.round(v)} ${unit}` : `${v.toFixed(2)} ${unit}`;

// 선 그래프 카드 — 제목 + 정보 아이콘, 범례(색 점 · 이름 · 최신값), 우상단 PNG, 그래프.
// 마우스를 따라오는 툴팁 = DS ChartTooltip(커서 세로선 · 선마다 점 포함). 머리글은 시각(UTC) + 상대 시간,
// 행은 색 점 · 이름 · 단위 붙은 값 — DS 툴팁의 labelFormatter · formatter 로만 바꿨다(새 컴포넌트 없음).
// 그래프를 누르면 그 시각이 골라지고(onSelect) 점선 세로줄(ReferenceLine)이 선다
function LineCard({
  id,
  title,
  config,
  data,
  ticks,
  range,
  unit,
  selected,
  onSelect,
}: {
  id: string;
  title: string;
  config: LineConfig;
  data: Record<string, string | number | null>[];
  ticks: string[];
  range: Range;
  unit: string;
  selected: string | null;
  onSelect: (t: string) => void;
}) {
  const keys = Object.keys(config);
  // 범례 값 = 마지막으로 수집된 값
  const latest = (k: string) => {
    for (let i = data.length - 1; i >= 0; i--) if (typeof data[i][k] === "number") return data[i][k] as number;
    return 0;
  };
  return (
    // scroll-mt — 2xl 미만은 셸 헤더 + 상단 탭 두 줄 아래로 멈춰야 제목이 가려지지 않는다
    <Card id={id} variant="flat" className="scroll-mt-60 space-y-3 p-4 2xl:scroll-mt-24">
      {/* 머리 행 = 제목 + PNG 만. 범례는 아래 줄 카드 전폭 — 범례가 PNG 옆 칸에 갇혀 긴 Pod 이름·값이 줄바꿈되던 것(2026-10-08 디자이너 지적).
          히트맵 카드(범례가 머리 아래)와 같은 구조 */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1 text-sm font-medium text-secondary-foreground">
          {title} <Info className="size-3.5" />
        </h2>
        <Button variant="ghost" size="sm">
          <Download className="size-4" /> PNG
        </Button>
      </div>
      {/* 범례 = 한 줄에 하나, 카드 전폭 — 이름은 왼쪽, 값은 오른쪽 끝에 세로로 맞춘다(표처럼, 2026-10-08 디자이너 결정 · 모든 선 그래프 공통).
          긴 이름은 값 앞에서 … 로 자르고 전체 이름은 호버(title) */}
      <div className="space-y-1">
        {keys.map((k) => (
          <div key={k} className="flex items-center gap-1.5 text-xs">
            {/* 범례 점 색은 저장소 선례 그대로 인라인 var — 대시보드 도넛 범례와 같은 문법 */}
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: config[k].color }} />
            <span className="min-w-0 flex-1 truncate text-secondary-foreground" title={config[k].label}>
              {config[k].label}
            </span>
            <span className="whitespace-nowrap font-mono font-medium">{fmtVal(latest(k), unit)}</span>
          </div>
        ))}
      </div>
      {/* 플롯 테두리 상자 없음 — 카드 면에 바로 그린다(히트맵과 같은 문법, 2026-10-08) */}
      <div>
        <ChartContainer config={config as ChartConfig} className="aspect-auto h-56 w-full cursor-pointer">
          <LineChart
            data={data}
            margin={{ left: 4, right: 12 }}
            onClick={(s: { activeLabel?: string | number } | null) => {
              if (s?.activeLabel != null) onSelect(String(s.activeLabel));
            }}
          >
            <CartesianGrid vertical={false} />
            {/* 눈금 글자 — 하루 이하 기간은 시각(HH:00), 그보다 길면 날짜(MM-DD) */}
            <XAxis
              dataKey="t"
              ticks={ticks}
              tickFormatter={(t: string) => (range.to - range.from <= DAY ? t.slice(6) : t.slice(0, 5))}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="min-w-48"
                  labelFormatter={(_, payload) => {
                    const t = (payload?.[0]?.payload as { t?: string } | undefined)?.t;
                    if (!t) return null;
                    return (
                      <span className="block space-y-0.5">
                        <span className="block font-mono">2026-{t} UTC</span>
                        <span className="block font-normal text-secondary-foreground">{ago(tMs(t))}</span>
                      </span>
                    );
                  }}
                  formatter={(value, name, item) => (
                    <span className="flex w-full items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="flex-1 text-secondary-foreground">{config[String(name)]?.label ?? String(name)}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">{fmtVal(Number(value), unit)}</span>
                    </span>
                  )}
                />
              }
            />
            {/* 고른 시각 — 점선 세로줄. 세 그래프가 같은 시각을 가리킨다 */}
            {selected && (
              <ReferenceLine x={selected} stroke="var(--primary)" strokeDasharray="4 4" strokeWidth={1.5} />
            )}
            {/* 그리기 애니메이션 끔 — 애니메이션이 멈춘 탭에서 선이 안 보이는 문제(2026-09-29 실측) */}
            {keys.map((k) => (
              <Line
                key={k}
                dataKey={k}
                type="monotone"
                stroke={`var(--color-${k})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    </Card>
  );
}

function HeatmapCard({
  id,
  title,
  desc,
  legend,
  rows,
  range,
  colLabel,
}: {
  id: string;
  title: string;
  desc: string;
  legend: { label: string; tone: HeatmapTone }[];
  rows: HeatRow[];
  range: Range;
  colLabel: string;
}) {
  const starts = React.useMemo(() => cellStarts(range), [range]);
  const cells = React.useMemo(() => rows.map((r) => cellsFor(r, range, starts)), [rows, range, starts]);
  const nameOf = (c: Cell) => legend.find((l) => l.tone === CELL_TONE[c])?.label ?? c;
  return (
    <Card id={id} variant="flat" className="scroll-mt-60 p-4 2xl:scroll-mt-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>
          <p className="text-xs text-secondary-foreground">{desc}</p>
        </div>
        <Button variant="ghost" size="sm">
          <Download className="size-4" /> PNG
        </Button>
      </div>
      <HeatmapLegend className="mt-2" items={legend} />
      <DenseHeatmap rows={rows} cells={cells} starts={starts} range={range} colLabel={colLabel} nameOf={nameOf} />
    </Card>
  );
}

// 칸 자동 축소 히트맵 — 칸 수와 상관없이 표 폭에 맞춰 나눈다(6개월 180칸 ≈ 칸 4px, GitHub 잔디처럼). 가로 스크롤 없음.
// DS HeatmapGrid 는 칸이 고정(h-5 · min-w-8 = 32px)이라 180칸이면 가로로 넘친다 — 클론에서 못 고쳐 화면 안 임시 조합.
// 관리자에게 HeatmapGrid dense 모드 요청(2026-10-08). 색은 HeatmapGrid 와 같은 톤 클래스. 화면 표시 없이 data-ds="fallback" 만
const CELL_BG: Record<Cell, string> = { ok: "bg-success", bad: "bg-destructive", mid: "bg-caution", none: "bg-muted" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function DenseHeatmap({
  rows,
  cells,
  starts,
  range,
  colLabel,
  nameOf,
}: {
  rows: HeatRow[];
  cells: Cell[][];
  starts: number[];
  range: Range;
  colLabel: string;
  nameOf: (c: Cell) => string;
}) {
  const n = starts.length;
  const span = range.to - range.from;
  const fmt = (ms: number) => (range.cell >= DAY ? mmdd(new Date(ms)) : `${mmdd(new Date(ms))} ${hhmm(new Date(ms))}`);
  // 눈금 — 하루 이하: 3칸마다 시각 / 하루 넘는 시간 칸: 매일 0시에 날짜(14일은 이틀마다) / 일 칸: 45칸 이하는 고르게 날짜, 넘으면 매달 1일에 월 이름
  const tick = (ms: number, i: number): string | null => {
    const d = new Date(ms);
    // 오른쪽 끝 8% 안의 눈금은 뺀다 — 글자가 카드 밖으로 삐져나갔다(1440px 실측 25px)
    if (n > 8 && i > n * 0.92) return null;
    if (span <= DAY) return i % 3 === 0 ? hhmm(d) : null;
    if (range.cell < DAY) return d.getUTCHours() === 0 && (span <= 8 * DAY || d.getUTCDate() % 2 === 0) ? mmdd(d) : null;
    if (n <= 45) return i % Math.ceil(n / 8) === 0 ? mmdd(d) : null;
    return d.getUTCDate() === 1 ? MONTHS[d.getUTCMonth()] : null;
  };
  // 기간이 길면(칸이 좁으면) 칸 높이도 낮춘다
  const h = n > 60 ? "h-3" : "h-5";
  return (
    <div data-ds="fallback" className="mt-3 space-y-1">
      <div className="flex items-end gap-4 pb-1">
        <span className="w-40 shrink-0 text-xs font-medium uppercase text-secondary-foreground">{colLabel}</span>
        <div className="flex h-4 min-w-0 flex-1 gap-px">
          {starts.map((ms, i) => {
            const t = tick(ms, i);
            return (
              <span key={ms} className="relative min-w-0 flex-1">
                {t && <span className="absolute bottom-0 left-0 whitespace-nowrap text-xs text-secondary-foreground">{t}</span>}
              </span>
            );
          })}
        </div>
      </div>
      {rows.map((r, ri) => (
        <div key={r.name} className="flex items-center gap-4">
          <span className="w-40 shrink-0 truncate font-mono text-sm">
            {r.group && <span className="mr-1 text-secondary-foreground">+</span>}
            {r.name}
          </span>
          <div className="flex min-w-0 flex-1 gap-px">
            {cells[ri].map((c, i) => (
              <span
                key={starts[i]}
                title={`${fmt(starts[i])}${range.cell > HOUR ? ` ~ ${fmt(starts[i] + range.cell)}` : ""} UTC · ${nameOf(c)}`}
                className={`${h} min-w-0 flex-1 rounded-xs ${CELL_BG[c]}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
