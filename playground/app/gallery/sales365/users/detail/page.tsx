"use client";

// 유저 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세)
// 원천: hinas365 와이어프레임 wireframe_user_detail.html
//
// 와이어프레임 대조 메모
// - 헤더: ← 유저 목록 / 김민준(활성 도트) · 영업 · mj.kim@company.com / [✏ 수정][비활성 처리]
// - 유저 정보 dl + 담당 계약 표(담당은 기술영업·영업 팀 유저만)
// - 비활성 확인 모달: 담당자 지정·태그 후보 제외, 알림 중단, 기존 참조 유지 안내
// - 수정 모달: 이름·이메일 변경 시 과거 댓글·감사 로그 표기도 함께 변경 안내
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, Info, Pencil } from "lucide-react";

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

const BASE = "/generated/sales365";

const CONTRACTS = [
  { code: "C-2026-044", name: "☆☆해운 Navi 2척", shipType: "Container", product: "Safety Forward", date: "2026-07-20" },
  { code: "C-2026-031", name: "○○해운 Cloud 구독", shipType: "Container", product: "Cloud", date: "2026-05-10" },
  { code: "C-2026-001", name: "○○해운 Navi 5척", shipType: "Container", product: "Enterprise", date: "2026-01-15" },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365UserDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [active, setActive] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-secondary-foreground">
          <Link href={`${BASE}/users`}>
            <ArrowLeft className="size-4" /> 유저 목록
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              김민준
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
            <p className="text-sm text-secondary-foreground">영업 · mj.kim@company.com</p>
          </div>
          <div className="flex items-center gap-2">
            <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> 수정
            </Button>
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
        <>
          <section className="max-w-xl rounded-lg border bg-card p-5">
            <h2 className="text-sm font-medium text-secondary-foreground">유저 정보</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {(
                [
                  ["이름", "김민준"],
                  ["팀", "영업"],
                  ["이메일", "mj.kim@company.com"],
                  ["활성 여부", active ? "활성" : "비활성"],
                  ["등록일", "2023-02-01"],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">{k}</dt>
                  <dd className="min-w-0">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="space-y-2">
            <div>
              <h2 className="text-sm font-medium text-secondary-foreground">담당 계약 3건</h2>
              <p className="text-xs text-secondary-foreground">
                계약 담당은 기술영업·영업 팀 유저만 맡습니다.
              </p>
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
        </>
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
              <Input id="ue-name" defaultValue="김민준" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ue-team">팀</Label>
              <Input id="ue-team" defaultValue="영업" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ue-email">이메일</Label>
              <Input id="ue-email" defaultValue="mj.kim@company.com" />
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
  );
}
