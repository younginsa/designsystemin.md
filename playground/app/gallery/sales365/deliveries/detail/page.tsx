"use client";

// S10 납품 제품 상세 — 세일즈포스 대체 (① 프레임 셸 상속 + B 상세 · Jira형 상세 템플릿 롤아웃 3번째)
// 원천: hinas365 와이어프레임 wireframe_s10_delivery_detail.html
//
// 재제작(2026-09-08) — 계약 상세(파일럿, 2026-08-28 확정)와 같은 골격:
// - 루트 max-w-7xl · 헤더는 타이틀 단독(메타는 우측 Details 패널 소유) · 우측 액션 [✕ 취소]
// - 본문 컬럼: 도면 (3) → Activity [댓글 | 변경 이력] 탭(pt-16 여백으로 구분)
// - 우측 sticky 레일: 일정(✏ 수정 → 예정일 수정 모달) · 납품 제품 정보 · 계약 정보 체인(계약→항목→슬롯→호선)
// - 종전 구조 폐기: 페이지 탭(개요/도면/변경 이력)과 댓글 도킹 패널 — 단일 스크롤로
//
// 와이어프레임 대조 메모
// - 헤더: Hull 1001 · Control + 계약 항목 칩(납품 + 구독 · C-2026-001 ↗) / 우측 [✕ 취소] — 칩은 레일로
// - 취소 시나리오: 취소되면 배너(⛔ 예정일 수정·도면 등록 차단, 취소 기점 표시) — 토글로 시연
// - 도면 승인/작업/최종 3종 — 버전·다운로드·업로드·이전 버전, 도면 등록 모달
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { Download, Info, Paperclip, Pencil, Plus, Upload } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Textarea } from "@ds/ui/ui/textarea";

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
// 납품 유형 표기 잠금(2026-09-07) — 4곳 공유
import { DeliveryType } from "../../../_detail/delivery-type";
// 사람 요소 잠금(2026-09-04): 댓글 작성자 = DS Avatar sm(이니셜) — _detail/person 공유
import { PersonAvatar } from "../../../_detail/person";
// 계약명·항목명 조립 규칙(2026-09-09) — 계약 상세와 같은 문자열
import { contractName, itemFromPackage, itemName } from "../../../_detail/contract-name";

const BASE = "/gallery/sales365";

// 계약 정보 체인 — 계약 → 계약 항목 → 슬롯 → 호선
const ITEM_SPEC = itemFromPackage("Enterprise", 5);
const CHAIN: { label: string; value: string; link: string }[] = [
  { label: "계약", value: `C-2026-001 · ${contractName("2026-01-15", "대양해운", [ITEM_SPEC])}`, link: `${BASE}/contracts/detail` },
  { label: "계약 항목", value: `C-2026-001-01 · ${itemName(ITEM_SPEC)}`, link: `${BASE}/contracts/detail` },
  { label: "슬롯", value: "1호선 슬롯 · USD 1,200,000", link: `${BASE}/contracts/detail` },
  { label: "호선", value: "Hull 1001 · MV EXAMPLE", link: `${BASE}/vessels/detail` },
];

const DRAWINGS: { type: string; name: string; version: string; date: string; history: [string, string][] }[] = [
  { type: "승인도면", name: "General Arrangement Plan", version: "v3", date: "2026-11-20", history: [["v2", "2026-09-05"], ["v1", "2026-07-01"]] },
  { type: "작업도면", name: "Installation Drawing", version: "v2", date: "2026-10-15", history: [["v1", "2026-08-20"]] },
  { type: "최종도면", name: "As-Built Drawing", version: "v1", date: "2026-12-01", history: [] },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

// 변경 이력 — 와이어프레임 AUDIT 이식(예정일·도면 관리 이력)
// 병합 변경 이력(2026-09-10): domain = 이 페이지 섹션(일정 · 도면 · 납품 제품 정보).
// 도면 항목은 DRAWINGS의 이전 버전(승인 v1 07-01 · v2 09-05, 작업 v1 08-20)과 맞춘다
const AUDIT_DOMAINS = ["일정", "도면", "납품 제품 정보"];
const AUDIT: AuditEntry[] = [
  { at: "2026-09-05 10:12", domain: "도면", action: "도면 새 버전 업로드", tone: "add", actor: "김민준", lines: ["승인도면 v2", "General Arrangement Plan"] },
  { at: "2026-08-20 15:40", domain: "도면", action: "도면 등록", tone: "add", actor: "이수진", lines: ["작업도면 v1", "Installation Drawing"] },
  {
    at: "2026-08-18 17:26",
    domain: "일정",
    action: "예정일 수정",
    tone: "modify",
    actor: "최다혜",
    fields: [
      { label: "납품 예정일", from: "2026-02-10", to: "2026-02-24" },
      { label: "커미셔닝 예정일", from: "2026-03-01", to: "2026-03-15" },
    ],
  },
  {
    at: "2026-08-02 10:41",
    domain: "일정",
    action: "예정일 수정",
    tone: "modify",
    actor: "최다혜",
    fields: [{ label: "커미셔닝 예정일", from: "— (미입력)", to: "2026-03-01" }],
  },
  { at: "2026-07-01 09:30", domain: "도면", action: "도면 등록", tone: "add", actor: "김민준", lines: ["승인도면 v1", "General Arrangement Plan"] },
  {
    at: "2026-01-08 11:20",
    domain: "납품 제품 정보",
    action: "납품 제품 생성",
    tone: "create",
    actor: "김민준",
    badge: "공통 컬럼",
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
  // 도면 등록 첨부 — 고른 파일 이름(시각 스펙: 업로드는 하지 않는다). 모달을 닫으면 비운다
  const [drawingFile, setDrawingFile] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState([
    { author: "이수진", time: "2026-08-19 10:12", text: "일정 변경 사유와 현장 이슈를 남깁니다" },
  ]);
  const [draft, setDraft] = React.useState("");

  return (
    // Jira 문법: 콘텐츠 컬럼은 풀스크린에서도 max-width 캡(계약 상세와 동일 1280)
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── 페이지 헤더 — 타이틀 단독, 메타(계약 항목·이행 종류)는 우측 Details 패널 소유 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-lg font-bold">Hull 1001 · Control</h1>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
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

      {/* 취소 배너 — 예정일 수정·도면 등록 차단. 배너 표준 양식: variant destructive + /5 틴트 */}
      {cancelled && (
        <Alert variant="destructive" className="border-0 bg-destructive/5">
          <Info className="size-4" />
          <AlertTitle className="font-semibold text-foreground">이 납품은 취소되었습니다.</AlertTitle>
          <div className="col-start-2 text-sm text-secondary-foreground">
            예정일 수정과 도면 등록이 차단됩니다. 취소 기점: 계약 항목 (취소 2026-03-10 · 발주처 사양 변경 —
            상위 전파). 재개하려면 계약부터 순서대로 해제하세요.
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
        <div className="flex items-start gap-6">
          {/* ══ 본문 컬럼 — 도면 → Activity ══ */}
          <div className="min-w-0 flex-1 space-y-16">
            {/* 도면 — 계약 상세 문서 목록과 같은 문법(divide-y 박스 · 종류 + 버전 배지 · 우측 액션) */}
            <section id="drawings" className="scroll-mt-24 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">
                  도면 ({DRAWINGS.length}) <span className="font-normal">· 최신 버전 기준</span>
                </h2>
                <Button variant="outline" size="sm" disabled={cancelled} onClick={() => setDrawingOpen(true)}>
                  <Plus className="size-4" /> 도면 등록
                </Button>
              </div>
              <div className="divide-y rounded-md border bg-card">
                {DRAWINGS.map((d) => (
                  <div key={d.type} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {d.type}
                        <Badge variant="secondary" className="font-mono font-normal">
                          {d.version}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-secondary-foreground">
                        {d.name} · <span className="font-mono">{d.date}</span>
                      </p>
                      {d.history.length > 0 ? (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-primary hover:underline">
                            이전 버전 {d.history.length}건 보기
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
                        <p className="mt-1 text-xs text-secondary-foreground">이전 버전 없음</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" className="text-secondary-foreground">
                        <Download className="size-4" /> 다운로드
                      </Button>
                      <Button variant="ghost" size="sm" className="text-secondary-foreground" disabled={cancelled}>
                        <Upload className="size-4" /> 새 버전
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                  <AuditLog subject="납품 제품 · Hull 1001 · Control" entries={AUDIT} domains={AUDIT_DOMAINS} />
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* ══ 우측 Details 패널 — Jira 문법: 개요 KV가 스크롤 내내 고정 ══ */}
          {/* top-22 = 셸 상단바 h-16(64px) + 24px 여백 — top-6은 상단바 아래로 숨었다(2026-09-10, 상세 5종 공통) */}
          <aside className="sticky top-22 w-80 shrink-0 space-y-4 self-start">
            {/* 일정 — 이 엔티티의 편집 가능 필드. 수정 = 저강조 ghost(4개 상세 페이지 공통) */}
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">일정</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-secondary-foreground"
                  disabled={cancelled}
                  onClick={() => setScheduleOpen(true)}
                >
                  <Pencil className="size-4" /> 수정
                </Button>
              </div>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline">
                  <dt className="w-32 shrink-0 text-secondary-foreground">납품 예정일</dt>
                  <dd className="font-mono">2027-03-01</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-32 shrink-0 text-secondary-foreground">커미셔닝 예정일</dt>
                  <dd className="font-mono">2027-05-01</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-medium text-secondary-foreground">납품 제품 정보</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline">
                  <dt className="w-32 shrink-0 text-secondary-foreground">이름</dt>
                  <dd className="min-w-0">
                    Hull 1001 · Control
                    <div className="text-xs text-secondary-foreground">자동 생성</div>
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-32 shrink-0 text-secondary-foreground">제품</dt>
                  <dd>
                    <Link href={`${BASE}/products`} className="text-primary hover:underline">
                      Control
                    </Link>
                  </dd>
                </div>
                {/* 배지 행이라 items-center — baseline이면 칩이 라벨보다 내려앉는다 */}
                <div className="flex items-center">
                  <dt className="w-32 shrink-0 text-secondary-foreground">이행 종류</dt>
                  <dd>
                    <DeliveryType value="제품 신규 납부 + 구독" />
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-32 shrink-0 text-secondary-foreground">구독 조건</dt>
                  <dd className="min-w-0">
                    36개월
                    <div className="text-xs text-secondary-foreground">계약 항목 제품에 붙은 조건</div>
                  </dd>
                </div>
              </dl>
            </section>

            {/* 계약 정보 체인 — 계약 → 항목 → 슬롯 → 호선, 값 자체가 링크 */}
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-medium text-secondary-foreground">계약 정보</h2>
              <dl className="mt-3 space-y-3 text-sm">
                {CHAIN.map((c) => (
                  <div key={c.label} className="flex items-baseline">
                    <dt className="w-32 shrink-0 text-secondary-foreground">{c.label}</dt>
                    <dd className="min-w-0">
                      <Link href={c.link} className="text-primary hover:underline">
                        {c.value}
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>
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
      <Dialog
        open={drawingOpen}
        onOpenChange={(o) => {
          setDrawingOpen(o);
          if (!o) setDrawingFile(null);
        }}
      >
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
              <Label htmlFor="d-file">파일 첨부</Label>
              {/* 점선 영역 = label + 숨긴 file input(2026-09-10 디자이너 확정) — 클릭하면 OS 파일 선택창이 열린다.
                  고른 파일 이름이 안내 문구 자리에 온다. 드래그는 시각 스펙만(핸들러 없음) */}
              <label
                htmlFor="d-file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-secondary-foreground hover:bg-accent"
              >
                <Paperclip className="size-4" />
                {drawingFile ? (
                  <span className="truncate text-foreground">{drawingFile}</span>
                ) : (
                  "파일을 클릭하거나 드래그하여 업로드"
                )}
                <input
                  id="d-file"
                  type="file"
                  className="sr-only"
                  onChange={(e) => setDrawingFile(e.target.files?.[0]?.name ?? null)}
                />
              </label>
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
