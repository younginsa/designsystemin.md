"use client";

// S7 계약 호선 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세)
// 원천: hinas365 와이어프레임 wireframe_s7.html
//
// 와이어프레임 대조 메모
// - 헤더: Hull 1001 · MV EXAMPLE + 미입력 식별자 경고 배너(제원 탭 유도) +
//   메타(IMO · 선종 · 선급 KR/DNV) + 참여 계약 3건 칩 / 우측 [호선 삭제]
// - 탭 3: ① 제원(식별자·당사자·기본 정보·제원·전자장비 메이커 + 수정)
//   ② 계약 이력(중복 배정 불가 안내 + 필터 + 표, 취소 포함 토글)
//   ③ 납품 제품(자동 생성 안내 + 표 → 납품 제품 목록 링크)
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

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
import { CommentsRail } from "../../../_detail/comments-rail";
import { SubscriptionsTab } from "./subscriptions-tab";

const BASE = "/generated/sales365";

// dl 섹션 — 타이틀 + 키-값 (S3 개요와 동일 위계)
function InfoSection({ title, rows, action }: { title: string; rows: [string, React.ReactNode][]; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>
        {action}
      </div>
      <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline">
            <dt className="w-32 shrink-0 text-secondary-foreground">{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MissingMark() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm italic text-secondary-foreground">
      <span className="size-1.5 rounded-full bg-destructive" /> 미입력
    </span>
  );
}

// ② 계약 이력
const CONTRACT_HISTORY: { contract: string; item: string; cancelled: boolean; note?: string }[] = [
  { contract: "C-2026-001 ○○해운", item: "Control + SVM 구독 5척", cancelled: false },
  { contract: "C-2026-017 ◇◇해운", item: "Navi 3척", cancelled: true, note: "취소 2026-04-01 · 발주처 사양 변경" },
  { contract: "C-2025-003 ○○해운", item: "Control 3척", cancelled: false },
];

// ③ 납품 제품 (5)
const DELIVERIES: { product: string; delivery: string; contract: string; slot: string; dueOn: string | null; commissioningOn: string | null }[] = [
  { product: "Control", delivery: "납품 + 구독", contract: "C-2026-001", slot: "C-2026-001-01 · 1호선 슬롯", dueOn: "2027-03-01", commissioningOn: "2027-05-01" },
  { product: "SVM", delivery: "납품 + 구독", contract: "C-2026-001", slot: "C-2026-001-01 · 1호선 슬롯", dueOn: "2027-03-01", commissioningOn: null },
  { product: "Cloud", delivery: "구독", contract: "C-2026-001", slot: "C-2026-001-01 · 1호선 슬롯", dueOn: null, commissioningOn: null },
  { product: "Navigation", delivery: "납품", contract: "C-2026-017", slot: "C-2026-017-01 · 2호선 슬롯", dueOn: "2026-05-01", commissioningOn: null },
  { product: "Control", delivery: "구독", contract: "C-2025-003", slot: "C-2025-003-01 · 1호선 슬롯", dueOn: "2025-10-01", commissioningOn: "2025-10-20" },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 와이어프레임 AUDIT 이식(계약 호선은 마스터성 데이터 — cross 부연)
const AUDIT: AuditEntry[] = [
  {
    at: "2026-07-30 16:44",
    action: "U",
    actor: "박준혁",
    cross:
      "이 호선을 참조하는 계약 3건에 함께 반영됩니다 — 계약 호선은 여러 계약이 참조하는 마스터성 데이터라 한 번의 수정이 계약 경계를 넘어 보입니다",
    fields: [
      { label: "선명", from: "— (미입력)", to: "MV EXAMPLE" },
      { label: "인도 예정일", from: "2027-05-01", to: "2027-07-15" },
    ],
  },
  {
    at: "2026-03-02 10:12",
    action: "U",
    actor: "박준혁",
    fields: [{ label: "주선급", from: "KR 한국선급", to: "DNV" }],
  },
  {
    at: "2025-11-19 13:58",
    action: "C",
    actor: "최다혜",
    fields: [{ label: "Hull Number", from: null, to: "Hull 1001" }],
  },
];

export default function Sales365VesselDetailPage() {
  const [view, setView] = React.useState<ViewState>("default");

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold">
            Hull 1001 <span className="text-secondary-foreground">· MV EXAMPLE</span>
          </h1>
          <p className="text-sm text-secondary-foreground">
            IMO 9876543 · Container · KR / DNV
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-sm">
            <span className="text-secondary-foreground">참여 계약 3건</span>
            {["C-2026-001 ○○해운", "C-2026-017 ◇◇해운", "C-2025-003"].map((c) => (
              <Badge key={c} variant="secondary" className="font-normal" asChild>
                <Link href={`${BASE}/contracts/detail`}>{c}</Link>
              </Badge>
            ))}
          </div>
        </div>
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
        <AlertTitle className="font-semibold text-foreground">
          미입력 식별자 — IMO · Ship Name
        </AlertTitle>
        <div className="col-start-2 text-sm text-secondary-foreground">
          선박 명명·등록 후 제원 탭에서 채워주세요.
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
        <>
        <Tabs defaultValue="specs">
          <TabsList>
            <TabsTrigger value="specs">제원</TabsTrigger>
            <TabsTrigger value="subs">구독</TabsTrigger>
            <TabsTrigger value="history">계약 이력</TabsTrigger>
            <TabsTrigger value="deliveries">납품 제품 (5)</TabsTrigger>
            <TabsTrigger value="audit">변경 이력</TabsTrigger>
          </TabsList>

          {/* ── ① 제원 ── */}
          <TabsContent value="specs" className="mt-4 space-y-4">
            <InfoSection
              title="식별자"
              action={
                <Button variant="ghost" size="sm">
                  <Pencil className="size-4" /> 수정
                </Button>
              }
              rows={[
                ["Hull Number", "1001"],
                ["IMO", <MissingMark key="imo" />],
                ["Ship Name", <MissingMark key="sn" />],
              ]}
            />
            <InfoSection
              title="당사자"
              rows={[
                ["선주", <span key="o">○○해운 <Link href={`${BASE}/accounts/detail`} className="text-primary hover:underline">→ 계정 상세</Link></span>],
                ["조선소", "△△중공업"],
              ]}
            />
            <InfoSection
              title="선박 기본 정보"
              rows={[
                ["Call Sign", "—"],
                ["선종", "Container"],
                ["선급", "주선급 KR — 승인도면 제출 상대 · DNV"],
                ["시리즈 코드", "SER-2026-A"],
                ["인도 예정일", "2027-06-01"],
              ]}
            />
            <InfoSection
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
            <InfoSection
              title="전자장비·메이커"
              rows={[
                ["AMS Maker", "Raytheon"],
                ["BMS Maker", "Kongsberg"],
                ["ECDIS Maker", "JRC"],
                ["Auto Pilot Maker", "Furuno"],
              ]}
            />
          </TabsContent>

          {/* ── ② 구독 — S11 만료 임박 목록이 링크하는 주 관리 화면 ── */}
          <TabsContent value="subs" className="mt-4">
            <SubscriptionsTab />
          </TabsContent>

          {/* ── ③ 계약 이력 ── */}
          <TabsContent value="history" className="mt-4 space-y-3">
            <p className="flex items-start gap-1.5 text-xs text-secondary-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              같은 계약 항목 안에서 이 호선을 중복 배정할 수 없습니다. 취소된 슬롯도 중복 검사
              대상입니다 — 재투입 시 취소를 해제하세요.
            </p>
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
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>계약</TableHead>
                  <TableHead>계약 항목</TableHead>
                  <TableHead>상태</TableHead>
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
                    <TableCell>{r.item}</TableCell>
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
          </TabsContent>

          {/* ── ③ 납품 제품 ── */}
          <TabsContent value="deliveries" className="mt-4 space-y-3">
            <p className="flex items-start gap-1.5 text-xs text-secondary-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              이 호선에 걸린 이행 건입니다. 납품 제품은 호선 배정 시 자동 생성되므로 여기서 직접
              추가·삭제할 수 없고, 납품·커미셔닝 예정일과 도면을 관리합니다. 예정일은 호선이 아니라
              제품 단위이므로 같은 호선이어도 값이 갈립니다.
            </p>
            <div className="flex justify-end">
              <Button asChild variant="ghost" size="sm">
                <Link href={`${BASE}/deliveries`}>납품 제품 목록에서 보기 →</Link>
              </Button>
            </div>
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>제품</TableHead>
                  <TableHead>납품 유형</TableHead>
                  <TableHead>계약 · 계약 항목</TableHead>
                  <TableHead>납품 예정일</TableHead>
                  <TableHead>커미셔닝 예정일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DELIVERIES.map((r, i) => (
                  <TableRow key={r.product + i}>
                    <TableCell>
                      <Link
                        href={`${BASE}/deliveries/detail`}
                        className="font-medium text-primary hover:underline"
                      >
                        {r.product}
                      </Link>
                    </TableCell>
                    <TableCell>{r.delivery}</TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="font-mono text-sm">{r.contract}</span>
                      <div className="text-xs text-secondary-foreground">{r.slot}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.dueOn ?? <span className="text-secondary-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.commissioningOn ?? <span className="text-secondary-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* ── ⑤ 변경 이력 — 공통 AuditLog 시안 ── */}
          <TabsContent value="audit" className="mt-4">
            <AuditLog subject="계약 호선 · Hull 1001" entries={AUDIT} />
          </TabsContent>
        </Tabs>

        {/* ── 댓글 — 공통 CommentsRail 시안 ── */}
        <CommentsRail
          subjectHint="호선 선급에 대한 내용도 여기에 적습니다"
          initial={[
            {
              author: "박준혁",
              team: "기술영업",
              at: "2026-07-30 16:50",
              body: "@김민준 선명·인도 예정일 갱신했습니다. 주선급 DNV 전환 건도 확인 부탁드려요.",
            },
          ]}
        />
        </>
      )}
    </div>
  );
}
