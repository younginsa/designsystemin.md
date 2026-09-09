"use client";

// 유저 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세 · Jira형 상세 템플릿 롤아웃 4번째)
// 원천: hinas365 와이어프레임 wireframe_user_detail.html
//
// 재제작(2026-09-08) — 계약 상세(파일럿, 2026-08-28 확정)와 같은 골격:
// - 루트 max-w-7xl · 헤더는 타이틀(아바타 + 이름 + 활성 도트) 단독 · 우측 액션 [비활성 처리]
// - 본문 컬럼: 담당 계약 (3) → Activity [댓글 | 변경 이력] 탭(pt-16 여백으로 구분)
// - 우측 sticky 레일: 유저 정보(✏ 수정 모달) · 요약(담당 계약 N건 앵커)
// - 종전 구조 폐기: ← 목록 링크(브레드크럼이 맡는다) · 헤더의 팀·이메일 줄(레일 KV 소유) · 헤더 수정 버튼(레일로)
//
// 와이어프레임 대조 메모
// - 헤더: 김민준(활성 도트) · 영업 · mj.kim@company.com / [✏ 수정][비활성 처리]
// - 유저 정보 dl + 담당 계약 표(담당은 기술영업·영업 팀 유저만) — 안내는 [i] 툴팁으로
// - 비활성 확인 모달: 담당자 지정·태그 후보 제외, 알림 중단, 기존 참조 유지 안내
// - 수정 모달: 이름·이메일 변경 시 과거 댓글·감사 로그 표기도 함께 변경 안내
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { Info, Pencil } from "lucide-react";

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

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
// 사람 요소 잠금(2026-09-04): 헤더 유저 = DS Avatar default(32) + 이름 · 댓글 작성자 = sm — _detail/person 공유
import { PersonAvatar } from "../../../_detail/person";

const BASE = "/gallery/sales365";

const USER = {
  name: "김민준",
  team: "영업",
  email: "mj.kim@company.com",
  createdOn: "2023-02-01",
};

const CONTRACTS = [
  { code: "C-2026-044", name: "2026-07-20-우진해운-Safety Forward-2척", shipType: "Container", product: "Safety Forward", date: "2026-07-20" },
  { code: "C-2026-031", name: "2026-05-10-대양해운-Cloud-2척", shipType: "Container", product: "Cloud", date: "2026-05-10" },
  { code: "C-2026-001", name: "2026-01-15-대양해운-Enterprise-5척", shipType: "Container", product: "Enterprise", date: "2026-01-15" },
];

const CONTRACT_NOTE = "계약 담당은 기술영업·영업 팀 유저만 맡습니다.";

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 유저 마스터(팀 이동·생성)
const AUDIT: AuditEntry[] = [
  {
    at: "2026-03-04 09:12",
    action: "U",
    actor: "한소영",
    fields: [{ label: "팀", from: "기술영업", to: "영업" }],
  },
  {
    at: "2023-02-01 10:00",
    action: "C",
    actor: "한소영",
    fields: [
      { label: "이름", from: null, to: "김민준" },
      { label: "이메일", from: null, to: "mj.kim@company.com" },
    ],
  },
];

export default function Sales365UserDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [active, setActive] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [comments, setComments] = React.useState<{ author: string; time: string; text: string }[]>([]);
  const [draft, setDraft] = React.useState("");

  return (
    // Jira 문법: 콘텐츠 컬럼은 풀스크린에서도 max-width 캡(계약 상세와 동일 1280)
    // TooltipProvider — 담당 계약 [i] 툴팁이 붙는다(DS Tooltip은 Provider를 품지 않는다)
    <TooltipProvider>
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── 페이지 헤더 — 타이틀(사람 표기 + 상태) 단독, 메타(팀·이메일)는 우측 Details 패널 소유 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PersonAvatar name={USER.name} size="default" />
          <h1 className="flex items-center gap-2 text-lg font-bold">
            {USER.name}
            {active ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-normal">
                <span className="size-2 rounded-full bg-success" /> 활성
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-normal text-secondary-foreground">
                <span className="size-2 rounded-full bg-muted-foreground" /> 비활성
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          {active ? (
            <Button
              variant="destructive-outline"
              size="sm"
              className="rounded-sm"
              onClick={() => setDeactivateOpen(true)}
            >
              비활성 처리
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setActive(true)}>
              활성화
            </Button>
          )}
        </div>
      </div>

      {view === "loading" && <BlockSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">유저 정보를 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="유저 정보를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>유저를 찾을 수 없습니다.</EmptyTitle>
            <EmptyDescription>삭제되었거나 접근 권한이 없는 유저입니다.</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link href={`${BASE}/users`}>유저 목록으로</Link>
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <div className="flex items-start gap-6">
          {/* ══ 본문 컬럼 — 담당 계약 → Activity ══ */}
          <div className="min-w-0 flex-1 space-y-16">
            <section id="contracts" className="scroll-mt-24 space-y-3">
              {/* 섹션 설명은 [i] 툴팁으로 — 계약 상세와 같은 문법(2026-09-08) */}
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-medium text-secondary-foreground">담당 계약 ({CONTRACTS.length})</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="담당 계약 설명">
                      <Info className="size-4 text-secondary-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{CONTRACT_NOTE}</TooltipContent>
                </Tooltip>
              </div>
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>계약명</TableHead>
                    <TableHead>선종</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead>계약일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTRACTS.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell>
                        <Link
                          href={`${BASE}/contracts/detail`}
                          className="font-medium text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>{c.shipType}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {c.product}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{c.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            {/* ══ Activity — Jira 문법: [댓글 | 변경 이력] 탭 스위치. 라벨 없이 여백(pt-16)으로 구분 ══ */}
            <section className="pt-16">
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments">댓글 ({comments.length})</TabsTrigger>
                  <TabsTrigger value="audit">변경 이력</TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="mt-3 space-y-4">
                  {comments.length === 0 && (
                    <p className="text-sm text-secondary-foreground">아직 댓글이 없습니다.</p>
                  )}
                  {comments.map((c, i) => (
                    <div key={c.time + i} className="flex gap-2.5">
                      <PersonAvatar name={c.author} />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs text-secondary-foreground">
                          <span className="font-medium text-foreground">{c.author}</span> · {c.time}
                        </p>
                        <p className="whitespace-normal text-sm">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2.5 border-t pt-4">
                    <PersonAvatar name="김민준" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Textarea
                        placeholder="댓글을 입력하세요 — @로 유저 태그"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="min-h-20"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-secondary-foreground">
                          태그된 유저에게 알림이 갑니다
                        </p>
                        <Button
                          size="sm"
                          disabled={!draft.trim()}
                          onClick={() => {
                            setComments((prev) => [
                              ...prev,
                              { author: "김민준", time: "방금", text: draft.trim() },
                            ]);
                            setDraft("");
                          }}
                        >
                          등록
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="mt-3">
                  <AuditLog subject="유저 · 김민준" entries={AUDIT} />
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* ══ 우측 Details 패널 — Jira 문법: 개요 KV가 스크롤 내내 고정 ══ */}
          <aside className="sticky top-6 w-80 shrink-0 space-y-4 self-start">
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">유저 정보</h2>
                {/* 수정 = 저강조 ghost(text-secondary-foreground) — 4개 상세 페이지 공통(2026-09-08 확정) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-secondary-foreground"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-4" /> 수정
                </Button>
              </div>
              {/* 필드 순서 = 와이어프레임 유저 정보 dl 그대로 */}
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">이름</dt>
                  <dd>{USER.name}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">팀</dt>
                  <dd>{USER.team}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">이메일</dt>
                  <dd className="min-w-0 break-all">{USER.email}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="w-28 shrink-0 text-secondary-foreground">활성 여부</dt>
                  <dd className="inline-flex items-center gap-1.5">
                    <span className={"size-2 rounded-full " + (active ? "bg-success" : "bg-muted-foreground")} />
                    {active ? "활성" : "비활성"}
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">등록일</dt>
                  <dd className="font-mono">{USER.createdOn}</dd>
                </div>
              </dl>
            </section>

            {/* 요약 — 본문 섹션으로 가는 앵커. 계약 상세의 문서·청구 요약과 같은 문법 */}
            <section className="rounded-lg border bg-card p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center">
                  <dt className="w-28 shrink-0 text-secondary-foreground">담당 계약</dt>
                  <dd>
                    <a href="#contracts" className="text-primary hover:underline">
                      {CONTRACTS.length}건
                    </a>
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      )}

      {/* ── 유저 수정 모달 ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>유저 수정</DialogTitle>
            <DialogDescription>
              이름·이메일을 바꾸면 과거 댓글·감사 로그의 표기도 함께 바뀝니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ue-name">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input id="ue-name" defaultValue={USER.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ue-team">팀</Label>
              <Input id="ue-team" defaultValue={USER.team} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ue-email">이메일</Label>
              <Input id="ue-email" defaultValue={USER.email} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setEditOpen(false)}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 비활성 확인 모달 ── */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>김민준 님을 비활성 처리합니다.</DialogTitle>
            <DialogDescription>담당 중인 계약 3건이 있습니다.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 rounded-md bg-muted p-3 text-sm text-secondary-foreground">
            <li>· 담당자 지정·댓글 태그 후보에서 제외됩니다</li>
            <li>· 알림을 받지 않습니다</li>
            <li>· 기존 참조(과거 댓글, 감사 로그, 담당 계약)는 유지됩니다</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setActive(false);
                setDeactivateOpen(false);
              }}
            >
              비활성 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
