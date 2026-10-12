"use client";

// 호선 상세 — ① HiNAS 365 프레임 셸 + B 상세 본문(2컬럼)
// 원천: 운영 화면 캡처 8장(2026-09-21) — /ship/production/<호선>. 납품 호선·테스트 호선 목록의 행에서 들어온다(?kind=delivery|test).
//
// 2026-09-21 디자이너 확정(운영과 다른 점)
// - 호선 제원 · 호선 메모 = 우측 패널 탭 2개(제원이 첫 탭). 운영의 본문 접이식 「호선 제원」·우측 메모 패널을 합쳤다
// - 호선 태그 = 제목 옆 칩(x 포함) + [태그 추가]. 운영의 호선 태그 박스는 제거
// - 기본 정보·시스템 옵션·상태 정보를 감싸던 컨테이너 카드 제거 — 카드 안 카드가 중복이라 평면 패널.
//   배치는 1행 기본 정보 전폭(5열 격자) · 2행 시스템 옵션 | 상태 정보 반반(2026-10-07 개정, 종전 3열은 값이 줄바꿈으로 깨졌다)
// - 제품 탭은 최대 4개(Control · SVM · Navigation · Shield). 하위 탭 중 커미셔닝 레포트와 CA 웹뷰어는 Control 전용
// - CA 웹뷰어는 탭이 아니라 링크 버튼 — 하위 탭 행 오른쪽 끝(외부 링크 아이콘)
// - 비밀번호 조회 모달의 값은 가림 표기(••••) — 실물처럼 보이는 문자열을 저장소에 넣지 않는다(세션 판단)
// - 새 메모 모달 제목은 아이콘 없이(저장소 다이얼로그 통일, 2026-09-14) · 내용은 평문 Textarea + 「Markdown 지원」 배지(운영과 동일)
//
// 상태(2026-09-18 규칙): 진행률이 실재하지 않는 조회 화면이라 DEFAULT_STATES 4종(기본·빈·로딩·에러) — 프로그레스 없음
// 규정: regulations/control.md는 HiNAS Control 선내 화면(ISO 8468 시거리)용이라 이 관리 콘솔 화면에는 적용 대상 아님

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DEFAULT_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { PageHeader } from "@ds/ui/ui/page-header";
// 패널 제목 = 갤러리 공통 문법 h2 text-sm font-medium text-secondary-foreground(저장소 50곳, 스토리북 FlatPanel 과 동형).
// CardHeader/CardTitle 조합은 2026-09-21 되돌렸다 — flat 카드에 그 슬롯을 쓰는 선례가 스토리북에도 갤러리에도 없었다(이 파일 3곳뿐이었다).
import { Card } from "@ds/ui/ui/card";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  KeyRound,
  Link2,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Stethoscope,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ds/ui/ui/collapsible";
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
import { ErrorState } from "@ds/ui/ui/error-state";
import { Input } from "@ds/ui/ui/input";
import { Label } from "@ds/ui/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@ds/ui/ui/popover";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Textarea } from "@ds/ui/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";
import { BodyPager } from "../../../_detail/body-pager";
// 사람 요소 잠금(2026-09-04): 프로필(이니셜) + 이름 — _detail/person 공유. HiNAS 쪽 첫 사용(2026-10-07)
import { Person } from "../../../_detail/person";

/* ---------------------------------------------------- 목업 데이터 */

const BASE = "/gallery/hinas365";

const KINDS = { delivery: "납품 호선", test: "테스트 호선" } as const;
type Kind = keyof typeof KINDS;
const isKind = (v: string | null): v is Kind => v !== null && v in KINDS;

const VESSEL = {
  // 호선 식별자는 업데이트 플로우(ships/update)와 같은 배를 가리킨다 — 두 화면이 링크로 이어져 있다(2026-09-22).
  // 9811000 = 호선명 겸 IMO(7자리) · HULL1234 = Hull Number. 선주는 실물 값이 없어 그대로 뒀다.
  name: "9811000",
  imo: "9811000",
  hullNumber: "HULL1234",
  shipName: "9811000",
  callSign: "asdfasdf",
  owner: "gpu_update_test_1",
  build: "신조",
  klass: null as string | null,
  yard: "HMD",
  creator: "Hyunsoo Yoo(유현수)",
  createdAt: "2026-07-01 06:39",
  createdAgo: "2개월 전",
};

const SYSTEM_OPTIONS: [string, boolean][] = [
  ["사이버 보안", false],
  ["클라우드", false],
  ["데이터 수집 모듈", false],
];

const STATUS_INFO = {
  updatedAt: "2026-07-02 08:40",
  updatedAgo: "2개월 전",
  cloud: false,
  subscription: "NONE",
};

// 호선 제원(디자이너 제공, 2026-09-21) — 우측 패널 첫 탭. 값 뒤 단위는 보조색
const SPEC_GROUPS: { title: string; rows: [string, string, string?][] }[] = [
  {
    title: "Ship Specifications",
    rows: [
      ["Type", "PCTC"],
      ["LOA", "200", "m"],
      ["LBP", "180", "m"],
      ["Beam", "35", "m"],
      ["Depth", "10", "m"],
      ["Scantling Draught", "6", "m"],
    ],
  },
  {
    title: "Engine & ECDIS & Autopilot",
    rows: [
      ["Engine Quantity", "single"],
      ["Engine Type", "diesel"],
      ["ECDIS Maker", "JRC"],
      ["Auto Pilot Maker", "Tokyokeiki"],
    ],
  },
  {
    title: "AMS & BMS",
    rows: [
      ["AMS Maker", "not_installed"],
      ["BMS Maker", "Nabtesco"],
    ],
  },
];

const PRODUCTS = ["CONTROL", "SVM", "NAVIGATION", "SHIELD"] as const;
type Product = (typeof PRODUCTS)[number];

const PRODUCT_INFO: Record<Product, { common: string; product: string; server: string; clients: number; agent: string }> = {
  CONTROL: { common: "v4.0.0-gpu.4", product: "v3.0.0-rc.5", server: "NUVO-10108GC-NX", clients: 0, agent: "READY" },
  SVM: { common: "v4.0.0-gpu.4", product: "v1.0.0-rc.3", server: "NUVO-8240GC", clients: 2, agent: "READY" },
  NAVIGATION: { common: "v4.0.0-gpu.4", product: "v3.7.0-rc.7", server: "NUVO-10108GC-NX", clients: 1, agent: "NOT_INSTALLED" },
  SHIELD: { common: "v4.0.0-shield.27", product: "v0.0.73", server: "NUVO-8240GC", clients: 0, agent: "READY" },
};

// 옵션 정보 — 그룹별 (라벨, 값). boolean 은 도트 + True/False, 그 외는 값 그대로
const OPTION_GROUPS: { title: string; rows: [string, boolean | string][] }[] = [
  {
    title: "Basic Configuration",
    rows: [
      ["DNV Cert", false],
      ["Enable CA", true],
      ["Enable S Mode", true],
      ["Enable UPS", true],
      ["Enable Route Optimization", false],
    ],
  },
  {
    title: "Navigation Configuration",
    rows: [
      ["Enable Navigation(MIP)", true],
      ["IP Camera", false],
      ["Display Count", "1"],
      ["Camera FOV", "180"],
      ["Enable Inclinometer Widget", false],
      ["Enable Position Widget", false],
      ["Enable Azimuth Thruster", false],
    ],
  },
  {
    title: "ECDIS Configuration",
    rows: [
      ["Ecdis Communication Type", "450"],
      ["Ecdis HiNAS SFI", "II0001"],
      ["Ecdis SFI", "EI0001"],
    ],
  },
  {
    title: "Sensor Configuration",
    rows: [
      ["Sensor Network IP", "192.168.32.16"],
      ["CAMS/BAMS IP", "10.0.100.20"],
      ["Enable AMS", false],
      ["BMS Port", "504"],
      ["DTA Expire Time", "10"],
      ["Control Camera IP (Internal)", "10.0.100.20"],
    ],
  },
];

const DETAILED_CONFIG: [string, string][] = [
  ["Config Revision", "r42"],
  ["Deploy Channel", "stable"],
  ["Telemetry Interval", "60"],
  ["Log Retention", "30"],
];

// 이미지 버전 정보 — Module 카드 그리드(운영 캡처의 모듈 목록)
const MODULES: [string, string][] = [
  ["hinas-fluentbit", "v4.2.2"],
  ["hinas-fluentd", "v1.19.2-2.4-with-plugins"],
  ["hinas-minio", "v2021-04-22"],
  ["hinas-minio-mc", "v2024-08-17"],
  ["hinas-redis", "v7.2.11"],
  ["hidom-2.0-storage", "v1.2.0-rc.2"],
  ["hinas-busybox", "v1.36.0"],
  ["hinas-cloud-module-collector", "v1.2.0-rc.4"],
  ["hinas-cloud-module-evaluator", "v1.2.0-rc.4"],
  ["hinas-cloud-module-hinas-control", "v1.2.0-rc.4"],
  ["hinas-cloud-module-ingestor", "v1.2.0-rc.4"],
  ["hinas-cloud-module-mosquitto", "v2.0.0"],
  ["hinas-cloud-module-ping", "v1.2.0-rc.4"],
  ["hinas-cloud-module-publisher", "v1.2.0-rc.4"],
  ["hinas-ingress-nginx", "v1.11.2"],
  ["hinas-nginx-error", "v2023-05-05"],
  ["hinas-argocd", "v2.12.3-cred-helper"],
  ["hidom-2.0-frontend", "v3.3.0-rc.4"],
  ["hidom-2.0-backend", "v4.0.0-rc.7"],
  ["hinas-dropship", "v0.0.15"],
  ["hinas-registry", "v2.8.3"],
  ["hinas-htpasswd", "v1.0.0"],
  ["auth-front", "v3.1.0-rc.5"],
  ["avikus-auth", "v1.7.0-rc.3"],
  ["nas2-backend", "v3.0.0-rc.4"],
  ["nas2-frontend", "v1.5.0-rc.21"],
  ["nas2-bms", "v1.1.0-rc.1"],
  ["nas2-autopilot", "v0.3.0-rc.2"],
  ["nas2-ecdis", "v2.1.1-rc.2"],
  ["nas2-cardia", "v1.1.1"],
  ["nas2-control-tower", "v2.7.0-rc.6"],
  ["navigation-tcs", "v1.6.3-rc.0"],
  ["navigation-ca", "v1.1.0-rc.20"],
  ["nas2-ups", "v1.1.1-rc.1"],
  ["nas2-vdr-logger", "v1.1.1-rc.1"],
  ["detector-app", "v1.2.0-rc.3"],
  ["hinas-mediamtx", "v1.16.1"],
  ["avikus-sensor-fusion", "v1.0.18-rc.2"],
  ["hidom-2.0-rtsp", "v3.5.0-rc.5-5080"],
  ["standard-nmea-filter", "v2.0.0"],
];

// 비밀번호 조회 — 라벨만 실물, 값은 가림 표기(세션 판단: 실물처럼 보이는 문자열을 넣지 않는다)
const CREDENTIAL_LABELS = [
  "Argocd Crew Password",
  "Argocd Password",
  "Argocd Secret Key",
  "Argocd Syncer Password",
  "Auth Module Password",
  "Auth Redis Password",
  "Camera Mediamtx Password",
  "Camera Redis Password",
  "Control Postgres Password",
  "Control Redis Password",
  "Core Redis Password",
  "Docker Registry Password",
  "Firewall Password",
  "Optimization Secret Key",
  "Optimization Token Id",
  "Storage Minio Password",
  "Storage Module Password",
  "Storage Redis Password",
  "Svm Redis Password",
  "Ubuntu Admin Password",
  "Ubuntu User Password",
];

type ViewState = "default" | "loading" | "error" | "empty";
const SUB_TABS = { product: "제품 정보", image: "이미지 버전 정보", remote: "원격접속", commissioning: "커미셔닝 레포트" } as const;
type SubTab = keyof typeof SUB_TABS;

/* ---------------------------------------------------- 페이지 */

// useSearchParams는 Suspense 경계 필수(정적 export)
export default function ShipDetailPage() {
  return (
    <React.Suspense fallback={null}>
      <ShipDetailBody />
    </React.Suspense>
  );
}

function ShipDetailBody() {
  const [view, setView] = React.useState<ViewState>("default");
  const raw = useSearchParams().get("kind");
  const kind: Kind = isKind(raw) ? raw : "delivery";

  const [starred, setStarred] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>(["test"]);
  const [tagOpen, setTagOpen] = React.useState(false);
  const [tagDraft, setTagDraft] = React.useState("");
  const [product, setProduct] = React.useState<Product>("CONTROL");
  const [sub, setSub] = React.useState<SubTab>("product");
  const [credOpen, setCredOpen] = React.useState(false);
  const [memoOpen, setMemoOpen] = React.useState(false);

  // Control 전용 하위 탭(커미셔닝 레포트) — 다른 제품으로 옮기면 제품 정보로 되돌린다
  const subTabs: SubTab[] = product === "CONTROL" ? ["product", "image", "remote", "commissioning"] : ["product", "image", "remote"];
  const switchProduct = (v: Product) => {
    setProduct(v);
    if (v !== "CONTROL" && sub === "commissioning") setSub("product");
  };
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags((prev) => [...prev, t]);
    setTagDraft("");
    setTagOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title={VESSEL.name}
          addon={
            <span className="flex flex-wrap items-center gap-1.5">
              {/* 즐겨찾기 — 운영의 제목 옆 별 */}
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={starred ? "즐겨찾기 해제" : "즐겨찾기"}
                aria-pressed={starred}
                onClick={() => setStarred((s) => !s)}
              >
                <Star className={starred ? "size-4 fill-current text-primary" : "size-4"} />
              </Button>
              {/* 호선 태그 = 제목 옆 칩(2026-09-21 디자이너 확정, 종전 태그 박스 폐기) */}
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1 font-normal">
                  {t}
                  <button
                    type="button"
                    aria-label={`태그 ${t} 삭제`}
                    className="rounded-sm hover:bg-accent"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={tagOpen} onOpenChange={setTagOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-secondary-foreground">
                    <Plus className="size-3" /> 태그 추가
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="tag-input" className="text-xs">
                      새 태그
                    </Label>
                    <span className="text-xs text-secondary-foreground">{tags.length} / 10</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="tag-input"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      placeholder="태그 입력"
                    />
                    <Button size="sm" disabled={!tagDraft.trim()} onClick={addTag}>
                      추가
                    </Button>
                  </div>
                  <p className="text-xs text-secondary-foreground">태그는 호선 검색에 쓰입니다.</p>
                </PopoverContent>
              </Popover>
            </span>
          }
          actions={
            <>
              <Button variant="ghost" onClick={() => setCredOpen(true)}>
                <KeyRound className="size-4" /> 비밀번호
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <Link2 className="size-4" /> Quick Link <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Argo CD</DropdownMenuItem>
                  <DropdownMenuItem>Grafana</DropdownMenuItem>
                  <DropdownMenuItem>MinIO 콘솔</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <Settings className="size-4" /> 도구 및 관리 <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>호선 정보 수정</DropdownMenuItem>
                  <DropdownMenuItem>구독 관리</DropdownMenuItem>
                  <DropdownMenuItem>로그 다운로드</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">호선 삭제</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline">
                <Stethoscope className="size-4" /> 자가 진단
              </Button>
              {/* 업데이트 플로우 진입 — 목록 표의 같은 버튼(updates/page.tsx)과 같은 곳으로 간다.
                  ?kind= 는 붙이지 않는다: 셸 브레드크럼 표가 이미 kind 를 무시한다 */}
              <Button asChild>
                <Link href={`${BASE}/ships/update`}>
                  <RefreshCw className="size-4" /> 업데이트
                </Link>
              </Button>
              <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={DEFAULT_STATES} />
            </>
          }
        />

        {view === "loading" && <BlockSkeleton />}
        {view === "error" && (
          <ErrorState
            title="호선 정보를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}
        {view === "empty" && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>이 호선에 설치된 제품이 없습니다.</EmptyTitle>
              <EmptyDescription>
                {KINDS[kind]}에 제품이 배정되면 제품 정보와 이미지 버전이 여기 표시됩니다.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {view === "default" && (
          // 2컬럼 = 계약 상세와 같은 문법(본문 min-w-0 flex-1 · 레일 sticky top-22 w-80)
          <div className="flex items-start gap-6">
            <div className="min-w-0 flex-1 space-y-6">
              {/* 패널 배치(2026-10-07 디자이너 지정) — 1행 기본 정보 전폭 · 2행 시스템 옵션 | 상태 정보 반반.
                  종전 3열은 패널 폭이 좁아 값이 줄바꿈으로 깨졌다(선주 · 신조/개조 · 생성 시간). 감싸는 컨테이너 카드는 여전히 없다 */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card variant="flat" className="space-y-4 p-6 lg:col-span-2">
                  <h2 className="text-sm font-medium text-secondary-foreground">기본 정보</h2>
                  {/* 4열 격자 두 줄(2026-10-07 디자이너 지정) — 1줄 IMO·Hull·호선명·Call Sign · 2줄 선주·신조/개조·선급·Yard.
                      라벨이 있는 항목끼리는 구분선을 두지 않는다 — 라벨이 이미 항목을 나눈다.
                      구분선은 생성 정보(생성자·생성 시간) 위 하나뿐 */}
                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Kv label="IMO" value={VESSEL.imo} mono />
                    <Kv label="Hull Number" value={VESSEL.hullNumber} mono />
                    <Kv label="호선명" value={VESSEL.shipName} mono />
                    <Kv label="Call Sign" value={VESSEL.callSign} mono />
                    <Kv label="선주" value={VESSEL.owner} mono />
                    <Kv label="신조/개조" value={VESSEL.build} />
                    <Kv label="선급" value={VESSEL.klass} />
                    <Kv label="Yard" value={VESSEL.yard} />
                  </div>
                  <div className="grid gap-x-6 gap-y-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <PersonKv label="생성자" name={VESSEL.creator} />
                    {/* 생성 시간은 두 칸 — 날짜·시각·상대 시간이 한 줄에 들어가게 */}
                    <div className="sm:col-span-2">
                      <Kv label="생성 시간" value={`${VESSEL.createdAt} (${VESSEL.createdAgo})`} />
                    </div>
                  </div>
                </Card>

                <Card variant="flat" className="space-y-4 p-6">
                  <h2 className="text-sm font-medium text-secondary-foreground">시스템 옵션</h2>
                  {/* 라벨 있는 항목끼리는 구분선 없음(2026-10-07) — 간격만으로 나눈다 */}
                  <div className="space-y-4">
                    {SYSTEM_OPTIONS.map(([label, on]) => (
                      <div key={label} className="space-y-1">
                        <p className="text-xs text-secondary-foreground">{label}</p>
                        <StatusBadge
                          label={on ? "활성화" : "비활성화"}
                          tone={on ? "success" : "neutral"}
                          bg={false}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card variant="flat" className="space-y-4 p-6">
                  <h2 className="text-sm font-medium text-secondary-foreground">상태 정보</h2>
                  {/* 라벨 있는 항목끼리는 구분선 없음(2026-10-07) — 간격만으로 나눈다 */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs text-secondary-foreground">상태 업데이트</p>
                      <p className="text-sm font-medium">
                        <span className="font-mono">{STATUS_INFO.updatedAt}</span>{" "}
                        <span className="font-normal text-secondary-foreground">({STATUS_INFO.updatedAgo})</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-secondary-foreground">클라우드 상태</p>
                      <StatusBadge
                        label={STATUS_INFO.cloud ? "활성화" : "비활성화"}
                        tone={STATUS_INFO.cloud ? "success" : "neutral"}
                        bg={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-secondary-foreground">구독 상태</p>
                      <p className="font-mono text-sm font-medium">{STATUS_INFO.subscription}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 제품 탭(최대 4) + 하위 탭 행 — 우측 끝은 Control 전용 CA 웹뷰어 링크 버튼 */}
              <div className="space-y-4">
                <div className="border-b">
                  <Tabs value={product} onValueChange={(v) => switchProduct(v as Product)}>
                    <TabsList variant="line">
                      {PRODUCTS.map((p) => (
                        <TabsTrigger key={p} value={p}>
                          {p}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <Tabs value={sub} onValueChange={(v) => setSub(v as SubTab)}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <TabsList>
                      {subTabs.map((s) => (
                        <TabsTrigger key={s} value={s}>
                          {SUB_TABS[s]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {product === "CONTROL" && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="size-4" /> CA 웹뷰어
                      </Button>
                    )}
                  </div>

                  <TabsContent value="product" className="mt-4 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <Card variant="flat" className="space-y-4 p-6 lg:col-span-2">
                        <h2 className="text-sm font-medium text-secondary-foreground">제품 정보</h2>
                        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
                          <Kv label="Common Version" value={PRODUCT_INFO[product].common} mono />
                          <Kv label="Product Version" value={PRODUCT_INFO[product].product} mono />
                          <Kv label="Server Type" value={PRODUCT_INFO[product].server} mono />
                          <Kv label="클라이언트 PC 수량" value={String(PRODUCT_INFO[product].clients)} mono />
                        </div>
                        <div className="grid gap-x-6 gap-y-4 border-t pt-4 sm:grid-cols-2">
                          <PersonKv label="Created By" name={VESSEL.creator} />
                          <Kv label="Created At" value={`2026-07-01 06:46 (${VESSEL.createdAgo})`} />
                        </div>
                      </Card>
                      <Card variant="flat" className="space-y-4 p-6">
                        <h2 className="text-sm font-medium text-secondary-foreground">상태 정보</h2>
                        <Kv label="Agent Status" value={PRODUCT_INFO[product].agent} mono />
                      </Card>
                    </div>

                    <Card variant="flat" className="space-y-6 p-6">
                      <h2 className="text-sm font-medium text-secondary-foreground">옵션 정보</h2>
                      {/* 그룹 네 개를 위아래 네 줄로(2026-10-07 디자이너 지정) — 종전 2×2 는 그룹 안 2열과 겹쳐
                          사실상 4열 격자가 됐고, 그룹 높이가 달라 아래 두 그룹의 시작선이 어긋나 읽기 순서가 지그재그였다.
                          그룹 안 항목은 위 기본 정보와 같은 4열 격자 — 페이지 전체에서 열이 맞는다.
                          구분선은 그룹 사이에만(제목 밑줄은 뺐다 — 라벨 있는 항목끼리는 선을 두지 않는다는 같은 날 규칙) */}
                      <div className="divide-y">
                        {OPTION_GROUPS.map((g) => (
                          <section key={g.title} className="space-y-3 py-5 first:pt-0">
                            <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{g.title}</h3>
                            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                              {g.rows.map(([label, value]) => (
                                <div key={label} className="space-y-1">
                                  <p className="text-xs text-secondary-foreground">{label}</p>
                                  {typeof value === "boolean" ? (
                                    <StatusBadge
                                      label={value ? "True" : "False"}
                                      tone={value ? "success" : "neutral"}
                                      bg={false}
                                      mono
                                    />
                                  ) : (
                                    <p className="font-mono text-sm font-medium">{value}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                      {/* DETAILED CONFIGURATION — 운영은 접힌 행. DS Collapsible(어휘 data-tree) */}
                      <DetailedConfig />
                    </Card>
                  </TabsContent>

                  <TabsContent value="image" className="mt-4 space-y-6">
                    <section className="space-y-3">
                      <h2 className="text-sm font-medium text-secondary-foreground">Module ({MODULES.length})</h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        {MODULES.map(([name, version]) => (
                          <Card key={name} variant="flat" className="space-y-2 p-3">
                            <div className="space-y-0.5">
                              <p className="text-xs text-secondary-foreground">Module</p>
                              <p className="break-all text-sm font-medium text-primary">{name}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-secondary-foreground">Version</p>
                              <p className="break-all font-mono text-sm">{version}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-3">
                      <h2 className="text-sm font-medium text-secondary-foreground">Library (0)</h2>
                      <Empty size="sm" className="justify-center">
                        등록된 데이터가 없습니다.
                      </Empty>
                    </section>
                  </TabsContent>

                  <TabsContent value="remote" className="mt-4">
                    {/* DS에 없음이 아니라 캡처에 없던 화면 — 최소 구성으로 세웠다(2026-09-21 세션 판단) */}
                    <Card variant="flat" className="space-y-4 p-6">
                      <div>
                        <h2 className="text-sm font-medium text-secondary-foreground">원격 접속</h2>
                        <p className="text-xs text-secondary-foreground">
                          운영 캡처에 없던 탭입니다 — 접속 정보와 진입 버튼만 세운 최소 구성입니다.
                        </p>
                      </div>
                      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
                        <Kv label="Remote Support" value="Rustdesk" />
                        <Kv label="세션 ID" value="982 445 117" mono />
                        <Kv label="마지막 접속" value="2026-07-02 08:41 (2개월 전)" />
                      </div>
                      <div>
                        <Button variant="outline">
                          <ExternalLink className="size-4" /> 원격 접속 열기
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="commissioning" className="mt-4">
                    {/* 운영 캡처의 실패 상태 재현 — 배너 표준 양식(destructive + /5 틴트) */}
                    <Alert variant="destructive" className="border-0 bg-destructive/5">
                      <AlertTitle>커미셔닝 레포트 정보를 불러오지 못했습니다.</AlertTitle>
                      <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* 우측 패널 — 호선 제원(첫 탭) · 호선 메모 */}
            <aside className="sticky top-22 w-80 shrink-0 self-start">
              <Card variant="flat" className="p-4">
                <Tabs defaultValue="specs">
                  <div className="border-b">
                    <TabsList variant="line">
                      <TabsTrigger value="specs">호선 제원</TabsTrigger>
                      <TabsTrigger value="memo">호선 메모</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="specs" className="mt-4 space-y-5">
                    {SPEC_GROUPS.map((g) => (
                      <section key={g.title} className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{g.title}</h3>
                        <dl className="divide-y">
                          {g.rows.map(([label, value, unit]) => (
                            <div key={label} className="flex items-baseline justify-between gap-3 py-2">
                              <dt className="text-xs text-secondary-foreground">{label}</dt>
                              <dd className="text-sm font-medium">
                                {value}
                                {unit && <span className="ml-1 text-xs font-normal text-secondary-foreground">{unit}</span>}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}
                  </TabsContent>

                  <TabsContent value="memo" className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-secondary-foreground">전체 0건</p>
                      <Button size="sm" onClick={() => setMemoOpen(true)}>
                        <Plus className="size-4" /> 새 메모
                      </Button>
                    </div>
                    <Input placeholder="제목 · 내용 검색" aria-label="메모 검색" />
                    <Empty size="sm" className="justify-center">
                      등록된 메모가 없습니다.
                    </Empty>
                    <BodyPager page={1} count={1} onChange={() => {}} />
                  </TabsContent>
                </Tabs>
              </Card>
            </aside>
          </div>
        )}

        <CredentialDialog open={credOpen} onOpenChange={setCredOpen} />
        <MemoDialog open={memoOpen} onOpenChange={setMemoOpen} />
      </div>
    </TooltipProvider>
  );
}

/* ---------------------------------------------------- 조각 */

// KV 한 칸 — 라벨(보조색 xs) + 값(sm, 필요 시 mono). 빈 값은 대시
// 사람 값 — Kv 와 같은 라벨·값 자세에 프로필(이니셜)+이름. 내부 유저(생성자 등)에만 쓴다
function PersonKv({ label, name }: { label: string; name: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-secondary-foreground">{label}</p>
      <p className="text-sm font-medium">
        <Person name={name} />
      </p>
    </div>
  );
}

function Kv({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-secondary-foreground">{label}</p>
      {value ? (
        <p className={"break-all text-sm font-medium" + (mono ? " font-mono" : "")}>{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground">-</p>
      )}
    </div>
  );
}

function DetailedConfig() {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 border-t pt-4 text-xs font-semibold uppercase text-secondary-foreground"
        >
          Detailed Configuration
          <ChevronDown className={open ? "size-4 rotate-180" : "size-4"} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-4">
          {DETAILED_CONFIG.map(([label, value]) => (
            <Kv key={label} label={label} value={value} mono />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---------------------------------------------------- 비밀번호 조회 모달 */

// 라벨만 실물이고 값은 가림 표기 — 복사 버튼은 자리를 지킨다(실제 복사는 목업에서 동작하지 않는다)
function CredentialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>비밀번호 조회</DialogTitle>
          <DialogDescription>
            값은 가려져 있습니다 — 복사 버튼으로만 꺼내 씁니다. {VESSEL.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-120 gap-x-6 gap-y-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {CREDENTIAL_LABELS.map((label) => (
            <div key={label} className="space-y-1">
              <p className="text-sm font-medium">{label}</p>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-6" aria-label={`${label} 복사`}>
                        <Copy className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>복사</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-mono text-sm text-secondary-foreground">••••••••••</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------- 새 메모 작성 모달 */

function MemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const close = (v: boolean) => {
    if (!v) {
      setTitle("");
      setBody("");
    }
    onOpenChange(v);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          {/* 제목은 아이콘 없이 — 저장소 다이얼로그 통일(2026-09-14). 운영 화면은 + 아이콘을 달고 있다 */}
          <DialogTitle>새 메모 작성</DialogTitle>
          <DialogDescription>{VESSEL.name} 호선에 남기는 메모입니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="memo-title">제목</Label>
              <span className="text-xs text-secondary-foreground">{title.length}/200</span>
            </div>
            <Input
              id="memo-title"
              maxLength={200}
              placeholder="예: 출항 전 점검 특이사항"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="memo-body">내용</Label>
                <Badge variant="secondary" className="font-normal">
                  Markdown 지원
                </Badge>
              </div>
              <span className="text-xs text-secondary-foreground">{body.length}/20000</span>
            </div>
            <Textarea
              id="memo-body"
              rows={10}
              maxLength={20000}
              placeholder={"상세 내용을 입력하세요.\n- 점검 항목\n- 확인 결과\n- 후속 조치"}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            취소
          </Button>
          <Button disabled={!title.trim() || !body.trim()} onClick={() => close(false)}>
            메모 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
