"use client";

// CommentsRail 시안 — 상세 화면 공통 「댓글」 패널 (와이어프레임 v2 1.7.1 문법, 2026-08-26)
// - 대상 엔티티 + 대상 ID로 걸리는 목록 · @태그는 표시 시점에 이름 치환 · 답글은 1단계까지
// - 접기 토글 헤더 + 목록 + 입력(태그 알림 힌트 + 등록)
// - 5개 상세 화면 공유 — 확정 후 DS 승격 후보. 산출물 목적 = 시각 스펙(등록은 로컬 추가만)

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@ds/ui/ui/avatar";
import { Button } from "@ds/ui/ui/button";
import { Input } from "@ds/ui/ui/input";

export type Comment = {
  author: string;
  team: string;
  at: string;
  body: string;
  replies?: Comment[];
};

// @이름 마커를 파랑으로 — 태그 문법 시각화
function Body({ text }: { text: string }) {
  const parts = text.split(/(@[가-힣A-Za-z]+)/g);
  return (
    <p className="whitespace-pre-wrap text-sm">
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} className="font-medium text-primary">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </p>
  );
}

function Item({ c, reply = false }: { c: Comment; reply?: boolean }) {
  return (
    <div className={"flex gap-2.5" + (reply ? " pl-8" : "")}>
      <Avatar className="size-7">
        <AvatarFallback className="text-xs">{c.author[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs text-secondary-foreground">
          <span className="font-medium text-foreground">{c.author}</span> · {c.team} · {c.at}
        </p>
        <Body text={c.body} />
      </div>
    </div>
  );
}

export function CommentsRail({
  subjectHint,
  initial = [],
  me = "김민준",
}: {
  /** 입력 위 힌트 — 예: "호선 선급에 대한 내용도 여기에 적습니다" */
  subjectHint: string;
  initial?: Comment[];
  me?: string;
}) {
  const [open, setOpen] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [comments, setComments] = React.useState(initial);
  const count = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section className="rounded-lg border bg-card">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        댓글
        <span className="text-secondary-foreground">{count}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          <p className="text-xs text-secondary-foreground">{subjectHint}</p>
          {comments.length === 0 && (
            <p className="text-sm text-secondary-foreground">아직 댓글이 없습니다.</p>
          )}
          {comments.map((c, i) => (
            <div key={i} className="space-y-3">
              <Item c={c} />
              {c.replies?.map((r, j) => <Item key={j} c={r} reply />)}
            </div>
          ))}

          <div className="space-y-1.5 border-t pt-3">
            <div className="flex gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{me[0]}</AvatarFallback>
              </Avatar>
              <Input
                placeholder="댓글 남기기 — @로 유저 태그"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button
                size="sm"
                disabled={!draft.trim()}
                onClick={() => {
                  setComments((list) => [
                    ...list,
                    { author: me, team: "영업", at: "방금", body: draft.trim() },
                  ]);
                  setDraft("");
                }}
              >
                등록
              </Button>
            </div>
            <p className="pl-9 text-xs text-secondary-foreground">태그된 유저에게 알림이 갑니다</p>
          </div>
        </div>
      )}
    </section>
  );
}
