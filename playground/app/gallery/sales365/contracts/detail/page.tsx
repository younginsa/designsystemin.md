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
import { Download, Info, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";

import { Alert, AlertDescription } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

import { AuditLog, type AuditEntry } from "../../../_detail/audit-log";
// 사람 요소 잠금(2026-09-04): 담당·댓글 작성자 = DS Avatar(이니셜) — _detail/person 공유
import { Person, PersonAvatar } from "../../../_detail/person";
// 미입력 표기 잠금(2026-09-07) — 슬롯 금액 미입력도 같은 부품
import { MissingMark } from "../../../_detail/missing-mark";
// 계약명·항목명 자동 생성 규칙(2026-09-09 유현수 공유) — 목록·생성 폼과 같은 부품. 수정 모달에서도 손으로 못 고친다
import { contractName, itemFromPackage, itemName } from "../../../_detail/contract-name";

const BASE = "/gallery/sales365";

const CONTRACT = {
  id: "C-2026-001",
  // "{계약일} {고객} {제품 이행단축, …} N척" — 목록·계정 상세·유저 상세·구독·납품 상세가 같은 문자열을 쓴다
  name: contractName("2026-01-15", "대양해운", [itemFromPackage("Enterprise", 5)]),
  customer: "대양해운",
  ctype: "신조",
  date: "2026-01-15",
  owner: "홍길동",
  /** 계약서 시리얼 넘버 — 선택 필드(2026-09-09 신설). 비어 있으면 미입력 표기 */
  serial: "SN-2026-0115-01" as string | null,
  memo: "—",
};

const ITEM = {
  code: "C-2026-001-01",
  pkg: "Enterprise",
  // 계약 항목명도 조립 규칙(2026-09-09): "{제품 이행단축}, … N척"
  name: itemName(itemFromPackage("Enterprise", 5)),
  assigned: 4,
  total: 5,
  // 구독 조건 — 헤더 행 + Optimization 열 신설(2026-09-08 리뷰 반영, 와이어프레임 대조)
  subs: [
    { product: "Navigation", term: "— 일시납", opt: null },
    { product: "Control", term: "36개월", opt: "보증" },
    { product: "SVM", term: "12개월", opt: null },
    { product: "Cloud", term: "36개월", opt: null },
  ] as { product: string; term: string; opt: string | null }[],
};

/** 계약 항목 코드 설명 — 와이어프레임 원문(1.2.2.1, 2.3.2) */
const ITEM_CODE_NOTE =
  "이름은 계약 내용에서 조립하므로 구성이 바뀌면 함께 바뀝니다. 지칭에 쓰는 값은 이 코드입니다.";

type SlotState = "assigned" | "missing" | "unassigned" | "cancelled";
/** 금액 행 — value가 null이면 미입력 */
type MoneyRow = { label: string; value: string | null; unit?: string };
// 배정 호선(2026-09-08 개편) — 인도 예정일 제거, 총 금액·제품별 금액 신설(와이어프레임 대조).
// 일시납과 구독 단가는 단위가 달라 한 수로 합치지 않는다 — 그래서 총 금액이 2행이다.
// 기간 단위는 월로 고정(2026-09-08 디자이너 확정 — 년 폐기, 36개월처럼 개월로 입력) → 연 구독료 행 없음.
const SLOTS: {
  no: number;
  hull: string | null;
  ship: string | null;
  state: SlotState;
  note?: string;
  totals: MoneyRow[];
  products: MoneyRow[];
}[] = [
  {
    no: 1, hull: "Hull 1001", ship: "MV EXAMPLE", state: "assigned",
    totals: [
      { label: "일시납 금액 합산", value: "USD 850,000" },
      { label: "월 구독료 합산", value: "USD 45,000" },
    ],
    products: [
      { label: "Navigation", value: "USD 850,000" },
      { label: "Control", value: "USD 20,000", unit: "월" },
      { label: "SVM", value: "USD 15,000", unit: "월" },
      { label: "Cloud", value: "USD 10,000", unit: "월" },
    ],
  },
  {
    no: 2, hull: "Hull 1002", ship: "MV PIONEER", state: "assigned",
    totals: [
      { label: "일시납 금액 합산", value: "USD 850,000" },
      { label: "월 구독료 합산", value: "USD 45,000" },
    ],
    products: [
      { label: "Navigation", value: "USD 850,000" },
      { label: "Control", value: "USD 20,000", unit: "월" },
      { label: "SVM", value: "USD 15,000", unit: "월" },
      { label: "Cloud", value: "USD 10,000", unit: "월" },
    ],
  },
  {
    // 한 제품이라도 미입력이면 그 줄의 합은 내지 않는다(와이어프레임 1.3.1)
    no: 3, hull: "Hull 1003", ship: null, state: "missing",
    totals: [
      { label: "일시납 금액 합산", value: "USD 850,000" },
      { label: "월 구독료 합산", value: null },
    ],
    products: [
      { label: "Navigation", value: "USD 850,000" },
      { label: "Control", value: "USD 20,000", unit: "월" },
      { label: "SVM", value: null },
      { label: "Cloud", value: null },
    ],
  },
  { no: 4, hull: null, ship: null, state: "unassigned", totals: [], products: [] },
  {
    no: 5, hull: "Hull 1004", ship: null, state: "cancelled",
    note: "취소 2026-04-01 · 발주처 사양 변경",
    totals: [
      { label: "일시납 금액 합산", value: "USD 850,000" },
      { label: "월 구독료 합산", value: "USD 45,000" },
    ],
    products: [
      { label: "Navigation", value: "USD 850,000" },
      { label: "Control", value: "USD 20,000", unit: "월" },
      { label: "SVM", value: "USD 15,000", unit: "월" },
      { label: "Cloud", value: "USD 10,000", unit: "월" },
    ],
  },
];

// 금액 수정 모달 데이터(2026-09-08, 와이어프레임 1.4.3) — 슬롯별 제품 단가 · 무상 기간 · 파생 계산.
// 파생값(× 유상 … = …)은 저장하지 않는 계산 결과라 시각 스펙에서는 문자열로 고정한다.
// 일시납(Navigation)은 무상 칸이 없다. 무상 단위는 월 고정(년 폐기) — unit은 구독 여부 표시로만 쓴다.
type PriceRow = {
  product: string;
  amount: number | null;
  free: number | null;
  unit: "월" | null;
  /** 유상 개월(구독 기간 − 무상) — 일시납은 null */
  paidMonths: number | null;
  /** 파생 총액(숫자) — 미입력이면 null. 통화 코드는 모달의 통화 선택을 따라 렌더 시 붙인다(2026-09-08) */
  total: number | null;
};
const fmtAmount = (n: number) => n.toLocaleString("en-US");
const PRICING_FULL: PriceRow[] = [
  { product: "Navigation", amount: 850000, free: null, unit: null, paidMonths: null, total: 850000 },
  { product: "Control", amount: 20000, free: 3, unit: "월", paidMonths: 33, total: 660000 },
  { product: "SVM", amount: 15000, free: 0, unit: "월", paidMonths: 12, total: 180000 },
  { product: "Cloud", amount: 10000, free: 0, unit: "월", paidMonths: 36, total: 360000 },
];
const PRICING: Record<number, PriceRow[]> = {
  1: PRICING_FULL,
  2: PRICING_FULL,
  // 3번 — SVM·Cloud 미입력(정상 상태). 미입력 줄은 파생값도 내지 않는다
  3: [
    PRICING_FULL[0],
    PRICING_FULL[1],
    { product: "SVM", amount: null, free: 0, unit: "월", paidMonths: 12, total: null },
    { product: "Cloud", amount: null, free: 0, unit: "월", paidMonths: 36, total: null },
  ],
};

/** 배정 호선 안내 — 와이어프레임 원문 */
const SLOT_NOTE =
  "배정된 호선은 바꿀 수 없습니다. 잘못 배정했으면 슬롯 삭제 후 새 슬롯에 배정하고, 계약 대상 선박이 교체됐으면 슬롯 취소 후 새 슬롯에 배정합니다. 취소는 어느 호선이 왜 빠졌는지를 남기고, 삭제는 남기지 않습니다.";

// 문서(2026-09-08 신설) — 외부와 주고받은 파일의 버전 이력
const DOCUMENTS = [
  { kind: "계약서", ver: "v2", file: "contract_C-2026-001_v2.pdf", at: "2026-02-03", by: "김민준", prev: 1 },
  { kind: "견적서", ver: "v3", file: "quote_KMTC_v3.pdf", at: "2026-01-09", by: "이수진", prev: 2 },
];

// 청구(2026-09-08 신설) — 금액은 청구서가 따로 담고, 대상은 어느 가격 행을 덮는지만 가리킨다
const INVOICES = [
  { at: "2026-03-20", amount: "USD 450,000", targets: 4, summary: "Hull 1001 Navigation 외 3건" },
  { at: "2026-09-10", amount: "USD 600,000", targets: 4, summary: "Hull 1001 Navigation 외 3건" },
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

// 금액 목록 — 총 금액(합산 3행)·제품별 금액(제품 4행) 공용. null = 미입력(호선 목록과 같은 표기)
// strong = 값이 있는 금액만 굵게(미입력 표기는 굵기 상속 안 함) · className = 행 간격 등 자리별 덮어쓰기.
// 둘 다 금액 수정 모달 Total 전용(2026-09-08). 표의 총 금액·제품별 금액 셀은 기본 굵기·기본 간격
function MoneyList({
  rows,
  strong = false,
  className = "",
}: {
  rows: MoneyRow[];
  strong?: boolean;
  className?: string;
}) {
  return (
    <dl className={"space-y-1 text-sm " + className}>
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline gap-3">
          <dt className="w-28 shrink-0 text-secondary-foreground">{r.label}</dt>
          <dd className={strong && r.value ? "font-mono font-bold" : "font-mono"}>
            {r.value ?? <MissingMark />}
            {r.value && r.unit && (
              <span className="ml-1 font-sans text-xs text-secondary-foreground">/ {r.unit}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// 변경 이력 — 와이어프레임 AUDIT 이식(대상 테이블 + 대상 ID 축)
const AUDIT: AuditEntry[] = [
  {
    at: "2026-08-20 14:32",
    action: "U",
    actor: "김민준",
    fields: [
      { label: "가격", from: "USD 1,200,000", to: "USD 1,350,000" },
      { label: "고객 계정", from: "대양해운", to: "대양해운 싱가포르" },
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
      // 계약명은 자동 생성이라 직접 고칠 수 없다 — 항목 패키지가 바뀌면 이름이 따라 바뀐 것으로 기록된다(2026-09-09)
      {
        label: "계약명",
        from: contractName("2026-01-15", "대양해운", [itemFromPackage("Safety Forward", 5)]),
        to: contractName("2026-01-15", "대양해운", [itemFromPackage("Enterprise", 5)]),
      },
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
  // 금액 수정 모달 — 열린 슬롯 번호(null = 닫힘). 배정 행의 연필이 연다(2026-09-08)
  const [priceSlot, setPriceSlot] = React.useState<number | null>(null);
  // 금액 수정 모달의 통화 — 표의 총액·Total 표기가 따라간다(저장 전 미리보기, 닫으면 USD로 복귀)
  const [currency, setCurrency] = React.useState("USD");
  const priceTarget = priceSlot ? SLOTS.find((s) => s.no === priceSlot) : undefined;
  const [comments, setComments] = React.useState(COMMENTS);
  const [draft, setDraft] = React.useState("");

  return (
    // Jira 문법: 콘텐츠 컬럼은 풀스크린에서도 max-width 캡 — 1152→1280(2026-09-08, 배정 호선 금액 2열 수용)
    // TooltipProvider — 항목 코드 [i] 툴팁이 붙는다(DS Tooltip은 Provider를 품지 않는다)
    <TooltipProvider>
    <div className="mx-auto w-full max-w-7xl space-y-6">
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
          <div className="min-w-0 flex-1 space-y-16">
            {/* ══ 계약 항목 그룹(2026-09-08 3차 확정) — 그룹 머리글(문서·청구와 동급) 아래, 항목 하나가
                하선 패널(rounded-lg border p-5, 채움 없음)에 담긴다. 흰 바닥 위 하선은 "카드 위 카드"가
                아니라 Jira Details 패널과 같은 문법이다. 2차의 좌측 레일은 소속이 약해 폐기.
                항목 코드가 패널 제목이고 코드 설명은 [i] 툴팁으로 접는다. [+ 계약 항목 추가]는 그룹 하단 ══ */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-secondary-foreground">계약 항목 (1)</h2>

              {/* 항목 C-2026-001-01 — 패널 안이 전부 이 항목의 것 */}
              <div className="space-y-6 rounded-lg border p-5">
                {/* 패널 제목 행 — 코드 · [i] 설명 · 패키지 · 척수 (와이어프레임 분류 체계) */}
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-mono font-medium">{ITEM.code}</h3>
                  {/* 코드가 지칭 값이라는 설명 — 상시 문단 대신 툴팁(2026-09-08 확정). 트리거는 button이라
                      키보드 포커스로도 열린다. TooltipContent는 w-fit이라 max-w-xs로 줄바꿈 폭을 준다 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="계약 항목 코드 설명" className="-ml-1.5">
                        <Info className="size-4 text-secondary-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{ITEM_CODE_NOTE}</TooltipContent>
                  </Tooltip>
                  <Badge variant="outline" className="border-primary text-primary">
                    {ITEM.pkg}
                  </Badge>
                  <span className="text-sm text-secondary-foreground">
                    척수 <span className="font-semibold text-foreground">{ITEM.assigned}</span> /{" "}
                    {ITEM.total}
                  </span>
                </div>

              {/* 구독 조건 — 헤더 행 신설 + Optimization 열(2026-09-08 리뷰 반영). 라벨이 없어
                  항목 헤더 아래 정체불명 표로 읽혔다 — 배정 호선과 같은 h4 라벨을 단다 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-foreground">구독 조건</h4>
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">제품</TableHead>
                    <TableHead className="w-56">구독 조건</TableHead>
                    <TableHead>Optimization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ITEM.subs.map((s) => (
                    <TableRow key={s.product}>
                      <TableCell className="font-medium">{s.product}</TableCell>
                      <TableCell className={s.term.startsWith("—") ? "text-secondary-foreground" : ""}>
                        {s.term}
                      </TableCell>
                      <TableCell>
                        {s.opt ? (
                          <Badge variant="secondary" className="font-normal">
                            {s.opt}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* 배정 호선(2026-09-08 개편, 와이어프레임 대조) — 인도 예정일 제거, 총 금액·제품별 금액 신설.
                  [수정] 토글 폐기 → 액션 상시 노출: 배정 행 = 연필(금액 수정) + ⋯ 메뉴(슬롯 취소·슬롯 삭제),
                  미배정 행 = [호선 배정] + ⋯, 취소 행 = 되돌릴 수 없음.
                  종전 pt-8 제거 — 레일 안 블록 간격은 space-y-6이 통일해서 잡는다 */}
              <div className="space-y-2">
                {/* 섹션 머리글 문법 통일(2026-09-08 확정) — 좌: 라벨 + [i] · 우: 섹션 주 액션.
                    문서 등록·청구서 발행과 같은 행 모양이고 와이어프레임도 +슬롯 추가를 머리글 우측에 뒀다.
                    배정 불변 안내(취소 vs 삭제)는 상시 문단 대신 [i] 툴팁 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-secondary-foreground">배정 호선</h4>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="배정 호선 규칙 설명">
                          <Info className="size-4 text-secondary-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{SLOT_NOTE}</TooltipContent>
                    </Tooltip>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="size-4" /> 슬롯 추가
                  </Button>
                </div>
                <Table className="bg-card">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">슬롯</TableHead>
                      <TableHead className="w-44">계약 호선</TableHead>
                      <TableHead className="w-72">총 금액</TableHead>
                      <TableHead>제품별 금액</TableHead>
                      <TableHead className="w-36" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SLOTS.map((s) => (
                      <TableRow
                        key={s.no}
                        className={s.state === "cancelled" ? "opacity-60" : undefined}
                      >
                        <TableCell className="align-top text-secondary-foreground">{s.no}번</TableCell>
                        <TableCell className="whitespace-normal align-top">
                          {s.hull ? (
                            <>
                              <Link
                                href={`${BASE}/vessels/detail`}
                                className="font-medium text-primary hover:underline"
                              >
                                {s.hull}
                              </Link>
                              {s.ship && (
                                <div className="text-sm text-secondary-foreground">{s.ship}</div>
                              )}
                              {s.state === "cancelled" && (
                                <div className="pt-0.5 text-xs text-secondary-foreground">{s.note}</div>
                              )}
                            </>
                          ) : (
                            <SlotStatus state={s.state} />
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {s.totals.length ? (
                            <MoneyList rows={s.totals} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {s.products.length ? (
                            <MoneyList rows={s.products} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {s.state === "cancelled" ? (
                            <span className="text-sm text-secondary-foreground">되돌릴 수 없음</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {s.state === "unassigned" ? (
                                <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                                  호선 배정
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-secondary-foreground"
                                  aria-label={`${s.no}번 호선 금액 수정`}
                                  onClick={() => setPriceSlot(s.no)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-secondary-foreground"
                                    aria-label={`${s.no}번 슬롯 메뉴`}
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>슬롯 취소</DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive">슬롯 삭제</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 항목 파괴 액션 — 항목 레일 하단. 취소 = ghost destructive · 삭제 = 아이콘(헤더 계약 삭제와 동형) */}
              <div className="flex items-center justify-end gap-1">
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
              </div>

              {/* [+ 계약 항목 추가] — 그룹 하단(2026-09-08 확정). 문서·청구 사이에 떠 있던 것을 소속으로 복귀.
                  [시안] contrast(블랙 필드) — 본문 레벨 생성 CTA. DS variant 반영 시 variant="contrast"로 교체 */}
              <Button className="bg-foreground text-background hover:bg-foreground hover:opacity-90">
                <Plus className="size-4" /> 계약 항목 추가
              </Button>
            </section>

            {/* ══ 문서 (2026-09-08 신설) — 본문 평면 섹션. 레일에는 요약 한 줄만 두고 여기로 앵커 ══ */}
            <section id="documents" className="scroll-mt-24 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">문서 ({DOCUMENTS.length})</h2>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" /> 문서 등록
                </Button>
              </div>
              <div className="divide-y rounded-md border bg-card">
                {DOCUMENTS.map((d) => (
                  <div key={d.kind} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {d.kind}
                        <Badge variant="secondary" className="font-mono font-normal">
                          {d.ver}
                        </Badge>
                      </div>
                      <div className="font-mono text-xs text-secondary-foreground">
                        {d.file} · {d.at} · {d.by}
                      </div>
                      <button type="button" className="mt-1 text-xs text-primary hover:underline">
                        이전 버전 {d.prev}건 보기
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" aria-label={`${d.kind} 다운로드`}>
                        <Download className="size-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="size-4" /> 새 버전
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-secondary-foreground"
                        aria-label={`${d.kind} 삭제`}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* 삭제 게이트 안내 — 와이어프레임 1.2.4.3 */}
              <p className="text-xs text-secondary-foreground">
                문서가 {DOCUMENTS.length}건 있어 이 계약은 삭제할 수 없습니다. 외부와 주고받은 문서의 이력이기
                때문이며, 지우려면 문서를 먼저 지웁니다.
              </p>
            </section>

            {/* ══ 청구 (2026-09-08 신설) ══ */}
            <section id="invoices" className="scroll-mt-24 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">청구서 ({INVOICES.length})</h2>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" /> 청구서 발행
                </Button>
              </div>
              {/* 금액 ≠ 대상 합 — 와이어프레임 1.2.5.1 */}
              <Alert>
                <Info className="size-4" />
                <AlertDescription>
                  <span className="font-medium text-foreground">청구 금액은 대상 가격의 합이 아닙니다.</span>{" "}
                  계약금 30%처럼 한 대상을 나눠 청구하므로 금액은 청구서가 따로 담고, 대상은 그 청구서가 어느
                  가격 행을 덮는지만 가리킵니다.
                </AlertDescription>
              </Alert>
              <div className="divide-y rounded-md border bg-card">
                {INVOICES.map((inv) => (
                  <div key={inv.at} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-medium">{inv.at}</span>
                        <Badge variant="secondary" className="font-mono font-normal">
                          {inv.amount}
                        </Badge>
                      </div>
                      <div className="text-xs text-secondary-foreground">
                        대상 {inv.targets}건 · {inv.summary}
                      </div>
                      <button type="button" className="mt-1 text-xs text-primary hover:underline">
                        대상 {inv.targets}건 보기
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-secondary-foreground"
                        aria-label="청구서 삭제"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* 삭제 게이트 안내 — 와이어프레임 1.2.5.3 */}
              <p className="text-xs text-secondary-foreground">
                청구에 걸린 가격 행이 4건 있어 이 계약·계약 항목·슬롯은 삭제할 수 없습니다. 청구한 대상이
                사라지면 그 청구서가 무엇에 대한 것이었는지 답할 수 없기 때문이며, 되돌리려면 청구서를 먼저
                지웁니다.
              </p>
            </section>

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
                {/* 수정 = 저강조 ghost(text-secondary-foreground) — FilterBar 필터 추가·RowsPerPage 초기화와
                    같은 문법(2026-09-08 확정). 4개 상세 페이지 공통 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-secondary-foreground"
                  onClick={() => setEditOpen(true)}
                >
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
                {/* 계약서 시리얼 넘버 — 선택 필드(2026-09-09). 생성 폼에서 넣은 값, 없으면 미입력 */}
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">시리얼 넘버</dt>
                  <dd className="font-mono">{CONTRACT.serial ?? <MissingMark />}</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">고객</dt>
                  <dd>
                    {/* 고객명 자체가 계정 링크 — "→ 계정" 꼬리 제거(2026-09-08) */}
                    <Link
                      href={`${BASE}/accounts/detail`}
                      className="text-primary hover:underline"
                    >
                      {CONTRACT.customer}
                    </Link>
                  </dd>
                </div>
                {/* 배지 행이라 items-center — baseline이면 칩이 라벨보다 내려앉는다 */}
                <div className="flex items-center">
                  <dt className="w-24 shrink-0 text-secondary-foreground">계약 유형</dt>
                  {/* 목록과 같은 배지 문법(2026-09-07) — 신조=회색 채움 / 개조=테두리만 */}
                  <dd>
                    <Badge
                      variant={CONTRACT.ctype === "개조" ? "outline" : "secondary"}
                      className="font-normal"
                    >
                      {CONTRACT.ctype}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="w-24 shrink-0 text-secondary-foreground">계약일</dt>
                  <dd>{CONTRACT.date}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="w-24 shrink-0 text-secondary-foreground">담당</dt>
                  <dd>
                    <Person name={CONTRACT.owner} />
                  </dd>
                </div>
              </dl>
            </section>

            {/* 문서·청구 요약(2026-09-08 확정) — 본문 섹션으로 가는 앵커. 전체를 레일에 넣으면
                계약 정보 280 + 문서 260 + 청구 320 ≈ 860px로 뷰포트를 넘겨 sticky가 무력화된다 */}
            <section className="rounded-lg border bg-card p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center">
                  <dt className="w-24 shrink-0 text-secondary-foreground">문서</dt>
                  <dd>
                    <a href="#documents" className="text-primary hover:underline">
                      {DOCUMENTS.length}건 · 계약서 v2, 견적서 v3
                    </a>
                  </dd>
                </div>
                <div className="flex items-center">
                  <dt className="w-24 shrink-0 text-secondary-foreground">청구</dt>
                  <dd>
                    <a href="#invoices" className="text-primary hover:underline">
                      {INVOICES.length}건 · USD 1,050,000
                    </a>
                  </dd>
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
            {/* 계약명은 자동 생성(2026-09-09 확정) — 수정 모달에서도 읽기 전용. 생성 폼과 같은 문법 */}
            <div className="space-y-2">
              <Label>계약명</Label>
              <p className="text-sm break-all">{CONTRACT.name}</p>
              <p className="text-xs text-secondary-foreground">
                계약일·고객·제품 구성·척수에서 자동으로 만들어집니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-serial">계약서 시리얼 넘버 (선택)</Label>
              <Input id="c-serial" defaultValue={CONTRACT.serial ?? ""} placeholder="예: SN-2026-0001" />
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

      {/* ── 금액 수정 모달(2026-09-08 신설, 와이어프레임 1.4.3) — 배정 행 연필이 연다.
          통화는 호선당 하나 · 제품별 단가 + 무상 기간(구독만) + 파생 계산 · 슬롯 총액은 표와 같은 3행.
          파생값과 총액은 저장하지 않는 계산 결과(1.4.3.2)라 읽기 전용으로 둔다 ── */}
      {/* 모달 문법 = 계정 등록 모달과 동일(2026-09-08 3차): 제목 + 평문 부제(DS 기본 토큰 그대로) · 라벨 위 필드 ·
          제품별 금액은 4열 표(제품 | 금액 | 기간 | 총액) · 기간 = 무상 개월(월 고정, 년 폐기) · 폭 2xl ·
          구분선 위 슬롯 총액 · 맨 아래 규칙 2문단은 은은한 회색 패널(유저 비활성 모달 패널 문법) */}
      <Dialog
        open={priceSlot !== null}
        onOpenChange={(o) => {
          if (o) return;
          setPriceSlot(null);
          setCurrency("USD");
        }}
      >
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
          {priceTarget && (
            <>
              <DialogHeader>
                <DialogTitle>금액 수정 — {priceTarget.no}번 호선</DialogTitle>
                <DialogDescription>
                  {ITEM.code} · {priceTarget.hull}
                  {priceTarget.ship ? ` · ${priceTarget.ship}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* 통화 — 호선당 하나(1.4.3.3). 라벨 위 · 반폭 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-currency">통화</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="price-currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KRW">KRW</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-secondary-foreground">한 호선 안에서는 통화가 하나입니다.</p>
                  </div>
                </div>

                {/* 제품별 금액 — 4열 표. 무상 기간 = 개월 입력(일시납은 —) · 헤더 옆 [i]에 무상 규칙, 총액 = 파생 읽기 전용 */}
                <div className="space-y-2">
                  <Label>제품별 금액</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">제품</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead className="w-36">
                          <span className="inline-flex items-center gap-1.5">
                            무상 기간
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" aria-label="무상 기간 규칙 설명">
                                  <Info className="size-3.5 text-secondary-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                무상 기간은 호선마다 다를 수 있으며 구독 시작일부터 이어지는 앞머리 구간입니다. 그
                                기간에도 라이선스는 유효하고 청구만 하지 않으므로 총액은 줄지만 구독 만료일은
                                움직이지 않습니다. 구독 도중이나 말미에 얹는 무상은 여기가 아니라 크레딧으로 담습니다.
                              </TooltipContent>
                            </Tooltip>
                          </span>
                        </TableHead>
                        <TableHead className="w-48">총액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(PRICING[priceTarget.no] ?? []).map((row) => (
                        <TableRow key={row.product}>
                          <TableCell className="font-medium">{row.product}</TableCell>
                          <TableCell>
                            <Input
                              aria-label={`${row.product} 금액`}
                              placeholder="단가 입력"
                              defaultValue={row.amount ?? ""}
                            />
                          </TableCell>
                          <TableCell>
                            {row.unit ? (
                              <InputGroup>
                                <InputGroupInput
                                  aria-label={`${row.product} 무상 기간`}
                                  placeholder="0"
                                  defaultValue={row.free ?? ""}
                                />
                                <InputGroupAddon align="inline-end">개월</InputGroupAddon>
                              </InputGroup>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-secondary-foreground">
                            {row.total === null ? (
                              <MissingMark />
                            ) : (
                              <>
                                {row.paidMonths ? `× 유상 ${row.paidMonths}개월 = ` : ""}
                                {currency} {fmtAmount(row.total)}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Total — 표 박스 밖, 배경·구분선 없음(2026-09-08 5차 확정). 좌측 Total 라벨은 제품 열 폭(w-28).
                      합산 묶음은 오른쪽 끝에 붙이고(justify-between), 묶음 안은 배정 호선 표의 총 금액 셀과 같은
                      부품(MoneyList: 라벨 열 + 금액 열, 둘 다 좌정렬) — 가장 긴 금액이 오른쪽 끝에 닿는다 · 금액만 굵게 */}
                  <div className="flex items-start justify-between px-2 py-4 text-sm">
                    <span className="w-28 shrink-0 font-medium">Total</span>
                    {/* 행 간격 2배(space-y-2) — 표 셀의 기본 간격은 그대로. 통화 코드는 모달 선택값으로 치환 */}
                    <MoneyList
                      rows={priceTarget.totals.map((t) => ({
                        ...t,
                        value: t.value ? t.value.replace(/^[A-Z]{3}/, currency) : null,
                      }))}
                      strong
                      className="space-y-2"
                    />
                  </div>
                </div>

                {/* 규칙 패널 — 와이어프레임 원문 2문단(1.3.1 · 1.4.3.2 · 1.4.3 · 1.4.3.3). 유저 비활성 모달의 bg-muted 패널 문법 */}
                <div className="space-y-2 rounded-md bg-muted p-3 text-xs text-secondary-foreground">
                  <p>
                    일시납과 구독 단가는 단위가 달라 한 수로 합치지 않습니다. 구독끼리도 기간 단위가 다르면 나눠서
                    냅니다 (1.3.1). 어느 쪽이든 제품별 금액에서 파생하며 저장하지 않습니다 (1.4.3.2) — 한 제품이라도
                    미입력이면 그 줄의 합은 내지 않습니다
                  </p>
                  <p>
                    금액은 비워 둘 수 있습니다 — 미입력이 정상 상태입니다 (1.4.3). 통화만 먼저 정해 두는 것도 됩니다.
                    다만 금액이 있으면 통화는 필수입니다 (1.4.3.3).
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPriceSlot(null)}>
                  취소
                </Button>
                <Button onClick={() => setPriceSlot(null)}>저장</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
