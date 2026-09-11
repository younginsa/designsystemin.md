"use client";

// S7 계약 호선 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세 · Jira형 상세 템플릿 롤아웃 5번째)
// 원천: hinas365 와이어프레임 wireframe_s7.html
//
// 재제작(2026-09-08) — 계약 상세(파일럿, 2026-08-28 확정)와 같은 골격:
// - 루트 max-w-7xl · 헤더는 타이틀(Hull · 선명) 단독(메타 IMO·선종·선급·참여 계약은 우측 Details 패널 소유)
// - 페이지 탭(제원/구독/계약 이력/납품 제품/변경 이력) 폐기 → 단일 스크롤 섹션:
//   제원 → 구독 → 계약 이력 (3) → 납품 제품 (5) → Activity [댓글 | 변경 이력] 탭
// - 우측 sticky 레일: 호선 정보(식별자·당사자·기본 정보 합본, ✏ 수정) · 참여 계약 (3)
//   선박 제원·전자장비는 행이 많아(14) 레일이 뷰포트를 넘기므로 본문 「제원」 섹션의 2열 패널로
// - 섹션 설명(중복 배정 불가·자동 생성 안내)은 [i] 툴팁 — 계약 상세와 같은 문법
// - 종전 CommentsRail 폐기 — Activity 탭의 댓글로 통일
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Info, Pencil, TriangleAlert } from "lucide-react";

import { Alert, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Checkbox } from "@ds/ui/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
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
// 이행 종류 표기 잠금(2026-09-07 · 5종 2026-09-09) — 4곳 공유
import { DeliveryType } from "../../../_detail/delivery-type";
// 계약 항목명 조립 규칙(2026-09-09)
import { itemFromPackage, itemName } from "../../../_detail/contract-name";
// 미입력 표기 잠금 — 공용 부품(2026-09-08). 상세는 값을 채우는 면이라 미입력 표기
import { MissingMark } from "../../../_detail/missing-mark";
// 사람 요소 잠금(2026-09-04): 댓글 작성자 = DS Avatar sm(이니셜) — _detail/person 공유
import { PersonAvatar } from "../../../_detail/person";
import { SubscriptionsTab } from "./subscriptions-tab";

const BASE = "/gallery/sales365";

// 2열 KV 패널 — 본문 「제원」 섹션용(행이 많은 제원·전자장비)
function SpecPanel({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline">
            <dt className="w-32 shrink-0 text-secondary-foreground">{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// 참여 계약 (3) — 레일 패널 + 계약 이력 표가 같은 원천을 본다
// 계약 항목명은 조립 규칙(2026-09-09): "{제품 이행단축}, … N척"
const CONTRACT_HISTORY: { contract: string; item: string; cancelled: boolean; note?: string }[] = [
  { contract: "C-2026-001 대양해운", item: itemName(itemFromPackage("Enterprise", 5)), cancelled: false },
  { contract: "C-2026-017 서해해운", item: itemName(itemFromPackage("Safety Forward", 3)), cancelled: true, note: "취소 2026-04-01 · 발주처 사양 변경" },
  { contract: "C-2025-003 대양해운", item: itemName(itemFromPackage("Smart Standard", 3)), cancelled: false },
];

// 납품 제품 (5)
const DELIVERIES: { product: string; delivery: string; contract: string; slot: string; dueOn: string | null; commissioningOn: string | null }[] = [
  { product: "Control", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", slot: "C-2026-001-01 · 1호선 슬롯", dueOn: "2027-03-01", commissioningOn: "2027-05-01" },
  { product: "SVM", delivery: "제품 신규 납부 + 구독", contract: "C-2026-001", slot: "C-2026-001-01 · 1호선 슬롯", dueOn: "2027-03-01", commissioningOn: null },
  { product: "Cloud", delivery: "구독 갱신·신규 전환", contract: "C-2026-001", slot: "C-2026-001-01 · 1호선 슬롯", dueOn: null, commissioningOn: null },
  { product: "Navigation", delivery: "제품 신규 납부", contract: "C-2026-017", slot: "C-2026-017-01 · 2호선 슬롯", dueOn: "2026-05-01", commissioningOn: null },
  { product: "Control", delivery: "구독 갱신·신규 전환", contract: "C-2025-003", slot: "C-2025-003-01 · 1호선 슬롯", dueOn: "2025-10-01", commissioningOn: "2025-10-20" },
];

// 섹션 설명 — [i] 툴팁 원문(와이어프레임)
const HISTORY_NOTE =
  "같은 계약 항목 안에서 이 호선을 중복 배정할 수 없습니다. 취소된 슬롯도 중복 검사 대상입니다 — 재투입 시 취소를 해제하세요.";
const DELIVERY_NOTE =
  "이 호선에 걸린 이행 건입니다. 납품 제품은 호선 배정 시 자동 생성되므로 여기서 직접 추가·삭제할 수 없고, 납품·커미셔닝 예정일과 도면을 관리합니다. 예정일은 호선이 아니라 제품 단위이므로 같은 호선이어도 값이 갈립니다.";

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 와이어프레임 AUDIT 이식(계약 호선은 마스터성 데이터 — cross 부연)
// 병합 변경 이력(2026-09-10): domain = 이 페이지 섹션(호선 정보 · 구독 · 계약 이력 · 납품 제품).
// 항목은 이 화면 데이터와 맞춘다 — C-2026-001 1번 슬롯 배정, C-2026-017 슬롯 취소(2026-04-01), 구독 탭의 중단·조기 종료
const AUDIT_DOMAINS = ["호선 정보", "구독", "계약 이력", "납품 제품"];
const AUDIT: AuditEntry[] = [
  { at: "2026-08-01 09:00", domain: "구독", action: "구독 중단", tone: "modify", actor: "이수진", lines: ["Navigation · C-2025-004-01", "중단 시작 2026-08-01 · 재개 시 연장 여부 선택"] },
  {
    at: "2026-07-30 16:44",
    domain: "호선 정보",
    action: "호선 정보 수정",
    tone: "modify",
    actor: "박준혁",
    cross:
      "이 호선을 참조하는 계약 3건에 함께 반영됩니다 — 계약 호선은 여러 계약이 참조하는 마스터성 데이터라 한 번의 수정이 계약 경계를 넘어 보입니다",
    fields: [
      { label: "선명", from: "— (미입력)", to: "MV EXAMPLE" },
      { label: "인도 예정일", from: "2027-05-01", to: "2027-07-15" },
    ],
  },
  { at: "2026-07-15 11:20", domain: "납품 제품", action: "예정일 수정", tone: "modify", actor: "최다혜", lines: ["Control · C-2026-001-01"], fields: [{ label: "납품 예정일", from: "2027-02-01", to: "2027-03-01" }] },
  { at: "2026-05-31 17:00", domain: "구독", action: "조기 종료", tone: "remove", actor: "이수진", lines: ["Cloud · C-2024-016-01", "만료일 2027-01-31 → 2026-05-31"], reason: "선박 매각" },
  { at: "2026-04-01 17:12", domain: "계약 이력", action: "슬롯 취소", tone: "remove", actor: "이수영", lines: ["C-2026-017-01 2번 · 서해해운"], reason: "발주처 사양 변경" },
  {
    at: "2026-03-02 10:12",
    domain: "호선 정보",
    action: "호선 정보 수정",
    tone: "modify",
    actor: "박준혁",
    fields: [{ label: "주선급", from: "KR 한국선급", to: "DNV" }],
  },
  { at: "2026-01-20 10:30", domain: "납품 제품", action: "납품 제품 자동 생성", tone: "add", actor: "김민준", lines: ["Control · SVM · Cloud (C-2026-001-01)", "호선 배정 시 자동 생성 — 직접 만들거나 지울 수 없다"] },
  { at: "2026-01-20 10:30", domain: "계약 이력", action: "호선 배정", tone: "add", actor: "김민준", lines: ["C-2026-001-01 1번 ← Hull 1001"] },
  {
    at: "2025-11-19 13:58",
    domain: "호선 정보",
    action: "호선 생성",
    tone: "create",
    actor: "최다혜",
    badge: "공통 컬럼",
    fields: [{ label: "Hull Number", from: null, to: "Hull 1001" }],
  },
];

export default function Sales365VesselDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [comments, setComments] = React.useState([
    {
      author: "박준혁",
      time: "2026-07-30 16:50",
      text: "@김민준 선명·인도 예정일 갱신했습니다. 주선급 DNV 전환 건도 확인 부탁드려요.",
    },
  ]);
  const [draft, setDraft] = React.useState("");

  return (
    // Jira 문법: 콘텐츠 컬럼은 풀스크린에서도 max-width 캡(계약 상세와 동일 1280)
    // TooltipProvider — 섹션 [i] 툴팁이 붙는다(DS Tooltip은 Provider를 품지 않는다)
    <TooltipProvider>
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── 페이지 헤더 — 타이틀 단독, 메타는 우측 Details 패널 소유 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-lg font-bold">
          Hull 1001 <span className="text-secondary-foreground">· MV EXAMPLE</span>
        </h1>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          <Button variant="destructive-outline" size="sm" className="rounded-sm">
            호선 삭제
          </Button>
        </div>
      </div>

      {/* 미입력 식별자 경고 — 주의 레벨. 배너 표준 양식(취소 배너와 동일): variant destructive + /5 틴트 */}
      <Alert variant="destructive" className="border-0 bg-destructive/5">
        <TriangleAlert className="size-4" />
        <AlertTitle className="font-semibold text-foreground">미입력 식별자 — IMO · Ship Name</AlertTitle>
        <div className="col-start-2 text-sm text-secondary-foreground">
          선박 명명·등록 후 호선 정보에서 채워주세요.
        </div>
      </Alert>

      {view === "loading" && <BlockSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">호선 정보를 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="호선 정보를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>호선을 찾을 수 없습니다.</EmptyTitle>
            <EmptyDescription>삭제되었거나 접근 권한이 없는 호선입니다.</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link href={`${BASE}/vessels`}>계약 호선 목록으로</Link>
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <div className="flex items-start gap-6">
          {/* ══ 본문 컬럼 — 제원 → 구독 → 계약 이력 → 납품 제품 → Activity ══ */}
          <div className="min-w-0 flex-1 space-y-16">
            {/* 제원 — 행이 많은 KV는 본문 2열 패널(레일 sticky 보호) */}
            <section id="specs" className="scroll-mt-24 space-y-3">
              <h2 className="text-sm font-medium text-secondary-foreground">제원</h2>
              <div className="space-y-4">
                <SpecPanel
                  title="선박 제원"
                  rows={[
                    ["GT", "50,000 t"],
                    ["DWT", "65,000 t"],
                    ["LOA", "230.0 m"],
                    ["LBP", "220.0 m"],
                    ["Beam", "32.2 m"],
                    ["Depth", "18.5 m"],
                    ["Scantling Draft", "13.5 m"],
                    ["엔진 수", "2기"],
                    ["엔진 타입", "MAN B&W"],
                    ["UR E27 적용", "예"],
                  ]}
                />
                <SpecPanel
                  title="전자장비·메이커"
                  rows={[
                    ["AMS Maker", "Raytheon"],
                    ["BMS Maker", "Kongsberg"],
                    ["ECDIS Maker", "JRC"],
                    ["Auto Pilot Maker", "Furuno"],
                  ]}
                />
              </div>
            </section>

            {/* 구독 — S11 만료 임박 목록이 링크하는 주 관리 화면 */}
            <section id="subscriptions" className="scroll-mt-24 space-y-3">
              <h2 className="text-sm font-medium text-secondary-foreground">구독</h2>
              <SubscriptionsTab />
            </section>

            {/* 계약 이력 — 설명은 [i] 툴팁, 필터는 헤더 아래 행 */}
            <section id="history" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-medium text-secondary-foreground">
                  계약 이력 ({CONTRACT_HISTORY.length})
                </h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="계약 이력 설명">
                      <Info className="size-4 text-secondary-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{HISTORY_NOTE}</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                {["상태", "계약", "계약 항목"].map((f) => (
                  <DropdownMenu key={f}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-secondary-foreground">
                        {f} <ChevronDown className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    {/* 타이틀 없음 — 트리거 버튼이 이미 이름을 말한다. 값 해제는 하단 [초기화] */}
                    <DropdownMenuContent align="start" className="w-40">
                      {/* 다중 문법 — 상시 노출 체크박스 왼쪽, 고를 때마다 닫지 않는다 */}
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Checkbox checked className="pointer-events-none" /> 취소 포함
                      </DropdownMenuItem>
                      <div className="flex justify-end px-1 pt-1">
                        <Button variant="ghost" size="sm" className="text-secondary-foreground">
                          초기화
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
              {/* 가로 스크롤 없이 컬럼 폭에 맞춘다(2026-09-10 확정): table-fixed + 좁은 열 폭 선언, 계약 항목이 나머지를 받아
                  줄바꿈(말줄임 없음). 유저·계정 상세의 계약 표와 같은 문법 */}
              <Table className="table-fixed bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">계약</TableHead>
                    <TableHead>계약 항목</TableHead>
                    <TableHead className="w-44">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTRACT_HISTORY.map((r) => (
                    <TableRow key={r.contract} className={r.cancelled ? "opacity-60" : undefined}>
                      <TableCell>
                        <Link
                          href={`${BASE}/contracts/detail`}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          {r.contract} <ArrowUpRight className="size-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-normal">{r.item}</TableCell>
                      <TableCell>
                        {r.cancelled ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                              <span className="size-2 rounded-full bg-destructive" /> 취소
                            </span>
                            <div className="whitespace-normal text-xs text-secondary-foreground">
                              {r.note}
                            </div>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span className="size-2 rounded-full bg-success" /> 유효
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            {/* 납품 제품 — 설명은 [i] 툴팁, 우측에 목록 링크(섹션 헤더 버튼 문법) */}
            <section id="deliveries" className="scroll-mt-24 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-medium text-secondary-foreground">
                    납품 제품 ({DELIVERIES.length})
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="납품 제품 설명">
                        <Info className="size-4 text-secondary-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{DELIVERY_NOTE}</TooltipContent>
                  </Tooltip>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${BASE}/deliveries`}>납품 제품 목록에서 보기</Link>
                </Button>
              </div>
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead>제품</TableHead>
                    <TableHead>이행 종류</TableHead>
                    <TableHead>계약 · 계약 항목</TableHead>
                    <TableHead>납품 예정일</TableHead>
                    <TableHead>커미셔닝 예정일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DELIVERIES.map((r, i) => (
                    <TableRow key={r.product + i}>
                      {/* 제품 = 회색 배지(다른 목록의 상품 열과 같은 문법, 2026-09-09) — 배지 자체가 납품 상세 링크 */}
                      <TableCell>
                        <Badge variant="secondary" className="font-normal" asChild>
                          <Link href={`${BASE}/deliveries/detail`}>{r.product}</Link>
                        </Badge>
                      </TableCell>
                      {/* 이행 종류 — 목록과 같은 원자 칩 부품(2026-09-07 · 5종 2026-09-09) */}
                      <TableCell>
                        <DeliveryType value={r.delivery} />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <Link
                          href={`${BASE}/contracts/detail`}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {r.contract}
                        </Link>
                        <div className="text-xs text-secondary-foreground">{r.slot}</div>
                      </TableCell>
                      {/* 예정일 빈 칸 — 상세는 채우는 면이라 미입력 표기(2026-09-08 빈 값 규칙). 목록은 대시 */}
                      <TableCell className="font-mono text-sm">{r.dueOn ?? <MissingMark />}</TableCell>
                      <TableCell className="font-mono text-sm">{r.commissioningOn ?? <MissingMark />}</TableCell>
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
                  <AuditLog subject="계약 호선 · Hull 1001" entries={AUDIT} domains={AUDIT_DOMAINS} />
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* ══ 우측 Details 패널 — Jira 문법: 개요 KV가 스크롤 내내 고정 ══ */}
          {/* top-22 = 셸 상단바 h-16(64px) + 24px 여백 — top-6은 상단바 아래로 숨었다(2026-09-10, 상세 5종 공통) */}
          <aside className="sticky top-22 w-80 shrink-0 space-y-4 self-start">
            {/* 호선 정보 — 식별자·당사자·기본 정보 합본(와이어프레임 3카드 → 1패널). 수정 = 저강조 ghost */}
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">호선 정보</h2>
                <Button variant="ghost" size="sm" className="text-secondary-foreground">
                  <Pencil className="size-4" /> 수정
                </Button>
              </div>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">Hull Number</dt>
                  <dd className="font-mono">1001</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">IMO</dt>
                  <dd>
                    <MissingMark />
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">Ship Name</dt>
                  <dd>
                    <MissingMark />
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">선주</dt>
                  <dd>
                    {/* 선주명 자체가 계정 링크 — 계약 상세 고객 행과 같은 문법(2026-09-08) */}
                    <Link href={`${BASE}/accounts/detail`} className="text-primary hover:underline">
                      대양해운
                    </Link>
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">조선소</dt>
                  <dd>한빛중공업</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">Call Sign</dt>
                  <dd className="text-muted-foreground">—</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">선종</dt>
                  <dd>Container</dd>
                </div>
                {/* 선급 칩(2026-09-08) — 목록과 같은 outline 배지, 주선급 칩 안에 점. 배지 행이라 items-center */}
                <div className="flex items-center">
                  <dt className="w-28 shrink-0 text-secondary-foreground">선급</dt>
                  <dd className="inline-flex flex-wrap items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-default gap-1.5 font-normal">
                          <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
                          KR
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>주선급 — 승인도면 제출 상대</TooltipContent>
                    </Tooltip>
                    <Badge variant="outline" className="font-normal">
                      DNV
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">시리즈 코드</dt>
                  <dd className="font-mono">SER-2026-A</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-28 shrink-0 text-secondary-foreground">인도 예정일</dt>
                  <dd className="font-mono">2027-06-01</dd>
                </div>
              </dl>
            </section>

            {/* 참여 계약 — 헤더 칩 3개를 레일 패널로. 값 자체가 계약 상세 링크, 앵커는 계약 이력 섹션 */}
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-medium text-secondary-foreground">
                <a href="#history" className="hover:underline">
                  참여 계약 ({CONTRACT_HISTORY.length})
                </a>
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {CONTRACT_HISTORY.map((c) => (
                  <li key={c.contract} className={c.cancelled ? "text-secondary-foreground" : undefined}>
                    <Link href={`${BASE}/contracts/detail`} className="text-primary hover:underline">
                      {c.contract}
                    </Link>
                    {c.cancelled && <span className="ml-1.5 text-xs">취소됨</span>}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
