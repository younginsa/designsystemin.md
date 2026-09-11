"use client";

// 계정 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세 · Jira형 상세 템플릿 롤아웃 2번째)
// 원천: hinas365 와이어프레임 wireframe_account_detail.html
//
// 재제작(2026-09-08) — 계약 상세(파일럿, 2026-08-28 확정)와 같은 골격:
// - 루트 max-w-7xl · 헤더는 타이틀 단독(메타는 우측 Details 패널 소유) · 우측 액션 [계정 삭제]
// - 본문 컬럼: 계약 목록 → Activity [댓글 | 변경 이력] 탭(pt-16 여백으로 구분)
// - 우측 sticky 레일: 계정 정보(✏ 수정 모달) · 담당자(+ 추가 폼) · 요약(계약 N건 · 계약 호선 N척 앵커)
// - 종전 구조 폐기: 루트 가로 flex에 변경 이력·CommentsRail이 형제로 얹혀 본문 컬럼이 눌려 깨졌고(2026-08-26
//   공통 시안 이식 때 중첩 오류), 댓글 도킹 패널과 CommentsRail이 이중으로 있었다
//
// 와이어프레임 대조 메모
// - 헤더: 대양해운 · 계약 3건 · 계약 호선 8척 / [계정 삭제] — 메타 2개는 레일 요약 패널로
// - 계정 정보 카드(✏ 수정 모달) + 담당자 카드(+추가 폼) → 레일 / 계약 목록 표(+계약 생성) → 본문
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

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

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
// 사람 요소 잠금(2026-09-04): 댓글 작성자 = DS Avatar sm(이니셜) — _detail/person 공유
import { PersonAvatar } from "../../../_detail/person";
// 계약명 조립 규칙(2026-09-09) — 샘플은 패키지 + 척수로 적는다
import { contractName, itemFromPackage } from "../../../_detail/contract-name";

const BASE = "/gallery/sales365";
const cn = (date: string, customer: string, pkg: string, count: number) =>
  contractName(date, customer, [itemFromPackage(pkg, count)]);

const ACCOUNT = {
  name: "대양해운",
  type: "선사",
  country: "대한민국",
  brn: "123-45-67890",
  tier: "Tier 1",
  // 메모 필드 제거(2026-09-09 디자이너 확정) — 등록 모달과 함께
  vessels: 8,
};

const MANAGERS = [
  { name: "김철수", role: "구매팀 / 부장", phone: "010-1234-5678", email: "cskim@shipping.com" },
  { name: "이영희", role: "기술팀 / 차장", phone: "010-9876-5432", email: "yhlee@shipping.com" },
];

const CONTRACTS = [
  { code: "C-2026-001", name: cn("2026-01-15", "대양해운", "Enterprise", 5), shipType: "Container", product: "Enterprise", date: "2026-01-15" },
  { code: "C-2026-031", name: cn("2026-05-10", "대양해운", "Cloud", 2), shipType: "Container", product: "Cloud", date: "2026-05-10" },
  { code: "C-2024-019", name: cn("2024-02-28", "대양해운", "Safety Around", 3), shipType: "Bulk Carrier", product: "Safety Around", date: "2024-02-28" },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 와이어프레임 AUDIT 이식
// 병합 변경 이력(2026-09-10): domain = 이 페이지 섹션(계정 정보 · 담당자 · 계약).
// 담당자·계약 항목은 이 화면의 MANAGERS·CONTRACTS와 맞춘다
const AUDIT_DOMAINS = ["계정 정보", "담당자", "계약"];
const AUDIT: AuditEntry[] = [
  { at: "2026-06-02 14:10", domain: "담당자", action: "담당자 추가", tone: "add", actor: "김영업", lines: ["이영희 · 기술팀 / 차장", "010-9876-5432 · yhlee@shipping.com"] },
  {
    at: "2026-05-14 15:02",
    domain: "계정 정보",
    action: "계정 정보 수정",
    tone: "modify",
    actor: "한소영",
    fields: [{ label: "계정 이름", from: "대양해운(주)", to: "대양해운" }],
  },
  { at: "2026-05-10 11:00", domain: "계약", action: "계약 등록", tone: "add", actor: "홍길동", lines: [`C-2026-031 · ${cn("2026-05-10", "대양해운", "Cloud", 2)}`] },
  { at: "2026-01-15 10:00", domain: "계약", action: "계약 등록", tone: "add", actor: "김민준", lines: [`C-2026-001 · ${cn("2026-01-15", "대양해운", "Enterprise", 5)}`] },
  {
    at: "2025-09-03 11:37",
    domain: "계정 정보",
    action: "계정 정보 수정",
    tone: "modify",
    actor: "한소영",
    fields: [{ label: "국가", from: "대한민국", to: "싱가포르" }],
  },
  { at: "2024-03-01 10:20", domain: "담당자", action: "담당자 추가", tone: "add", actor: "김영업", lines: ["김철수 · 구매팀 / 부장", "010-1234-5678 · cskim@shipping.com"] },
  {
    at: "2024-02-01 09:00",
    domain: "계정 정보",
    action: "계정 생성",
    tone: "create",
    actor: "한소영",
    badge: "공통 컬럼",
    fields: [{ label: "계정명", from: null, to: "대양해운" }],
  },
];

export default function Sales365AccountDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [editOpen, setEditOpen] = React.useState(false);
  const [addManager, setAddManager] = React.useState(false);
  const [comments, setComments] = React.useState([
    {
      author: "한소영",
      time: "2026-05-14 15:05",
      text: "@김민준 법인명 변경 반영했습니다 — 계약서 표기와 대조 확인 부탁드려요.",
    },
  ]);
  const [draft, setDraft] = React.useState("");

  return (
    // Jira 문법: 콘텐츠 컬럼은 풀스크린에서도 max-width 캡(계약 상세와 동일 1280)
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── 페이지 헤더 — 타이틀 단독, 메타는 우측 Details 패널 소유 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-lg font-bold">{ACCOUNT.name}</h1>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          {/* 파괴적 액션 — 아웃라인 파괴형, CTA 순서 관례 */}
          <Button variant="destructive-outline" size="sm" className="rounded-sm">
            계정 삭제
          </Button>
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
        <div className="flex items-start gap-6">
          {/* ══ 본문 컬럼 — 계약 목록 → Activity ══ */}
          <div className="min-w-0 flex-1 space-y-16">
            <section id="contracts" className="scroll-mt-24 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">계약 목록 ({CONTRACTS.length})</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${BASE}/contracts/new`}>
                    <Plus className="size-4" /> 계약 생성
                  </Link>
                </Button>
              </div>
              {/* 가로 스크롤 없이 컬럼 폭에 맞춘다(2026-09-10 확정): table-fixed + 좁은 열 폭 선언, 계약명이 나머지를 받아
                  줄바꿈(말줄임 없음). 유저 상세 담당 계약 표와 같은 문법 */}
              <Table className="table-fixed bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">코드</TableHead>
                    <TableHead>계약명</TableHead>
                    <TableHead className="w-32">선종</TableHead>
                    <TableHead className="w-40">상품</TableHead>
                    <TableHead className="w-32">계약일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTRACTS.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell className="whitespace-normal">
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
                  <AuditLog subject="계정 · 대양해운" entries={AUDIT} domains={AUDIT_DOMAINS} />
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* ══ 우측 Details 패널 — Jira 문법: 개요 KV가 스크롤 내내 고정 ══ */}
          {/* top-22 = 셸 상단바 h-16(64px) + 24px 여백 — top-6은 상단바 아래로 숨었다(2026-09-10, 상세 5종 공통) */}
          <aside className="sticky top-22 w-80 shrink-0 space-y-4 self-start">
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">계정 정보</h2>
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
              {/* 필드 순서 = 와이어프레임 계정 정보 카드 그대로 */}
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">이름</dt>
                  <dd className="min-w-0">{ACCOUNT.name}</dd>
                </div>
                {/* 배지 행이라 items-center — 목록의 계정 유형과 같은 배지 문법 */}
                <div className="flex items-center">
                  <dt className="w-28 shrink-0 text-secondary-foreground">계정 유형</dt>
                  <dd>
                    <Badge variant="secondary" className="font-normal">
                      {ACCOUNT.type}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">국가</dt>
                  <dd>{ACCOUNT.country}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">사업자등록번호</dt>
                  <dd className="font-mono">{ACCOUNT.brn}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">티어</dt>
                  <dd>{ACCOUNT.tier}</dd>
                </div>
              </dl>
            </section>

            {/* 담당자 — 와이어프레임 담당자 카드(+추가 폼) 그대로 레일로 */}
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">담당자</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-secondary-foreground"
                  onClick={() => setAddManager((v) => !v)}
                >
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

            {/* 요약 — 헤더 메타(계약 N건 · 계약 호선 N척)를 앵커·링크로. 계약 상세의 문서·청구 요약과 같은 문법 */}
            <section className="rounded-lg border bg-card p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center">
                  <dt className="w-28 shrink-0 text-secondary-foreground">계약</dt>
                  <dd>
                    <a href="#contracts" className="text-primary hover:underline">
                      {CONTRACTS.length}건
                    </a>
                  </dd>
                </div>
                <div className="flex items-center">
                  <dt className="w-28 shrink-0 text-secondary-foreground">계약 호선</dt>
                  <dd>
                    <Link href={`${BASE}/vessels`} className="text-primary hover:underline">
                      {ACCOUNT.vessels}척
                    </Link>
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      )}

      {/* ── 계정 수정 모달 — 계정 등록 모달 문법(라벨 위 필드 · grid-cols-2) ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>계정 수정</DialogTitle>
            <DialogDescription>계정 기본 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-name">계정명</Label>
              <Input id="e-name" defaultValue={ACCOUNT.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-brn">사업자등록번호</Label>
                <Input id="e-brn" defaultValue={ACCOUNT.brn} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-tier">티어</Label>
                <Input id="e-tier" defaultValue={ACCOUNT.tier} />
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
    </div>
  );
}
