"use client";

// 호선 업데이트 — ① admin-console 프레임
//   허브 = B 상세(전폭 단일 컬럼) · STEP 1~5 = C 위저드(좌 정보 레일 + 본문)
// 원천: 운영 캡처 9장(2026-09-21). 납품·테스트 호선 상세의 우상단 [업데이트] 로 진입한다.
//
// 2026-09-21 디자이너 확정
// - 화면 7개(허브 · 버전 선택 모달 · STEP 1~5)를 한 파일에서 스텝 전환한다(단일 파일 진화)
// - STEP 1~4 하단에 스티키 CTA — 본문이 길어도 다음 단계 버튼이 항상 바닥에 보인다.
//   `sticky bottom-0 border-t bg-secondary py-3` · 본문 컬럼 안에서만 (body-patterns C·E 공통 스펙)
//   좌측 안내 슬롯은 비워 둔다 — 규칙이 선택 슬롯으로 정하면서 커밋 개념 없는 이 흐름을 예로 들었다
// - 진짜 본문 전용 스크롤(셸 필하이트)은 layout.tsx 가 14면 공유라 별건으로 남겼다
// - STEP 5(업데이트 적용)는 캡처가 없다 — 자리만 잡고 비운다. 발명하지 않는다
// - 제품 카드 4장(Navigation · SVM · Control · Shield) — 캡처 주석 "sheild 추가돼서 카드 총 4개로 바뀜"
//
// 색 — 규칙 + updates/page.tsx 선례: 실패·롤백만 destructive · 완료만 success · 나머지 기본색
// - 운영의 주황(IMAGE READY · Unreachable)과 보라(UPDATE REQUESTED · 제품 배지)는 DS 토큰이 없어 neutral 로 내렸다
// - 표 안 상태는 도트+텍스트(StatusBadge bg={false}) 한 벌 — 캡처가 도트·칩 두 벌로 갈려 있던 것을 통일
//
// 2026-09-29 디자이너 확정 (레이아웃 4건 + 도구 모달)
// - 한 박스 — 스텝퍼 · ACTION · 에러 콘솔 · 본문이 divide-y 로 나뉜 한 카드의 행이다.
//   하단 스티키 바만 박스 밖: 안에 넣으면 바닥 고정이 깨진다
// - 도구 넷을 레일에서 페이지 우상단으로. 이름은 변경목록 · Automation · 로그 · 네트워크이고
//   뒤 둘은 아이콘 전용(Tooltip 으로 이름). 레일 TOOLS & RESOURCES 섹션은 제거
// - 레일 맨 위: 좌 [← 업데이트 목록] · 우 「최근 갱신 4초 전」+갱신 아이콘 한 덩어리
// - 도구 넷은 모두 센터 모달(피그마 3100:145) — 피그마가 시트로 그린 둘도 모달로 통일했다
//
// 상태: 진행률이 실재하는 화면(STEP 4 다운로드 %)이라 PROGRESS_STATES 5종
// 규정: regulations/control.md 는 Control 선내 화면(ISO 8468 시거리)용이라 이 관리 콘솔 화면에는 적용 대상 아님
// 프로토 편의: 스텝퍼를 눌러 단계를 오갈 수 있다 — 제품 동작이 아니라 플로우 확인용

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileText,
  Globe,
  History,
  Info,
  ListChecks,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Terminal,
  Upload,
  X,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@ds/ui/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Card } from "@ds/ui/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@ds/ui/ui/chart";
import { Checkbox } from "@ds/ui/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ds/ui/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Input } from "@ds/ui/ui/input";
import { Label } from "@ds/ui/ui/label";
import { ListFooter } from "@ds/ui/ui/list-footer";
import { PageHeader } from "@ds/ui/ui/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ds/ui/ui/pagination";
import { Progress } from "@ds/ui/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ds/ui/ui/select";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import { Spinner } from "@ds/ui/ui/spinner";
import { StatePreview, PROGRESS_STATES } from "@ds/ui/ui/state-preview";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Stepper, StepperItem } from "@ds/ui/ui/stepper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ds/ui/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Timeline, TimelineItem, TimelineMeta, TimelineTitle } from "@ds/ui/ui/timeline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

/* ---------------------------------------------------- 목업 데이터 */

const BASE = "/gallery/hinas365";

const VESSEL = { name: "9811000", hull: "HULL1234" };

// 제품 카드 4장 — UPDATE 상태는 neutral/success/error 3톤만(주황 Unreachable → neutral)
type Tone = "neutral" | "success" | "error" | "progress";
const PRODUCT_CARDS: { name: string; common: string; product: string; ssm: string; update: string; tone: Tone; disabled?: boolean }[] = [
  { name: "NAVIGATION", common: "v3.4.2", product: "v3.4.0-rc.5", ssm: "mi-0123456789abcde01", update: "Awaiting Ship Confirm (Failed)", tone: "error" },
  { name: "SVM", common: "v3.4.0", product: "v1.1.2", ssm: "mi-0123456789abcdef0", update: "Ready", tone: "success" },
  { name: "CONTROL", common: "v3.3.4", product: "v2.0.3", ssm: "mi-0123456789abcde02", update: "Unreachable", tone: "neutral", disabled: true },
  { name: "SHIELD", common: "v4.0.0-shield.27", product: "v0.0.73", ssm: "mi-0123456789abcde03", update: "Ready", tone: "success" },
];

type Attempt = {
  id: string;
  status: string;
  tone: Tone;
  product: string;
  common: [string, string];
  prod: [string, string];
  start: string;
  startAgo: string;
  end: string | null;
  endAgo: string | null;
};

const RUNNING: Attempt[] = [
  {
    id: "upda",
    status: "UPDATING",
    tone: "progress",
    product: "SVM",
    common: ["v1.0.0", "v1.1.0"],
    prod: ["v1.0.0", "v1.1.0"],
    start: "2023-10-01 12:00",
    startAgo: "2년 전",
    end: "2026-06-01 05:55",
    endAgo: "1개월 전",
  },
];

const PAST: Attempt[] = [
  {
    id: "7b74",
    status: "UPDATE REQUESTED",
    tone: "neutral",
    product: "NAVIGATION",
    common: ["v3.5.0-test.15", "v3.5.0-test.14"],
    prod: ["v3.5.0-rc.1", "v3.5.0-imu.1"],
    start: "2026-01-07 01:33",
    startAgo: "6개월 전",
    end: null,
    endAgo: null,
  },
  {
    id: "7db5",
    status: "COMPLETED",
    tone: "success",
    product: "SVM",
    common: ["v3.4.4", "v3.5.0-test.15"],
    prod: ["v1.2.0-test2", "v1.2.0-rc.1"],
    start: "2026-01-07 03:41",
    startAgo: "6개월 전",
    end: "2026-01-08 01:50",
    endAgo: "6개월 전",
  },
  {
    id: "0da4",
    status: "CANCELED",
    tone: "neutral",
    product: "NAVIGATION",
    common: ["v4.0.0-update.1", "v4.0.0-update.1"],
    prod: ["v3.5.2", "v3.5.0"],
    start: "2026-02-23 05:01",
    startAgo: "5개월 전",
    end: null,
    endAgo: null,
  },
];

const STEPS = ["업데이트 옵션 설정", "업데이트 내용", "업데이트 항목 조회", "이미지 다운로드", "업데이트 적용"];

// 좌측 레일 — UPDATE INFO
const UPDATE_INFO: [string, string, Tone | null][] = [
  ["제품", "svm", null],
  ["Update ID", "update-1", null],
  ["SSM Status", "Online", "success"],
  ["SSM Instance", "mi-01234", null],
];

const HISTORY: { label: string; meta: string; status: "default" | "current" | "success" | "error" }[] = [
  { label: "SYSTEM ROLLBACK FAILED", meta: "2개월 전", status: "error" },
  { label: "SYSTEM ROLLING BACK", meta: "2개월 전 · 소요 1분 37초", status: "error" },
  { label: "SYSTEM UPDATING", meta: "2개월 전 · 소요 3분 4초", status: "default" },
];

// STEP 1 제품 옵션 — 캡처 주석: 입력 항목은 서버에서 동적으로 오고, 항목이 없는 경우도 존재한다
type OptionRow =
  | { kind: "check"; label: string; on: boolean }
  | { kind: "select"; label: string; value: string; required?: boolean }
  | { kind: "text"; label: string; value: string; required?: boolean };

const OPTION_GROUPS: { title: string; rows: OptionRow[] }[] = [
  {
    title: "Basic Configuration",
    rows: [
      { kind: "check", label: "DNV Cert", on: false },
      { kind: "check", label: "Enable CA", on: true },
      { kind: "check", label: "Enable S Mode", on: true },
      { kind: "check", label: "Enable UPS", on: true },
      { kind: "check", label: "Enable Route Optimization", on: false },
    ],
  },
  {
    title: "Navigation Configuration",
    rows: [
      { kind: "check", label: "Enable Navigation(MIP)", on: true },
      { kind: "check", label: "IP Camera", on: false },
      { kind: "select", label: "Display Count", value: "1", required: true },
      { kind: "select", label: "Camera FOV", value: "180", required: true },
      { kind: "check", label: "Enable Inclinometer Widget", on: false },
      { kind: "check", label: "Enable Position Widget", on: false },
      { kind: "check", label: "Enable Azimuth Thruster", on: false },
    ],
  },
  {
    title: "ECDIS Configuration",
    rows: [
      { kind: "select", label: "Ecdis Communication Type", value: "450", required: true },
      { kind: "text", label: "Ecdis HiNAS SFI", value: "II0001" },
      { kind: "text", label: "Ecdis SFI", value: "EI0001" },
    ],
  },
  {
    title: "Sensor Configuration",
    rows: [
      { kind: "select", label: "Sensor Network IP", value: "FURUNO: 192.168.32.16", required: true },
      { kind: "select", label: "CAMS/BAMS IP", value: "Not Installed: 10.0.100.20", required: true },
      { kind: "check", label: "Enable AMS", on: false },
      { kind: "text", label: "BMS Port", value: "504" },
    ],
  },
];

const ERROR_LINES = [
  { text: "[2026-07-07 10:19:25] SYSTEM_ROLLING_BACK", error: true },
  { text: "[2026-07-07 10:21:02] SYSTEM_ROLLBACK_FAILED", error: true },
];

const RELEASE_NOTES: { kind: string; title: string; rows: [string, string][] }[] = [
  { kind: "COMMON", title: "Common 릴리즈 노트", rows: [["1.0.0", "2023-10-01 12:00"], ["1.0.0", "2023-10-01 12:00"]] },
  { kind: "PRODUCT", title: "SVM 릴리즈 노트", rows: [["1.0.0", "2023-10-01 12:00"], ["1.0.0", "2023-10-01 12:00"]] },
];

const IMAGE_CHANGES: [string, string, string, string][] = [
  ["hidom-2.0-aws", "32MB", "v1.0.0", "v1.1.0"],
  ["hinas-api", "120MB", "v2.0.0", "v2.1.0"],
  ["hidom-ui", "45MB", "-", "v1.8.0"],
];

const BINARY_CHANGES: [string, string, string, string, boolean][] = [
  ["hi-frame", "213.99 MB", "1.3.2", "1.3.2", true],
  ["k3s", "665.09 MB", "1.30.5", "1.33.0", false],
];

// STEP 4 다운로드 상태 — 상태는 도트+텍스트 한 벌(캡처의 칩 변형은 채택하지 않음)
type DlRow = { name: string; version: string; size: string; start: string; done: string; fail: string; status: string; tone: Tone };
const DL_IMAGE: DlRow[] = [
  { name: "hinas-api", version: "v2.1.0", size: "100MB", start: "2026-06-04 09:08", done: "2026-06-04 09:08", fail: "-", status: "SUCCEEDED", tone: "success" },
  { name: "hinas-worker", version: "v2.1.0", size: "-", start: "-", done: "-", fail: "-", status: "SUCCEEDED", tone: "success" },
  { name: "hidom-ui", version: "v1.8.0", size: "-", start: "-", done: "-", fail: "-", status: "RUNNING", tone: "progress" },
];
const DL_BINARY: DlRow[] = [
  { name: "hi-frame", version: "v3.2.0", size: "-", start: "-", done: "-", fail: "-", status: "NOT_STARTED", tone: "neutral" },
  { name: "k3s", version: "v1.28.5", size: "-", start: "-", done: "-", fail: "-", status: "NOT_STARTED", tone: "neutral" },
];

// STEP 4 국면 — 피그마 프레임 3052:2 의 캡처 다섯 장이 한 화면의 다섯 국면이다
type Phase = "requested" | "progress" | "failed" | "done" | "empty";
const PHASES: { key: Phase; label: string }[] = [
  { key: "requested", label: "요청됨" },
  { key: "progress", label: "진행 중" },
  { key: "failed", label: "실패" },
  { key: "done", label: "완료" },
  { key: "empty", label: "항목 없음" },
];

// STEP 5 변형 3종(피그마 3054:28 · 3052:22 · 3052:23) — 「현재 상태」 블록 하나로 같은 골격이다.
// 운영의 주황은 DS 토큰이 없어 실패는 destructive, 완료는 success, 진행은 progress 로 내렸다.
type Outcome = "updating" | "completed" | "failed";
const OUTCOMES: {
  key: Outcome;
  label: string;
  status: string;
  desc: string;
  tone: Tone;
  client: string;
  agent: string;
  cancellable: boolean;
  console: boolean;
}[] = [
  {
    key: "updating",
    label: "진행 중",
    status: "HELM UPDATING",
    desc: "OS 업데이트를 완료하고 Helm 차트 업데이트 중입니다.",
    tone: "progress",
    client: "아니오",
    agent: "아니오",
    cancellable: true,
    console: false,
  },
  {
    key: "completed",
    label: "완료",
    status: "COMPLETED",
    desc: "업데이트가 성공적으로 완료되었습니다.",
    tone: "success",
    client: "아니오",
    agent: "아니오",
    cancellable: false,
    console: false,
  },
  {
    key: "failed",
    label: "실패",
    status: "HELM ROLLBACK FAILED",
    desc: "Helm 차트 롤백에 실패했습니다. 업데이트 프로세스가 종료되었습니다.",
    tone: "error",
    client: "아니오",
    agent: "예",
    cancellable: false,
    console: true,
  },
];

/* ------------------------------------------- 도구 모달 4종 (피그마 3100:145) */

// 우상단 도구 묶음. 앞 둘은 라벨, 뒤 둘은 아이콘만 — 네 개 모두 센터 모달을 연다(2026-09-29 디자이너 확정).
// 이름은 캡처의 레일 라벨(변경사항 보기 · Automation 이력 · Agent 로그 · 네트워크 상태)을 줄인 것이다
type ToolKey = "diff" | "automation" | "log" | "network";
const TOOLS: { key: ToolKey; label: string; icon: React.ComponentType<{ className?: string }>; iconOnly: boolean }[] = [
  { key: "diff", label: "변경목록", icon: FileText, iconOnly: false },
  { key: "automation", label: "Automation", icon: ListChecks, iconOnly: false },
  { key: "log", label: "로그", icon: Terminal, iconOnly: true },
  { key: "network", label: "네트워크", icon: Globe, iconOnly: true },
];

// 변경 사항 목록 모달의 파일 diff 행 — 캡처는 접힌 상태 세 줄만 보인다
const FILE_DIFFS = [".github/workflows/build.yml", "helm/argocd-app/values.yaml", "helm/argocd/values.yaml"];

// SSM Automation 실행 이력 — 상태 톤은 이 페이지 규칙 그대로(실패·시간초과만 error · 성공만 success · 나머지 기본)
type AutoRow = { status: string; tone: Tone; doc: string; start: string; end: string; dur: string; id: string };
const AUTOMATION: AutoRow[] = [
  { status: "InProgress", tone: "progress", doc: "UpdateHinasShip", start: "2026-06-26 03:00:00", end: "", dur: "", id: "89abcdef" },
  { status: "Success", tone: "success", doc: "UpdateHinasShip", start: "2026-06-25 21:00:00", end: "2026-06-25 21:01:30", dur: "1분 30초", id: "8acf1356" },
  { status: "Failed", tone: "error", doc: "UpdateHinasShip", start: "2026-06-25 15:00:00", end: "2026-06-25 15:02:00", dur: "2분 0초", id: "8bf258bd" },
  { status: "Cancelled", tone: "neutral", doc: "CancelHinasShipUpdate", start: "2026-06-25 09:00:00", end: "2026-06-25 09:02:30", dur: "2분 30초", id: "8d159e24" },
  { status: "TimedOut", tone: "error", doc: "UpdateHinasShip", start: "2026-06-25 03:00:00", end: "2026-06-25 03:03:00", dur: "3분 0초", id: "8e38e38b" },
  { status: "Waiting", tone: "neutral", doc: "UpdateHinasShip", start: "2026-06-24 21:00:00", end: "", dur: "", id: "8f5c28f2" },
  { status: "InProgress", tone: "progress", doc: "UpdateHinasShip", start: "2026-06-24 15:00:00", end: "", dur: "", id: "907f6e59" },
  { status: "Success", tone: "success", doc: "CancelHinasShipUpdate", start: "2026-06-24 09:00:00", end: "2026-06-24 09:01:00", dur: "1분 0초", id: "91a2b3c0" },
  { status: "Failed", tone: "error", doc: "UpdateHinasShip", start: "2026-06-24 03:00:00", end: "2026-06-24 03:01:30", dur: "1분 30초", id: "92c5f927" },
  { status: "Cancelled", tone: "neutral", doc: "UpdateHinasShip", start: "2026-06-23 21:00:00", end: "2026-06-23 21:02:00", dur: "2분 0초", id: "93e93e8e" },
];

// Agent 로그 — 목록(파일) → 상세(뷰어) 두 화면이 한 모달 안에서 오간다
const LOG_FILES: { name: string; size: string; at: string; latest?: boolean }[] = [
  { name: "hinas-update-agent.20260626T053000Z.log", size: "1.2 MB", at: "2026-06-26 05:30", latest: true },
  { name: "hinas-update-agent.20260620T021500Z.log", size: "965 KB", at: "2026-06-20 02:15" },
  { name: "hinas-update-agent.20260610T112233Z.log", size: "446 KB", at: "2026-06-10 11:22" },
];
const LOG_LINES: { text: string; error?: boolean }[] = [
  { text: "// Mock Agent log for imo=9811000 product=svm" },
  { text: "// Generated at 2026-09-21T04:46:16.364Z" },
  { text: "" },
  { text: "2026-06-26T05:30:00.000Z [INFO] Agent started." },
  { text: "2026-06-26T05:30:15.000Z [INFO] Loaded config from /etc/hinas-update-agent/config.yaml" },
  { text: "2026-06-26T05:30:30.000Z [INFO] Connected to AWS IoT Core endpoint." },
  { text: "2026-06-26T05:30:45.000Z [DEBUG] Heartbeat sent to control plane." },
  { text: "2026-06-26T05:31:00.000Z [WARN] Pull request received: image=hinas/control:v1.4.2" },
  { text: "2026-06-26T05:31:15.000Z [INFO] Pulling docker image hinas/control:v1.4.2 ..." },
  { text: "2026-06-26T05:31:30.000Z [ERROR] Image pull failed: registry timeout after 30s", error: true },
  { text: "2026-06-26T05:31:45.000Z [INFO] Retrying image pull (attempt 2/3) ..." },
  { text: "2026-06-26T05:32:00.000Z [INFO] Agent started." },
  { text: "2026-06-26T05:32:15.000Z [INFO] Loaded config from /etc/hinas-update-agent/config.yaml" },
  { text: "2026-06-26T05:32:30.000Z [INFO] Connected to AWS IoT Core endpoint." },
  { text: "2026-06-26T05:32:45.000Z [DEBUG] Heartbeat sent to control plane." },
  { text: "2026-06-26T05:33:00.000Z [WARN] Pull request received: image=hinas/control:v1.4.2" },
  { text: "2026-06-26T05:33:15.000Z [INFO] Pulling docker image hinas/control:v1.4.2 ..." },
  { text: "2026-06-26T05:33:30.000Z [ERROR] Image pull failed: registry timeout after 30s", error: true },
];

// 네트워크 대역폭 — 가운데 두 점은 수집 공백이라 null 이다(recharts 가 선을 끊는다).
// 색은 chart-1·chart-4 — 피그마는 초록·파랑이지만 DS chart 토큰은 blue 800~200 다섯 단계뿐이고,
// 대시보드도 같은 한계를 주석으로 남겨 뒀다. 상태색(success)을 데이터색으로 쓰지 않는다(2026-09-29 확정)
const NET_CONFIG = {
  download: { label: "Download", color: "var(--chart-1)" },
  upload: { label: "Upload", color: "var(--chart-4)" },
} satisfies ChartConfig;
const NET_SERIES: { t: string; download: number | null; upload: number | null }[] = [
  { t: "02:08", download: 33, upload: 16 },
  { t: "02:23", download: 41, upload: 19 },
  { t: "02:38", download: 46, upload: 20 },
  { t: "02:53", download: 44, upload: 19 },
  { t: "03:08", download: 48, upload: 20 },
  { t: "03:23", download: 43, upload: 18 },
  { t: "03:38", download: null, upload: null },
  { t: "03:53", download: 38, upload: 17 },
  { t: "04:08", download: 45, upload: 19 },
  { t: "04:23", download: 50, upload: 20 },
  { t: "04:38", download: 48, upload: 19 },
  { t: "04:53", download: 41.6, upload: 17.6 },
];

// 상단 바는 이 화면에서만 단계에 따라 칸이 바뀐다 — DS 의 PROGRESS_STATES 5종은 그대로 두고
// 지금 단계에만 있는 변형을 뒤에 붙인다(2026-09-29 디자이너 확정). 본문에 있던 국면·결과
// 전환기 행을 없애면서 그 선택지가 여기로 올라왔다.
// 단계별로 갈라 두는 이유는 이름이 겹치기 때문이다 — 「진행 중」·「실패」·「완료」가 국면과 결과에
// 모두 있고 「항목 없음」은 STEP 1·4 양쪽에 있다. 한 번에 한 벌만 보이면 같은 글자가 나란히 놓이지 않는다.
// 값은 접두사로 구분한다: phase:<키> · outcome:<키> · 나머지는 화면 상태 그대로
type ViewState = "default" | "loading" | "error" | "empty" | "progress" | "options-empty";

function pageStates(step: number) {
  const base = [...PROGRESS_STATES];
  if (step === 1) base.push({ value: "options-empty", label: "항목 없음" });
  if (step === 4) base.push(...PHASES.map((p) => ({ value: `phase:${p.key}`, label: p.label })));
  if (step === 5) base.push(...OUTCOMES.map((o) => ({ value: `outcome:${o.key}`, label: o.label })));
  return base;
}

/* ---------------------------------------------------- 페이지 */

export default function ShipUpdatePage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [step, setStep] = React.useState(0); // 0 = 허브 · 1~5 = 스텝 · 6 = STEP -. CANCEL(단계가 아닌 종료 화면)
  const [versionOpen, setVersionOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [tool, setTool] = React.useState<ToolKey | null>(null);
  // Agent 로그는 제품 단위다(피그마 제목 「Agent 로그 · SVM」) — 허브 카드의 [Agent 로그]도 같은 모달을 연다
  const [logProduct, setLogProduct] = React.useState("SVM");
  const [phase, setPhase] = React.useState<Phase>("progress");
  const [outcome, setOutcome] = React.useState<Outcome>("updating");
  // 기본 흐름의 STEP 1 은 항상 옵션이 있는 쪽이다. 빈 경우는 상단 상태 미리보기의 「항목 없음」이 담당한다
  const optionsEmpty = false;
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  // 기본 화면일 때는 그 단계의 변형 칸이 켜진다 — STEP 4 면 지금 국면, STEP 5 면 지금 결과.
  // 로딩·에러처럼 화면 전체를 덮는 상태일 때는 그쪽이 켜진다
  const previewValue =
    view !== "default" ? view : step === 4 ? `phase:${phase}` : step === 5 ? `outcome:${outcome}` : view;

  const onPreviewChange = (v: string) => {
    if (v.startsWith("phase:")) {
      setView("default");
      setPhase(v.slice("phase:".length) as Phase);
    } else if (v.startsWith("outcome:")) {
      setView("default");
      setOutcome(v.slice("outcome:".length) as Outcome);
    } else {
      setView(v as ViewState);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title={VESSEL.name}
          // 단계 화면은 제목만 — 단계 이름은 스텝퍼가 이미 밝히고 있어서 설명을 버렸다(2026-09-29 디자이너 지정).
          // 허브의 Name·Hull 과 취소 종료의 라벨은 다른 문장이라 남긴다
          description={step === 0 ? `Name ${VESSEL.name} · Hull ${VESSEL.hull}` : step === 6 ? "STEP -. CANCEL" : undefined}
          actions={
            <>
              {/* 도구 묶음 — 레일의 TOOLS & RESOURCES 를 우상단으로 옮겼다(2026-09-29 디자이너 지정).
                  단계 화면에만 둔다: 허브는 업데이트 목록이라 특정 업데이트의 도구가 붙을 자리가 아니다.
                  아이콘만 두 개는 Tooltip 으로 이름을 밝힌다 — 높이는 sm(h-8) 과 icon-sm(size-8) 로 맞췄다 */}
              {step > 0 && (
                <span className="flex items-center gap-1">
                  {TOOLS.map((t) =>
                    t.iconOnly ? (
                      <Tooltip key={t.key}>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon-sm" aria-label={t.label} onClick={() => setTool(t.key)}>
                            <t.icon className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button key={t.key} variant="outline" size="sm" onClick={() => setTool(t.key)}>
                        <t.icon className="size-4" /> {t.label}
                      </Button>
                    )
                  )}
                </span>
              )}
              <StatePreview value={previewValue} onChange={onPreviewChange} states={pageStates(step)} />
            </>
          }
        />

        {view === "loading" && <BlockSkeleton />}
        {view === "error" && (
          <ErrorState
            title="업데이트 정보를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}
        {view === "empty" && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>진행 중이거나 지난 업데이트가 없습니다.</EmptyTitle>
              <EmptyDescription>제품 카드의 [업데이트]로 새 업데이트를 시작할 수 있습니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {view === "progress" && (
          <Card variant="flat" className="space-y-3 p-6">
            <h2 className="text-sm font-medium text-secondary-foreground">다운로드 진행률</h2>
            <DownloadProgress value={40} />
          </Card>
        )}

        {/* 「항목 없음」은 STEP 1 을 빈 옵션으로 보여주는 케이스다 — 다른 단계로 이동하면 기본으로 돌아온다 */}
        {view === "options-empty" && (
          <Wizard
            step={1}
            onStep={(n) => {
              setView("default");
              setStep(n);
            }}
            phase={phase}
            onPhase={setPhase}
            outcome={outcome}
            optionsEmpty
            onCancel={() => setCancelOpen(true)}
          />
        )}

        {view === "default" &&
          (step === 0 ? (
            <Hub
              onStart={() => setVersionOpen(true)}
              onWatch={() => setStep(1)}
              onLog={(name) => {
                setLogProduct(name);
                setTool("log");
              }}
              page={page}
              onPage={setPage}
              pageSize={pageSize}
              onPageSize={setPageSize}
            />
          ) : step === 6 ? (
            <Canceled onList={() => setStep(0)} />
          ) : (
            <Wizard
              step={step}
              onStep={setStep}
              phase={phase}
              onPhase={setPhase}
              outcome={outcome}
                optionsEmpty={optionsEmpty}
              onCancel={() => setCancelOpen(true)}
            />
          ))}

        <VersionDialog open={versionOpen} onOpenChange={setVersionOpen} onStart={() => { setVersionOpen(false); setStep(1); }} />
        <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} onConfirm={() => { setCancelOpen(false); setStep(6); }} />

        {/* 도구 모달 4종 — 한 상태(tool)가 열린 하나를 가리킨다 */}
        <DiffDialog open={tool === "diff"} onClose={() => setTool(null)} />
        <AutomationDialog open={tool === "automation"} onClose={() => setTool(null)} />
        <LogDialog open={tool === "log"} onClose={() => setTool(null)} product={logProduct} />
        <NetworkDialog open={tool === "network"} onClose={() => setTool(null)} />
      </div>
    </TooltipProvider>
  );
}

/* ---------------------------------------------------- 허브 (전폭 단일 컬럼) */

function Hub({
  onStart,
  onWatch,
  onLog,
  page,
  onPage,
  pageSize,
  onPageSize,
}: {
  onStart: () => void;
  onWatch: () => void;
  onLog: (product: string) => void;
  page: number;
  onPage: (p: number) => void;
  pageSize: number;
  onPageSize: (n: number) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-secondary-foreground">제품 및 네트워크 상태</h2>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {PRODUCT_CARDS.map((p) => (
            <Card key={p.name} variant="flat" className="space-y-4 p-6">
              <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{p.name}</h3>
              <dl className="divide-y">
                {([["Common", p.common], ["Product", p.product], ["SSM Instance", p.ssm]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-xs text-secondary-foreground">{k}</dt>
                    <dd className="break-all font-mono text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {/* 상태 표기는 도트+텍스트 유지 — 채움 칩은 DS 에서 모든 톤이 bg-muted 한 벌이라
                  실물의 톤별 칩과 다르다(2026-09-22 디자이너 확정). (i) 툴팁은 제거 —
                  STEP 1 옵션 필드의 (i)는 캡처에 있어 남긴다.
                  상태는 라벨 행에 합치지 않고 아래 행 우측 정렬 — 카드 내부 폭 249px 에
                  라벨 48 + 배지 232 가 안 들어가 43px 넘쳤다(2026-09-22 실측) */}
              <div className="space-y-2 border-t pt-4">
                {/* flex-wrap — 4열에서 카드가 좁아지면(안쪽 216px 미만) 라벨 48 + 간격 8 + 버튼 160 이
                    한 줄에 안 들어가 버튼이 카드를 넘쳤다. 그때는 버튼이 아랫줄로 내려가 우측 정렬된다(2026-09-29 실측) */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase text-secondary-foreground">Update</p>
                  {/* 아래 액션 페어와 같은 폭(w-40) — 세 버튼의 좌우 끝을 맞춘다(2026-09-29 디자이너 지정).
                      160px 은 페어를 반씩 나눴을 때 「옵션 변경」 실측 78px 이 들어가는 최소 표준 폭이다 */}
                  <Button variant="outline" size="sm" className="ml-auto w-40 shrink-0" onClick={() => onLog(p.name)}>
                    Agent 로그
                  </Button>
                </div>
                <div className="flex justify-end">
                  <StatusBadge label={p.update} tone={p.tone} bg={false} />
                </div>
              </div>
              {/* 카드 액션 페어 — 우측 정렬, 간격은 CTA 문법의 gap-1.
                  2026-09-29: 내용 폭(78/72) 대신 w-40 을 반씩 나눠 둘을 같은 폭으로 두고,
                  위 [Agent 로그]도 같은 w-40 을 써서 세 버튼의 좌우 끝을 맞춘다 */}
              <div className="ml-auto grid w-40 grid-cols-2 gap-1">
                <Button variant="outline" size="sm" disabled={p.disabled}>
                  옵션 변경
                </Button>
                <Button size="sm" disabled={p.disabled} onClick={onStart}>
                  업데이트
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-secondary-foreground">진행 중인 업데이트</h2>
        <AttemptTable rows={RUNNING} onWatch={onWatch} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-secondary-foreground">지난 업데이트</h2>
        <AttemptTable rows={PAST} />
        <ListFooter
          pageSize={pageSize}
          onPageSizeChange={onPageSize}
          total={PAST.length}
          page={page}
          onPageChange={onPage}
          pageCount={10}
        />
      </section>
    </div>
  );
}

function AttemptTable({ rows, onWatch }: { rows: Attempt[]; onWatch?: () => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Update ID</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>제품</TableHead>
          <TableHead>Common 버전</TableHead>
          <TableHead>Product 버전</TableHead>
          <TableHead>기간</TableHead>
          <TableHead className="text-right">액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="align-top">
              <span className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-6" aria-label={`${r.id} 복사`}>
                  <Copy className="size-3.5" />
                </Button>
                <span className="font-mono text-sm">{r.id}</span>
              </span>
            </TableCell>
            <TableCell className="align-top">
              <StatusBadge label={r.status} tone={r.tone} bg={false} />
            </TableCell>
            <TableCell className="align-top">
              <Badge variant="outline">{r.product}</Badge>
            </TableCell>
            <TableCell className="align-top">
              <FromTo from={r.common[0]} to={r.common[1]} />
            </TableCell>
            <TableCell className="align-top">
              <FromTo from={r.prod[0]} to={r.prod[1]} />
            </TableCell>
            <TableCell className="align-top">
              <Range label="START" value={r.start} ago={r.startAgo} />
              <Range label="END" value={r.end} ago={r.endAgo} />
            </TableCell>
            <TableCell className="align-top text-right">
              <span className="flex justify-end gap-1">
                {onWatch && (
                  <Button size="sm" onClick={onWatch}>
                    진행 보기
                  </Button>
                )}
                {/* 히스토리 = 그 업데이트의 상태 변경 기록 상세(2026-09-30 신설) */}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`${BASE}/ships/update/history`}>
                    <History className="size-4" /> 히스토리
                  </Link>
                </Button>
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// 버전 칸 — 라벨 좌 · 값 우로 벌린다(2026-09-23). 값이 오른쪽에 모여야 FROM·TO 두 줄이 같은 축에서 끝난다
function FromTo({ from, to }: { from: string; to: string }) {
  return (
    <div className="space-y-0.5">
      {([["FROM", from], ["TO", to]] as [string, string][]).map(([k, v]) => (
        <p key={k} className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-secondary-foreground">{k}</span>
          <span className="font-mono text-sm">{v}</span>
        </p>
      ))}
    </div>
  );
}

// 기간 칸 — 라벨 폭을 고정해 START·END 두 줄의 날짜가 같은 x 에서 시작한다(2026-09-23).
// 날짜 뒤에 (몇 개월 전)이 붙어 길이가 제각각이라 양 끝 정렬은 오히려 어긋난다
function Range({ label, value, ago }: { label: string; value: string | null; ago: string | null }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="w-12 shrink-0 text-xs text-secondary-foreground">{label}</span>
      {value ? (
        <span className="font-mono text-sm">
          {value} <span className="text-xs text-secondary-foreground">({ago})</span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )}
    </p>
  );
}

/* ---------------------------------------------------- 위저드 (좌 레일 + 본문) */

// 하단 고정 바가 「지금 붙어 있는가」 — 붙어 있을 때만 경계선을 켠다(2026-09-23 디자이너 확정).
// 스크롤이 없으면 바 밑으로 지나갈 내용도 없어서 가를 것이 없다.
// 판정은 바의 바닥 위치 하나다: 뷰포트 바닥에 닿아 있으면 붙어 있는 것이고,
// 끝까지 내리면 셸의 p-8 여백만큼 위로 앉아 떨어진다.
// IntersectionObserver 로도 되지만 렌더가 멈춘 창에서는 발화하지 않아 검증이 안 된다 —
// 측정식은 언제든 같은 답을 내므로 이쪽을 쓴다.
function useStuck(reset: unknown) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = React.useState(false);
  React.useEffect(() => {
    const read = () => {
      const el = ref.current;
      if (!el) return;
      setStuck(el.getBoundingClientRect().bottom >= window.innerHeight - 1);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [reset]);
  return [ref, stuck] as const;
}

function Wizard({
  step,
  onStep,
  phase,
  onPhase,
  outcome,
  optionsEmpty,
  onCancel,
}: {
  step: number;
  onStep: (n: number) => void;
  phase: Phase;
  onPhase: (p: Phase) => void;
  outcome: Outcome;
  optionsEmpty: boolean;
  onCancel: () => void;
}) {
  const current = OUTCOMES.find((o) => o.key === outcome)!;
  // STEP 5 도 진행 중일 때는 취소할 수 있다(피그마 3054:28) — 완료·실패는 종료 상태라 없다
  // STEP 1 은 ACTION 바를 두지 않는다 — 하단 스티키 바의 [취소]와 같은 일을 하는 중복이었다(2026-09-29 디자이너 확정)
  const showConsole = (step > 1 && step < 5) || (step === 5 && current.console);
  const [barRef, stuck] = useStuck(step);
  return (
    <div className="flex items-start gap-6">
      <InfoRail onList={() => onStep(0)} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* 한 박스 — 스텝퍼 · ACTION · 에러 콘솔 · 본문이 테두리 하나 안의 행들이다(2026-09-29 디자이너 지정).
            나누는 것은 divide-y 구분선이고, 안쪽 행이 각자 패딩(p-4 바 · p-6 섹션)을 갖는다.
            하단 스티키 바는 이 박스 밖에 남는다 — 박스 안에 넣으면 바닥 고정이 깨진다 */}
        <Card variant="flat" className="divide-y">
          {/* 스텝퍼 — 프로토에서는 눌러서 단계를 오갈 수 있다(제품 동작 아님) */}
          <div className="p-6">
            <Stepper>
              {STEPS.map((label, i) => {
                const n = i + 1;
                return (
                  <StepperItem key={label} step={n} state={n < step ? "completed" : n === step ? "current" : "upcoming"}>
                    <button type="button" className="text-left" onClick={() => onStep(n)}>
                      {label}
                    </button>
                  </StepperItem>
                );
              })}
            </Stepper>
          </div>

          {/* ACTION 행은 없앴다 — 「업데이트 취소」 하나뿐인 행이었고 2~4 단계에서는 하단 바의 같은 버튼과
              겹쳤다. 취소는 하단 스티키 바 한 곳에만 산다(2026-09-29 디자이너 확정) */}
          {/* 에러 콘솔은 STEP 2부터 — STEP 1 캡처에 없어 앞당기지 않았다. STEP 5 는 실패 변형만 */}
          {showConsole && <ErrorConsoleRow />}

          {step === 1 && <Step1 empty={optionsEmpty} />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 phase={phase} onPhase={onPhase} />}
          {step === 5 && <Step5 outcome={outcome} />}
        </Card>

        {/* 하단 스티키 CTA — 본문 컬럼 안에서만, 면은 캔버스와 같은 bg-secondary(2026-09-30 캔버스 회색 확정).
            border-t 는 규칙서 스펙이다 — body-patterns C·E 하단 고정 바(2026-09-22 a7d6b9b).
            면은 캔버스 배경 그대로 두고 경계만 선으로 낸다. 면을 같게 두면 분리도가 0이라서다.
            배치(2026-09-22 디자이너 지정): STEP 1 = 우측 [취소][업데이트 시작] ·
            STEP 2~4 = 좌측 [업데이트 취소] + 우측 [이전][단계 CTA]. 우측 페어 간격은 CTA 문법의 gap-1.
            2026-09-29: 본문 ACTION 행을 없애면서 「업데이트 취소」의 집을 이 바 하나로 모았다.
            STEP 5 는 다음 단계가 없어 원래 바가 없었는데, 진행 중일 때만 좌측 취소 하나로 바를 세운다
            (피그마 3054:28 — 진행 중은 멈출 수 있고 완료·실패는 끝난 상태라 없다). 그때 우측은 비운다 */}
        {(step < 5 || (step === 5 && current.cancellable)) && (
          <div
            ref={barRef}
            className={
              "sticky bottom-0 flex items-center justify-between gap-2 bg-secondary py-3" +
              (stuck ? " border-t" : "")
            }
          >
            {step === 1 ? (
              <span />
            ) : (
              <Button variant="destructive-outline" onClick={onCancel}>
                <CircleAlert className="size-4" /> 업데이트 취소
              </Button>
            )}
            {step < 5 ? (
              <span className="flex items-center gap-1">
                {step === 1 ? (
                  <Button variant="outline" onClick={() => onStep(0)}>
                    취소
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => onStep(step - 1)}>
                    이전
                  </Button>
                )}
                <Button disabled={step === 4 && phase !== "done"} onClick={() => onStep(step + 1)}>
                  {step === 3 && <Download className="size-4" />}
                  {step === 4 && <Upload className="size-4" />}
                  {/* STEP 1 은 「업데이트 시작」 · 3·4 는 캡처 라벨 · 2 는 C 위저드 기본값 */}
                  {step === 1
                    ? "업데이트 시작"
                    : step === 3
                      ? "이미지 다운로드"
                      : step === 4
                        ? "업데이트 적용"
                        : "다음"}
                </Button>
              </span>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRail({ onList }: { onList: () => void }) {
  return (
    <aside className="sticky top-22 w-80 shrink-0 space-y-4 self-start">
      <Card variant="flat" className="space-y-4 p-4">
        {/* 레일 맨 위 — 좌측 뒤로가기(← 업데이트 목록) · 우측 갱신 표기와 아이콘을 한 덩어리로 붙였다.
            (2026-09-29 디자이너 지정) 뒤로가기는 -ml-2 로 글자를 카드 안쪽 선에 맞춘다 */}
        <div className="flex items-center justify-between gap-2">
          {/* 뒤로가기는 보조 동작이라 연하고 작게 — 레일 라벨과 같은 보조 회색, 최소 버튼 크기(2026-09-29 디자이너 지정) */}
          <Button variant="ghost" size="xs" className="-ml-2 text-secondary-foreground" onClick={onList}>
            <ArrowLeft /> 업데이트 목록
          </Button>
          <span className="flex items-center gap-1">
            <p className="text-xs text-secondary-foreground">최근 갱신 4초 전</p>
            <Button variant="ghost" size="icon-xs" aria-label="새로고침">
              <RefreshCw />
            </Button>
          </span>
        </div>

        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase text-secondary-foreground">Version</h3>
          {([["Common", "v1.0.0", "v1.1.0"], ["Product", "v1.0.0", "v1.1.0"]] as [string, string, string][]).map(
            ([k, from, to]) => (
              <div key={k} className="space-y-1">
                <p className="text-xs text-secondary-foreground">{k}</p>
                <p className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono font-normal">
                    {from}
                  </Badge>
                  <span className="text-secondary-foreground">→</span>
                  <Badge variant="secondary" className="font-mono font-normal">
                    {to}
                  </Badge>
                </p>
              </div>
            )
          )}
        </section>

        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase text-secondary-foreground">Update Info</h3>
          <dl className="divide-y">
            {UPDATE_INFO.map(([k, v, tone]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 py-2">
                <dt className="text-xs text-secondary-foreground">{k}</dt>
                <dd className="text-sm font-medium">
                  {tone ? <StatusBadge label={v} tone={tone} bg={false} /> : <span className="font-mono">{v}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* TOOLS & RESOURCES 섹션은 제거했다 — 네 도구가 페이지 우상단으로 옮겨 갔다(2026-09-29 디자이너 지정) */}
        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase text-secondary-foreground">Status History</h3>
          <Timeline>
            {HISTORY.map((h) => (
              <TimelineItem key={h.label} status={h.status}>
                <TimelineTitle>{h.label}</TimelineTitle>
                <TimelineMeta>{h.meta}</TimelineMeta>
              </TimelineItem>
            ))}
          </Timeline>
          <Button variant="ghost" size="sm" className="w-full">
            더보기 (9)
          </Button>
        </section>
      </Card>
    </aside>
  );
}

/* ---------------------------------------------------- STEP 1 — 업데이트 옵션 설정 */

// 「항목 없음」은 국면이 아니라 데이터 조건이라 전환기를 두지 않는다 —
// 상단 상태 미리보기의 여섯째 칸으로 뺐다(2026-09-29 디자이너 확정).
// 그 칸은 이 페이지 로컬 배열에만 있고 DS 의 PROGRESS_STATES 는 건드리지 않는다
function Step1({ empty }: { empty: boolean }) {
  return (
    <>
      <section className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-medium text-secondary-foreground">제품 옵션</h2>
          {/* 캡처 주석 원문: 입력 항목은 서버에서 동적으로 받아옴 → 매번 달라질 수 있음 / 입력할 항목이 없는 경우도 존재 */}
          <p className="text-xs text-secondary-foreground">항목은 서버에서 받아오며 업데이트마다 달라질 수 있습니다.</p>
        </div>

        {empty ? (
          // 빈 상태는 DS Empty 표준(스토리 WithAction·NoResult 골격) — 버튼은 두지 않는다.
          // 실물의 가운데 [확인]은 단계를 넘기는 액션이라 하단 스티키 바의 「업데이트 시작」과 같은 일을 한다(2026-09-23 확정)
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Info />
              </EmptyMedia>
              <EmptyTitle>입력할 항목이 없습니다</EmptyTitle>
              <EmptyDescription>현재 설정에서는 추가 입력이 필요하지 않습니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {OPTION_GROUPS.map((g) => (
              <Card key={g.title} variant="flat" className="space-y-4 p-4">
                <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{g.title}</h3>
                <div className="space-y-4">
                  {g.rows.map((r) => (
                    <OptionField key={r.label} row={r} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function OptionField({ row }: { row: OptionRow }) {
  const id = `opt-${row.label.replace(/\s+/g, "-").toLowerCase()}`;
  if (row.kind === "check") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox id={id} defaultChecked={row.on} />
        <Label htmlFor={id} className="font-normal">
          {row.label}
        </Label>
        <InfoHint text={`${row.label} 옵션입니다.`} />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <span className="flex items-center gap-2">
        <Label htmlFor={id}>
          {row.label}
          {row.required && <span className="text-destructive"> *</span>}
        </Label>
        <InfoHint text={`${row.label} 값입니다.`} />
      </span>
      {row.kind === "select" ? (
        <Select defaultValue={row.value}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={row.value}>{row.value}</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input id={id} defaultValue={row.value} />
      )}
    </div>
  );
}

/* ---------------------------------------------------- STEP 2 — 업데이트 내용 */

function Step2() {
  return (
    <>
      <ReleaseNotes />
      <ChangeTables />
    </>
  );
}

// 릴리즈 노트 · 변경 표는 STEP 2·3 과 「변경목록」 모달이 같은 것을 쓴다 —
// className 으로 패딩만 바꿔 끼운다(모달은 DialogContent 가 이미 p-6 이라 패딩을 뺀다)
function ReleaseNotes({ className = "space-y-4 p-6" }: { className?: string }) {
  return (
    <section className={className}>
      <h2 className="text-sm font-medium text-secondary-foreground">릴리즈 노트</h2>
      {RELEASE_NOTES.map((n) => (
        <section key={n.kind} className="space-y-2">
          <p className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {n.kind}
            </Badge>
            <span className="text-sm font-medium">{n.title}</span>
            <span className="text-xs text-secondary-foreground">{n.rows.length}</span>
          </p>
          <Accordion type="multiple">
            {n.rows.map(([v, d], i) => (
              <AccordionItem key={`${n.kind}-${i}`} value={`${n.kind}-${i}`}>
                <AccordionTrigger>
                  <span className="flex w-full items-center justify-between gap-4 pr-2">
                    <span className="font-mono text-sm">{v}</span>
                    <span className="text-xs text-secondary-foreground">{d}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-secondary-foreground">릴리즈 노트 본문이 여기 들어갑니다.</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </section>
  );
}

function ChangeTables({ title, className = "space-y-6 p-6" }: { title?: string; className?: string }) {
  return (
    <section className={className}>
      {title && <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-secondary-foreground">Image Changes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>크기</TableHead>
              <TableHead>현재 버전</TableHead>
              <TableHead>업데이트 버전</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IMAGE_CHANGES.map(([name, size, cur, next]) => (
              <TableRow key={name}>
                <TableCell className="font-mono text-sm">{name}</TableCell>
                <TableCell className="text-sm">{size}</TableCell>
                <TableCell className="font-mono text-sm">{cur}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono font-normal">
                    {next}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-secondary-foreground">Binary Changes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>크기</TableHead>
              <TableHead>현재 버전</TableHead>
              <TableHead>업데이트 버전</TableHead>
              <TableHead className="text-right">비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BINARY_CHANGES.map(([name, size, cur, next, rollback]) => (
              <TableRow key={name}>
                <TableCell className="font-mono text-sm">{name}</TableCell>
                <TableCell className="text-sm">{size}</TableCell>
                <TableCell className="font-mono text-sm">{cur}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono font-normal">
                    {next}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {rollback ? <StatusBadge label="Rollback Image" tone="neutral" bg={false} /> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </section>
  );
}

/* ---------------------------------------------------- STEP 3 — 업데이트 항목 조회 */

function Step3() {
  return (
    <>
      <section className="grid gap-4 p-6 sm:grid-cols-2">
        {([["Common Module", "v1.0.0", "v1.1.0"], ["SVM Module", "v1.0.0", "v1.1.0"]] as [string, string, string][]).map(
          ([title, from, to]) => (
            <Card key={title} variant="flat" className="space-y-2 p-6 text-center">
              <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{title}</h3>
              <p className="flex items-center justify-center gap-2 font-mono text-sm">
                <span className="text-secondary-foreground">{from}</span>
                <span className="text-secondary-foreground">→</span>
                <span className="font-medium text-primary">{to}</span>
              </p>
            </Card>
          )
        )}
      </section>

      <ChangeTables title="svm 상세 업데이트 내역" />
    </>
  );
}

/* ---------------------------------------------------- STEP 4 — 이미지 다운로드 */

function Step4({ phase, onPhase }: { phase: Phase; onPhase: (p: Phase) => void }) {
  return (
    <>
      {/* 국면 전환 행은 없앴다 — 다섯 국면이 상단 상태 미리보기의 칸으로 올라갔다(2026-09-29 디자이너 지정) */}
      {phase === "requested" && (
        <div className="p-6">
          <Alert>
            <MessageSquare className="size-4" />
            <AlertTitle>다운로드 요청됨</AlertTitle>
            <AlertDescription>다운로드 요청이 생성되었으며 사용자 승인 대기 상태입니다.</AlertDescription>
          </Alert>
        </div>
      )}

      {phase === "progress" && (
        <section className="space-y-3 p-6">
          <DownloadProgress value={40} />
        </section>
      )}

      {/* 실패 — 운영의 주황은 DS 토큰이 없다. 실패라서 destructive 이고, DS ErrorState 가 제목·설명·재시도를 다 갖고 있다 */}
      {phase === "failed" && (
        <div className="p-6">
          <ErrorState
            title="DOWNLOAD_FAILED"
            description="업데이트 중 오류가 발생했습니다."
            onRetry={() => onPhase("progress")}
          />
        </div>
      )}

      {phase === "done" && (
        <div className="p-6">
          <Alert>
            <CircleCheck className="size-4 text-success" />
            <AlertTitle>모든 이미지 다운로드 완료</AlertTitle>
            <AlertDescription>모든 모듈이 준비되었습니다. 지금 즉시 업데이트를 적용할 수 있습니다.</AlertDescription>
          </Alert>
        </div>
      )}

      <section className="space-y-6 p-6">
        <h2 className="text-sm font-medium text-secondary-foreground">이미지 다운로드 상태</h2>
        <DownloadTable title="Image Status" rows={phase === "empty" ? [] : DL_IMAGE} />
        <DownloadTable title="Binary Status" rows={phase === "empty" ? [] : DL_BINARY} />
      </section>
    </>
  );
}

function DownloadProgress({ value }: { value: number }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Download className="size-4" /> 다운로드 진행률
          <span className="flex items-center gap-1 text-xs font-normal text-secondary-foreground">
            <Spinner className="size-3" /> 진행 중
          </span>
        </p>
        <p className="font-mono text-sm font-medium">{value}%</p>
      </div>
      <Progress value={value} />
    </>
  );
}

function DownloadTable({ title, rows }: { title: string; rows: DlRow[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{title}</h3>
      {/* 빈 결과도 표 헤더를 남긴다 — 저장소 선례(updates/page.tsx · release-notes/page.tsx):
          전 열을 잇는 한 행에 py-8 가운데 정렬. 아이콘은 두지 않는다(갤러리 어느 표에도 없다, 2026-09-23 확정) */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>모듈 이름</TableHead>
            <TableHead>버전</TableHead>
            <TableHead>크기</TableHead>
            <TableHead>시작 시간</TableHead>
            <TableHead>완료 시간</TableHead>
            <TableHead>실패 시간</TableHead>
            <TableHead className="text-right">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-secondary-foreground">
                등록된 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-mono text-sm">{r.name}</TableCell>
                <TableCell className="font-mono text-sm">{r.version}</TableCell>
                <TableCell className="text-sm">{r.size}</TableCell>
                <TableCell className="font-mono text-sm">{r.start}</TableCell>
                <TableCell className="font-mono text-sm">{r.done}</TableCell>
                <TableCell className="font-mono text-sm">{r.fail}</TableCell>
                <TableCell className="text-right">
                  <span className="flex justify-end">
                    <StatusBadge label={r.status} tone={r.tone} bg={false} mono />
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

/* ---------------------------------------------------- STEP 5 — 업데이트 적용 */

// 종료 단계다 — 하단 CTA 도 이전 버튼도 없다. 「현재 상태」 블록 하나가 전부이고,
// 진행 중(HELM UPDATING) · 완료(COMPLETED) · 실패(HELM ROLLBACK FAILED) 세 변형이 같은 골격을 쓴다.
// 원천: 피그마 프레임 3052:2 의 3054:28 · 3052:22 · 3052:23
function Step5({ outcome }: { outcome: Outcome }) {
  const o = OUTCOMES.find((x) => x.key === outcome)!;
  const Icon = o.tone === "success" ? CircleCheck : o.tone === "error" ? RotateCcw : Spinner;
  return (
    <>
      {/* 결과 전환 행은 없앴다 — 세 결과가 상단 상태 미리보기의 칸으로 올라갔다(2026-09-29 디자이너 지정) */}
      <section className="space-y-4 p-6">
        <h2 className="text-sm font-medium text-secondary-foreground">현재 상태</h2>
        <div className="flex items-start gap-3">
          <span
            className={
              "flex size-10 shrink-0 items-center justify-center rounded-full " +
              (o.tone === "success" ? "bg-success/10 text-success" : o.tone === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")
            }
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-2 text-base font-semibold">
              {o.status}
              {o.tone === "progress" && <Spinner className="size-4 text-secondary-foreground" />}
            </p>
            <p className="text-sm text-secondary-foreground">{o.desc}</p>
          </div>
        </div>
        <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t pt-4">
          {([["Client 업데이트", o.client], ["Agent 업데이트", o.agent]] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2">
              <dt className="text-xs text-secondary-foreground">{k}</dt>
              <dd className="text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

/* ---------------------------------------------------- STEP -. CANCEL (취소 종료) */

// 단계가 아니라 별도 종료 화면이다 — 스텝퍼는 다섯 칸이 전부 미도달, 하단 CTA 없음.
// 원천: 피그마 3052:25. 운영의 붉은 톤 패널은 destructive 틴트 규칙(/5 배너 표면)으로 옮겼다
function Canceled({ onList }: { onList: () => void }) {
  return (
    <div className="flex items-start gap-6">
      <InfoRail onList={onList} />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* 여기도 한 박스다 — 스텝퍼와 결과 패널이 같은 테두리를 쓴다(단계 화면과 같은 문법) */}
        <Card variant="flat" className="divide-y overflow-hidden">
          <div className="p-6">
            <Stepper>
              {STEPS.map((label, i) => (
                <StepperItem key={label} step={i + 1} state="upcoming">
                  {label}
                </StepperItem>
              ))}
            </Stepper>
          </div>

          <div className="flex flex-col items-center gap-3 bg-destructive/5 px-6 py-12">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <X className="size-6" />
            </span>
            <p className="text-base font-semibold">업데이트가 취소되었습니다</p>
            <StatusBadge label="CANCELED" tone="error" />
          </div>
          <div className="flex justify-center p-6">
            <Button variant="outline" onClick={onList}>
              <ListChecks className="size-4" /> 업데이트 목록가기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- 조각 */

// 변형 전환 행(VariantSwitch)은 2026-09-29 에 없앴다 — STEP 1 옵션 유무 · STEP 4 다섯 국면 ·
// STEP 5 세 결과가 전부 상단 상태 미리보기의 칸으로 올라갔다. 본문에는 프로토 전용 행을 두지 않는다.

// 에러 콘솔 — 전용 컴포넌트 파일이 없는 스토리 전용 패턴(DS/ErrorConsole)의 조립을 복사했다.
// 한 박스로 합치면서 카드 껍데기를 벗고 행이 되었다(2026-09-29)
function ErrorConsoleRow() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="space-y-3 p-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase text-secondary-foreground"
          >
            <span className="flex items-center gap-2">
              <Terminal className="size-4" /> Error Console
            </span>
            <ChevronDown className={open ? "size-4 rotate-180" : "size-4"} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="relative mt-3 rounded-lg bg-foreground p-4 font-mono text-xs text-background">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 size-6 text-background hover:bg-background/20"
              aria-label="복사"
            >
              <Copy />
            </Button>
            {ERROR_LINES.map((l) => (
              <div key={l.text} className={l.error ? "text-destructive" : undefined}>
                {l.text}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="설명" className="text-secondary-foreground">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

/* ---------------------------------------------------- 업데이트 버전 선택 모달 */

function VersionDialog({
  open,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: () => void;
}) {
  const [common, setCommon] = React.useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          {/* 설명 줄 제거(2026-09-22) — 제품 모듈 셀렉트의 placeholder 가 이미 같은 말을 한다 */}
          <DialogTitle>업데이트 버전 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-secondary-foreground">Common Module</h3>
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>현재 버전</Label>
                <p>
                  <Badge variant="secondary" className="font-mono font-normal">
                    v3.5.0-test.15
                  </Badge>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="common-target">타깃 버전</Label>
                <Select value={common} onValueChange={setCommon}>
                  <SelectTrigger id="common-target" className="w-full">
                    <SelectValue placeholder="버전을 선택해주세요." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v3.5.0-test.16">v3.5.0-test.16</SelectItem>
                    <SelectItem value="v3.6.0">v3.6.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t pt-6">
            <h3 className="text-xs font-semibold uppercase text-secondary-foreground">SVM Module</h3>
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>현재 버전</Label>
                <p>
                  <Badge variant="secondary" className="font-mono font-normal">
                    v3.5.0-rc.1
                  </Badge>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-target">타깃 버전</Label>
                <Select disabled={!common}>
                  <SelectTrigger id="product-target" className="w-full">
                    <SelectValue placeholder="Common 버전을 먼저 선택하세요." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v3.5.0-rc.2">v3.5.0-rc.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button disabled={!common} onClick={onStart}>
            업데이트 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------- 업데이트 취소 확인 */

function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>업데이트를 취소할까요?</DialogTitle>
          <DialogDescription>
            진행 중인 단계가 중단되고 호선은 직전 버전으로 남습니다. 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            계속 진행
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            업데이트 취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------- 도구 모달 4종 */

// 원천: 피그마 3100:145(캡처 5장). 피그마는 변경목록·Automation 을 우측 시트로 그렸지만
// 네 개 전부 센터 모달로 통일했다(2026-09-29 디자이너 확정) — 버튼 넷의 결과가 갈리지 않게.
// 폭: 표가 넓은 둘은 5xl(1024px) · 로그 2xl(672px) · 네트워크는 DS 기본 lg(512px, 캡처와 동일).
// 긴 본문 스크롤은 갤러리 선례 그대로 `max-h-dvh overflow-y-auto` 다

// ① 변경목록 — STEP 2 와 같은 릴리즈 노트·변경 표를 쓰고, 파일 diff 행을 더한다
function DiffDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>변경 사항 목록</DialogTitle>
          <DialogDescription>업데이트 전후 변경 파일과 내용을 확인할 수 있습니다.</DialogDescription>
        </DialogHeader>

        {/* min-w-0 — DialogContent 는 grid 이고 grid 항목은 기본이 min-width:auto 라
            표의 자연 폭이 트랙을 모달 최대폭보다 넓게 벌린다. 그러면 안쪽 전부가 패딩을 넘어 잘린다.
            여기서 줄여 줘야 DS 표가 가진 가로 스크롤이 제 역할을 한다(2026-09-29 실측) */}
        <div className="min-w-0 space-y-6">
          <ReleaseNotes className="space-y-4" />
          <ChangeTables className="space-y-6" />
          <Accordion type="multiple">
            {FILE_DIFFS.map((f) => (
              <AccordionItem key={f} value={f}>
                <AccordionTrigger>
                  <span className="font-mono text-sm">{f}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-secondary-foreground">파일 diff 본문이 여기 들어갑니다.</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ② Automation 이력 — 6열 표. 시각은 절대값 아래 상대값 한 줄(캡처 그대로).
// 상태는 이 페이지 규칙대로 도트+텍스트 한 벌이다 — 캡처의 맨 텍스트를 따르지 않았다(표 안 상태 문법 통일)
function AutomationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [page, setPage] = React.useState(1);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>SSM Automation 실행 이력</DialogTitle>
          <DialogDescription>이 호선에서 실행된 Automation 문서의 실행 기록입니다.</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>상태</TableHead>
                <TableHead>문서</TableHead>
                <TableHead>시작 시각</TableHead>
                <TableHead>완료 시각</TableHead>
                <TableHead>소요</TableHead>
                {/* 「열기」 열은 없앴다 — 바로가기 아이콘 하나뿐인 열이라 실행 ID 칸으로 합쳤다.
                    일곱 열이 모달 폭을 21px 넘겼던 것이 근거다(2026-09-29 실측) */}
                <TableHead>실행 ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUTOMATION.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <StatusBadge label={r.status} tone={r.tone} bg={false} />
                  </TableCell>
                  {/* 문서 이름이 링크다 — 행 끝 바로가기 아이콘을 없애고 이 자리가 대신한다(2026-09-29 디자이너 지정).
                      색은 빼고 호버 밑줄만 — 저장소 다른 표는 파란색을 같이 쓰지만 여기는 빼기로 했다 */}
                  <TableCell>
                    <button type="button" className="font-mono text-sm underline-offset-4 hover:underline">
                      {r.doc}
                    </button>
                  </TableCell>
                  <TableCell>
                    <TimeCell at={r.start} />
                  </TableCell>
                  <TableCell>
                    <TimeCell at={r.end} />
                  </TableCell>
                  <TableCell className="text-sm">{r.dur || "–"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <span className="font-mono text-sm">{r.id}</span>
                      <Button variant="ghost" size="icon-xs" aria-label="실행 ID 복사">
                        <Copy />
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 모달 표라 목록 페이지 푸터(ListFooter)가 아니라 페이지네이션만 둔다 — 캡처와 같다 */}
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page === 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                />
              </PaginationItem>
              {[1, 2, 3].map((n) => (
                <PaginationItem key={n}>
                  <PaginationLink href="#" isActive={page === n} onClick={() => setPage(n)}>
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" aria-disabled={page === 3} onClick={() => setPage(Math.min(3, page + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 시각 칸 — 절대값 위, 상대값 아래. 빈 값은 대시 하나
function TimeCell({ at }: { at: string }) {
  if (!at) return <span className="text-sm">–</span>;
  return (
    <span className="block">
      <span className="block font-mono text-sm">{at}</span>
      <span className="block text-xs text-secondary-foreground">2개월 전</span>
    </span>
  );
}

// ③ Agent 로그 — 한 모달 안에서 목록 → 상세를 오간다(피그마 3035:34 → 3035:30).
// 상세의 검은 뷰어는 DS/ErrorConsole 스토리가 원문인 패턴을 그대로 쓴다
function LogDialog({ open, onClose, product }: { open: boolean; onClose: () => void; product: string }) {
  const [picked, setPicked] = React.useState<string | null>(null);
  const file = LOG_FILES.find((f) => f.name === picked);
  // 모달을 닫으면 다음에 열 때 목록부터 — 상세에 머물러 있지 않게
  React.useEffect(() => {
    if (!open) setPicked(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* 폭 896px — 「최신」을 첫 칸으로 뺀 뒤 파일 이름이 한 줄(342px)이 되면서 표가 778px 필요하다.
          768px 은 718px 만 줘서 60px 모자랐다(2026-09-29 실측) */}
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-4xl">
        {/* 헤더 아이콘 타일은 뺐다 — DS 아이콘 타일은 빈 상태·Item 용이고 모달 헤더 패턴이 아니다.
            저장소의 모달 전부가 제목+설명만 쓴다(2026-09-29 디자이너 확정) */}
        <DialogHeader className="min-w-0">
          <DialogTitle>Agent 로그 · {product}</DialogTitle>
          <DialogDescription>
            호선 Agent 가 S3 에 업로드한 로그 파일 목록입니다. 다운로드 링크는 짧은 TTL 의 presigned URL 입니다.
          </DialogDescription>
        </DialogHeader>

        {file ? (
          <div className="min-w-0 space-y-4">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setPicked(null)}>
              <ArrowLeft className="size-4" /> 목록으로
            </Button>
            <Card variant="flat" className="flex flex-row items-center justify-between gap-3 p-4">
              <span className="min-w-0">
                <span className="block truncate font-mono text-sm">{file.name}</span>
                <span className="block text-xs text-secondary-foreground">
                  {file.size} · {file.at}
                </span>
              </span>
              <Button variant="outline" size="sm">
                <Download className="size-4" /> 다운로드
              </Button>
            </Card>
            <div className="relative rounded-lg bg-foreground p-4 font-mono text-xs text-background">
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute right-2 top-2 text-background hover:bg-background/20"
                aria-label="복사"
              >
                <Copy />
              </Button>
              {LOG_LINES.map((l, i) => (
                <div key={i} className={l.error ? "text-destructive" : undefined}>
                  {l.text || " "}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm">
                <RefreshCw className="size-4" /> 새로고침
              </Button>
              <Button size="sm">수집하기</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* 첫 칸은 배지 자리다 — 제목은 비워 둔다(2026-09-29 디자이너 확정) */}
                  <TableHead />
                  <TableHead>파일명</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>업로드 시각</TableHead>
                  <TableHead className="text-right">다운로드</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LOG_FILES.map((f) => (
                  <TableRow key={f.name}>
                    {/* 「최신」은 자기 칸을 가진다 — 이름 옆에 붙여 두면 이름 칸의 최소 폭이 커졌다 */}
                    <TableCell>{f.latest && <StatusBadge label="최신" tone="success" bg={false} />}</TableCell>
                    <TableCell className="font-mono text-sm">{f.name}</TableCell>
                    <TableCell className="text-sm">{f.size}</TableCell>
                    <TableCell className="font-mono text-sm">{f.at}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" aria-label="다운로드">
                          <Download />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="로그 열기"
                          onClick={() => setPicked(f.name)}
                        >
                          <ChevronRight />
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ④ 네트워크 상태 — 기간 전환 + 두 줄 선 그래프. 폭은 DS 기본이고 캡처와 같다.
// 기간 전환은 Tabs 기본형(bg-muted 컨테이너 + 눌린 칸) — 캡처의 분절 컨트롤과 같은 모양이다.
// ToggleGroup 은 2026-09-15 은퇴해서 쓰지 않는다
function NetworkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="min-w-0">
          <DialogTitle>네트워크 상태</DialogTitle>
          <DialogDescription>선택한 기간의 네트워크 대역폭 추이를 확인합니다.</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          {/* 기간 토글과 PNG 를 한 줄에 — 좌 토글, 우 내보내기(2026-09-29 디자이너 지정).
              TabsList 에 폭을 주면 트리거가 이미 가진 flex-1 이 3H·24H 를 똑같이 나눈다 */}
          <div className="flex items-center justify-between gap-3">
            <Tabs defaultValue="3H">
              <TabsList className="w-32">
                <TabsTrigger value="3H">3H</TabsTrigger>
                <TabsTrigger value="24H">24H</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="sm">
              <Download className="size-4" /> PNG
            </Button>
          </div>

          <Card variant="flat" className="p-4">
            <ChartContainer config={NET_CONFIG} className="aspect-video w-full">
              <LineChart data={NET_SERIES} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} interval={1} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {/* 선 그리기 애니메이션은 끈다 — 산출물은 시각 스펙이고, 애니메이션이 멈춘 탭에서
                    켜 두면 stroke-dasharray 가 전체 길이에 멈춰 선이 아예 안 보인다(2026-09-29 실측) */}
                <Line dataKey="download" type="monotone" stroke="var(--color-download)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="upload" type="monotone" stroke="var(--color-upload)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          </Card>

          {/* 범례는 그래프 아래 가운데 — 수치까지 남긴다(2026-09-29 디자이너 확정) */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {(["download", "upload"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-xs">
                {/* 범례 점 색은 저장소 선례 그대로 인라인 var — 대시보드 도넛 범례와 같은 문법 */}
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: NET_CONFIG[k].color }} />
                <span className="text-secondary-foreground">{NET_CONFIG[k].label}</span>
                <span className="font-mono font-medium">{k === "download" ? "41.60" : "17.60"} Mbps</span>
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
