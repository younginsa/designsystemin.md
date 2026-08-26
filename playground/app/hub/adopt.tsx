"use client";

// 컴포넌트 채택 패널 — 카드 그리드(라이브 프리뷰) + 채택 토글 + 우측 현황 레일.
// 구 index.html 채택 스크립트의 React 포트. 정책 동일:
//   GitHub(approved.json)가 유일한 진실 — 토글은 내보내기용 세션 스크래치(세션 메모리만).
//   매핑 없는 카드(shadcn: 없음)는 재현 제작 완료(build:done) 전까지 채택 불가.
// 카드 시각은 사진(pv png) 대신 previews.tsx 레지스트리의 실물 렌더가 기본이고,
// 레지스트리에 없는 항목만 기존 사진 → 자리표시 순으로 폴백한다.

import * as React from "react";

import { CARD_GROUPS, type HubCard } from "./cards-data";
import { PREVIEWS, FitScale } from "./previews";
import { HoverCut, Shot } from "./screens";

/* ── 데이터 로드 (1회) ── */

export type Ds365File = { components: Record<string, any>; tokens: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any

export function useHubData() {
  const [approvedFile, setApprovedFile] = React.useState<string[] | null>(null);
  const [ds365File, setDs365File] = React.useState<Ds365File | null>(null);
  React.useEffect(() => {
    fetch("/approved.json").then((r) => r.ok ? r.json() : null).catch(() => null)
      .then((j) => setApprovedFile((j && j.approved) || []));
    fetch("/ds365.json").then((r) => r.ok ? r.json() : null).catch(() => null)
      .then((j) => setDs365File({ components: (j && j.components) || {}, tokens: (j && j.tokens) || {} }));
  }, []);
  return { approvedFile, ds365File };
}

/* ── 채택 상태 ── */

const ALL_CARDS: HubCard[] = CARD_GROUPS.flatMap((g) => g.cards).filter((c) => c.slug);
const isNone = (c: HubCard) => c.shadcn === "없음";
const NAME_OF: Record<string, string> = Object.fromEntries(ALL_CARDS.map((c) => [c.slug!, c.name]));
const MAPPED = ALL_CARDS.filter((c) => !isNone(c)).map((c) => c.slug!);

const eqSet = (a: Set<string>, b: Set<string>) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

export function useAdoption(fileList: string[] | null, rebuilt: string[]) {
  const [local, setLocal] = React.useState<string[] | null>(null);
  const current = React.useMemo(
    () => new Set(local ?? fileList ?? []),
    [local, fileList],
  );
  const toggle = (slug: string) => {
    const s = new Set(current);
    if (s.has(slug)) s.delete(slug); else s.add(slug);
    setLocal([...s]);
  };
  const dirty = local !== null && fileList !== null && !eqSet(new Set(local), new Set(fileList));
  const exportApproved = () => {
    const data = { updated: new Date().toISOString().slice(0, 10), approved: [...current].sort() };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" }));
    a.download = "approved.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return { current, toggle, dirty, exportApproved, rebuilt, loaded: fileList !== null };
}
export type Adoption = ReturnType<typeof useAdoption>;

/* ── 카드 ── */

function CardVisual({ card, urls }: { card: HubCard; urls: Record<string, string> }) {
  const pv = card.slug ? PREVIEWS[card.slug] : undefined;
  return (
    <div className="comp-vis">
      {pv ? (
        <div className="livehole">
          <FitScale pv={pv} />
        </div>
      ) : card.ph ? (
        <div className="ph"><span className="lb">{card.ph[0]}</span><span className="cap">{card.ph[1]}</span></div>
      ) : null}
      {card.shot && card.crop ? <HoverCut shot={card.shot} crop={card.crop} urls={urls} /> : null}
    </div>
  );
}

function CompCard({ card, urls, adoption, flash }: {
  card: HubCard; urls: Record<string, string>; adoption: Adoption; flash: string | null;
}) {
  if (!card.slug) {
    // 「예시」 카드 — 원본 화면 썸네일 스트립
    return (
      <div className="card comp">
        <div className="card-head"><span>예시</span><span className="hchev"></span></div>
        <div className="card-body shot-strip">
          {(card.shots ?? []).map((n) => <Shot key={n} name={n} urls={urls} />)}
        </div>
      </div>
    );
  }
  const on = adoption.current.has(card.slug);
  const locked = isNone(card) && !adoption.rebuilt.includes(card.slug) && !on;
  return (
    <div className={"card comp" + (flash === card.slug ? " flash" : "")} data-comp={card.slug}>
      <div className="card-head"><span>{card.name}</span></div>
      <CardVisual card={card} urls={urls} />
      <div className="comp-chips">
        {card.prio ? <span className={"chip" + (card.prio === "P1" ? " p1" : "")}>{card.prio}</span> : null}
        {card.shadcn ? <span className="chip">shadcn: {card.shadcn}</span> : null}
        <button
          type="button"
          className={"chip approve" + (on ? " on" : "")}
          disabled={locked}
          title={locked ? "원본 재현 제작 완료 후 채택 가능" : ""}
          onClick={() => adoption.toggle(card.slug!)}
        >
          {on ? "채택됨 ✓" : locked ? "재현 대기" : "채택"}
        </button>
      </div>
    </div>
  );
}

export function AdoptPanel({ urls, adoption, flash }: {
  urls: Record<string, string>; adoption: Adoption; flash: string | null;
}) {
  return (
    <>
      {CARD_GROUPS.map((g) => (
        <React.Fragment key={g.title}>
          <h3>{g.title}</h3>
          <div className="card-grid">
            {g.cards.map((c, i) => (
              <CompCard key={c.slug ?? "ex" + i} card={c} urls={urls} adoption={adoption} flash={flash} />
            ))}
          </div>
        </React.Fragment>
      ))}
    </>
  );
}

/* ── 우측 현황 레일 ── */

function ChipRow({ slug, on, offNote, onJump }: { slug: string; on: boolean; offNote?: string; onJump: (slug: string) => void }) {
  return (
    <span className={"chip" + (on ? " approve on" : " off")} data-slug={slug} onClick={() => onJump(slug)}>
      {NAME_OF[slug] || slug}{on ? " ✓" : offNote ? " — " + offNote : ""}
    </span>
  );
}

export function AdoptRail({ adoption, onJump }: { adoption: Adoption; onJump: (slug: string) => void }) {
  const s = adoption.current;
  const sa = MAPPED.filter((x) => s.has(x));
  const ra = adoption.rebuilt.filter((x) => s.has(x));
  const pend = ALL_CARDS.filter((c) => isNone(c) && !adoption.rebuilt.includes(c.slug!)).map((c) => c.slug!);
  return (
    <div className="adopt-rail" style={{ display: "grid" }}>
      <div className="rail-dirty">{adoption.dirty ? "커밋 안 된 변경 있음 — 내보내기 후 커밋" : ""}</div>
      <div className="card">
        <div className="rail-head">shadcn 채택 <strong>{sa.length}</strong> / {MAPPED.length}</div>
        <div className="rail-list">
          {MAPPED.length
            ? MAPPED.map((x) => <ChipRow key={x} slug={x} on={s.has(x)} offNote="미채택" onJump={onJump} />)
            : <span className="chip off">아직 없음</span>}
        </div>
      </div>
      <div className="card">
        <div className="rail-head">재현(365 제작) 채택 <strong>{ra.length}</strong> / {adoption.rebuilt.length}</div>
        <div className="rail-list">
          {adoption.rebuilt.length
            ? adoption.rebuilt.map((x) => <ChipRow key={x} slug={x} on={s.has(x)} offNote="미채택" onJump={onJump} />)
            : <span className="chip off">제작 완료분 없음</span>}
        </div>
      </div>
      {pend.length ? (
        <div className="card">
          <div className="rail-head">원본 재현 대기 <strong>{pend.length}</strong></div>
          <div className="rail-list">
            {pend.map((x) => <ChipRow key={x} slug={x} on={false} onJump={onJump} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
