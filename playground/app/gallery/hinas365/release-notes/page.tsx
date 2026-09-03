"use client";

// 릴리즈 노트 — ① HiNAS 365 메인 레이아웃 + B 상세 본문(3컬럼)
// 원천: Avikus Design library 「릴리즈 노트」 캡처 3장
//   ① 사용자용 뷰 — 버전 트리 + 마크다운 노트 + 정보 패널(작성자·발행일·발행됨, 내보내기, 첨부)
//   ② 개발자용 뷰 — What's Changed PR 목록 + Helm Modules / Binary Versions / Assets
//   ③ 노트 생성 모달 — 제품·버전·제목(0/20)·내용(작성/미리보기)·첨부 파일(100MB)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  Download,
  FilePlus2,
  Info,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ds/ui/ui/accordion";
import { Badge } from "@ds/ui/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Textarea } from "@ds/ui/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";

const PRODUCT_TABS = ["COMMON", "NAVIGATION", "SVM", "CONTROL"];

const VERSION_TREE: { group: string; count: number; versions: string[] }[] = [
  {
    group: "v4.0",
    count: 9,
    versions: [
      "v4.0.5-temp",
      "v4.0.4-temp",
      "v4.0.4-success",
      "v4.0.3-fail",
      "v4.0.0-update.1",
      "v4.0.0-rc.2",
      "v4.0.0-test.96",
      "v4.0.0-test.95",
      "v4.0.0-wheel-house-test3",
    ],
  },
  { group: "v1.0", count: 1, versions: ["v1.0.0"] },
];

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

export default function ReleaseNotesPage() {
  const [audience, setAudience] = React.useState<Audience>("user");
  const [view, setView] = React.useState<ViewState>("default");
  const [selected, setSelected] = React.useState("v4.0.0-test.96");
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold">릴리즈 노트</h1>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={audience}
            onValueChange={(v) => v && setAudience(v as Audience)}
          >
            <ToggleGroupItem value="user">사용자용</ToggleGroupItem>
            <ToggleGroupItem value="dev">개발자용</ToggleGroupItem>
          </ToggleGroup>
          {audience === "user" ? (
            <>
              <Button variant="outline">
                <Download className="size-4" /> 일괄 내보내기
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> 노트 생성
              </Button>
            </>
          ) : (
            <Button variant="ghost">
              <RefreshCw className="size-4" /> 업데이트
            </Button>
          )}
        </div>
      </div>

      {/* 제품 탭 */}
      <Tabs defaultValue="COMMON">
        <TabsList>
          {PRODUCT_TABS.map((p) => (
            <TabsTrigger key={p} value={p}>
              {p}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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

      {view === "default" && (
        <div className="flex flex-col items-start gap-4 lg:flex-row">
          {/* ── 좌: 버전 트리 ── */}
          <aside className="w-full shrink-0 rounded-lg border bg-card p-2 lg:w-64">
            <p className="px-2 py-1.5 text-xs font-medium uppercase text-secondary-foreground">버전</p>
            <Accordion type="multiple" defaultValue={["v4.0"]}>
              {VERSION_TREE.map((g) => (
                <AccordionItem key={g.group} value={g.group} className="border-b-0">
                  <AccordionTrigger className="px-2 py-2 text-sm hover:no-underline">
                    <span className="flex w-full items-center justify-between pr-2">
                      <span className="font-medium">{g.group}</span>
                      <span className="text-xs text-secondary-foreground">{g.count}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-0.5 pb-1">
                    {g.versions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelected(v)}
                        className={
                          "block w-full truncate rounded-md px-3 py-1.5 text-left font-mono text-sm " +
                          (selected === v ? "bg-accent font-medium" : "text-secondary-foreground hover:bg-accent")
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </aside>

          {/* ── 중앙: 노트 본문 ── */}
          <article className="min-w-0 flex-1 space-y-4 rounded-lg border bg-card p-6">
            {audience === "user" ? (
              <>
                <h2 className="font-mono text-2xl font-bold text-primary">{selected}</h2>
                <div className="rounded-lg border bg-muted p-4 text-sm">
                  Introduces authentication features, improves performance, and fixes critical bugs
                  while adding security and operational enhancements.
                </div>

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

          {/* ── 우: 정보 패널 ── */}
          <aside className="w-full shrink-0 space-y-4 rounded-lg border bg-card p-4 lg:w-72">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">정보</p>
              {audience === "user" ? (
                <>
                  <p className="text-sm">seonghun.jung@avikus.ai</p>
                  <p className="text-sm">발행일 2026-06-25</p>
                  <Badge variant="secondary" className="font-normal">
                    <span className="size-1.5 rounded-full bg-success" /> 발행됨
                  </Badge>
                </>
              ) : (
                <p className="text-sm">릴리즈일 2026-05-11</p>
              )}
            </div>

            <Separator />

            {audience === "user" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-secondary-foreground">작업</p>
                <Button variant="outline" className="w-full">
                  <Download className="size-4" /> 내보내기
                </Button>
                <Button className="w-full">
                  <Send className="size-4" /> 발행
                </Button>
                <Button variant="outline" className="w-full">
                  <Pencil className="size-4" /> 수정
                </Button>
                <Button variant="destructive-outline" className="w-full">
                  <Trash2 className="size-4" /> 삭제
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
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
                <Separator />
                <div className="space-y-2">
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

            <Separator />
            <div className="space-y-2">
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

      {/* ── 노트 생성 모달 ── */}
      <CreateNoteDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

/* ---------------------------------------------------- 노트 생성 모달 */

function CreateNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [product, setProduct] = React.useState("navigation");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("## 새로운 기능\n- \n\n## 개선 사항\n- \n\n## 버그 수정\n- ");
  const [mode, setMode] = React.useState<"write" | "preview">("write");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="size-5 text-primary" /> 릴리즈 노트 생성
          </DialogTitle>
          <DialogDescription>제품과 버전을 선택하고 내용을 작성합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cn-product">
                제품 <span className="text-destructive">*</span>
              </Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger id="cn-product" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["common", "navigation", "svm", "control"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cn-version">
                버전 <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger id="cn-version" className="w-full">
                  <SelectValue placeholder="버전을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {["v3.6.0", "v3.5.2", "v3.4.0"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="cn-body">
                내용 <span className="text-destructive">*</span>
              </Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={mode}
                onValueChange={(v) => v && setMode(v as "write" | "preview")}
              >
                <ToggleGroupItem value="write">작성</ToggleGroupItem>
                <ToggleGroupItem value="preview">미리보기</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {mode === "write" ? (
              <Textarea
                id="cn-body"
                rows={8}
                className="font-mono"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            ) : (
              <div className="min-h-44 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">
                {body}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>첨부 파일</Label>
            <p className="text-xs text-success">100MB 이하의 파일만 등록할 수 있습니다.</p>
            <Button variant="outline" className="w-full border-dashed">
              <Paperclip className="size-4" /> 파일 추가
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={() => onOpenChange(false)}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

