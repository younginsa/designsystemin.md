"use client";

// 릴리즈 노트 — ① HiNAS 365 메인 레이아웃 + B 상세 본문(3컬럼)
// 원천: Avikus Design library 「릴리즈 노트」 캡처 3장
//   ① 사용자용 뷰 — 탭 행(제품 line 탭 + 페이지 액션) 아래 세로 구분선 3컬럼: 버전 목록 | 노트 | 정보(작성자·발행일·상태, 첨부)
//   내비(2026-09-16 디자이너 확정): 사이드바 자식 = 사용자용·개발자용(?view=user|dev, 제목 "{독자} 릴리즈 노트"),
//   제품(COMMON·NAVIGATION·SVM·CONTROL)은 탭 행의 line 탭(로컬 상태, 기본 COMMON) — 09-11의 제품 하위 페이지를 뒤집었다
//   레이아웃(2026-09-11 디자이너 확정, 레퍼런스 Statsig): 카드 대신 구분선 섹션, 셸 여백(p-8) 안에서만.
//   탭 행과 3컬럼은 간격 0 한 블록 — 세로 구분선이 탭 border-b에 바로 닿는다(컬럼 안쪽 pt-6으로 숨 쉼)
//   발행 상태: 버전 목록 각 행 앞 도트(발행됨 success · 미발행 muted-foreground = 저장소 상태 도트 관례) — 정보 배지도 선택 노트를 따른다
//   액션 레벨: 탭 행 우측 = 페이지 액션(사용자용: 일괄 다운로드 ghost·노트 생성 primary / 개발자용: 업데이트 ghost)
//             탭 행은 items-end — 탭 밑줄은 border-b에 앉히고 버튼 묶음만 pb-2로 8px 띄운다(레퍼런스 Statsig 툴바)
//   ④ 일괄 다운로드 모달 — 제품은 사이드바가 이미 고정하므로 시작·종료 버전만, 목록은 발행된 버전만(디자이너 확정 2026-09-11)
//   ⑤ 노트 수정 = 제자리 편집(Jira식, 2026-09-14 디자이너 확정) — 수정 아이콘을 누르면 요약 박스가 Input, 본문이 마크다운 Textarea로
//      바뀌고 제목 줄의 수정·삭제 자리에 취소·저장이 선다. 버전명은 키라 고정. 노트 전환·탭 전환 시 편집 종료
//   ⑥ 노트 생성 모달 — 제품 필드 없음(사이드바가 고정), 버전 목록은 이 제품에 노트가 아직 없는 빌드만.
//      노트가 있는 버전은 새로 만들 수 없고 ⑤로만 고친다
//   ⑦ 개발자용 업데이트(2026-09-14 디자이너 확정) — 화면 변화 없는 백그라운드 갱신(GitHub 저장소 요청).
//      진행 = 버튼 아이콘 회전 + 비활성, 결과 = 셸 토스트(하단 오른쪽): 성공 한 줄 / 실패 + 재시도 액션.
//      목업은 첫 클릭 성공 · 다음 클릭 실패를 번갈아 보여 두 상태를 모두 시연한다
//             노트 제목 줄 우측 = 수정·삭제(ghost 아이콘, 삭제만 빨강)
//             정보 위 = 발행(전폭 CTA, 미발행에만) + 다운로드(아이콘) — 발행되면 다운로드가 전폭 outline
//   우측 레일: 액션 행 아래 정보 · 첨부 파일이 각각 DS Card variant=flat p-4(2026-09-15 어휘화) — 구분선 없이 카드 간격
//   용어: 표 데이터를 형식 골라 내보내면 내보내기, 있는 파일을 받으면 다운로드 — 노트는 파일이므로 다운로드
//   ② 개발자용 뷰 — 본문 3섹션(2026-09-16 디자이너 확정): What's Changed PR 목록 → Helm Modules 표 → Binary Versions 표.
//      섹션 제목은 What's Changed와 같은 줄(border-b), 표는 DS Table(레일에 있던 목록을 본문으로 옮기며 열 전부 복원)
//   ③ 노트 생성 모달 — 제품·버전·제목(0/20)·내용(작성/미리보기)·첨부 파일(100MB)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { PageHeader } from "@ds/ui/ui/page-header";
import { Card } from "@ds/ui/ui/card";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  Download,
  ImagePlus,
  Info,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Trash2,
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { Input } from "@ds/ui/ui/input";
import { Label } from "@ds/ui/ui/label";
import { Progress } from "@ds/ui/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ds/ui/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
// 개발자용 Helm·Binary 목록(2026-09-18): 검색·필터 = DS FilterBar, 페이지네이션 = DS ListFooter, 매처는 여섯 목록 공용
import { FilterBar, OPS_SELECT, OPS_TEXT, type FilterDef, type FilterValues } from "@ds/ui/ui/filter-bar";
import { ROWS_PER_PAGE_DEFAULT } from "@ds/ui/ui/rows-per-page";
// 본문 표 페이저 — 업데이트 화면과 공용(2026-09-18). ListFooter variant="pager" 채택 시 은퇴
import { BodyPager } from "../../_detail/body-pager";
import { passSelect, passText } from "../../_detail/filter-match";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@ds/ui/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

// 하위 페이지 = 독자. ?view= 값 → 제목 라벨. 사이드바 자식 목록(layout.tsx)과 같은 순서
const AUDIENCES = { user: "사용자용", dev: "개발자용" } as const;
type Audience = keyof typeof AUDIENCES;
const isAudience = (v: string | null): v is Audience => v !== null && v in AUDIENCES;
// 제품 = 탭 행의 line 탭(로컬 상태). 데이터는 동일, 제목 줄·모달의 제품명만 따라간다
const PRODUCTS = { common: "COMMON", navigation: "NAVIGATION", svm: "SVM", control: "CONTROL" } as const;
type ProductKey = keyof typeof PRODUCTS;

// 발행 상태(2026-09-11): temp 빌드 2건은 미발행, 나머지 발행됨 — 목록 도트·정보 배지·발행 CTA 노출이 모두 이 값을 본다
type Version = { name: string; published: boolean };
const VERSION_TREE: { group: string; count: number; versions: Version[] }[] = [
  {
    group: "v4.0",
    count: 9,
    versions: [
      { name: "v4.0.5-temp", published: false },
      { name: "v4.0.4-temp", published: false },
      { name: "v4.0.4-success", published: true },
      { name: "v4.0.3-fail", published: true },
      { name: "v4.0.0-update.1", published: true },
      { name: "v4.0.0-rc.2", published: true },
      { name: "v4.0.0-test.96", published: true },
      { name: "v4.0.0-test.95", published: true },
      { name: "v4.0.0-wheel-house-test3", published: true },
    ],
  },
  { group: "v1.0", count: 1, versions: [{ name: "v1.0.0", published: true }] },
];
const isPublished = (name: string) =>
  VERSION_TREE.flatMap((g) => g.versions).find((v) => v.name === name)?.published ?? true;
// 일괄 다운로드 범위 후보 — 발행된 버전만, 목록 순서(최신 → 과거) 그대로
const PUBLISHED_VERSIONS = VERSION_TREE.flatMap((g) => g.versions)
  .filter((v) => v.published)
  .map((v) => v.name);
// 노트 생성 후보 — 이 제품에 아직 노트가 없는 빌드 버전(목업). 목록(VERSION_TREE)에 있는 버전은 후보가 아니다
const NOTE_FREE_VERSIONS = ["v4.0.6-rc.1", "v4.0.5-success", "v4.1.0-rc.1"];

// 선택 노트의 편집 원문(목업) — 요약 박스 + 마크다운 본문. 화면의 정적 본문과 같은 내용
// 본문은 한국어(2026-09-15 디자이너 확정) — 개발자용 GitHub PR 제목·Helm·바이너리 이름은 식별자라 그대로
const NOTE_SUMMARY =
  "인증 기능을 추가하고 성능을 개선했으며, 보안·운영 기능을 보강하면서 주요 버그를 수정했습니다.";
const NOTE_BODY_MD = [
  "# 릴리즈 노트 v1.3.0",
  "",
  "릴리즈일: 2026년 6월 25일",
  "",
  "## 새로운 기능",
  "",
  "### 팀 워크스페이스",
  "- 협업을 위한 팀 워크스페이스를 도입했습니다.",
  "- 역할 기반 접근 관리를 추가했습니다.",
  "- 팀원 간 리소스 공유가 가능해졌습니다.",
  "",
  "### 리포트 예약",
  "- 리포트를 자동으로 생성하도록 예약할 수 있습니다.",
  "- 발송 주기: 매일 · 매주 · 매월을 지원합니다.",
  "- 생성된 리포트의 이메일 발송 옵션을 추가했습니다.",
  "",
  "## 개선 사항",
  "",
  "### 대시보드 경험",
  "- 대시보드 로딩 성능을 개선했습니다.",
].join("\n");

// Helm·Binary 목업(2026-09-18 확장): 페이지네이션이 보이도록 30건 이상 — 캡처 시드 3건 + 생성분. 제품·플랫폼을 섞어 필터가 뜻을 갖게
type HelmRow = [product: string, platform: string, repo: string, tag: string];
const HELM_PRODUCTS = ["common", "navigation", "svm", "control"];
const HELM_REPOS = ["auth", "registry", "nmea-filter", "gateway", "recorder", "stitch", "detector", "fusion", "telemetry", "updater"];
const HELM_MODULES: HelmRow[] = [
  ["common", "amd64", "hinas-kyverno", "v1.7.5"],
  ["common", "amd64", "hinas-htpasswd", "v1.0.0"],
  ["common", "amd64", "hinas-dropship", "v0.0.14"],
  ...Array.from({ length: 29 }, (_, i): HelmRow => [
    HELM_PRODUCTS[i % 4],
    i % 5 === 4 ? "arm64" : "amd64",
    `hinas-${HELM_REPOS[i % 10]}${i >= 10 ? `-${Math.floor(i / 10)}` : ""}`,
    `v${1 + (i % 3)}.${i % 7}.${i % 4}`,
  ]),
];
const HELM_FILTERS: FilterDef[] = [
  { name: "product", label: "제품", options: HELM_PRODUCTS, operators: OPS_SELECT, base: true },
  { name: "platform", label: "플랫폼", options: ["amd64", "arm64"], operators: OPS_SELECT, base: true },
  { name: "tag", label: "태그", kind: "text", operators: OPS_TEXT, placeholder: "v1.7.5" },
];

// Binary는 운영과 같은 9건(2026-09-18 디자이너 확정 — 요약 카드의 한 자리 건수 비교용). 한 페이지라 페이저는 생략된다
type BinaryRow = [name: string, version: string];
const BINARY_NAMES = ["greengrass", "guard_av", "hi_frame", "nvidia_driver", "cuda_runtime", "docker_ce"];
const BINARY_VERSIONS: BinaryRow[] = [
  ["avikus_theme", "1.0.0"],
  ["cloud_provision", "1.1.0"],
  ["fluentbit", "4.2.2_24.04"],
  ...BINARY_NAMES.map((name, i): BinaryRow => [name, `${1 + (i % 4)}.${i % 10}.${(i * 3) % 12}`]),
];
const BINARY_FILTERS: FilterDef[] = [
  { name: "version", label: "버전", kind: "text", operators: OPS_TEXT, base: true, placeholder: "1.0.0" },
];

// OSS Components 목업(2026-09-18): 캡처 시드(cuda 1버전 · curl 5버전) + 생성분 30 = 32. 한 OSS에 버전 여러 줄(혼재)이면 주의 문법(빨간 도트 + 기본 글자)
type OssVersion = { version: string; type: "deb" | "rpm"; modules: number };
type OssRow = { name: string; versions: OssVersion[] };
const OSS_NAMES = [
  "openssl", "zlib", "libpng", "glibc", "python3", "nginx", "ffmpeg", "opencv", "boost", "protobuf",
  "grpc", "sqlite", "jq", "bash", "systemd", "openssh", "libjpeg", "gstreamer", "numpy", "redis",
  "postgresql", "libxml2", "yaml-cpp", "eigen", "tbb", "cmake", "git", "rsync", "tzdata", "ca-certificates",
];
const OSS_COMPONENTS: OssRow[] = [
  { name: "cuda", versions: [{ version: "12.2.140", type: "deb", modules: 1 }] },
  {
    name: "curl",
    versions: [
      { version: "7.81.0", type: "deb", modules: 2 },
      { version: "8.14.1", type: "deb", modules: 2 },
      { version: "7.61.1", type: "rpm", modules: 1 },
      { version: "7.64.0", type: "deb", modules: 1 },
      { version: "7.68.0", type: "deb", modules: 1 },
    ],
  },
  ...OSS_NAMES.map(
    (name, i): OssRow => ({
      name,
      versions: Array.from({ length: i % 4 === 3 ? 2 : 1 }, (_, k): OssVersion => ({
        version: `${1 + (i % 3)}.${(i + k) % 10}.${(i * 2 + k) % 8}`,
        type: (i + k) % 5 === 2 ? "rpm" : "deb",
        modules: 1 + ((i + k) % 3),
      })),
    }),
  ),
];
const OSS_FILTERS: FilterDef[] = [
  { name: "type", label: "타입", options: ["deb", "rpm"], operators: OPS_SELECT, base: true },
  { name: "mixed", label: "버전 혼재", options: ["혼재", "단일"], operators: OPS_SELECT },
];

const PR_LIST: { text: string; link: string }[] = [
  { text: "Fix/add ufw rule by @kimsron in", link: "avikus-ai/hidom2.0-deploy/pull/727" },
  { text: "chore: update hinas_update_agent version by @kimsron in", link: "avikus-ai/hidom2.0-deploy/pull/728" },
  { text: "ship.json / ship.secrets.json 기반 Helm values 일원화 및 스키마 재설계 by @hyunsooyoo-avikus in", link: "avikus-ai/hidom2.0-deploy/pull/729" },
  { text: "Feat/update ship json by @hyunsooyoo-avikus in", link: "avikus-ai/hidom2.0-deploy/pull/730" },
  { text: "chore: add argcd, minio user name key to ship.secrets.json by @hyunsooyoo-avikus in", link: "avikus-ai/hidom2.0-deploy/pull/731" },
  { text: "fix: fix product.json vars by @hyunsooyoo-avikus in", link: "avikus-ai/hidom2.0-deploy/pull/733" },
  { text: "fix: apply -override flag when registering ssm agent by @hyunsooyoo-avikus in", link: "avikus-ai/hidom2.0-deploy/pull/734" },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// useSearchParams는 Suspense 경계 필수(정적 export) — 버전 호환성·Developer/QA와 같은 패턴
export default function ReleaseNotesPage() {
  return (
    <React.Suspense fallback={null}>
      <ReleaseNotesBody />
    </React.Suspense>
  );
}

function ReleaseNotesBody() {
  const raw = useSearchParams().get("view");
  const audience: Audience = isAudience(raw) ? raw : "user";
  const [product, setProduct] = React.useState<ProductKey>("common");
  const [view, setView] = React.useState<ViewState>("default");
  // 첫 화면은 미발행 노트 — 발행 CTA까지 포함한 액션 세트가 보이도록
  const [selected, setSelected] = React.useState("v4.0.5-temp");
  // 버전 그룹 펼침 — 제어형이라 머리글 앞 셰브론을 상태로 그린다(접힘 ▸ · 펼침 ▾, 2026-09-14 디자이너 확정)
  const [openGroups, setOpenGroups] = React.useState<string[]>(["v4.0"]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const published = isPublished(selected);

  // 제자리 편집(Jira식) — 저장본(summary·bodyMd)과 초안(draft)을 나눠 취소가 되돌릴 수 있게
  const [editing, setEditing] = React.useState(false);
  const [summary, setSummary] = React.useState(NOTE_SUMMARY);
  const [bodyMd, setBodyMd] = React.useState(NOTE_BODY_MD);
  const [summaryDraft, setSummaryDraft] = React.useState(NOTE_SUMMARY);
  const [bodyDraft, setBodyDraft] = React.useState(NOTE_BODY_MD);
  const beginEdit = () => {
    setSummaryDraft(summary);
    setBodyDraft(bodyMd);
    setEditing(true);
  };
  const saveEdit = () => {
    setSummary(summaryDraft);
    setBodyMd(bodyDraft);
    setEditing(false);
  };
  // 노트·제품 탭·독자(사이드바) 전환 = 편집 종료(초안 버림)
  const pick = (name: string) => {
    setSelected(name);
    setEditing(false);
  };
  const switchProduct = (v: ProductKey) => {
    setProduct(v);
    setEditing(false);
  };
  React.useEffect(() => setEditing(false), [audience]);

  // 개발자용 업데이트 — 백그라운드 갱신 목업: 1.5초 진행 후 토스트. 성공/실패를 번갈아 시연, 실패 토스트의 재시도가 다시 돌린다
  const [syncing, setSyncing] = React.useState(false);
  const syncOutcome = React.useRef<"ok" | "fail">("ok");
  const runSync = () => {
    if (syncing) return;
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      if (syncOutcome.current === "ok") {
        toast.success("GitHub에서 릴리즈 노트를 갱신했습니다", { description: "10건 확인 · 새 노트 없음" });
        syncOutcome.current = "fail";
      } else {
        toast.error("GitHub에 연결하지 못했습니다", {
          description: "네트워크 또는 저장소 권한을 확인한 뒤 다시 시도하세요",
          action: { label: "재시도", onClick: () => runSync() },
        });
        syncOutcome.current = "ok";
      }
    }, 1500);
  };

  return (
    // 셸 main(flex-col)을 세로로 채운다 — 3컬럼 세로 구분선이 화면 바닥까지 닿도록(2026-09-11 디자이너 확정)
    <div className="flex flex-1 flex-col gap-6">
      {/* ── 페이지 헤더: 제목만(액션은 탭 행으로) ── */}
      <PageHeader
        title={`${AUDIENCES[audience]} 릴리즈 노트`}
        actions={<StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />}
      />

      {/* ── 탭 행 + 3컬럼: 간격 0 한 블록 — 세로 구분선이 탭 border-b에 바로 닿는다. 남은 높이를 이 블록이 받는다 ── */}
      <div className={view === "default" ? "flex flex-1 flex-col" : undefined}>
        {/* 좌 제품 line 탭(COMMON·NAVIGATION·SVM·CONTROL) · 우 페이지 액션 — 탭은 border-b에 앉고, 버튼 묶음만 pb-2로 띄운다 */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b">
          <Tabs value={product} onValueChange={(v) => switchProduct(v as ProductKey)}>
            <TabsList variant="line">
              {(Object.keys(PRODUCTS) as ProductKey[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {PRODUCTS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 pb-2">
            {audience === "user" ? (
              <>
                <Button variant="ghost" onClick={() => setBulkOpen(true)}>
                  <Download className="size-4" /> 일괄 다운로드
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" /> 노트 생성
                </Button>
              </>
            ) : (
              // outline(2026-09-18 디자이너 확정 — 종전 ghost). 사용자용 행의 ghost+primary 쌍과 달리 단독 액션이라 테두리로 자리를 준다
              <Button variant="outline" onClick={runSync} disabled={syncing} aria-busy={syncing}>
                <RefreshCw className={syncing ? "size-4 animate-spin" : "size-4"} /> 업데이트
              </Button>
            )}
          </div>
        </div>

      {view === "default" && (
        // flex-1 = 남은 높이 채움 · lg:-mb-8 = 셸 하단 여백(p-8)만 넘어가 구분선이 뷰포트 바닥에 닿는다(좌우 여백은 유지)
        <div className="flex flex-1 flex-col gap-6 lg:-mb-8 lg:flex-row lg:gap-0 lg:divide-x">
          {/* ── 좌: 버전 목록 — 행 앞 도트 = 발행 상태 ── */}
          <aside className="w-full shrink-0 pt-6 lg:w-64 lg:pr-6">
            <p className="px-2 py-1.5 text-xs font-medium uppercase text-secondary-foreground">버전</p>
            <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups}>
              {VERSION_TREE.map((g) => (
                <AccordionItem key={g.group} value={g.group} className="border-b-0">
                  {/* 머리글: DS chevron="start"(2026-09-15 DS 회신 — 트리 문법 ▸ 닫힘 → ▾ 열림을 DS가 그린다) + 그룹명 · 우 건수 */}
                  <AccordionTrigger chevron="start" className="items-center gap-1.5 px-2 py-2 text-sm hover:no-underline">
                    <span className="flex w-full items-center gap-1.5 pr-2">
                      <span className="flex-1 font-medium">{g.group}</span>
                      <span className="text-xs text-secondary-foreground">{g.count}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-0.5 pb-1">
                    {g.versions.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => pick(v.name)}
                        className={
                          "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left font-mono text-sm " +
                          (selected === v.name ? "bg-accent font-medium" : "text-secondary-foreground hover:bg-accent")
                        }
                      >
                        <span
                          className={
                            "size-2 shrink-0 rounded-full " + (v.published ? "bg-success" : "bg-muted-foreground")
                          }
                        />
                        <span className="truncate">{v.name}</span>
                        <span className="sr-only">{v.published ? "발행됨" : "미발행"}</span>
                      </button>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </aside>

          {/* ── 중앙: 노트 본문 ── */}
          <article className="min-w-0 flex-1 space-y-4 pt-6 lg:px-8">
            {audience === "user" ? (
              <>
                {/* 제목 줄: 좌 버전명(키, 편집 불가) · 우 보기=수정·삭제 아이콘 / 편집=취소·저장 */}
                <div className="flex items-start justify-between gap-4">
                  <h2 className="min-w-0 truncate font-mono text-2xl font-bold text-primary">{selected}</h2>
                  {editing ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        취소
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        저장
                      </Button>
                    </div>
                  ) : (
                    <TooltipProvider>
                      <div className="flex shrink-0 items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="수정" onClick={beginEdit}>
                              <Pencil className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>수정</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="destructive-ghost" size="icon" aria-label="삭제">
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>삭제</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  )}
                </div>
                {/* 요약 — 보기: muted 박스 / 편집: Input */}
                {editing ? (
                  <Input
                    aria-label="요약"
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                  />
                ) : (
                  <div className="rounded-lg border bg-muted p-4 text-sm">{summary}</div>
                )}

                {/* 본문 — 보기: 저장된 마크다운을 renderMarkdown으로 렌더 / 편집: 생성 모달과 같은 MarkdownEditor(작성|미리보기 + 이미지 삽입)
                    (2026-09-18 디자이너 확정, 피그마 코멘트 "마크다운 변환 미리보기 버튼·이미지 첨부·파일 업로드") */}
                {editing ? (
                  <MarkdownEditor id="rn-body" value={bodyDraft} onChange={setBodyDraft} rows={18} />
                ) : (
                  <div className="space-y-4">{renderMarkdown(bodyMd)}</div>
                )}
              </>
            ) : (
              <>
                {/* 제목 줄 = 제품 탭 + 선택 버전(종전 "common v4.0.3-fail1" 고정값 — 제품 탭 도입으로 따라가게) */}
                <h2 className="min-w-0 truncate font-mono text-2xl font-bold text-primary">
                  {product} {selected}
                </h2>
                {/* What's Changed = flat 카드 p-6(2026-09-18 디자이너 확정) — 표 섹션은 표 테두리가 경계라 산문 블록에도 같은 경계를 준다. 버전 제목은 카드 밖 */}
                <Card variant="flat" className="space-y-4 p-6">
                  <h3 className="border-b pb-2 text-xl font-bold">What&apos;s Changed</h3>
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {PR_LIST.map((pr) => (
                      <li key={pr.link}>
                        {pr.text}{" "}
                        <a href="#" className="break-all text-primary hover:underline">
                          github.com/{pr.link}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    <span className="font-semibold">Full Changelog</span>:{" "}
                    <a href="#" className="break-all text-primary hover:underline">
                      github.com/avikus-ai/hidom2.0-deploy/compare/v4.0.0-test.19...v4.0.3-fail1
                    </a>
                  </p>
                </Card>

                {/* ── 섹션 2·3(2026-09-16 본문 이동 · 09-18 목록화): 제목(구분선 없음) + FilterBar + DS Table + ListFooter.
                    섹션 간격 pt-14 = 종전(24px)의 3배(디자이너 확정) ── */}
                <ListSection
                  id="helm"
                  title="Helm Modules"
                  rows={HELM_MODULES}
                  filters={HELM_FILTERS}
                  searchPlaceholder="Repository · Tag 검색"
                  colCount={4}
                  rowKey={([, , repo]) => repo}
                  matches={([moduleProduct, platform, repo, tag], q, v) =>
                    (!q || `${repo} ${tag}`.toLowerCase().includes(q)) &&
                    passSelect(v.product, moduleProduct) &&
                    passSelect(v.platform, platform) &&
                    passText(v.tag, tag)
                  }
                  head={
                    <>
                      <TableHead className="uppercase">Product</TableHead>
                      <TableHead className="uppercase">Platform</TableHead>
                      <TableHead className="uppercase">Repository</TableHead>
                      <TableHead className="uppercase">Tag</TableHead>
                    </>
                  }
                  cells={([moduleProduct, platform, repo, tag]) => (
                    <>
                      <TableCell>{moduleProduct}</TableCell>
                      <TableCell className="font-mono text-sm">{platform}</TableCell>
                      <TableCell className="font-mono text-sm">{repo}</TableCell>
                      <TableCell className="font-mono text-sm">{tag}</TableCell>
                    </>
                  )}
                />

                <ListSection
                  id="binary"
                  title="Binary Versions"
                  rows={BINARY_VERSIONS}
                  filters={BINARY_FILTERS}
                  searchPlaceholder="Name · Version 검색"
                  colCount={2}
                  rowKey={([name]) => name}
                  matches={([name, version], q, v) =>
                    (!q || `${name} ${version}`.toLowerCase().includes(q)) && passText(v.version, version)
                  }
                  head={
                    <>
                      <TableHead className="uppercase">Name</TableHead>
                      <TableHead className="uppercase">Version</TableHead>
                    </>
                  }
                  cells={([name, version]) => (
                    <>
                      <TableCell className="font-mono text-sm">{name}</TableCell>
                      <TableCell className="font-mono text-sm">{version}</TableCell>
                    </>
                  )}
                />

                {/* ── 섹션 4(2026-09-18): OSS Components — 운영 캡처 재현. 한 OSS 한 행, 버전·타입·모듈은 줄 묶음, 혼재 = 주의 도트 ── */}
                <ListSection
                  id="oss"
                  title="OSS Components"
                  titleMeta={
                    <span className="text-sm font-normal text-secondary-foreground">
                      {HELM_MODULES.length}/{HELM_MODULES.length} 스캔됨
                    </span>
                  }
                  actions={<OssActions />}
                  rows={OSS_COMPONENTS}
                  filters={OSS_FILTERS}
                  searchPlaceholder="OSS · Version 검색"
                  colCount={4}
                  rowKey={(r) => r.name}
                  matches={(r, q, v) =>
                    (!q || `${r.name} ${r.versions.map((x) => x.version).join(" ")}`.toLowerCase().includes(q)) &&
                    r.versions.some((x) => passSelect(v.type, x.type)) &&
                    passSelect(v.mixed, r.versions.length > 1 ? "혼재" : "단일")
                  }
                  head={
                    <>
                      <TableHead className="uppercase">OSS</TableHead>
                      <TableHead className="uppercase">Version</TableHead>
                      <TableHead className="uppercase">Type</TableHead>
                      <TableHead>모듈</TableHead>
                    </>
                  }
                  cells={(r) => (
                    <>
                      <TableCell className="align-top">
                        {r.versions.length > 1 ? (
                          <StatusBadge label={r.name} bg={false} mono toneClassName="text-destructive" />
                        ) : (
                          <span className="font-mono text-sm">{r.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top font-mono text-sm">
                        <div className="space-y-1">
                          {r.versions.map((x) => (
                            <div key={x.version}>{x.version}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <div className="space-y-1">
                          {r.versions.map((x) => (
                            <div key={x.version}>{x.type}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top font-mono text-sm">
                        <div className="space-y-1">
                          {r.versions.map((x) => (
                            <div key={x.version}>{x.modules}</div>
                          ))}
                        </div>
                      </TableCell>
                    </>
                  )}
                />
              </>
            )}
          </article>

          {/* ── 우: 노트 주 액션 + 정보 패널 ── */}
          <aside className="w-full shrink-0 space-y-4 pt-6 lg:w-72 lg:pl-6">
            {audience === "user" && (
              <>
                {/* 발행(전폭 CTA, 미발행에만) + 다운로드(아이콘) — 발행된 노트는 다운로드가 전폭 outline */}
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    {published ? (
                      <Button variant="outline" className="flex-1">
                        <Download className="size-4" /> 다운로드
                      </Button>
                    ) : (
                      <>
                        <Button className="flex-1">
                          <Send className="size-4" /> 발행
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="다운로드">
                              <Download className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>다운로드</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </TooltipProvider>
              </>
            )}
            {/* 레일 = 정보 · 첨부 파일 두 카드(09-11 카드, p-4, 라벨이 내용 안) — 독자 공통.
                개발자용 Helm·Binary는 2026-09-16 본문 섹션으로 이동(288px 레일의 표 가로 스크롤 문제를 자리 이동으로 해소) */}
            <Card variant="flat" className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">정보</p>
              {audience === "user" ? (
                <>
                  <p className="text-sm">seonghun.jung@avikus.ai</p>
                  <p className="text-sm">{published ? "발행일" : "마지막 수정"} 2026-06-25</p>
                  {/* 발행 상태 필 — DS StatusBadge(muted 면 + 8px 도트), 2026-09-14 부품으로 통일 */}
                  <StatusBadge label={published ? "발행됨" : "미발행"} tone={published ? "success" : "neutral"} dot />
                </>
              ) : (
                <p className="text-sm">릴리즈일 2026-05-11</p>
              )}
            </Card>

            {audience === "dev" && (
              // 본문 섹션 요약(2026-09-18 디자이너 확정 — 계약 상세의 문서·청구 카드와 같은 문법): 제목 없이 라벨 | 건수 링크,
              // 링크는 본문 섹션 앵커(scroll-mt-24)로 스크롤. 건수는 데이터 길이
              <Card variant="flat" className="p-4">
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      ["helm", "Helm Modules", HELM_MODULES.length],
                      ["binary", "Binary Versions", BINARY_VERSIONS.length],
                      ["oss", "OSS Components", OSS_COMPONENTS.length],
                    ] as const
                  ).map(([anchor, label, count]) => (
                    // 라벨 좌 · 건수 우(justify-between, 2026-09-18) — 라벨 길이가 제각각이라 고정 폭 대신 양끝 정렬
                    <div key={anchor} className="flex items-center justify-between gap-4">
                      <dt className="text-secondary-foreground">{label}</dt>
                      <dd>
                        <a href={`#${anchor}`} className="text-primary hover:underline">
                          {count}개
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            <Card variant="flat" className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                첨부 파일 {audience === "user" ? "0" : "(0)"}
              </p>
              {/* 인라인 빈 상태 = DS Empty size=sm(2026-09-15 신설, 어휘 fb-empty). 편집 중에는 생성 모달과 같은 점선 [파일 추가](2026-09-18) */}
              {editing ? (
                <Button variant="outline" className="w-full border-dashed">
                  <Paperclip className="size-4" /> 파일 추가
                </Button>
              ) : (
                <Empty size="sm" className="justify-center">
                  {audience === "user" ? "첨부 파일이 비어있습니다." : "첨부 파일 없음"}
                </Empty>
              )}
            </Card>
          </aside>
        </div>
      )}
      </div>

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <Card variant="flat" className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">릴리즈 노트를 불러오는 중입니다…</p>
        </Card>
      )}

      {view === "error" && (
        <ErrorState
          title="릴리즈 노트를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>릴리즈 노트가 없습니다.</EmptyTitle>
            <EmptyDescription>노트를 생성하면 버전 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> 노트 생성
          </Button>
        </Empty>
      )}

      {/* ── 노트 생성 모달 ── */}
      <CreateNoteDialog open={createOpen} onOpenChange={setCreateOpen} product={PRODUCTS[product]} />
      {/* ── 일괄 다운로드 모달 ── */}
      <BulkDownloadDialog open={bulkOpen} onOpenChange={setBulkOpen} product={PRODUCTS[product]} />
    </div>
  );
}

/* ---------------------------------------------------- 마크다운 편집기 · 렌더러(로컬 조합, 2026-09-18) */

// 최소 렌더러 — 노트 본문의 문법만: # 제목(구분선) · ## 절(구분선) · ### 소제목(바로 아래 목록과 묶음) · "- " 목록 · 이미지 줄(자리표시) · 문단.
// 보기 모드와 편집기의 미리보기가 같은 함수를 쓴다 — 저장하면 화면이 원문을 그대로 따른다(종전 보기 모드는 고정 마크업이라 저장이 반영되지 않았다)
function renderMarkdown(md: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let label: string | null = null;
  const key = (p: string) => `${p}-${out.length}`;
  const flushLabel = () => {
    if (label !== null) {
      out.push(
        <p key={key("label")} className="font-medium">
          {label}
        </p>,
      );
      label = null;
    }
  };
  const flushList = () => {
    if (!list.length) return;
    const ul = (
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {list.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    );
    if (label !== null) {
      out.push(
        <div key={key("group")} className="space-y-1">
          <p className="font-medium">{label}</p>
          {ul}
        </div>,
      );
      label = null;
    } else {
      out.push(<React.Fragment key={key("ul")}>{ul}</React.Fragment>);
    }
    list = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    flushLabel();
    out.push(
      <p key={key("p")} className="text-sm">
        {para.join(" ")}
      </p>,
    );
    para = [];
  };
  md.split("\n").forEach((raw) => {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
      return;
    }
    flushList();
    if (line === "") {
      flushPara();
      flushLabel();
      return;
    }
    if (line.startsWith("### ")) {
      flushPara();
      flushLabel();
      label = line.slice(4);
      return;
    }
    if (line.startsWith("## ")) {
      flushPara();
      flushLabel();
      out.push(
        <h4 key={key("h4")} className="border-b pb-2 text-lg font-semibold">
          {line.slice(3)}
        </h4>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushPara();
      flushLabel();
      out.push(
        <h3 key={key("h3")} className="border-b pb-2 text-xl font-bold">
          {line.slice(2)}
        </h3>,
      );
      return;
    }
    const img = line.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
    if (img) {
      flushPara();
      flushLabel();
      out.push(
        <Empty key={key("img")} size="sm" className="justify-start gap-2">
          <ImagePlus className="size-4" /> {img[1] || "이미지"} · {img[2]}
        </Empty>,
      );
      return;
    }
    para.push(line);
  });
  flushList();
  flushPara();
  flushLabel();
  return out;
}

// 마크다운 편집기(2026-09-18 디자이너 확정 — 생성 모달·제자리 편집 공용): 세그먼트 탭 작성|미리보기(DS Tabs 기본 변형, 전폭)
// + DS InputGroup 텍스트에어리어(필드 안 하단 툴바: 이미지 삽입 → OS 파일 선택 → 본문 끝에 마크다운 이미지 줄) + 렌더된 미리보기(flat 카드).
// 같은 요소를 두 곳이 쓰므로 모양이 갈라지지 않는다
function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 8,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const imageInput = React.useRef<HTMLInputElement>(null);
  const insertImage = (file: File | undefined) => {
    if (!file) return;
    onChange(`${value.replace(/\s+$/, "")}\n\n![${file.name}](업로드 예정)\n`);
  };
  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as "write" | "preview")}>
      <TabsList className="w-full">
        <TabsTrigger value="write">작성</TabsTrigger>
        <TabsTrigger value="preview">미리보기</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <InputGroup>
          <InputGroupTextarea
            id={id}
            rows={rows}
            className="font-mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <InputGroupAddon align="block-end" className="justify-between border-t">
            {/* 힌트 접미어 = muted(DS 규칙) */}
            <InputGroupText muted className="text-xs">
              이미지는 본문 끝에 마크다운으로 들어갑니다
            </InputGroupText>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton size="icon-xs" aria-label="이미지 삽입" onClick={() => imageInput.current?.click()}>
                    <ImagePlus />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>이미지 삽입</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </InputGroupAddon>
        </InputGroup>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            insertImage(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </TabsContent>
      <TabsContent value="preview">
        <Card variant="flat" className="min-h-44 space-y-4 p-4">
          {renderMarkdown(value)}
        </Card>
      </TabsContent>
    </Tabs>
  );
}

/* ---------------------------------------------------- 개발자용 본문 목록 섹션 */

// 제목(구분선 없음) + DS FilterBar + DS Table + DS ListFooter — 표마다 검색·필터·페이지 상태를 따로 가진다(2026-09-18).
// 제목 건수 = 전체, 푸터 건수 = 걸러진 결과. 필터·검색이 바뀌면 1페이지로
function ListSection<T>({
  id,
  title,
  titleMeta,
  actions,
  rows,
  filters,
  searchPlaceholder,
  colCount,
  rowKey,
  matches,
  head,
  cells,
}: {
  /** 앵커 id — 우측 레일 요약 카드의 링크 대상(scroll-mt-24) */
  id: string;
  title: string;
  /** 제목 옆 보조 글자(예: 스캔 현황) */
  titleMeta?: React.ReactNode;
  /** 섹션 액션 — FilterBar 우측 actions 슬롯(목록 페이지의 페이지 액션 자리)에 outline 버튼으로(2026-09-18) */
  actions?: React.ReactNode;
  rows: T[];
  filters: FilterDef[];
  searchPlaceholder: string;
  colCount: number;
  rowKey: (row: T) => string;
  matches: (row: T, q: string, values: FilterValues) => boolean;
  head: React.ReactNode;
  cells: (row: T) => React.ReactNode;
}) {
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  // 페이지당 선택은 없다(페이저만 두는 본문 표 규칙) — DS 기본 15 고정
  const pageSize = ROWS_PER_PAGE_DEFAULT;
  const [page, setPage] = React.useState(1);
  const q = keyword.trim().toLowerCase();
  const filtered = rows.filter((r) => matches(r, q, filterValues));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => setPage(1), [keyword, filterValues]);

  return (
    <section id={id} className="scroll-mt-24 space-y-4 pt-14">
      <h3 className="flex flex-wrap items-baseline gap-2 text-xl font-bold">
        <span>
          {title} ({rows.length})
        </span>
        {titleMeta}
      </h3>
      <FilterBar
        searchPlaceholder={searchPlaceholder}
        keyword={keyword}
        onKeyword={setKeyword}
        filters={filters}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={actions}
      />
      <Table>
        <TableHeader>
          <TableRow>{head}</TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="py-8 text-center text-secondary-foreground">
                검색 결과가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((r) => <TableRow key={rowKey(r)}>{cells(r)}</TableRow>)
          )}
        </TableBody>
      </Table>
      <BodyPager page={page} count={Math.ceil(filtered.length / pageSize)} onChange={setPage} />
    </section>
  );
}

// OSS 섹션 액션 — 스캔은 백그라운드 목업(회전 + 토스트, 릴리즈 노트 업데이트와 같은 문법), 관리는 화면이 아직 없어 토스트로 안내
function OssActions() {
  const [scanning, setScanning] = React.useState(false);
  const scan = () => {
    if (scanning) return;
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      toast.success("OSS 스캔을 마쳤습니다", {
        description: `${HELM_MODULES.length}/${HELM_MODULES.length} 모듈 · 새 컴포넌트 없음`,
      });
    }, 1500);
  };
  // FilterBar actions 슬롯에 outline 버튼 2개(2026-09-18 디자이너 확정 — 종전 제목 줄 ghost)
  return (
    <>
      <Button variant="outline" onClick={scan} disabled={scanning} aria-busy={scanning}>
        <RefreshCw className={scanning ? "size-4 animate-spin" : "size-4"} /> 스캔
      </Button>
      <Button variant="outline" onClick={() => toast("관리 화면은 아직 없습니다")}>
        <Settings2 className="size-4" /> 관리
      </Button>
    </>
  );
}

/* ---------------------------------------------------- 일괄 다운로드 모달 */

// 제품은 사이드바가 이미 고정 → 시작·종료 버전만 받는다. 목록 = 발행된 버전(최신 → 과거). 둘 다 고르면 범위·건수 한 줄
function BulkDownloadDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: string;
}) {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const close = (v: boolean) => {
    if (!v) {
      setFrom("");
      setTo("");
    }
    onOpenChange(v);
  };
  // 목록은 최신 → 과거이므로 시작(과거)이 뒤 인덱스, 종료(최신)가 앞 인덱스
  const fromIdx = PUBLISHED_VERSIONS.indexOf(from);
  const toIdx = PUBLISHED_VERSIONS.indexOf(to);
  const ready = from !== "" && to !== "";
  const count = ready ? Math.abs(fromIdx - toIdx) + 1 : 0;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* 제목은 아이콘 없이 — 저장소 다이얼로그 22개 중 19개가 맨 글자(2026-09-14 통일) */}
          <DialogTitle>릴리즈 노트 일괄 다운로드</DialogTitle>
          <DialogDescription>선택된 범위 내 {product} 릴리즈 모두 다운로드합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bd-from">시작 버전</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger id="bd-from" className="w-full">
                  <SelectValue placeholder="시작 버전을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PUBLISHED_VERSIONS.map((v) => (
                    <SelectItem key={v} value={v} className="font-mono">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bd-to">종료 버전</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger id="bd-to" className="w-full">
                  <SelectValue placeholder="종료 버전을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PUBLISHED_VERSIONS.map((v) => (
                    <SelectItem key={v} value={v} className="font-mono">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {ready && (
            <p className="text-sm text-secondary-foreground">
              <span className="font-mono">{from}</span> ~ <span className="font-mono">{to}</span> · 노트 {count}건
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button disabled={!ready} onClick={() => close(false)}>
            <Download className="size-4" /> 다운로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------- 노트 생성 모달 */

// 제품은 사이드바가 고정 → 버전만 고른다. 후보 = 이 제품에 노트가 없는 빌드(NOTE_FREE_VERSIONS). 노트가 있으면 제자리 편집으로만
function CreateNoteDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: string;
}) {
  const [version, setVersion] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("## 새로운 기능\n- \n\n## 개선 사항\n- \n\n## 버그 수정\n- ");
  const close = (v: boolean) => {
    if (!v) setVersion("");
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>릴리즈 노트 생성</DialogTitle>
          <DialogDescription>
            {product} 제품 · 노트가 없는 버전만 고를 수 있습니다. 이미 노트가 있는 버전은 노트에서 바로 수정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cn-version">
              버전 <span className="text-destructive">*</span>
            </Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger id="cn-version" className="w-full">
                <SelectValue placeholder="버전을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_FREE_VERSIONS.map((v) => (
                  <SelectItem key={v} value={v} className="font-mono">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="cn-title">제목</Label>
              <span className="text-xs text-secondary-foreground">{title.length}/20</span>
            </div>
            <Input
              id="cn-title"
              maxLength={20}
              placeholder="ex) 정규 릴리즈, 마이너 패치"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cn-body">
              내용 <span className="text-destructive">*</span>
            </Label>
            {/* 편집기 = 제자리 편집과 같은 MarkdownEditor(2026-09-18 공용화) — 세그먼트 탭 작성|미리보기 + 이미지 삽입 + 렌더된 미리보기 */}
            <MarkdownEditor id="cn-body" value={body} onChange={setBody} />
          </div>

          <div className="space-y-2">
            <Label>첨부 파일</Label>
            {/* 한계 안내는 보조 텍스트 — 초록(success)은 상태색이라 안내문에 쓰지 않는다(2026-09-14 디자이너 확정, 제품 화면과 다름) */}
            <p className="text-xs text-secondary-foreground">100MB 이하의 파일만 등록할 수 있습니다.</p>
            <Button variant="outline" className="w-full border-dashed">
              <Paperclip className="size-4" /> 파일 추가
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button disabled={!version} onClick={() => close(false)}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

