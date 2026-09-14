"use client";

// AuditLog — 상세 화면 공통 「변경 이력」 (와이어프레임 v2 6.1 · 탭별 변경 이력 카드 → 2026-09-10 단일 이력으로 병합)
// - 와이어프레임은 탭(개요·계약 항목·배정 호선·문서·청구)마다 이력 카드를 뒀다. 단일 스크롤 상세에서는 탭 맥락이
//   사라지므로 한 이력에 합치고, 항목마다 「분류」(어느 섹션의 변경인지) 배지를 달아 구분한다(디자이너 확정 2026-09-10).
//   분류 배지는 버튼 — 누르면 그 분류만 보이도록 필터가 잡히고, 같은 배지를 다시 누르면 풀린다(2026-09-14 디자이너 확정).
// - 행 문법 = DS Timeline(어휘 「타임라인」, HiNAS 365 업데이트 상세와 같은 부품): 마커 컬럼(도트 + 세로선) + 제목 + 메타.
//   도트 톤 4종 ↔ Timeline status: 추가=success · 취소·삭제=error(제목도 빨강, DS 규칙) · 수정=current(파랑) · 생성=default(빈 회색).
//   와이어프레임과 다른 점 2개(디자이너 확정): 생성 도트는 검정 채움 대신 DS default, 삭제·취소 제목은 빨강.
// - 필터 = FilterChip 1개(분류, 다중, is/is not) — 목록 FilterBar와 같은 칩·패널 문법, 검색창 없음.
//   칩 자리 = [댓글 | 변경 이력] 탭 행 우측(2026-09-14 디자이너 확정, 레퍼런스 Statsig 탭 툴바). 상태는 페이지가 useAuditFilter로
//   소유하고 AuditFilter(칩+건수)와 AuditLog(목록)가 같은 상태를 본다. filter prop 없이 쓰면 종전처럼 머리 행 안에 칩을 그린다.
//   종류(추가·수정·삭제) 필터는 2026-09-14 폐기 — 도트 색·빨간 제목이 이미 말하는 정보라 중복이었다. 「대상」 → 「분류」 개명(행 안의 "대상 4건" 데이터 표기와 충돌).
// - 조회 축 = 대상 테이블 + 대상 ID → 삭제 레코드는 여기 안 보인다(전역 감사 로그 몫). 그 안내는 [i] 툴팁으로(종전 Alert 폐기).
// - cross: 마스터성 데이터 수정이 계약 경계를 넘어 보일 때의 부연(호선 등)
// - 5개 상세 화면 공유 — 확정 후 DS 승격 후보

import * as React from "react";
import { Info } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { FilterChip, OPS_SELECT, type FilterDef, type FilterValues } from "@ds/ui/ui/filter-bar";
import { Timeline, TimelineItem, TimelineMeta, TimelineTitle } from "@ds/ui/ui/timeline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

import { passSelect } from "./filter-match";
// 사람 요소 잠금(2026-09-04): 행위자 = 프로필(이니셜) + 이름
import { Person } from "./person";

export type AuditTone = "add" | "remove" | "modify" | "create";
export type AuditField = { label: string; from: string | null; to: string };
export type AuditEntry = {
  at: string;
  /** 어느 섹션의 변경인지 — 병합된 단일 이력에서 분류 배지·필터의 원천(개요 · 계약 항목 · 배정 호선 · 문서 · 청구 …) */
  domain: string;
  /** 동사 — 와이어프레임 어휘(계약 항목 추가 · 슬롯 취소 · 문서 등록 · 청구서 발행 …) */
  action: string;
  /** 도트 톤 — add=추가·등록·배정·발행 / remove=취소·삭제 / modify=수정 / create=생성 */
  tone: AuditTone;
  actor: string;
  /** 대상·요약 줄(예: "C-2026-001-01 3번 ← Hull 1003") */
  lines?: string[];
  /** 필드 diff — 수정류 */
  fields?: AuditField[];
  /** 취소·삭제 사유 */
  reason?: string;
  /** 보조 배지 — 생성 이벤트의 「공통 컬럼」 등 */
  badge?: string;
  /** 계약 경계를 넘는 반영 부연(마스터성 데이터) */
  cross?: string;
};

const TONE_STATUS: Record<AuditTone, "default" | "current" | "success" | "error"> = {
  add: "success",
  remove: "error",
  modify: "current",
  create: "default",
};

const SCOPE_NOTE =
  "이 목록에 삭제가 보이지 않는 것은 정상입니다. 조회가 대상 테이블 + 대상 ID 기준이라 지워진 행에는 상세 화면 자체가 없습니다 — 삭제 레코드는 전역 감사 로그에서만 찾을 수 있습니다.";

export type AuditFilterState = {
  values: FilterValues;
  setValues: React.Dispatch<React.SetStateAction<FilterValues>>;
  /** 필터 통과 행 */
  rows: AuditEntry[];
  domainOptions: string[];
};

/** 필터 상태 — 페이지가 소유해 탭 행의 AuditFilter와 목록의 AuditLog가 같은 값을 본다 */
export function useAuditFilter(entries: AuditEntry[], domains?: string[]): AuditFilterState {
  const [values, setValues] = React.useState<FilterValues>({});
  const domainOptions = domains ?? Array.from(new Set(entries.map((e) => e.domain)));
  const rows = entries.filter((e) => passSelect(values.domain, e.domain));
  return { values, setValues, rows, domainOptions };
}

/** 분류 칩 + 건수 — [댓글 | 변경 이력] 탭 행 우측, 변경 이력 탭이 활성일 때만 */
export function AuditFilter({ filter }: { filter: AuditFilterState }) {
  const def: FilterDef = {
    name: "domain",
    label: "분류",
    options: filter.domainOptions,
    multi: true,
    operators: OPS_SELECT,
    base: true,
  };
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex items-center gap-2">
      <FilterChip
        def={def}
        value={filter.values.domain}
        onSelect={(v) => filter.setValues((s) => ({ ...s, domain: v }))}
        onRemove={() => filter.setValues((s) => ({ ...s, domain: undefined }))}
        onComplexOpen={() => {}}
        open={open}
        onOpenChange={setOpen}
      />
      <span className="ml-1 text-sm text-secondary-foreground">{filter.rows.length}건</span>
    </div>
  );
}

export function AuditLog({
  subject,
  entries,
  domains,
  filter,
}: {
  subject: string;
  entries: AuditEntry[];
  /** 분류 필터 옵션 순서 — 생략하면 항목 등장 순 */
  domains?: string[];
  /** 페이지가 useAuditFilter로 소유한 상태 — 주면 칩은 탭 행(AuditFilter)에 있으므로 여기서는 그리지 않는다 */
  filter?: AuditFilterState;
}) {
  // 훅은 무조건 호출(규칙) — 외부 filter가 있으면 그것을 쓴다
  const internal = useAuditFilter(entries, domains);
  const { values, setValues, rows } = filter ?? internal;

  // 행의 분류 배지 클릭 — 그 분류 하나로 잡고(값 문법 "is <옵션>" = 패널에서 하나 고른 것과 동일 상태), 같은 걸 다시 누르면 해제
  const pickDomain = (domain: string) =>
    setValues((s) => ({ ...s, domain: s.domain === `is ${domain}` ? undefined : `is ${domain}` }));

  return (
    <div className="space-y-4">
      {/* 머리 — 좌: 조회 축 설명 + [i] / 우: (외부 필터가 없을 때만) 분류 칩 + 건수 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-secondary-foreground">
          변경 일시 내림차순 · 최근 50건 · {subject}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="변경 이력 조회 범위 설명">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{SCOPE_NOTE}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
        {!filter && <AuditFilter filter={internal} />}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-secondary-foreground">조건에 맞는 변경 이력이 없습니다.</p>
      ) : (
        <Timeline>
          {/* 행 간격 = DS 24px + 16px(2026-09-10 디자이너 확정) — 2~3줄짜리 항목이라 업데이트 타임라인보다 여유를 둔다.
              마지막 항목은 DS가 pb-0으로 닫으므로 여기서도 덧대지 않는다 */}
          {rows.map((e, i) => (
            <TimelineItem key={`${e.at}-${i}`} status={TONE_STATUS[e.tone]}>
              <div className={i < rows.length - 1 ? "pb-4" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 분류 배지 — 병합 이력에서 섹션을 말하는 유일한 표기. 버튼: 누르면 그 분류로 필터 */}
                  <Badge asChild variant="outline" className="cursor-pointer font-normal hover:bg-accent hover:text-accent-foreground">
                    <button
                      type="button"
                      onClick={() => pickDomain(e.domain)}
                      aria-pressed={values.domain === `is ${e.domain}`}
                      aria-label={`분류 ${e.domain}만 보기`}
                    >
                      {e.domain}
                    </button>
                  </Badge>
                  <TimelineTitle className="leading-5">{e.action}</TimelineTitle>
                  {e.badge && (
                    <Badge variant="secondary" className="font-normal">
                      {e.badge}
                    </Badge>
                  )}
                  <Person name={e.actor} />
                </div>
                <span className="font-mono text-xs text-secondary-foreground">{e.at}</span>
              </div>
              {e.lines?.map((l) => (
                <p key={l} className="mt-1.5 text-sm">
                  {l}
                </p>
              ))}
              {e.fields?.map((f) => (
                <p key={f.label} className="mt-1.5 flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="text-secondary-foreground">{f.label}</span>
                  <span className="text-secondary-foreground line-through">{f.from ?? "— (없음)"}</span>
                  <span aria-hidden>→</span>
                  <span className="font-medium">{f.to}</span>
                </p>
              ))}
              {e.reason && <TimelineMeta>사유 · {e.reason}</TimelineMeta>}
              {e.cross && <TimelineMeta>{e.cross}</TimelineMeta>}
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </div>
  );
}
