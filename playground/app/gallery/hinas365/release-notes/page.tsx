"use client";

// 릴리즈 노트 — ① HiNAS 365 메인 레이아웃 + B 상세 본문(3컬럼)
// 원천: Avikus Design library 「릴리즈 노트」 캡처 3장
//   ① 사용자용 뷰 — 탭 행(사용자용|개발자용 line 탭 + 페이지 액션) 아래 세로 구분선 3컬럼: 버전 목록 | 노트 | 정보(작성자·발행일·상태, 첨부)
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
//   우측 레일: 액션 행 아래 정보 · (개발자용 Helm/Binary 표) · 첨부 파일이 각각 카드(rounded-lg border bg-card p-4) — 구분선 없이 카드 간격
//   제품 탭(COMMON·NAVIGATION·SVM·CONTROL)은 2026-09-11 사이드바 하위 페이지(?view=)로 이관 — 제목이 "{제품} 릴리즈 노트"
//   용어: 표 데이터를 형식 골라 내보내면 내보내기, 있는 파일을 받으면 다운로드 — 노트는 파일이므로 다운로드
//   ② 개발자용 뷰 — What's Changed PR 목록 + Helm Modules / Binary Versions / Assets
//   ③ 노트 생성 모달 — 제품·버전·제목(0/20)·내용(작성/미리보기)·첨부 파일(100MB)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Code,
  Download,
  Info,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
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
import { Separator } from "@ds/ui/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Textarea } from "@ds/ui/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

// 하위 페이지 = 제품. ?view= 값 → 제목 라벨. 사이드바 자식 목록(layout.tsx)과 같은 순서
const PRODUCTS = { common: "COMMON", navigation: "NAVIGATION", svm: "SVM", control: "CONTROL" } as const;
type ProductKey = keyof typeof PRODUCTS;
const isProductKey = (v: string | null): v is ProductKey => v !== null && v in PRODUCTS;

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
const NOTE_SUMMARY =
  "Introduces authentication features, improves performance, and fixes critical bugs while adding security and operational enhancements.";
const NOTE_BODY_MD = [
  "# Release Notes v1.3.0",
  "",
  "Release Date: June 25, 2026",
  "",
  "## New Features",
  "",
  "### Team Workspace",
  "- Introduced team workspaces for improved collaboration.",
  "- Added role-based access management.",
  "- Enabled resource sharing across team members.",
  "",
  "### Report Scheduling",
  "- Users can schedule reports to be generated automatically.",
  "- Supported delivery frequencies: Daily, Weekly, and Monthly.",
  "- Added email delivery options for generated reports.",
  "",
  "## Improvements",
  "",
  "### Dashboard Experience",
  "- Improved dashboard loading performance.",
].join("\n");

const HELM_MODULES: [string, string, string, string][] = [
  ["common", "amd64", "hinas-kyverno", "v1.7.5"],
  ["common", "amd64", "hinas-htpasswd", "v1.0.0"],
  ["common", "amd64", "hinas-dropship", "v0.0.14"],
];

const BINARY_VERSIONS: [string, string][] = [
  ["avikus_theme", "1.0.0"],
  ["cloud_provision", "1.1.0"],
  ["fluentbit", "4.2.2_24.04"],
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

type Audience = "user" | "dev";
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
  const product: ProductKey = isProductKey(raw) ? raw : "common";
  const [audience, setAudience] = React.useState<Audience>("user");
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
  // 노트·탭 전환 = 편집 종료(초안 버림)
  const pick = (name: string) => {
    setSelected(name);
    setEditing(false);
  };
  const switchAudience = (v: Audience) => {
    setAudience(v);
    setEditing(false);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold">{PRODUCTS[product]} 릴리즈 노트</h1>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* ── 탭 행 + 3컬럼: 간격 0 한 블록 — 세로 구분선이 탭 border-b에 바로 닿는다. 남은 높이를 이 블록이 받는다 ── */}
      <div className={view === "default" ? "flex flex-1 flex-col" : undefined}>
        {/* 좌 사용자용|개발자용(line 탭) · 우 페이지 액션 — 탭은 border-b에 앉고, 버튼 묶음만 pb-2로 띄운다 */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b">
          <Tabs value={audience} onValueChange={(v) => switchAudience(v as Audience)}>
            <TabsList variant="line">
              <TabsTrigger value="user">
                <UserRound /> 사용자용
              </TabsTrigger>
              <TabsTrigger value="dev">
                <Code /> 개발자용
              </TabsTrigger>
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
              <Button variant="ghost" onClick={runSync} disabled={syncing} aria-busy={syncing}>
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
                  {/* 머리글: 앞 셰브론 + 그룹명 · 우 건수. DS 뒤 셰브론(열림=위)은 이 트리에서만 숨긴다 */}
                  <AccordionTrigger className="px-2 py-2 text-sm hover:no-underline [&>svg]:hidden">
                    <span className="flex w-full items-center gap-1.5 pr-2">
                      {openGroups.includes(g.group) ? (
                        <ChevronDown className="size-4 shrink-0 text-secondary-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-secondary-foreground" />
                      )}
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

                {/* 본문 — 보기: 렌더된 노트 / 편집: 마크다운 원문 Textarea(생성 모달 작성 칸과 같은 mono) */}
                {editing ? (
                  <Textarea
                    aria-label="내용"
                    rows={18}
                    className="font-mono"
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                  />
                ) : (
                  <>
                <h3 className="border-b pb-2 text-xl font-bold">Release Notes v1.3.0</h3>
                <p className="text-sm">
                  <span className="font-semibold">Release Date:</span> June 25, 2026
                </p>

                <h4 className="border-b pb-2 text-lg font-semibold">New Features</h4>
                <div className="space-y-1">
                  <p className="font-medium">Team Workspace</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Introduced team workspaces for improved collaboration.</li>
                    <li>Added role-based access management.</li>
                    <li>Enabled resource sharing across team members.</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Report Scheduling</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Users can schedule reports to be generated automatically.</li>
                    <li>Supported delivery frequencies: Daily, Weekly, and Monthly.</li>
                    <li>Added email delivery options for generated reports.</li>
                  </ul>
                </div>

                <Separator />
                <h4 className="text-lg font-semibold">Improvements</h4>
                <div className="space-y-1">
                  <p className="font-medium">Dashboard Experience</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Improved dashboard loading performance.</li>
                  </ul>
                </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h2 className="font-mono text-2xl font-bold text-primary">common v4.0.3-fail1</h2>
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
            {/* 섹션마다 카드 하나(2026-09-11 디자이너 확정): 정보 · (개발자용 Helm/Binary) · 첨부 파일 — 구분선 대신 카드 간격 */}
            <div className="space-y-2 rounded-lg border bg-card p-4">
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
            </div>

            {audience === "dev" && (
              <>
                <div className="space-y-2 rounded-lg border bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-secondary-foreground">
                    Helm Modules (28)
                  </p>
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Repository</TableHead>
                        <TableHead className="text-xs">Tag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {HELM_MODULES.map(([product, , repo, tag]) => (
                        <TableRow key={repo}>
                          <TableCell className="text-xs">{product}</TableCell>
                          <TableCell className="font-mono text-xs">{repo}</TableCell>
                          <TableCell className="font-mono text-xs">{tag}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="space-y-2 rounded-lg border bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-secondary-foreground">
                    Binary Versions (14)
                  </p>
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {BINARY_VERSIONS.map(([name, version]) => (
                        <TableRow key={name}>
                          <TableCell className="font-mono text-xs">{name}</TableCell>
                          <TableCell className="font-mono text-xs">{version}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            <div className="space-y-2 rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                첨부 파일 {audience === "user" ? "0" : "(0)"}
              </p>
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-secondary-foreground">
                {audience === "user" ? "첨부 파일이 비어있습니다." : "첨부 파일 없음"}
              </p>
            </div>
          </aside>
        </div>
      )}
      </div>

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">릴리즈 노트를 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="릴리즈 노트를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
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
  const [mode, setMode] = React.useState<"write" | "preview">("write");
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
            {/* 세그먼트 탭(2026-09-14 디자이너 확정): 회색 트랙 전폭에 작성|미리보기 반반, 활성은 흰 필(DS Tabs 기본 변형).
                라벨 옆에 떠 있던 토글은 무엇을 바꾸는지 모호했다 — 탭이 본문 바로 위에 전폭으로 앉아야 짝이 보인다 */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as "write" | "preview")}>
              <TabsList className="w-full">
                <TabsTrigger value="write">작성</TabsTrigger>
                <TabsTrigger value="preview">미리보기</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  id="cn-body"
                  rows={8}
                  className="font-mono"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-44 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">{body}</div>
              </TabsContent>
            </Tabs>
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

