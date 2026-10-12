"use client";

// 역할 표기 요소 잠금 (2026-10-08 디자이너 지시) — 역할이 많아 칩만으로는 무엇인지 한눈에 안 읽혔다.
// - RoleMark: 두 글자 이니셜 원(20px). 한 글자는 겹친다(Avikus·Admin = A) → 전부 두 글자로 폭 통일.
//   면 = 아바타 폴백과 같은 primary/10 × foreground(dstk/contrast-pairs.json tints.allowed, person.tsx 와 같은 문법).
//   글자 = text-xs(12px, DS 최소 글자) — 그래서 원은 20px 아래로 줄이지 않는다.
//   역할별 색 구분은 하지 않는다(디자이너 결정 2026-10-08: 그룹 없음 · DS 에 범주색 토큰 없음).
// - RoleTip: 마우스를 올리면 그 역할이 무엇을 하는지 한 줄 툴팁(DS Tooltip).
// - 쓰는 곳: 계정 관리(행 칩 · (+) 팝오버 · 일괄 편집 팝오버) · 기능별 권한(역할 열 머리) — 네 곳이 이 파일 하나를 읽는다.

import * as React from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

type RoleMeta = { name: string; initials: string; desc: string };

// 설명은 기능별 권한 매트릭스(목업)에서 읽은 범위
const ROLES: RoleMeta[] = [
  { name: "Avikus", initials: "AV", desc: "사내 기본 계정 — ECR 토큰 발급" },
  { name: "Sales", initials: "SA", desc: "영업 — 계약·호선 정보 열람" },
  { name: "Research", initials: "RE", desc: "연구 — Developer/QA 정보 열람 · 설치 실행" },
  { name: "Service Engineer", initials: "SE", desc: "현장 엔지니어 — 설치·업데이트 실행" },
  { name: "QA", initials: "QA", desc: "품질 검증 — 설치·테스트 호선 운영" },
  { name: "DEV", initials: "DV", desc: "개발 — 설치 실행 · 저장소 갱신" },
  { name: "Admin", initials: "AD", desc: "관리자 — 계정·권한 전체 관리" },
];

// 화면마다 표기가 달라(Service Engineer / service_engineer · DEV / dev) 소문자·밑줄을 무시하고 찾는다
const norm = (s: string) => s.toLowerCase().replace(/[\s_]+/g, "");
export const roleMeta = (name: string): RoleMeta =>
  ROLES.find((r) => norm(r.name) === norm(name)) ?? { name, initials: name.slice(0, 2).toUpperCase(), desc: name };

export function RoleMark({ role }: { role: string }) {
  return (
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-foreground"
    >
      {roleMeta(role).initials}
    </span>
  );
}

export function RoleTip({ role, children }: { role: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <span className="font-medium">{roleMeta(role).name}</span> · {roleMeta(role).desc}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
