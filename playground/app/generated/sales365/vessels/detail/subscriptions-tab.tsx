"use client";

// S7 ② 구독 탭 — 제품별 라이선스 타임라인 + 관리 (와이어프레임 v2 B-4, 2026-08-26)
// - 상태 판정: 취소 → 예정 → 중단 → 만료 → 진행 중 (먼저 맞는 것 하나) · 진행 중일 때만 라이선스 유효
// - 만료일 = 시작일 + 기간 + Σ(연장 적용 중단) + Σ(크레딧) · 조기 종료면 지정 고정값
// - 구독 이력은 (호선, 제품) 축으로 이어진다 — 체인이 계약 여러 개에 걸릴 수 있다
// - 안 A: 제품별 미니 타임라인(클릭 = 선택) · 안 B: 선택 제품 확대 3레인 + 현재 구독 관리
// - 선행 구독은 조회 전용(만료일이 후속 시작일을 통과시킨 근거) · 취소 구독은 목록 제외
// - 산출물 목적 = 시각 스펙 — 액션 버튼은 활성 규칙·비활성 사유 툴팁까지(모달은 요청 시)

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ds/ui/ui/tooltip";

/* ---------------------------------------------------------------- 날짜 유틸 (UTC 고정) */

const TODAY = "2026-08-21"; // 기준일 — S11과 같은 값

const d = (s: string) => new Date(s + "T00:00:00Z");
const iso = (dt: Date) => dt.toISOString().slice(0, 10);
const addMonths = (s: string, n: number) => {
  const t = d(s);
  t.setUTCMonth(t.getUTCMonth() + n);
  return iso(t);
};
const addDays = (s: string, n: number) => {
  const t = d(s);
  t.setUTCDate(t.getUTCDate() + n);
  return iso(t);
};
const dayDiff = (a: string, b: string) =>
  Math.round((d(b).getTime() - d(a).getTime()) / 86400000);

/* ---------------------------------------------------------------- 데이터 (와이어프레임 이식) */

type Pause = {
  id: string;
  from: string;
  to: string | null;
  code: string;
  detail: string;
  extend: boolean | null;
};
type Credit = { id: string; days: number; from: string; code: string; detail: string };
type Sub = {
  id: string;
  contract: string;
  item: string;
  termMonths: number;
  start: string | null;
  cancelled: boolean;
  early: { end: string; code: string; detail: string } | null;
  pauses: Pause[];
  credits: Credit[];
};
type Group = { prod: string; chain: Sub[] };

const PAUSE_CODES: Record<string, string> = { DRY_DOCK: "입거", LAID_UP: "계선" };
const CREDIT_CODES: Record<string, string> = { AVAILABILITY_SLA: "가동률 SLA 미달" };
const EARLY_CODES: Record<string, string> = { VESSEL_SOLD: "선박 매각" };

const SUBS: Group[] = [
  {
    prod: "Control",
    // 체인이 계약 3개에 걸친다 — 구독 이력은 (호선, 제품) 기준
    chain: [
      { id: "s-ctl-0", contract: "C-2020-005", item: "C-2020-005-01", termMonths: 36, start: "2020-02-28", cancelled: false, early: null, pauses: [], credits: [] },
      {
        id: "s-ctl-1", contract: "C-2023-011", item: "C-2023-011-01", termMonths: 36, start: "2023-03-01", cancelled: false, early: null,
        pauses: [{ id: "p0", from: "2024-11-01", to: "2025-01-15", code: "DRY_DOCK", detail: "정기 입거 · 도장 및 프로펠러 정비", extend: true }],
        credits: [{ id: "c0", days: 20, from: "2025-06-01", code: "AVAILABILITY_SLA", detail: "2025-04 가동률 97.4% · SLA 99% 미달분" }],
      },
      {
        id: "s-ctl-2", contract: "C-2026-001", item: "C-2026-001-01", termMonths: 36, start: "2026-07-01", cancelled: false, early: null,
        pauses: [{ id: "p1", from: "2027-01-10", to: "2027-03-01", code: "DRY_DOCK", detail: "정기 입거 · 상가 수리", extend: true }],
        credits: [{ id: "c1", days: 15, from: "2028-05-01", code: "AVAILABILITY_SLA", detail: "2028-03 가동률 98.2% · SLA 99% 미달분" }],
      },
    ],
  },
  {
    prod: "SVM",
    // 개시일 미정 → 예정 · 만료일도 비어 있다
    chain: [{ id: "s-svm-1", contract: "C-2026-001", item: "C-2026-001-01", termMonths: 12, start: null, cancelled: false, early: null, pauses: [], credits: [] }],
  },
  {
    prod: "Navigation",
    // 재개일 없는 열린 중단 — 호선 구독당 최대 1건
    chain: [{
      id: "s-nav-1", contract: "C-2025-004", item: "C-2025-004-01", termMonths: 24, start: "2025-03-01", cancelled: false, early: null,
      pauses: [{ id: "p2", from: "2026-08-01", to: null, code: "LAID_UP", detail: "계선 · 용선 계약 종료 대기", extend: null }],
      credits: [],
    }],
  },
  {
    prod: "Cloud",
    chain: [{ id: "s-cld-1", contract: "C-2024-016", item: "C-2024-016-01", termMonths: 36, start: "2024-02-01", cancelled: false, early: { end: "2026-05-31", code: "VESSEL_SOLD", detail: "선박 매각 · 2026-05-31자 인도" }, pauses: [], credits: [] }],
  },
  {
    // 만료됐지만 갱신 계약이 없다 → 여전히 가장 최근 구독 · 액션 대상
    prod: "Shield",
    chain: [{ id: "s-shd-1", contract: "C-2023-020", item: "C-2023-020-01", termMonths: 24, start: "2024-03-01", cancelled: false, early: null, pauses: [], credits: [] }],
  },
];

/* ---------------------------------------------------------------- 조회 시점 계산 */

// 계약상 만기일 = 시작일 + 기간 + Σ(연장 적용 중단 일수) + Σ(크레딧 일수)
const contractEnd = (s: Sub) => {
  if (!s.start) return null;
  let end = addMonths(s.start, s.termMonths);
  s.pauses.forEach((p) => {
    if (p.to && p.extend) end = addDays(end, dayDiff(p.from, p.to));
  });
  s.credits.forEach((c) => (end = addDays(end, c.days)));
  return end;
};
// 구독 만료일 — 조기 종료면 지정 고정값
const subEnd = (s: Sub) => (s.early ? s.early.end : contractEnd(s));

type Status = "진행 중" | "중단" | "예정" | "만료" | "취소";
const statusOf = (s: Sub): Status => {
  if (s.cancelled) return "취소";
  if (!s.start || s.start > TODAY) return "예정";
  if (s.pauses.some((p) => p.from <= TODAY && (!p.to || TODAY < p.to))) return "중단";
  const e = subEnd(s);
  if (e && e <= TODAY) return "만료";
  return "진행 중";
};
const ST_DOT: Record<Status, string> = {
  "진행 중": "bg-success",
  중단: "bg-muted-foreground",
  예정: "bg-primary",
  만료: "bg-destructive",
  취소: "bg-destructive",
};
const currentOf = (g: Group) => g.chain[g.chain.length - 1];

const endWhy = (s: Sub) => {
  if (!s.start) return "시작일이 정해지면 산출됩니다";
  if (s.early) return `조기 종료 · ${EARLY_CODES[s.early.code] ?? s.early.code} · 계약상 만기일 ${contractEnd(s)}`;
  const adj = s.pauses.filter((p) => p.to && p.extend).length + s.credits.length;
  return adj ? `${s.termMonths}개월 + 조정 ${adj}건` : `${s.termMonths}개월`;
};

/* ---------------------------------------------------------------- 타임라인 축 */

// 도메인: 데이터 전체 범위 + 여백 6개월
const DOMAIN_FROM = "2019-09-01";
const DOMAIN_TO = "2029-12-31";
const SPAN = dayDiff(DOMAIN_FROM, DOMAIN_TO);
const pctOf = (date: string) => `${((dayDiff(DOMAIN_FROM, date) / SPAN) * 100).toFixed(2)}%`;
const wOf = (from: string, to: string) =>
  `${((dayDiff(from, to) / SPAN) * 100).toFixed(2)}%`;
const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029"];

function TodayLine() {
  return (
    <span
      className="absolute inset-y-0 w-px bg-destructive"
      style={{ left: pctOf(TODAY) }}
      aria-hidden
    />
  );
}

// 한 구독의 발효 구간 — 중단은 틈, 조기 종료 이후는 고스트
function SubSegments({ s }: { s: Sub }) {
  if (!s.start) return null;
  const end = subEnd(s);
  const cEnd = contractEnd(s);
  if (!end || !cEnd) return null;
  // 발효 구간을 중단으로 쪼갠다
  const pieces: { from: string; to: string }[] = [];
  let cursor = s.start;
  [...s.pauses].sort((a, b) => a.from.localeCompare(b.from)).forEach((p) => {
    if (p.from > cursor) pieces.push({ from: cursor, to: p.from });
    cursor = p.to ?? end;
  });
  if (cursor < end) pieces.push({ from: cursor, to: end });
  return (
    <>
      {pieces.map((pc, i) => (
        <span
          key={i}
          className="absolute inset-y-1 rounded-sm bg-primary"
          style={{ left: pctOf(pc.from), width: wOf(pc.from, pc.to) }}
        />
      ))}
      {/* 중단 틈 — muted 블록 */}
      {s.pauses.map((p) => (
        <span
          key={p.id}
          className="absolute inset-y-1 rounded-sm bg-muted-foreground"
          style={{ left: pctOf(p.from), width: wOf(p.from, p.to ?? end) }}
        />
      ))}
      {/* 조기 종료로 실현되지 않은 계약상 구간 — 고스트 */}
      {s.early && cEnd > end && (
        <span
          className="absolute inset-y-1 rounded-sm border border-dashed border-input"
          style={{ left: pctOf(end), width: wOf(end, cEnd) }}
        />
      )}
    </>
  );
}

function AxisRow() {
  return (
    <div className="relative h-5">
      {YEARS.map((y) => (
        <span
          key={y}
          className="absolute top-0 text-xs text-secondary-foreground"
          style={{ left: pctOf(`${y}-01-01`) }}
        >
          {y}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- 화면 */

function StatusPill({ st }: { st: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`size-2 rounded-full ${ST_DOT[st]}`} /> {st}
    </span>
  );
}

// 액션 버튼 — 비활성 사유는 툴팁(와이어프레임 활성 규칙 이식)
function ActionBtn({ label, why }: { label: string; why?: string }) {
  const btn = (
    <Button variant="outline" size="sm" disabled={Boolean(why)}>
      {label}
    </Button>
  );
  if (!why) return btn;
  return (
    <Tooltip>
      {/* disabled 버튼도 툴팁이 뜨게 span 래핑 */}
      <TooltipTrigger asChild>
        <span tabIndex={0}>{btn}</span>
      </TooltipTrigger>
      <TooltipContent>{why}</TooltipContent>
    </Tooltip>
  );
}

function ActionBtns({ s, st }: { s: Sub; st: Status }) {
  if (st === "취소") return null;
  const open = s.pauses.find((p) => !p.to);
  if (s.early)
    return (
      <>
        <Button variant="outline" size="sm">조기 종료 해제</Button>
        <ActionBtn label="중단" why="조기 종료된 구독은 중단할 수 없습니다" />
        <ActionBtn label="크레딧 부여" why="조기 종료된 구독에는 크레딧을 부여할 수 없습니다" />
      </>
    );
  return (
    <>
      {open ? (
        <Button size="sm">재개</Button>
      ) : (
        <ActionBtn
          label="중단"
          why={!s.start ? "시작일이 미정인 구독은 중단할 수 없습니다" : st === "만료" ? "만료일이 도래한 구독은 중단할 수 없습니다" : undefined}
        />
      )}
      <ActionBtn label="크레딧 부여" why={!s.start ? "시작일이 미정인 구독에는 부여할 수 없습니다" : undefined} />
      <ActionBtn
        label="조기 종료"
        why={!s.start ? "시작일이 미정인 구독은 조기 종료할 수 없습니다" : st === "만료" ? "만료일이 이미 도래했습니다" : undefined}
      />
    </>
  );
}

// 기간 조정 이력 — 중단·크레딧·조기 종료 나열
function AdjustList({ s }: { s: Sub }) {
  const items: React.ReactNode[] = [];
  s.pauses.forEach((p) => {
    items.push(
      <li key={p.id}>
        <span className="font-medium">중단</span> {p.from} ~ {p.to ?? "재개 대기"} ·{" "}
        {PAUSE_CODES[p.code] ?? p.code} · {p.detail}
        {p.to && ` · ${p.extend ? "만료일 연장 적용" : "연장 없음"}`}
      </li>,
    );
  });
  s.credits.forEach((c) => {
    items.push(
      <li key={c.id}>
        <span className="font-medium">크레딧 +{c.days}일</span> 적용 시작 {c.from} ·{" "}
        {CREDIT_CODES[c.code] ?? c.code} · {c.detail}
      </li>,
    );
  });
  if (s.early)
    items.push(
      <li key="early">
        <span className="font-medium">조기 종료</span> {s.early.end} ·{" "}
        {EARLY_CODES[s.early.code] ?? s.early.code} · {s.early.detail}
      </li>,
    );
  if (!items.length)
    return <p className="text-sm text-secondary-foreground">조정 이력이 없습니다.</p>;
  return <ul className="space-y-1 text-sm">{items}</ul>;
}

export function SubscriptionsTab() {
  // 취소된 구독은 목록에서 제외 — 예외 토글 없음
  const shown = SUBS.filter((g) => statusOf(currentOf(g)) !== "취소");
  const [picked, setPicked] = React.useState(shown[0]?.prod ?? null);
  const [pastOpen, setPastOpen] = React.useState(false);

  const g = shown.find((x) => x.prod === picked);
  const cur = g ? currentOf(g) : null;
  const st = cur ? statusOf(cur) : null;

  return (
    <div className="space-y-4">
      {/* ── 범례 ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-5 rounded-sm bg-primary" /> 라이선스 발효 기간
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-5 rounded-sm bg-muted-foreground" /> 중단 — 계약은 살아 있고
          라이선스만 정지
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-5 rounded-sm border border-dashed border-input" /> 조기 종료로
          실현되지 않은 계약상 구간
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-destructive" /> 오늘
        </span>
      </div>

      {/* ── 안 A — 제품별 타임라인(클릭 = 선택) ── */}
      <div className="space-y-1 rounded-lg border bg-card p-4">
        {shown.map((grp) => {
          const gst = statusOf(currentOf(grp));
          const active = grp.prod === picked;
          return (
            <button
              key={grp.prod}
              type="button"
              className={
                "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left " +
                (active ? "bg-muted" : "hover:bg-accent")
              }
              onClick={() => setPicked(grp.prod)}
            >
              <span className="flex w-32 shrink-0 items-center gap-2 text-sm font-medium">
                {grp.prod} <StatusPill st={gst} />
              </span>
              <span className="relative h-6 flex-1 overflow-hidden rounded-sm">
                {grp.chain.map((s) => (
                  <SubSegments key={s.id} s={s} />
                ))}
                <TodayLine />
              </span>
            </button>
          );
        })}
        <div className="flex gap-3 px-2">
          <span className="w-32 shrink-0" />
          <div className="relative flex-1">
            <AxisRow />
          </div>
        </div>
      </div>

      {/* ── 안 B — 선택 제품 확대 + 관리 ── */}
      {g && cur && st && (
        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <span className="font-medium">{g.prod}</span>
            <span className="text-sm text-secondary-foreground">{cur.termMonths}개월 구독</span>
            <span className="text-xs text-secondary-foreground">
              구독 {g.chain.length}건 · 계약 {[...new Set(g.chain.map((x) => x.contract))].length}건
            </span>
          </div>

          {/* 3레인 — 계약 기간(고스트) / 발효 / 조정 시점 */}
          <div className="space-y-2 px-4 pt-4">
            {[
              {
                label: "구독 계약 기간",
                node: (
                  <>
                    {g.chain.map((s) => {
                      if (!s.start) return null;
                      const ce = contractEnd(s);
                      return (
                        ce && (
                          <React.Fragment key={s.id}>
                            <span
                              className="absolute inset-y-1 rounded-sm border border-dashed border-input"
                              style={{ left: pctOf(s.start), width: wOf(s.start, ce) }}
                            />
                            <span
                              className="absolute top-0 truncate text-xs text-secondary-foreground"
                              style={{ left: pctOf(s.start) }}
                            >
                              {s.contract} · {s.termMonths}개월
                            </span>
                          </React.Fragment>
                        )
                      );
                    })}
                    <TodayLine />
                  </>
                ),
              },
              {
                label: "라이선스 발효 기간",
                node: (
                  <>
                    {g.chain.map((s) => (
                      <SubSegments key={s.id} s={s} />
                    ))}
                    <TodayLine />
                  </>
                ),
              },
            ].map((lane) => (
              <div key={lane.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-secondary-foreground">{lane.label}</span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-sm bg-muted">{lane.node}</div>
              </div>
            ))}
            <div className="flex gap-3">
              <span className="w-32 shrink-0" />
              <div className="relative flex-1">
                <AxisRow />
              </div>
            </div>
          </div>

          {/* 현재 구독 */}
          <div className="space-y-3 px-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {g.chain.length === 1 ? "최초 구독" : `${g.chain.length}차 구독`}
              </Badge>
              <Badge className="font-normal">현재</Badge>
              <StatusPill st={st} />
              <span
                className={
                  "text-xs font-medium " +
                  (st === "진행 중" ? "text-success" : "text-secondary-foreground")
                }
              >
                라이선스 {st === "진행 중" ? "유효" : "정지"}
              </span>
              <span className="ml-auto flex flex-wrap gap-2">
                <ActionBtns s={cur} st={st} />
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-secondary-foreground">소속 계약</span>
                <Badge variant="secondary" className="font-normal">
                  {cur.contract}
                </Badge>
                <span className="text-xs text-secondary-foreground">{cur.item}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 shrink-0 text-secondary-foreground">구독 시작일</span>
                <span>
                  {cur.start ?? (
                    <span className="text-secondary-foreground">
                      미정 · 납품 제품 상세에서 입력
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 shrink-0 text-secondary-foreground">구독 만료일</span>
                <span>
                  {subEnd(cur) ?? <span className="text-secondary-foreground">—</span>}{" "}
                  <span className="text-xs text-secondary-foreground">{endWhy(cur)}</span>
                </span>
              </div>
            </div>

            {cur.early && (
              <p className="rounded-md border border-dashed p-3 text-sm">
                <span className="font-medium">조기 종료</span> ·{" "}
                {EARLY_CODES[cur.early.code] ?? cur.early.code} · {cur.early.detail}
              </p>
            )}
            {st === "만료" && !cur.early && (
              <p className="rounded-md border border-dashed p-3 text-sm text-secondary-foreground">
                <span className="font-medium text-foreground">
                  만료됐지만 갱신 계약이 없어 이 구독이 여전히 가장 최근입니다.
                </span>{" "}
                크레딧을 부여하면 만료일부터 적용 시작일까지가 공백 중단으로 함께 기록됩니다.
              </p>
            )}

            <div>
              <p className="pb-1 text-xs font-medium text-secondary-foreground">기간 조정 이력</p>
              <AdjustList s={cur} />
            </div>

            {/* 선행 구독 — 조회 전용 */}
            <div className="border-t pt-3">
              {g.chain.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-secondary-foreground hover:text-foreground"
                    onClick={() => setPastOpen((o) => !o)}
                  >
                    {pastOpen ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                    선행 구독 {g.chain.length - 1}건 보기
                  </button>
                  {pastOpen && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-secondary-foreground">
                        선행 구독은 조회 전용입니다. 이 구독들의 조정이 각자의 만료일을 정했고, 그
                        만료일이 다음 구독의 시작일을 통과시킨 근거이기 때문입니다. 기간을
                        움직이려면 현재 구독에 하세요.
                      </p>
                      {g.chain.slice(0, -1).map((p, i) => {
                        const pst = statusOf(p);
                        const adj = p.pauses.length + p.credits.length;
                        return (
                          <div key={p.id} className="space-y-1.5 rounded-md border p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-secondary-foreground">{i + 1}차</span>
                              <Badge variant="secondary" className="font-normal">
                                {p.contract}
                              </Badge>
                              <span>
                                {p.start} ~ {subEnd(p) ? addDays(subEnd(p) as string, -1) : "—"}
                              </span>
                              <StatusPill st={pst} />
                              <span className="text-xs text-secondary-foreground">
                                {adj ? `조정 ${adj}건` : "조정 없음"}
                              </span>
                            </div>
                            {adj > 0 && (
                              <>
                                <p className="text-xs text-secondary-foreground">
                                  이 조정들이 만료일을 {subEnd(p)}로 정했고, 그 값이 다음 구독의
                                  시작일을 통과시켰습니다. 그래서 수정·삭제할 수 없습니다.
                                </p>
                                <AdjustList s={p} />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-secondary-foreground">선행 구독 없음</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
