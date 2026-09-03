"use client";

// S10 납품 제품 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세)
// 원천: hinas365 와이어프레임 wireframe_s10_delivery_detail.html
//
// 와이어프레임 대조 메모
// - 헤더: Hull 1001 · Control + 계약 항목 칩(납품 + 구독 · C-2026-001 ↗) / 우측 [✕ 취소]
// - 취소 시나리오: 취소되면 배너(⛔ 예정일 수정·도면 등록 차단, 취소 기점 표시) — 토글로 시연
// - 탭 2: ① 개요(일정 — 예정일 수정 모달 · 납품 제품 정보 · 계약 정보 체인:
//   계약→항목→슬롯→호선 각 링크) ② 도면(승인/작업/최종 3종 — 버전·다운로드·업로드·
//   이전 버전, 도면 등록 모달)
// - 우측 댓글 도킹 패널(S3와 동일 패턴 — 접으면 헤더 ghost 버튼)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Download,
  Info,
  MessageSquare,
  Paperclip,
  Plus,
  Upload,
} from "lucide-react";

import { Alert, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
import { Textarea } from "@ds/ui/ui/textarea";

const BASE = "/gallery/sales365";

// 계약 정보 체인 — 계약 → 계약 항목 → 슬롯 → 호선
const CHAIN: { label: string; value: string; link: string; sub?: string }[] = [
  { label: "계약", value: "C-2026-001 · ○○해운 Navi + SVM 구독 5척", link: `${BASE}/contracts/detail`, sub: "계약 상세 →" },
  { label: "계약 항목", value: "C-2026-001-01 · Control + SVM 구독 5척", link: `${BASE}/contracts/detail`, sub: "유효 척수 4/5 · 계약 항목 →" },
  { label: "슬롯", value: "1호선 슬롯 · USD 1,200,000", link: `${BASE}/contracts/detail`, sub: "슬롯 →" },
  { label: "호선", value: "Hull 1001 · MV EXAMPLE", link: `${BASE}/vessels/detail`, sub: "호선 상세 →" },
];

const DRAWINGS: { type: string; name: string; version: string; date: string; history: [string, string][] }[] = [
  { type: "승인도면", name: "General Arrangement Plan", version: "v3", date: "2026-11-20", history: [["v2", "2026-09-05"], ["v1", "2026-07-01"]] },
  { type: "작업도면", name: "Installation Drawing", version: "v2", date: "2026-10-15", history: [["v1", "2026-08-20"]] },
  { type: "최종도면", name: "As-Built Drawing", version: "v1", date: "2026-12-01", history: [] },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 와이어프레임 AUDIT 이식(예정일·도면 관리 이력)
const AUDIT: AuditEntry[] = [
  {
    at: "2026-08-18 17:26",
    action: "U",
    actor: "최다혜",
    fields: [
      { label: "납품 예정일", from: "2026-02-10", to: "2026-02-24" },
      { label: "커미셔닝 예정일", from: "2026-03-01", to: "2026-03-15" },
    ],
  },
  {
    at: "2026-08-02 10:41",
    action: "U",
    actor: "최다혜",
    fields: [{ label: "커미셔닝 예정일", from: "— (미입력)", to: "2026-03-01" }],
  },
  {
    at: "2026-01-08 11:20",
    action: "C",
    actor: "김민준",
    fields: [
      { label: "납품 제품 이름", from: null, to: "Hull 1001 · Control" },
      { label: "배정 호선", from: null, to: "Hull 1001 (MV EXAMPLE)" },
    ],
  },
];

export default function Sales365DeliveryDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [cancelled, setCancelled] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [drawingOpen, setDrawingOpen] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState([
    { author: "이수진", time: "2026-08-19 10:12", text: "일정 변경 사유와 현장 이슈를 남깁니다" },
  ]);
  const [draft, setDraft] = React.useState("");

  return (
    <div className="flex min-h-0 flex-1 items-stretch gap-6">
      <div className="min-w-0 flex-1 space-y-6">
        {/* ── 페이지 헤더 ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold">Hull 1001 · Control</h1>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-secondary-foreground">
              계약 항목 <Badge variant="secondary" className="font-normal">납품 + 구독</Badge> ·
              <Link
                href={`${BASE}/contracts/detail`}
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                C-2026-001 ○○해운 Navi + SVM 구독 5척 <ArrowUpRight className="size-3" />
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
            {!commentsOpen && (
              <Button variant="ghost" onClick={() => setCommentsOpen(true)}>
                <MessageSquare className="size-4" /> 댓글 ({comments.length})
                <ChevronRight className="size-4" />
              </Button>
            )}
            {/* 취소 시나리오 토글 (와이어프레임: 정상/취소 상태 시연) */}
            <Button
              variant="destructive-outline"
              size="sm"
              className="rounded-sm"
              onClick={() => setCancelled((c) => !c)}
            >
              {cancelled ? "취소 해제" : "✕ 취소"}
            </Button>
          </div>
        </div>

        {/* 취소 배너 — 예정일 수정·도면 등록 차단 */}
        {cancelled && (
          <Alert variant="destructive" className="border-0 bg-destructive/5">
            <Info className="size-4" />
            <AlertTitle className="font-semibold text-foreground">
              이 납품은 취소되었습니다.
            </AlertTitle>
            <div className="col-start-2 text-sm text-secondary-foreground">
              예정일 수정과 도면 등록이 차단됩니다. 취소 기점: 계약 항목 (취소 2026-03-10 ·
              발주처 사양 변경 — 상위 전파). 재개하려면 계약부터 순서대로 해제하세요.
            </div>
          </Alert>
        )}

        {view === "loading" && <BlockSkeleton />}
        {view === "progress" && (
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <Progress value={62} className="flex-1" />
              <span className="font-mono text-sm text-secondary-foreground">62%</span>
            </div>
            <p className="text-sm text-secondary-foreground">납품 제품 정보를 불러오는 중입니다…</p>
          </div>
        )}

        {view === "error" && (
          <ErrorState
            title="납품 제품 정보를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {view === "empty" && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>납품 제품을 찾을 수 없습니다.</EmptyTitle>
              <EmptyDescription>삭제되었거나 접근 권한이 없습니다.</EmptyDescription>
            </EmptyHeader>
            <Button asChild variant="outline">
              <Link href={`${BASE}/deliveries`}>납품 제품 목록으로</Link>
            </Button>
          </Empty>
        )}

        {view === "default" && (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="drawings">도면</TabsTrigger>
              <TabsTrigger value="audit">변경 이력</TabsTrigger>
            </TabsList>

            {/* ── ① 개요 ── */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <section className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-secondary-foreground">일정</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancelled}
                    onClick={() => setScheduleOpen(true)}
                  >
                    예정일 수정
                  </Button>
                </div>
                <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  <div className="flex items-baseline">
                    <dt className="w-36 shrink-0 text-secondary-foreground">납품 예정일</dt>
                    <dd className="font-mono">2027-03-01</dd>
                  </div>
                  <div className="flex items-baseline">
                    <dt className="w-36 shrink-0 text-secondary-foreground">커미셔닝 예정일</dt>
                    <dd className="font-mono">2027-05-01</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-lg border bg-card p-5">
                <h2 className="text-sm font-medium text-secondary-foreground">납품 제품 정보</h2>
                <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  <div className="flex items-baseline">
                    <dt className="w-36 shrink-0 text-secondary-foreground">이름</dt>
                    <dd>Hull 1001 · Control <span className="text-xs text-secondary-foreground">— 자동 생성</span></dd>
                  </div>
                  <div className="flex items-baseline">
                    <dt className="w-36 shrink-0 text-secondary-foreground">제품</dt>
                    <dd>
                      Control{" "}
                      <Link href={`${BASE}/products`} className="text-primary hover:underline">
                        제품 마스터 →
                      </Link>
                    </dd>
                  </div>
                  <div className="flex items-baseline">
                    <dt className="w-36 shrink-0 text-secondary-foreground">납품 유형</dt>
                    <dd>납품 + 구독 <span className="text-xs text-secondary-foreground">— 계약 항목 제품에서 상속</span></dd>
                  </div>
                  <div className="flex items-baseline">
                    <dt className="w-36 shrink-0 text-secondary-foreground">구독 조건</dt>
                    <dd>36개월 <span className="text-xs text-secondary-foreground">— 계약 항목 제품에 붙은 조건</span></dd>
                  </div>
                </dl>
              </section>

              {/* 계약 정보 체인 — 계약 → 항목 → 슬롯 → 호선 */}
              <section className="rounded-lg border bg-card p-5">
                <h2 className="text-sm font-medium text-secondary-foreground">계약 정보</h2>
                <div className="mt-3 space-y-3">
                  {CHAIN.map((c) => (
                    <div key={c.label} className="flex items-baseline text-sm">
                      <span className="w-36 shrink-0 text-secondary-foreground">{c.label}</span>
                      <span className="min-w-0">
                        {c.value}{" "}
                        <Link href={c.link} className="text-xs text-primary hover:underline">
                          {c.sub}
                        </Link>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* ── ② 도면 ── */}
            <TabsContent value="drawings" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">
                  도면 3건 (최신 버전 기준)
                </h2>
                <Button size="sm" disabled={cancelled} onClick={() => setDrawingOpen(true)}>
                  <Plus className="size-4" /> 도면 등록
                </Button>
              </div>
              {DRAWINGS.map((d) => (
                <section key={d.type} className="rounded-lg border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        <Badge variant="secondary" className="mr-2 font-normal">{d.type}</Badge>
                        {d.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-secondary-foreground">
                        {d.version} · {d.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" /> 다운로드
                      </Button>
                      <Button variant="ghost" size="sm" disabled={cancelled}>
                        <Upload className="size-4" /> 업로드
                      </Button>
                    </div>
                  </div>
                  {d.history.length > 0 ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-secondary-foreground">
                        이전 버전 보기 ({d.history.length})
                      </summary>
                      <ul className="mt-1 space-y-0.5 pl-4 font-mono text-xs text-secondary-foreground">
                        {d.history.map(([v, dt]) => (
                          <li key={v}>
                            {v} · {dt}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="mt-2 text-xs text-secondary-foreground">이전 버전 없음</p>
                  )}
                </section>
              ))}
            </TabsContent>
            {/* ── 변경 이력 — 공통 AuditLog 시안 ── */}
            <TabsContent value="audit" className="mt-4">
              <AuditLog subject="납품 제품 · Hull 1001 · Control" entries={AUDIT} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── 우측 댓글 도킹 패널 (S3 패턴) ── */}
      {commentsOpen && (
        <aside className="flex w-80 shrink-0 flex-col rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium text-secondary-foreground">댓글 ({comments.length})</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary-foreground"
              onClick={() => setCommentsOpen(false)}
            >
              접기 <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {comments.map((c, i) => (
              <div key={c.time + i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {c.author.slice(0, 1)}
                  </span>
                  <span className="text-sm font-medium">{c.author}</span>
                  <span className="text-xs text-secondary-foreground">{c.time}</span>
                </div>
                <p className="whitespace-normal pl-8 text-sm">{c.text}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2 p-4">
            <Textarea
              placeholder="댓글을 입력하세요"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-20"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-secondary-foreground">@로 태그하면 알림이 갑니다</p>
              <Button
                size="sm"
                disabled={!draft.trim()}
                onClick={() => {
                  setComments((prev) => [...prev, { author: "김민준", time: "방금", text: draft.trim() }]);
                  setDraft("");
                }}
              >
                등록
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* ── 예정일 수정 모달 ── */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>예정일 수정</DialogTitle>
            <DialogDescription>
              두 값 모두 비워 둘 수 있습니다. 이 화면은 이 납품 제품 한 건만 수정합니다 — 같은
              호선의 다른 제품은 목록의 예정일 일괄 수정을 사용하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="d-due">납품 예정일</Label>
              <Input id="d-due" defaultValue="2027-03-01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-com">커미셔닝 예정일</Label>
              <Input id="d-com" defaultValue="2027-05-01" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setScheduleOpen(false)}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 도면 등록 모달 ── */}
      <Dialog open={drawingOpen} onOpenChange={setDrawingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>도면 등록</DialogTitle>
            <DialogDescription>
              선택한 타입의 새 버전을 올립니다. 도면 타입과 이름은 바꿀 수 없고, 버전은 자동
              부여됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                도면 타입 <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  {DRAWINGS.map((d) => (
                    <SelectItem key={d.type} value={d.type}>
                      {d.type} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>파일 첨부</Label>
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-secondary-foreground">
                <Paperclip className="size-4" /> 파일을 클릭하거나 드래그하여 업로드
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-memo">메모 (선택)</Label>
              <Textarea id="d-memo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawingOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setDrawingOpen(false)}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
