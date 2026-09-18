"use client";

// 업데이트 — ① HiNAS 365 메인 레이아웃 + B 상세 본문(2컬럼)
// 원천: 운영 화면 캡처 6장(2026-09-18) — /update/production · /update/dev 의 요약 · 호선별 현황 · 이력
//
// 2026-09-18 재구성(디자이너 확정)
// - 하위 페이지 = 호선 구분(?view=delivery|test). 운영의 우상단 납품|테스트 토글은 사이드바 자식으로 이관 — 전환 진입점은 하나
// - 운영의 탭 3개(요약·호선별 현황·이력)를 한 페이지로: 본문 = 호선별 현황 · 이력 두 섹션, 요약은 우측 레일 카드
//   (계약 상세와 같은 2컬럼 문법: 본문 min-w-0 flex-1 + sticky 레일 w-80)
// - 레일 ① 업데이트 현황 = 파이프라인 4단계 수직 스텝(DS Timeline) + 종료 상태 3종. 색은 대시보드 규칙 —
//   실패/롤백만 빨강 · 완료 초록 · 나머지 기본색(DES-206: 주황·노랑·보라 토큰 없음)
//   ② 바로가기 = 섹션별 건수 + 가장 최근 항목·상대 시간(두 줄) → 본문 앵커로 스크롤
// - 표는 운영 열 그대로: ID · IMO NUMBER(이름·Hull·Name) · PRODUCT · VERSION(COMMON·PRODUCT From→To) ·
//   STATUS · DATE RANGE · ACTIONS(호선 업데이트 + 더보기)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { PageHeader } from "@ds/ui/ui/page-header";
import { Card } from "@ds/ui/ui/card";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { Progress } from "@ds/ui/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";
import { Timeline, TimelineItem, TimelineTitle } from "@ds/ui/ui/timeline";
import { ROWS_PER_PAGE_DEFAULT } from "@ds/ui/ui/rows-per-page";
import {
  FilterBar,
  OPS_DATE,
  OPS_SELECT,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";
// 상세 조건 매처(2026-09-09 두 앱 통일) — 세일즈 365 목록과 같은 부품
import { BASE_NOW, passDate, passSelect } from "../../_detail/filter-match";
// 본문 표 푸터 = 페이저만 가운데(2026-09-18 디자이너 확정) — 릴리즈 노트 개발자용 표와 같은 부품
import { BodyPager } from "../../_detail/body-pager";

/* ---------------------------------------------------- 상태 · 파이프라인 */

type Status =
  | "PENDING"
  | "DOWNLOADING"
  | "READY"
  | "HELM UPDATING"
  | "COMPLETED"
  | "UPDATE FAILED"
  | "SYSTEM ROLLED BACK"
  | "CANCELED";

// data-status — DS StatusBadge(도트 8px · text-sm · 배경 없음). 실패·롤백만 error(글자까지 빨강)
const STATUS_TONE: Record<Status, "neutral" | "success" | "error" | "progress"> = {
  PENDING: "neutral",
  DOWNLOADING: "progress",
  READY: "neutral",
  "HELM UPDATING": "progress",
  COMPLETED: "success",
  "UPDATE FAILED": "error",
  "SYSTEM ROLLED BACK": "error",
  CANCELED: "neutral",
};
const STATUS_OPTIONS = Object.keys(STATUS_TONE) as Status[];

// 파이프라인 4단계(진행) — 레일 수직 스텝
const PIPELINE: { key: Status; label: string }[] = [
  { key: "PENDING", label: "대기" },
  { key: "DOWNLOADING", label: "다운로드" },
  { key: "READY", label: "적용 대기" },
  { key: "HELM UPDATING", label: "적용 중" },
];
// 종료 상태 3종 — 대시보드 색 규칙(실패/롤백 빨강 · 완료 초록 · 취소 기본)
const TERMINALS: { label: string; keys: Status[]; tone: string }[] = [
  { label: "완료", keys: ["COMPLETED"], tone: "text-success" },
  { label: "실패/롤백", keys: ["UPDATE FAILED", "SYSTEM ROLLED BACK"], tone: "text-destructive" },
  { label: "취소", keys: ["CANCELED"], tone: "" },
];

/* ---------------------------------------------------- 목업 데이터 */

type Product = "CONTROL" | "SHIELD" | "NAVIGATION" | "SVM";
type Attempt = {
  id: string;
  vessel: string;
  hull: string;
  product: Product;
  status: Status;
  common: [string, string];
  prod: [string, string];
  start: string;
  startAgo: string;
  end: string | null;
  endAgo: string | null;
};

type Vessel = { vessel: string; hull: string; product: Product; status: Status; attempts: number };

// 운영 캡처의 호선 이름·제품·현재 상태를 그대로 옮긴 시드(테스트 13척 · 납품 3척)
const TEST_VESSELS: Vessel[] = [
  { vessel: "NEW_SHIELD", hull: "1234567", product: "SHIELD", status: "HELM UPDATING", attempts: 4 },
  { vessel: "new_shield_test_0918", hull: "nst0918", product: "SHIELD", status: "COMPLETED", attempts: 3 },
  { vessel: "config_test", hull: "config_test", product: "CONTROL", status: "COMPLETED", attempts: 6 },
  { vessel: "DEV_TDT2_FULLSET", hull: "DEV_TDT2_FULLSET", product: "CONTROL", status: "COMPLETED", attempts: 5 },
  { vessel: "shield_dev_0916", hull: "SD0916", product: "SHIELD", status: "COMPLETED", attempts: 7 },
  { vessel: "backup_restore_test_1", hull: "backup_restore_test_1", product: "NAVIGATION", status: "CANCELED", attempts: 4 },
  { vessel: "HELLO_SHIELD_2", hull: "HELLO_SHIELD_2", product: "SHIELD", status: "COMPLETED", attempts: 3 },
  { vessel: "BETA_TEST_DEV_1", hull: "BETA_TEST_DEV_1", product: "CONTROL", status: "COMPLETED", attempts: 5 },
  { vessel: "IDEMPOTENCY_TEST", hull: "IDEMPOTENCY_TEST", product: "CONTROL", status: "COMPLETED", attempts: 6 },
  { vessel: "FULL_TEST_1", hull: "FULL_TEST_1", product: "CONTROL", status: "COMPLETED", attempts: 4 },
  { vessel: "svm_stitch_test", hull: "SVM0912", product: "SVM", status: "DOWNLOADING", attempts: 5 },
  { vessel: "nav_route_test_2", hull: "NRT0910", product: "NAVIGATION", status: "UPDATE FAILED", attempts: 6 },
  { vessel: "shield_rollback_test", hull: "SRT0908", product: "SHIELD", status: "SYSTEM ROLLED BACK", attempts: 4 },
];

const DELIVERY_VESSELS: Vessel[] = [
  { vessel: "gpu_update_test_1", hull: "gpu_update_test_1", product: "CONTROL", status: "COMPLETED", attempts: 2 },
  { vessel: "HYUNDAI GLOBE", hull: "9876543", product: "NAVIGATION", status: "READY", attempts: 3 },
  { vessel: "PACIFIC PIONEER", hull: "9871234", product: "SVM", status: "COMPLETED", attempts: 2 },
];

// 목업 시각 = 운영 캡처 시각(2026-09-18 08:52) 기준으로 분 단위 역산 — 난수 없이 결정적으로 만든다
const NOW = new Date(2026, 8, 18, 8, 52);
const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const agoText = (min: number) => {
  if (min < 60) return `${min}분 전`;
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`;
  if (min < 60 * 24 * 30) return `${Math.floor(min / (60 * 24))}일 전`;
  return `${Math.floor(min / (60 * 24 * 30))}개월 전`;
};
const minus = (min: number) => new Date(NOW.getTime() - min * 60000);
// 옛 시도의 상태 — 최신 1건만 호선의 현재 상태이고, 그 아래는 완료 위주에 실패·롤백·취소가 섞인다
const PAST: Status[] = ["COMPLETED", "COMPLETED", "UPDATE FAILED", "COMPLETED", "SYSTEM ROLLED BACK", "CANCELED"];
const RUNNING: Status[] = ["PENDING", "DOWNLOADING", "READY", "HELM UPDATING"];

function buildHistory(vessels: Vessel[]): Attempt[] {
  const rows: Attempt[] = [];
  vessels.forEach((v, i) => {
    for (let k = 0; k < v.attempts; k += 1) {
      const status = k === 0 ? v.status : PAST[(i + k) % PAST.length];
      const running = RUNNING.includes(status);
      const offset = i * 173 + k * 827 + 55;
      const startAt = minus(offset);
      const endAt = running ? null : minus(offset - (8 + ((i + k) % 6)));
      const major = 4 - (i % 2);
      rows.push({
        id: (0x3e1882 + i * 0x1d3f7 + k * 0x2b1).toString(16).slice(0, 6),
        vessel: v.vessel,
        hull: v.hull,
        product: v.product,
        status,
        common: [`v${major}.0.0-rc.${20 + i + k}`, `v${major}.0.0-rc.${21 + i + k}`],
        prod: [`v${major - 1}.0.${i % 3}`, `v${major - 1}.0.${(i % 3) + 1}`],
        start: stamp(startAt),
        startAgo: agoText(offset),
        end: endAt ? stamp(endAt) : null,
        endAgo: endAt ? agoText(offset - (8 + ((i + k) % 6))) : null,
      });
    }
  });
  return rows.sort((a, b) => (a.start < b.start ? 1 : -1));
}

const HISTORY: Record<Kind, Attempt[]> = {
  delivery: buildHistory(DELIVERY_VESSELS),
  test: buildHistory(TEST_VESSELS),
};
// 호선별 현황 = 호선마다 가장 최근 시도 1건
const currentRows = (kind: Kind) => {
  const seen = new Set<string>();
  return HISTORY[kind].filter((r) => (seen.has(r.vessel) ? false : (seen.add(r.vessel), true)));
};

/* ---------------------------------------------------- 하위 페이지 */

const KINDS = { delivery: "납품 호선", test: "테스트 호선" } as const;
type Kind = keyof typeof KINDS;
const isKind = (v: string | null): v is Kind => v !== null && v in KINDS;

type ViewState = "default" | "loading" | "progress" | "error" | "empty";
type SortField = "id" | "vessel";

// useSearchParams는 Suspense 경계 필수(정적 export) — 릴리즈 노트·Developer/QA와 같은 패턴
export default function UpdatesPage() {
  return (
    <React.Suspense fallback={null}>
      <UpdatesBody />
    </React.Suspense>
  );
}

function UpdatesBody() {
  const [view, setView] = React.useState<ViewState>("default");
  const raw = useSearchParams().get("view");
  const kind: Kind = isKind(raw) ? raw : "delivery";

  const vessels = currentRows(kind);
  const history = HISTORY[kind];
  const empty = view === "empty";
  const count = (keys: Status[]) => (empty ? 0 : vessels.filter((r) => keys.includes(r.status)).length);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${KINDS[kind]} 업데이트`}
        actions={<StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />}
      />

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <Card variant="flat" className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">업데이트 현황을 불러오는 중입니다…</p>
        </Card>
      )}
      {view === "error" && (
        <ErrorState
          title="업데이트 현황을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {(view === "default" || empty) && (
        // 2컬럼 = 계약 상세와 같은 문법(본문 min-w-0 flex-1 · 레일 sticky top-22 w-80)
        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1 space-y-16">
            <UpdateSection
              id="vessels"
              title="호선별 현황"
              rows={empty ? [] : vessels}
              emptyText="진행 중이거나 완료된 업데이트가 없습니다."
              withDateFilter={false}
            />
            <UpdateSection
              id="history"
              title="이력"
              rows={empty ? [] : history}
              emptyText="업데이트 이력이 없습니다."
              withDateFilter
            />
          </div>

          <aside className="sticky top-22 w-80 shrink-0 space-y-4 self-start">
            {/* ① 업데이트 현황 — 파이프라인 4단계 수직 스텝(DS Timeline) + 종료 상태 3종 */}
            <Card variant="flat" className="p-4">
              <h2 className="text-xs font-semibold uppercase text-secondary-foreground">업데이트 현황</h2>
              <Timeline className="mt-3">
                {PIPELINE.map((s) => {
                  const n = count([s.key]);
                  return (
                    <TimelineItem key={s.key} status={n > 0 ? "current" : "default"}>
                      <div className="flex items-center justify-between gap-3">
                        <TimelineTitle className="font-normal">{s.label}</TimelineTitle>
                        <span className="font-mono text-sm">{n}</span>
                      </div>
                    </TimelineItem>
                  );
                })}
              </Timeline>
              <div className="mt-3 space-y-2 border-t pt-3">
                {TERMINALS.map((t) => (
                  <div key={t.label} className="flex items-center justify-between gap-3">
                    <span className={"text-sm " + (t.tone || "text-secondary-foreground")}>{t.label}</span>
                    <span className={"font-mono text-sm " + t.tone}>{count(t.keys)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ② 바로가기 — 건수(링크) + 가장 최근 항목·상대 시간(두 줄, 2026-09-18 디자이너 확정) */}
            <Card variant="flat" className="p-4">
              <dl className="space-y-3 text-sm">
                {(
                  [
                    ["vessels", "호선별 현황", empty ? [] : vessels],
                    ["history", "이력", empty ? [] : history],
                  ] as const
                ).map(([anchor, label, list]) => (
                  <div key={anchor}>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-secondary-foreground">{label}</dt>
                      <dd>
                        <a href={`#${anchor}`} className="text-primary hover:underline">
                          {list.length}건
                        </a>
                      </dd>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-secondary-foreground">
                      {list.length > 0 ? (
                        <>
                          <span className="font-mono">{list[0].vessel}</span> · {list[0].startAgo}
                        </>
                      ) : (
                        "최근 항목 없음"
                      )}
                    </p>
                  </div>
                ))}
              </dl>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------- 본문 섹션(검색·필터 + 표 + 푸터) */

function UpdateSection({
  id,
  title,
  rows,
  emptyText,
  withDateFilter,
}: {
  id: string;
  title: string;
  rows: Attempt[];
  emptyText: string;
  withDateFilter: boolean;
}) {
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  // 페이지당 선택은 없다(본문 표 푸터 규칙) — DS 기본 15 고정
  const pageSize = ROWS_PER_PAGE_DEFAULT;
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortField>("id");
  const [sortAsc, setSortAsc] = React.useState(false);

  const filters: FilterDef[] = [
    { name: "product", label: "제품", options: ["CONTROL", "SHIELD", "NAVIGATION", "SVM"], operators: OPS_SELECT, base: true },
    { name: "status", label: "상태", options: STATUS_OPTIONS, operators: OPS_SELECT },
    ...(withDateFilter
      ? [{ name: "requested", label: "요청 기간", kind: "date", operators: OPS_DATE, now: BASE_NOW } as FilterDef]
      : []),
  ];

  const q = keyword.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (!q || `${r.vessel} ${r.hull} ${r.id}`.toLowerCase().includes(q)) &&
      passSelect(filterValues.product, r.product) &&
      passSelect(filterValues.status, r.status) &&
      (!withDateFilter || passDate(filterValues.requested, r.start.slice(0, 10))),
  );
  const sorted = [...filtered].sort((a, b) => {
    const key = sort === "id" ? "id" : "vessel";
    const cmp = a[key].localeCompare(b[key]);
    return sortAsc ? cmp : -cmp;
  });
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => setPage(1), [keyword, filterValues]);
  const toggleSort = (field: SortField) => {
    setSort(field);
    setSortAsc((a) => (sort === field ? !a : false));
  };

  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      {/* 본문 섹션 제목 = 상세 화면 문법(계약 항목·문서·청구와 같은 text-sm 보조색) — 페이지 제목(text-lg)보다 작아야 한다 */}
      <h2 className="text-sm font-medium text-secondary-foreground">
        {title} ({rows.length})
      </h2>
      <FilterBar
        searchPlaceholder="호선 · Hull · ID 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={filters}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
      />

      {rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{emptyText}</EmptyTitle>
            <EmptyDescription>호선에 업데이트를 요청하면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                {/* 새 규칙(2026-08-26): 헤더는 정렬 전담 — 필터는 FilterBar로 */}
                <TableHead>
                  <SortBtn label="ID" active={sort === "id"} asc={sortAsc} onClick={() => toggleSort("id")} />
                </TableHead>
                <TableHead>
                  <SortBtn
                    label="IMO Number"
                    active={sort === "vessel"}
                    asc={sortAsc}
                    onClick={() => toggleSort("vessel")}
                  />
                </TableHead>
                <TableHead className="uppercase">Product</TableHead>
                <TableHead className="uppercase">Version</TableHead>
                <TableHead className="uppercase">Status</TableHead>
                <TableHead className="uppercase">Date Range</TableHead>
                <TableHead className="uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-secondary-foreground">
                    조건에 맞는 업데이트가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="align-top font-mono text-sm">{r.id}</TableCell>
                    <TableCell className="align-top">
                      {/* 호선 = 이름 링크 + Hull · Name 보조 두 줄(운영 열 재현) */}
                      <div className="space-y-0.5">
                        <a href="#" className="font-medium text-primary hover:underline">
                          {r.vessel}
                        </a>
                        <p className="text-xs text-secondary-foreground">Hull {r.hull}</p>
                        <p className="text-xs text-secondary-foreground">Name {r.vessel}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant="outline">{r.product}</Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1.5 text-xs">
                        {(
                          [
                            ["COMMON", r.common],
                            ["PRODUCT", r.prod],
                          ] as const
                        ).map(([label, [from, to]]) => (
                          <div key={label} className="flex gap-2">
                            <span className="w-16 shrink-0 text-secondary-foreground">{label}</span>
                            <div className="space-y-0.5">
                              <p>
                                <span className="inline-block w-9 text-secondary-foreground">From</span>
                                <span className="font-mono">{from}</span>
                              </p>
                              <p>
                                <span className="inline-block w-9 text-secondary-foreground">To</span>
                                <span className="font-mono">{to}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} bg={false} />
                    </TableCell>
                    <TableCell className="align-top">
                      {/* 열 폭 절약(2026-09-18): 한 줄에 라벨+시각+상대시간을 늘어놓던 것을 2줄로 — 상대 시간은 다음 줄 */}
                      <div className="space-y-1.5 text-sm">
                        {(
                          [
                            ["Start", r.start, r.startAgo],
                            ["End", r.end ?? "-", r.endAgo],
                          ] as const
                        ).map(([label, value, ago]) => (
                          <div key={label} className="flex gap-2">
                            <span className="w-10 shrink-0 pt-0.5 text-xs uppercase text-secondary-foreground">
                              {label}
                            </span>
                            <div>
                              <p className="font-mono">{value}</p>
                              {ago && <p className="text-xs text-secondary-foreground">({ago})</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-1">
                        {/* 라벨은 「업데이트」 — 표 안이라 대상(호선)은 행이 이미 말한다(2026-09-18 열 폭 절약) */}
                        <Button size="sm">
                          <RefreshCw className="size-4" /> 업데이트
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="더 보기">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>상세 보기</DropdownMenuItem>
                            <DropdownMenuItem>로그 다운로드</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive">업데이트 취소</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <BodyPager page={page} count={Math.ceil(filtered.length / pageSize)} onChange={setPage} />
        </>
      )}
    </section>
  );
}

// 정렬 버튼 — 헤더 전담 규칙(2026-08-26)
function SortBtn({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  const Icon = !active ? ChevronsUpDown : asc ? ArrowUp : ArrowDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={"-ml-2 h-7 gap-1 px-2 uppercase " + (active ? "" : "text-secondary-foreground")}
    >
      {label}
      <Icon className="size-3.5" />
    </Button>
  );
}
