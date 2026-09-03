"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 365 DS 카탈로그 — 채택 어휘 전용 + 값 조정 편집. 구 index.html 스크립트의 React 포트.
// ds365.json이 진실 — 편집은 세션 메모리, [내보내기]로 파일을 만들어 커밋한다.
// 카드 시각은 실물 렌더(레지스트리)가 기본 — 구 shadcn365/*.png(365 렌더 사진)와
// rest/hover 사진 스왑은 은퇴했다. 라이브 렌더 = 365 토큰 적용 실물이 곧 기본 그림이다.

import * as React from "react";

import { CARD_GROUPS, type HubCard } from "./cards-data";
import { PREVIEWS, FitScale } from "./previews";
import { HoverCut } from "./screens";
import type { Adoption, Ds365File } from "./adopt";

const SOURCE: HubCard[] = CARD_GROUPS.flatMap((g) => g.cards).filter((c) => c.slug);

const isAdjusted = (e: any) => (e.overrides && Object.keys(e.overrides).length) || e.note;

/* 「코드」 복사 — vocab-map files 조회 → /ui-src/<f>.tsx(ds:build 동기화) 클립보드 복사.
   내용물은 CSS가 아니라 컴포넌트 소스(tsx·Tailwind) — 프론트 코드베이스에 드롭인되는 단위(2026-09-03 확정) */
let vocabCache: Promise<any> | null = null;
const loadVocab = () => (vocabCache ??= fetch("/vocab-map.json").then((r) => r.json()));

function CodeButton({ slug }: { slug: string }) {
  const [state, setState] = React.useState<"idle" | "ok" | "err">("idle");
  const copy = async () => {
    try {
      const vm = await loadVocab();
      const files: string[] = vm.vocab?.[slug]?.files ?? [];
      if (!files.length) throw new Error("no files");
      const parts = await Promise.all(files.map(async (f) => {
        const r = await fetch("/ui-src/" + f + ".tsx.txt");
        if (!r.ok) throw new Error(f);
        return "/* ── components/src/ui/" + f + ".tsx ── */\n" + (await r.text());
      }));
      await navigator.clipboard.writeText(parts.join("\n\n"));
      setState("ok");
    } catch {
      setState("err");
    }
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <button type="button" className="chip" onClick={copy}>
      {state === "ok" ? "copied ✓" : state === "err" ? "복사 실패" : "코드"}
    </button>
  );
}

function Editor({ entry, onSave }: { entry: any; onSave: (overrides: Record<string, string>, note: string) => void }) {
  const ov = entry.overrides || {};
  const [rows, setRows] = React.useState<Array<[string, string]>>(
    Object.keys(ov).length ? Object.entries(ov).map(([k, v]) => [k, String(v)]) : [["", ""]],
  );
  const [note, setNote] = React.useState<string>(entry.note || "");
  return (
    <div className="ds-editor">
      <div className="rows" style={{ display: "grid", gap: 6 }}>
        {rows.map(([k, v], i) => (
          <div className="row" key={i}>
            <input placeholder="속성 (예: row-padding-x)" value={k}
              onChange={(e) => setRows((r) => r.map((x, j) => j === i ? [e.target.value, x[1]] : x))} />
            <input placeholder="값 (예: 0)" value={v}
              onChange={(e) => setRows((r) => r.map((x, j) => j === i ? [x[0], e.target.value] : x))} />
            <button type="button" className="chip" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <input placeholder="메모 (예: 행 좌측 패딩 제거 — 타이틀과 좌측 정렬)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="acts">
        <button type="button" className="chip" onClick={() => setRows((r) => [...r, ["", ""]])}>+ 행</button>
        <button type="button" className="chip" onClick={() => {
          const o: Record<string, string> = {};
          rows.forEach(([k, v]) => { if (k.trim()) o[k.trim()] = v.trim(); });
          onSave(o, note.trim());
        }}>저장</button>
      </div>
    </div>
  );
}

export function CatalogPanel({ approvals, ds365, urls }: {
  approvals: Adoption; ds365: Ds365File | null; urls: Record<string, string>;
}) {
  const fileComponents = ds365?.components ?? {};
  const fileTokens = ds365?.tokens ?? {};
  const [local, setLocal] = React.useState<Record<string, any> | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);

  const comps = local ?? fileComponents;
  const entry = (slug: string) => comps[slug] || {};
  const dirty = local !== null && JSON.stringify(local) !== JSON.stringify(fileComponents);

  const save = (slug: string, o: Record<string, string>, note: string) => {
    const next = JSON.parse(JSON.stringify(comps));
    const cur = next[slug] || {};
    if (Object.keys(o).length) cur.overrides = o; else delete cur.overrides;
    if (note) cur.note = note; else delete cur.note;
    if (cur.overrides || cur.note) {
      cur.render = cur.render === "done" ? "pending" : (cur.render || "pending");
      next[slug] = cur;
    } else if (!cur.build && !(cur.states || []).length) {
      delete next[slug];
    } else {
      next[slug] = cur;
    }
    setEditing(null);
    setLocal(next);
  };

  const exportDs365 = () => {
    const data = { updated: new Date().toISOString().slice(0, 10), tokens: fileTokens, components: comps };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + "\n", ], { type: "application/json" }));
    a.download = "ds365.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const shown = SOURCE.filter((s) => approvals.current.has(s.slug!));
  let adjusted = 0, rebuiltCnt = 0;
  shown.forEach((s) => {
    const e = entry(s.slug!);
    if (isAdjusted(e)) adjusted++;
    if (e.build === "done") rebuiltCnt++;
  });

  return (
    <>
      <div className="ds365-bar">
        <span className="cnt">채택 <strong>{approvals.current.size}</strong> · 조정 <strong>{adjusted}</strong> · 재현 제작 <strong>{rebuiltCnt}</strong></span>
        <span className="dirty">{dirty ? "· 커밋 안 된 변경 있음 — 내보내기 후 커밋" : ""}</span>
        <button type="button" className="chip" onClick={exportDs365}>ds365.json 내보내기</button>
      </div>
      <p className="lead"><strong>365 DS = 채택 어휘에 365 토큰을 얹은 모습.</strong> 01에서 채택된 컴포넌트만
        여기 올라온다 — 카드 그림은 실물 렌더라 토큰이 바뀌면 즉시 따라온다.
        미채택분은 여기 없다(현황은 01 컴포넌트 채택의 우측 레일, 과거 분석 자료는 04 히스토리).</p>

      <div className="card-grid" style={{ marginBottom: 8 }}>
        <div className="card ds-add" onClick={() => alert("새 컴포넌트 분석 요청서는 다음 단계(②)에서 활성화됩니다.")}>
          <span className="plus">＋</span>
          <span className="t">새 컴포넌트</span>
          <span className="d">분석 요청서 작성 — 신규인지, 기존 컴포넌트의 상태 추가인지 판정 후 등록 <span className="chip">적용 예정</span></span>
        </div>
      </div>

      <h3>채택 어휘 — 365 토큰 적용</h3>
      <div className="card-grid">
        {shown.map((s) => {
          const e = entry(s.slug!);
          const adj = isAdjusted(e);
          const pv = PREVIEWS[s.slug!];
          const metaParts: string[] = e.overrides
            ? Object.keys(e.overrides).map((k) => k + ": " + e.overrides[k])
            : [];
          return (
            <div className="card comp ds-card" data-slug={s.slug!} key={s.slug!}>
              <div className="card-head"><span>{s.name}</span></div>
              <div className="comp-vis">
                {pv ? (
                  <div className="livehole"><FitScale pv={pv} /></div>
                ) : s.shot && s.crop ? (
                  <div className="cutwrap"><HoverCut shot={s.shot} crop={s.crop} urls={urls} /></div>
                ) : (
                  <div className="ph"><span className="lb">미리보기 없음</span></div>
                )}
              </div>
              {(metaParts.length || e.note) ? (
                <div className="ds-meta">
                  {metaParts.map((p) => <div className="ov" key={p}>{p}</div>)}
                  {e.note ? <div>{e.note}</div> : null}
                </div>
              ) : null}
              <div className="ds-foot">
                {e.build === "done" ? (
                  <>
                    <span className="chip state p1">재현 제작됨</span>
                    {adj ? <span className="chip sub">조정 메모 있음</span> : null}
                  </>
                ) : (
                  <>
                    <span className={"chip state" + (adj ? " p1" : "")}>{adj ? "조정됨" : "기본"}</span>
                    {adj && e.render !== "done" ? <span className="chip sub warn">재렌더 대기</span> : null}
                  </>
                )}
                {s.shadcn ? <span className="chip">shadcn: {s.shadcn}</span> : null}
                <CodeButton slug={s.slug!} />
                <button type="button" className="chip edit" onClick={() => setEditing(editing === s.slug ? null : s.slug!)}>편집</button>
              </div>
              {editing === s.slug ? <Editor entry={e} onSave={(o, n) => save(s.slug!, o, n)} /> : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
