"use client";

// AuditLog — 상세 화면 공통 「변경 이력」 (와이어프레임 v2 6.1 · 탭별 변경 이력 카드 → 2026-09-10 단일 이력으로 병합)
// - 와이어프레임은 탭(개요·계약 항목·배정 호선·문서·청구)마다 이력 카드를 뒀다. 단일 스크롤 상세에서는 탭 맥락이
//   사라지므로 한 이력에 합치고, 항목마다 「대상」(어느 섹션의 변경인지) 배지를 달아 구분한다(디자이너 확정 2026-09-10).
// - 행 문법 = DS Timeline(어휘 「타임라인」, HiNAS 365 업데이트 상세와 같은 부품): 마커 컬럼(도트 + 세로선) + 제목 + 메타.
//   도트 톤 4종 ↔ Timeline status: 추가=success · 취소·삭제=error(제목도 빨강, DS 규칙) · 수정=current(파랑) · 생성=default(빈 회색).
//   와이어프레임과 다른 점 2개(디자이너 확정): 생성 도트는 검정 채움 대신 DS default, 삭제·취소 제목은 빨강.
// - 필터 = FilterChip 2개(대상 · 종류, 다중, is/is not) — 목록 FilterBar와 같은 칩·패널 문법, 검색창 없음.
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
  /** 어느 섹션의 변경인지 — 병합된 단일 이력에서 대상 배지·필터의 원천(개요 · 계약 항목 · 배정 호선 · 문서 · 청구 …) */
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
/** 「종류」 필터 라벨 — 톤과 1:1 */
const TONE_LABEL: Record<AuditTone, string> = {
  add: "추가",
  remove: "취소·삭제",
  modify: "수정",
  create: "생성",
};
const TONE_OPTIONS = ["추가", "취소·삭제", "수정", "생성"];

const SCOPE_NOTE =
  "이 목록에 삭제가 보이지 않는 것은 정상입니다. 조회가 대상 테이블 + 대상 ID 기준이라 지워진 행에는 상세 화면 자체가 없습니다 — 삭제 레코드는 전역 감사 로그에서만 찾을 수 있습니다.";

export function AuditLog({
  subject,
  entries,
  domains,
}: {
  subject: string;
  entries: AuditEntry[];
  /** 대상 필터 옵션 순서 — 생략하면 항목 등장 순 */
  domains?: string[];
}) {
  const domainOptions = domains ?? Array.from(new Set(entries.map((e) => e.domain)));
  const FILTERS: FilterDef[] = [
    { name: "domain", label: "대상", options: domainOptions, multi: true, operators: OPS_SELECT, base: true },
    { name: "tone", label: "종류", options: TONE_OPTIONS, multi: true, operators: OPS_SELECT, base: true },
  ];
  const [values, setValues] = React.useState<FilterValues>({});
  // 열린 패널은 하나 — FilterBar와 같은 단일 소유 규칙
  const [openName, setOpenName] = React.useState<string | null>(null);

  const rows = entries.filter(
    (e) => passSelect(values.domain, e.domain) && passSelect(values.tone, TONE_LABEL[e.tone]),
  );

  return (
    <div className="space-y-4">
      {/* 머리 — 좌: 조회 축 설명 + [i] / 우: 필터 칩 2개 + 건수 */}
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
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.name}
              def={f}
              value={values[f.name]}
              onSelect={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
              onRemove={() => setValues((s) => ({ ...s, [f.name]: undefined }))}
              onComplexOpen={() => {}}
              open={openName === f.name}
              onOpenChange={(o) => setOpenName(o ? f.name : null)}
            />
          ))}
          <span className="ml-1 text-sm text-secondary-foreground">{rows.length}건</span>
        </div>
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
                  {/* 대상 배지 — 병합 이력에서 섹션을 말하는 유일한 표기 */}
                  <Badge variant="outline" className="font-normal">
                    {e.domain}
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
