"use client";

// S3 계약 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세 본문 · Jira 레이아웃 개편 파일럿)
// 원천: hinas365 와이어프레임 wireframe_s3_contract_detail.html
// 개편(2026-08-28 디자이너 확정 — Jira 이슈 뷰 문법):
// - 페이지 탭 폐기 → 단일 스크롤. 콘텐츠 컬럼은 와이드에서도 max-width 캡(max-w-6xl)
// - 개요(계약 정보 KV) → 우측 Details 패널(sticky) — 스크롤 중에도 항상 보인다
// - 계약 항목 + 배정 호선 병합 — 슬롯 테이블이 호선 링크·선명·인도 예정일까지 가진다
// - 하단 Activity 섹션: [댓글 | 변경 이력] 탭 스위치 (Jira Activity 문법)
// - 슬롯 상태 5종: 배정(가격) / 미입력(warning 도트) / 미배정(muted) / 취소(사유·해제)
// - 모달 2종: 계약 수정 / 호선 배정(검색 + 기존 호선 + 신규 생성) — 현행 유지
//
// 어휘 게이트 메모: 전부 채택분 조합. Activity·Details 패널은 반복 확정 시 프리셋 승격 후보

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { Input } from "@ds/ui/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";
import { Label } from "@ds/ui/ui/label";
import { Progress } from "@ds/ui/ui/progress";
import { RadioGroup, RadioGroupItem } from "@ds/ui/ui/radio-group";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Textarea } from "@ds/ui/ui/textarea";

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";

const BASE = "/gallery/sales365";

const CONTRACT = {
  id: "C-2026-001",
  name: "○○해운 Navi + SVM 구독 5척",
  customer: "○○해운",
  ctype: "신조",
  date: "2026-01-15",
  owner: "홍길동",
  memo: "—",
};

const ITEM = {
  code: "C-2026-001-01",
  pkg: "Enterprise",
  name: "Control + SVM 구독 5척",
  assigned: 4,
  total: 5,
  subs: [
    ["Control", "36개월"],
    ["SVM", "12개월"],
    ["설치용역", "구독 없음"],
  ] as const,
};

type SlotState = "assigned" | "missing" | "unassigned" | "cancelled";
// 배정 호선 데이터 병합 — 슬롯이 인도 예정일까지 가진다(구 배정 호선 탭 흡수)
const SLOTS: {
  no: number;
  hull: string | null;
  ship: string | null;
  price: string | null;
  deliveryOn: string | null;
  state: SlotState;
  note?: string;
}[] = [
  { no: 1, hull: "Hull 1001", ship: "MV EXAMPLE", price: "USD 1,200,000", deliveryOn: "2027-06-01", state: "assigned" },
  { no: 2, hull: "Hull 1002", ship: "MV PIONEER", price: "USD 1,200,000", deliveryOn: "2027-09-01", state: "assigned" },
  { no: 3, hull: "Hull 1003", ship: null, price: null, deliveryOn: "2027-12-01", state: "missing" },
  { no: 4, hull: null, ship: null, price: null, deliveryOn: null, state: "unassigned" },
  {
    no: 5,
    hull: "Hull 1004",
    ship: null,
    price: null,
    deliveryOn: null,
    state: "cancelled",
    note: "취소 2026-04-01 · 발주처 사양 변경",
  },
];

const ASSIGN_CANDIDATES = ["Hull 1005 · 미정", "Hull 1006 · 미정", "HN-2026-020 · MV NEW DAWN"];

const COMMENTS: { author: string; time: string; text: string }[] = [
  {
    author: "이수진",
    time: "2026-08-19 10:12",
    text: "계약 항목 · 계약 항목 제품 · 슬롯에 대한 내용도 여기에 적습니다",
  },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 슬롯 상태 표기 — 도트+텍스트 규칙 (미입력=warning · 미배정=muted · 취소=destructive)
function SlotStatus({ state }: { state: SlotState }) {
  if (state === "missing")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="size-2 rounded-full bg-destructive" /> 미입력
      </span>
    );
  if (state === "unassigned")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="size-2 rounded-full bg-muted-foreground" /> 미배정
      </span>
    );
  if (state === "cancelled")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
        <span className="size-2 rounded-full bg-destructive" /> 취소
      </span>
    );
  return null;
}

// 변경 이력 — 와이어프레임 AUDIT 이식(대상 테이블 + 대상 ID 축)
const AUDIT: AuditEntry[] = [
  {
    at: "2026-08-20 14:32",
    action: "U",
    actor: "김민준",
    fields: [
      { label: "가격", from: "USD 1,200,000", to: "USD 1,350,000" },
      { label: "고객 계정", from: "○○해운", to: "○○해운 싱가포르" },
    ],
  },
  {
    at: "2026-06-11 09:05",
    action: "U",
    actor: "이수진",
    fields: [
      { label: "취소 여부", from: "정상", to: "취소됨" },
      { label: "취소 사유", from: "—", to: "발주처 사양 변경" },
    ],
  },
  {
    at: "2026-04-02 13:11",
    action: "U",
    actor: "김민준",
    fields: [
      { label: "계약 이름", from: "○○해운 Navi 구독 5척", to: "○○해운 Navi + SVM 구독 5척" },
    ],
  },
  {
    at: "2026-01-08 11:20",
    action: "C",
    actor: "김민준",
    fields: [{ label: "계약 코드", from: null, to: "C-2026-001" }],
  },
];

export default function Sales365ContractDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [editOpen, setEditOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [slotEdit, setSlotEdit] = React.useState(false);
  const [comments, setComments] = React.useState(COMMENTS);
  const [draft, setDraft] = React.useState("");

  return (
    // Jira 문법: 콘텐츠 컬럼은 풀스크린에서도 max-width 캡
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* 타이틀 단독 — 메타는 전부 우측 Details 패널 소유(2026-08-28 확정) */}
          <h1 className="text-lg font-bold">{CONTRACT.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          {/* 파괴적 액션 — 아웃라인 파괴형, CTA 순서 관례 */}
          <Button variant="destructive-outline" size="sm" className="rounded-sm">
            계약 취소
          </Button>
          <Button
            variant="destructive-outline"
            size="icon"
            className="size-8 rounded-sm"
            aria-label="계약 삭제"
          >
            <Trash2 className="size-4" />
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
          <p className="text-sm text-secondary-foreground">계약 정보를 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="계약 정보를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>계약을 찾을 수 없습니다.</EmptyTitle>
            <EmptyDescription>삭제되었거나 접근 권한이 없는 계약입니다.</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link href={`${BASE}/contracts`}>계약 목록으로</Link>
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <div className="flex items-start gap-6">
          {/* ══ 본문 컬럼 — 계약 항목(호선 병합) → Activity ══ */}
          <div className="min-w-0 flex-1 space-y-6">
            <section className="rounded-lg border bg-card">
              {/* 항목 헤더 */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                {/* 와이어프레임 분류 체계: 항목 코드 · 패키지 · 척수 (2026-08-28 확정) */}
                <div className="flex items-center gap-3">
                  <h2 className="font-mono font-medium">{ITEM.code}</h2>
                  <Badge variant="outline" className="border-primary text-primary">
                    {ITEM.pkg}
                  </Badge>
                  <span className="text-sm text-secondary-foreground">
                    척수 <span className="font-semibold text-foreground">{ITEM.assigned}</span> /{" "}
                    {ITEM.total}
                  </span>
                </div>
              </div>

              {/* 구독 조건 — 타이틀 행 아래 임베드된 아웃라인 패널(헤더 행 없음, 2026-08-28 확정) */}
              <div className="px-5 pt-4">
                <div className="overflow-hidden rounded-md border">
                  <Table variant="plain" className="bg-card">
                    <TableBody>
                      {ITEM.subs.map(([product, term]) => (
                        <TableRow key={product}>
                          <TableCell className="w-40 font-medium">{product}</TableCell>
                          <TableCell
                            className={term === "구독 없음" ? "text-secondary-foreground" : ""}
                          >
                            {term}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 슬롯 = 배정 호선 병합 테이블 — 호선 링크·선명·인도 예정일까지 한 표에 */}
              {/* pt-16(64px) — 구독 조건과 배정 호선 사이 호흡(2026-08-28 확정) */}
              <div className="space-y-2 px-5 pb-4 pt-16">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-secondary-foreground">배정 호선</h3>
                  {/* 카드 수정 문법(hinas365 계약 카드 승계): [수정] 토글 시에만 액션 노출.
                      CTA 페어 간격 = gap-1 통일(2026-08-28 확정) */}
                  <div className="flex items-center gap-1">
                    {/* 칩 스타일 보조 CTA(2026-08-28 확정) — 연회색 필드 · 라운드 풀 · 아이콘 없음 */}
                    {/* outline 보조 CTA(2026-08-28 확정) — 표준 rounded-md·hover 상속 */}
                    <Button variant="outline" size="sm">
                      슬롯 추가
                    </Button>
                    {slotEdit ? (
                      <Button variant="ghost" size="sm" onClick={() => setSlotEdit(false)}>
                        완료
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setSlotEdit(true)}>
                        수정
                      </Button>
                    )}
                  </div>
                </div>
                <Table className="bg-card">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">슬롯</TableHead>
                      <TableHead>호선</TableHead>
                      <TableHead className="w-32">인도 예정일</TableHead>
                      <TableHead className="w-36">가격</TableHead>
                      {slotEdit && <TableHead className="w-52">액션</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SLOTS.map((s) => (
                      <TableRow
                        key={s.no}
                        className={s.state === "cancelled" ? "opacity-60" : undefined}
                      >
                        <TableCell className="text-secondary-foreground">{s.no}번</TableCell>
                        <TableCell>
                          {s.hull ? (
                            <>
                              <Link
                                href={`${BASE}/vessels/detail`}
                                className="font-medium text-primary hover:underline"
                              >
                                {s.hull}
                              </Link>
                              {s.ship && (
                                <span className="text-secondary-foreground"> · {s.ship}</span>
                              )}
                              {s.state === "cancelled" && (
                                <div className="whitespace-normal pt-0.5 text-xs text-secondary-foreground">
                                  {s.note}
                                </div>
                              )}
                            </>
                          ) : (
                            <SlotStatus state={s.state} />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {s.deliveryOn ?? <span className="text-secondary-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {/* 미입력 = 가격 미입력(와이어프레임) — 호선이 아니라 이 열의 상태다 */}
                          {s.price ?? (s.state === "missing" ? (
                            <SlotStatus state="missing" />
                          ) : (
                            <span className="text-secondary-foreground">—</span>
                          ))}
                        </TableCell>
                        {slotEdit && (
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {s.state === "assigned" && (
                                <>
                                  <Button variant="ghost" size="sm">
                                    호선 대체
                                  </Button>
                                  <Button variant="destructive-outline" size="sm">
                                    슬롯 취소
                                  </Button>
                                </>
                              )}
                              {s.state === "missing" && (
                                <Button variant="outline" size="sm">
                                  입력
                                </Button>
                              )}
                              {s.state === "unassigned" && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                                    호선 배정
                                  </Button>
                                  <Button
                                    variant="destructive-ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label="슬롯 삭제"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </>
                              )}
                              {s.state === "cancelled" && (
                                <Button variant="ghost" size="sm">
                                  취소 해제
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 항목 파괴 액션 — 카드 하단(2026-08-28 확정): 상단 계약 액션과 시각 중복 해소 */}
              <div className="flex items-center justify-end gap-1 px-5 pb-4 pt-0">
                {/* 파괴 액션 위계: 취소 = ghost destructive(필터초기화 문법) · 삭제 = 아이콘(헤더 계약 삭제와 동형) */}
                <Button variant="destructive-ghost" size="sm">
                  계약 항목 취소
                </Button>
                <Button
                  variant="destructive-ghost"
                  size="icon"
                  className="size-8"
                  aria-label="계약 항목 삭제"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </section>

            <div>
              {/* [시안] contrast(블랙 필드) — 본문 레벨 생성 CTA. DS variant 반영 시 variant="contrast"로 교체 */}
              <Button className="bg-foreground text-background hover:bg-foreground hover:opacity-90">
                <Plus className="size-4" /> 계약 항목 추가
              </Button>
            </div>

            {/* ══ Activity — Jira 문법: [댓글 | 변경 이력] 탭 스위치 ══ */}
            {/* Activity — 라벨 없이 여백(pt-16)으로 섹션 구분(2026-08-28 확정) */}
            <section className="pt-16">
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments">댓글 ({comments.length})</TabsTrigger>
                  <TabsTrigger value="audit">변경 이력</TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="mt-3 space-y-4">
                  {comments.map((c, i) => (
                    <div key={c.time + i} className="flex gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {c.author.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs text-secondary-foreground">
                          <span className="font-medium text-foreground">{c.author}</span> · {c.time}
                        </p>
                        <p className="whitespace-normal text-sm">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2.5 border-t pt-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      김
                    </span>
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
                  <AuditLog subject="계약 · C-2026-001" entries={AUDIT} />
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* ══ 우측 Details 패널 — Jira 문법: 개요 KV가 스크롤 내내 고정 ══ */}
          <aside className="sticky top-6 w-80 shrink-0 space-y-4 self-start">
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">계약 정보</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" /> 수정
                </Button>
              </div>
              {/* 필드 순서 = 와이어프레임 개요 카드 그대로 */}
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">계약명</dt>
                  <dd className="min-w-0">{CONTRACT.name}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">계약 번호</dt>
                  <dd className="font-mono">{CONTRACT.id}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">고객</dt>
                  <dd>
                    <Link
                      href={`${BASE}/accounts/detail`}
                      className="text-primary hover:underline"
                    >
                      {CONTRACT.customer} → 계정
                    </Link>
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">계약 유형</dt>
                  <dd>{CONTRACT.ctype}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">계약일</dt>
                  <dd>{CONTRACT.date}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">담당</dt>
                  <dd>{CONTRACT.owner}</dd>
                </div>
              </dl>
            </section>

          </aside>
        </div>
      )}

      {/* ── 계약 수정 모달 ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>계약 수정</DialogTitle>
            <DialogDescription>계약 기본 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">계약명</Label>
              <Input id="c-name" defaultValue={CONTRACT.name} />
            </div>
            <div className="space-y-2">
              <Label>계약 유형</Label>
              <Select defaultValue={CONTRACT.ctype}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="신조">신조</SelectItem>
                  <SelectItem value="개조">개조</SelectItem>
                </SelectContent>
              </Select>
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

      {/* ── 호선 배정 모달 (4번 슬롯) ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>호선 배정 — 4번 호선</DialogTitle>
            <DialogDescription>{ITEM.name} 항목</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <InputGroup variant="filled">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Hull · 호선명 검색" aria-label="호선 검색" />
            </InputGroup>
            <RadioGroup defaultValue={ASSIGN_CANDIDATES[0]} className="gap-1">
              {ASSIGN_CANDIDATES.map((c) => (
                <Label
                  key={c}
                  className="flex items-center gap-2 rounded-md px-2 py-2 font-normal hover:bg-accent"
                >
                  <RadioGroupItem value={c} /> {c}
                </Label>
              ))}
            </RadioGroup>
            <Button variant="outline" size="sm">
              <Plus className="size-4" /> 신규 호선 생성
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setAssignOpen(false)}>배정 확정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
