"use client";

// 계정 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세)
// 원천: hinas365 와이어프레임 wireframe_account_detail.html
//
// 와이어프레임 대조 메모
// - 헤더: ← 계정 목록 / ○○해운 · 계약 3건 · 계약 호선 8척 / [계정 삭제]
// - 좌: 계정 정보 카드(✏ 수정 모달) + 담당자 카드(+추가 폼) / 본문: 계약 목록 표(+계약 생성)
// - 우측 댓글 도킹 패널 (S3 패턴 — 접으면 헤더 ghost 버튼)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Info, MessageSquare, Pencil, Plus } from "lucide-react";

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
import { Separator } from "@ds/ui/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
import { Textarea } from "@ds/ui/ui/textarea";

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
import { CommentsRail } from "../../../_detail/comments-rail";

const BASE = "/gallery/sales365";

const MANAGERS = [
  { name: "김철수", role: "구매팀 / 부장", phone: "010-1234-5678", email: "cskim@shipping.com" },
  { name: "이영희", role: "기술팀 / 차장", phone: "010-9876-5432", email: "yhlee@shipping.com" },
];

const CONTRACTS = [
  { code: "C-2026-001", name: "○○해운 Navi + SVM 구독 5척", shipType: "Container", product: "Enterprise", date: "2026-01-15" },
  { code: "C-2026-031", name: "○○해운 Cloud 구독", shipType: "Container", product: "Cloud", date: "2026-05-10" },
  { code: "C-2024-019", name: "○○해운 SVM 3척 (개조)", shipType: "Bulk Carrier", product: "Safety Around", date: "2024-02-28" },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 와이어프레임 AUDIT 이식
const AUDIT: AuditEntry[] = [
  {
    at: "2026-05-14 15:02",
    action: "U",
    actor: "한소영",
    fields: [{ label: "계정 이름", from: "○○해운(주)", to: "○○해운" }],
  },
  {
    at: "2025-09-03 11:37",
    action: "U",
    actor: "한소영",
    fields: [{ label: "국가", from: "대한민국", to: "싱가포르" }],
  },
  {
    at: "2024-02-01 09:00",
    action: "C",
    actor: "한소영",
    fields: [{ label: "계정명", from: null, to: "○○해운" }],
  },
];

export default function Sales365AccountDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [editOpen, setEditOpen] = React.useState(false);
  const [addManager, setAddManager] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState([
    { author: "이수진", time: "2026-08-18 09:40", text: "연락처에 대한 내용도 여기에 적습니다" },
  ]);
  const [draft, setDraft] = React.useState("");

  return (
    <div className="flex min-h-0 flex-1 items-stretch gap-6">
      <div className="min-w-0 flex-1 space-y-6">
        {/* ── 페이지 헤더 ── */}
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-secondary-foreground">
            <Link href={`${BASE}/accounts`}>
              <ArrowLeft className="size-4" /> 계정 목록
            </Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold">○○해운</h1>
              <p className="text-sm text-secondary-foreground">계약 3건 · 계약 호선 8척</p>
            </div>
            <div className="flex items-center gap-2">
              <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
              {!commentsOpen && (
                <Button variant="ghost" onClick={() => setCommentsOpen(true)}>
                  <MessageSquare className="size-4" /> 댓글 ({comments.length})
                  <ChevronRight className="size-4" />
                </Button>
              )}
              <Button variant="destructive-outline" size="sm" className="rounded-sm">
                계정 삭제
              </Button>
            </div>
          </div>
        </div>

        {view === "loading" && <BlockSkeleton />}
        {view === "progress" && (
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <Progress value={62} className="flex-1" />
              <span className="font-mono text-sm text-secondary-foreground">62%</span>
            </div>
            <p className="text-sm text-secondary-foreground">계정 정보를 불러오는 중입니다…</p>
          </div>
        )}

        {view === "error" && (
          <ErrorState
            title="계정 정보를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {view === "empty" && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>계정을 찾을 수 없습니다.</EmptyTitle>
              <EmptyDescription>삭제되었거나 접근 권한이 없는 계정입니다.</EmptyDescription>
            </EmptyHeader>
            <Button asChild variant="outline">
              <Link href={`${BASE}/accounts`}>계정 목록으로</Link>
            </Button>
          </Empty>
        )}

        {view === "default" && (
          <div className="flex flex-col items-start gap-4 xl:flex-row">
            {/* ── 좌측 패널: 계정 정보 + 담당자 ── */}
            <aside className="w-full shrink-0 space-y-4 xl:w-80">
              <section className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-secondary-foreground">계정 정보</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" /> 수정
                  </Button>
                </div>
                <dl className="mt-3 space-y-3 text-sm">
                  {(
                    [
                      ["이름", "○○해운"],
                      ["계정 유형", "선사"],
                      ["국가", "대한민국"],
                      ["사업자등록번호", "123-45-67890"],
                      ["티어", "Tier 1"],
                      ["메모", "—"],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="flex items-baseline">
                      <dt className="w-28 shrink-0 text-secondary-foreground">{k}</dt>
                      <dd className="min-w-0">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-secondary-foreground">담당자</h2>
                  <Button variant="ghost" size="sm" onClick={() => setAddManager((v) => !v)}>
                    <Plus className="size-4" /> 담당자 추가
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  {MANAGERS.map((m) => (
                    <div key={m.email} className="text-sm">
                      <p className="font-medium">
                        {m.name} <span className="font-normal text-secondary-foreground">· {m.role}</span>
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {m.phone} · {m.email}
                      </p>
                    </div>
                  ))}
                  {addManager && (
                    <div className="space-y-2 rounded-md border border-dashed p-3">
                      <Input placeholder="이름 *" aria-label="담당자 이름" />
                      <Input placeholder="직책 / 직급" aria-label="담당자 직책" />
                      <Input placeholder="전화번호" aria-label="담당자 전화번호" />
                      <Input placeholder="이메일" aria-label="담당자 이메일" />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <Button variant="outline" size="sm" onClick={() => setAddManager(false)}>
                          취소
                        </Button>
                        <Button size="sm" onClick={() => setAddManager(false)}>
                          추가
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </aside>

            {/* ── 본문: 계약 목록 ── */}
            <section className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">계약 목록</h2>
                <Button asChild size="sm">
                  <Link href={`${BASE}/contracts/new`}>
                    <Plus className="size-4" /> 계약 생성
                  </Link>
                </Button>
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
          </div>
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

      {/* ── 계정 수정 모달 ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>계정 수정</DialogTitle>
            <DialogDescription>계정 기본 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-name">계정명</Label>
              <Input id="e-name" defaultValue="○○해운" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-brn">사업자등록번호</Label>
                <Input id="e-brn" defaultValue="123-45-67890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-tier">티어</Label>
                <Input id="e-tier" defaultValue="Tier 1" />
              </div>
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

      {/* ── 변경 이력 — 공통 AuditLog 시안 ── */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-secondary-foreground">변경 이력</h2>
        <AuditLog subject="계정 · ○○해운" entries={AUDIT} />
      </section>

      {/* ── 댓글 — 공통 CommentsRail 시안 ── */}
      <CommentsRail
        subjectHint="계정·담당자에 대한 내용도 여기에 적습니다"
        initial={[
          {
            author: "한소영",
            team: "솔루션",
            at: "2026-05-14 15:05",
            body: "@김민준 법인명 변경 반영했습니다 — 계약서 표기와 대조 확인 부탁드려요.",
          },
        ]}
      />
    </div>
  );
}
