"use client";

// Person 시안 — 사람(내부 유저) 표기 요소 잠금 (2026-09-04, Jira식 프로필 + 이름)
// - PersonAvatar: DS Avatar + 이니셜 폴백(이름 첫 글자). 크기는 2종만 —
//   sm(24, 인라인: 표 셀 · dl 값 · 댓글 · 변경 이력 · picker) / default(32, 페이지 헤더 · 계정 존)
// - Person: PersonAvatar + 이름 라벨. children을 주면 라벨을 대체(유저 목록의 Link 등)
// - 색은 DS 폴백(bg-muted × secondary-foreground) 그대로 — 인물별 컬러는 DS 팔레트 부재로 보류(2026-09-04 결정)
// - 고객사 담당자(외부 인물·직책·전화)는 이 요소 대상이 아니다 — 텍스트 유지
// - sales365 12곳 공유 — 로컬 공유 부품으로 유지(디자이너 결정 2026-09-04: DS 승격·design.md 규칙 요청 안 함, 불러 쓰기만)

import * as React from "react";

import { Avatar, AvatarFallback } from "@ds/ui/ui/avatar";

type PersonSize = "sm" | "default";

export function PersonAvatar({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: PersonSize;
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}

export function Person({
  name,
  size = "sm",
  children,
  className,
}: {
  name: string;
  size?: PersonSize;
  /** 라벨 대체 — 예: 유저 목록의 상세 Link */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={"inline-flex items-center gap-2" + (className ? " " + className : "")}>
      <PersonAvatar name={name} size={size} />
      <span>{children ?? name}</span>
    </span>
  );
}
