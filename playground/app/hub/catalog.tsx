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

/* 「코드」 패널 — 우측 드로어(피그마 Inspect 패턴, 2026-09-03 개정: 즉시 복사 → 열람 패널).
   원천 = /ui-src/<f>.tsx.txt(ds:build 동기화). 상단 속성 블록은 소스에서 자동 추출(cva 베이스·variants)
   — 손 관리 스펙 없음. 복사는 패널 안 [전체 복사]·파일별 [복사]로. */
let vocabCache: Promise<any> | null = null;
const loadVocab = () => (vocabCache ??= fetch("/vocab-map.json").then((r) => r.json()));

type CodeFile = { name: string; src: string };

/* cva 베이스 클래스·variant/size 이름 자동 추출 — 실패하면 해당 블록만 생략(표시용, 게이트 아님) */
function extractProps(src: string): { base: string[]; variants: string[]; sizes: string[] } {
  const out = { base: [] as string[], variants: [] as string[], sizes: [] as string[] };
  try {
    const b = src.match(/cva\(\s*["'`]([^"'`]+)["'`]/);
    if (b) out.base = b[1].trim().split(/\s+/);
    // 콜론 뒤가 문자열 리터럴 시작일 때만 = variant 키 (클래스 안 hover: 등 오탐 차단)
    const keysOf = (block?: string) =>
      block ? [...block.matchAll(/(?:^|\n)\s*"?([\w-]+)"?:\s*\n?\s*["'`]/g)].map((m) => m[1]) : [];
    out.variants = keysOf(src.match(/variant:\s*{([\s\S]*?)\n\s*}/)?.[1]);
    out.sizes = keysOf(src.match(/size:\s*{([\s\S]*?)\n\s*}/)?.[1]);
  } catch { /* 추출 실패 = 생략 */ }
  return out;
}

function CopyChip({ text, label = "복사" }: { text: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button type="button" className="chip" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* noop */ }
    }}>
      {ok ? "copied ✓" : label}
    </button>
  );
}

function CodePanel({ card, entry, onClose }: { card: HubCard; entry: any; onClose: () => void }) {
  const [files, setFiles] = React.useState<CodeFile[] | null>(null);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const vm = await loadVocab();
        const names: string[] = vm.vocab?.[card.slug!]?.files ?? [];
        if (!names.length) throw new Error("no files");
        const loaded = await Promise.all(names.map(async (f) => {
          const r = await fetch("/ui-src/" + f + ".tsx.txt");
          if (!r.ok) throw new Error(f);
          return { name: f, src: await r.text() };
        }));
        if (!dead) setFiles(loaded);
      } catch { if (!dead) setErr(true); }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.code === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { dead = true; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.slug]);

  const overrides: Record<string, string> = entry?.overrides ?? {};
  const all = files ? files.map((f) => "/* ── components/src/ui/" + f.name + ".tsx ── */\n" + f.src).join("\n\n") : "";
  return (
    <div className="codebox" onClick={onClose}>
      <div className="codewrap" onClick={(e) => e.stopPropagation()}>
        <div className="bar">
          <span>{card.name}</span>
          {card.shadcn ? <span className="chip">shadcn: {card.shadcn}</span> : null}
          <span className="sp">
            {files ? <CopyChip text={all} label="전체 복사" /> : null}
            <button type="button" className="chip" onClick={onClose}>✕</button>
          </span>
        </div>
        <div className="codescroll">
          {err ? <div className="props">소스를 불러오지 못했다 — vocab-map · ui-src 동기화 확인</div> : null}
          {files ? (
            <>
              <div className="props">
                {Object.keys(overrides).length ? (
                  <>
                    <div className="pk">365 조정값</div>
                    {Object.keys(overrides).map((k) => <span className="tok" key={k}>{k}: {overrides[k]}</span>)}
                  </>
                ) : null}
                {files.map((f) => {
                  const p = extractProps(f.src);
                  if (!p.base.length && !p.variants.length && !p.sizes.length) return null;
                  return (
                    <React.Fragment key={f.name}>
                      {p.base.length ? (
                        <>
                          <div className="pk">기본 클래스{files.length > 1 ? " — " + f.name : ""}</div>
                          {p.base.map((t) => <span className="tok" key={t}>{t}</span>)}
                        </>
                      ) : null}
                      {p.variants.length ? (
                        <>
                          <div className="pk">variants</div>
                          {p.variants.map((t) => <span className="tok" key={t}>{t}</span>)}
                        </>
                      ) : null}
                      {p.sizes.length ? (
                        <>
                          <div className="pk">sizes</div>
                          {p.sizes.map((t) => <span className="tok" key={t}>{t}</span>)}
                        </>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
              {files.map((f) => (
                <React.Fragment key={f.name}>
                  <div className="fhead">
                    <span className="mono">components/src/ui/{f.name}.tsx</span>
                    <span style={{ marginLeft: "auto" }}><CopyChip text={f.src} /></span>
                  </div>
                  <pre>{f.src}</pre>
                </React.Fragment>
              ))}
            </>
          ) : !err ? <div className="props">불러오는 중…</div> : null}
        </div>
      </div>
    </div>
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
  const [codeSlug, setCodeSlug] = React.useState<string | null>(null); // 「코드」 드로어

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
              <div className="card-head"><span>{s.name}</span>
                <button type="button" className="chip" onClick={() => setCodeSlug(s.slug!)}>코드</button></div>
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
                <button type="button" className="chip edit" onClick={() => setEditing(editing === s.slug ? null : s.slug!)}>편집</button>
              </div>
              {editing === s.slug ? <Editor entry={e} onSave={(o, n) => save(s.slug!, o, n)} /> : null}
            </div>
          );
        })}
      </div>
      {codeSlug ? (
        <CodePanel
          card={SOURCE.find((c) => c.slug === codeSlug)!}
          entry={entry(codeSlug)}
          onClose={() => setCodeSlug(null)}
        />
      ) : null}
    </>
  );
}
