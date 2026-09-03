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

/* 박스 다이어그램 수치 파싱 — 기본 클래스에서 border·padding·크기·radius (Tailwind 스케일 ×4) */
type BoxSpec = { bw: number; pt: number; pr: number; pb: number; pl: number; h: number | null; w: number | null; r: number | null };
function parseBox(tokens: string[]): BoxSpec | null {
  const S = (n: string) => { const v = parseFloat(n); return isNaN(v) ? null : v * 4; };
  const box: BoxSpec = { bw: 0, pt: 0, pr: 0, pb: 0, pl: 0, h: null, w: null, r: null };
  const RAD: Record<string, number> = { "rounded-sm": 6, "rounded-md": 8, "rounded-lg": 10, "rounded-xl": 14, "rounded-full": 999, rounded: 10 };
  for (const t of tokens) {
    let m: RegExpMatchArray | null;
    if (t === "border") box.bw = 1;
    else if ((m = t.match(/^border-(\d)$/))) box.bw = +m[1];
    else if ((m = t.match(/^p-([\d.]+)$/))) { const v = S(m[1]); if (v != null) { box.pt = box.pr = box.pb = box.pl = v; } }
    else if ((m = t.match(/^px-([\d.]+)$/))) { const v = S(m[1]); if (v != null) { box.pl = box.pr = v; } }
    else if ((m = t.match(/^py-([\d.]+)$/))) { const v = S(m[1]); if (v != null) { box.pt = box.pb = v; } }
    else if ((m = t.match(/^pt-([\d.]+)$/))) { const v = S(m[1]); if (v != null) box.pt = v; }
    else if ((m = t.match(/^pr-([\d.]+)$/))) { const v = S(m[1]); if (v != null) box.pr = v; }
    else if ((m = t.match(/^pb-([\d.]+)$/))) { const v = S(m[1]); if (v != null) box.pb = v; }
    else if ((m = t.match(/^pl-([\d.]+)$/))) { const v = S(m[1]); if (v != null) box.pl = v; }
    else if ((m = t.match(/^h-([\d.]+)$/))) box.h = S(m[1]);
    else if ((m = t.match(/^w-([\d.]+)$/))) box.w = S(m[1]);
    else if ((m = t.match(/^size-([\d.]+)$/))) { box.h = box.w = S(m[1]); }
    else if (RAD[t] != null) box.r = RAD[t];
  }
  return box.bw || box.pt || box.pr || box.pb || box.pl || box.h != null || box.w != null || box.r != null ? box : null;
}

function BoxDiagram({ box }: { box: BoxSpec }) {
  const size = (box.w ?? "auto") + " × " + (box.h ?? "auto");
  const r = box.r == null ? "" : box.r === 999 ? "○" : String(box.r);
  return (
    <div className="diag">
      <span className="dc tl">{r}</span><span className="dc tr">{r}</span>
      <span className="dc bl">{r}</span><span className="dc br">{r}</span>
      <div className="d-border">
        <span className="dl">Border</span>
        <span className="dv t">{box.bw}</span><span className="dv b">{box.bw}</span>
        <span className="dv l">{box.bw}</span><span className="dv r">{box.bw}</span>
        <div className="d-pad">
          <span className="dl">Padding</span>
          <span className="dv t">{box.pt}</span><span className="dv b">{box.pb}</span>
          <span className="dv l">{box.pl}</span><span className="dv r">{box.pr}</span>
          <div className="d-size">{size}</div>
        </div>
      </div>
    </div>
  );
}

/* IDE식 인라인 폴딩(2026-09-03 재설계 — 구간 카드 방식 폐기): 코드는 한 덩어리로 흐르고,
   접기는 코드 자신의 들여쓰기 계층에서 일어난다. 여는 줄 = 원문 그대로, 거터 셰브런,
   접힘 시 줄 끝 "⋯ }" 표시. 3줄 미만 블록은 접기 생략(노이즈 방지). */
/* 줄 단위 하이라이트 — 블록 주석·백틱 문자열 상태를 줄 간에 이어받는다.
   단일 패스 치환(자기 마크업 재매칭 방지): JSX 태그명 파랑 · 속성명 금색 · 키워드 · 숫자 */
function highlightLines(src: string): string[] {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const plain = (s: string) => esc(s).replace(
    /(&lt;\/?)([A-Za-z][\w.-]*)|([a-zA-Z][\w-]*)(?==(?:"|\{))|\b(import|export|from|const|let|var|function|return|type|interface|extends|default|if|else|for|of|new|async|await|null|undefined|true|false|as)\b|\b(\d+(?:\.\d+)?)\b/g,
    (_m, tp, tn, at, kw2, num) => {
      if (tn) return tp + '<span class="tk-t">' + tn + "</span>";
      if (at) return '<span class="tk-a">' + at + "</span>";
      if (kw2) return '<span class="tk-k">' + kw2 + "</span>";
      return '<span class="tk-n">' + num + "</span>";
    });
  let inC = false, inT = false;
  return src.split("\n").map((line) => {
    let out = "", i = 0;
    while (i < line.length) {
      if (inC) {
        const e = line.indexOf("*/", i);
        if (e === -1) { out += '<span class="tk-c">' + esc(line.slice(i)) + "</span>"; i = line.length; }
        else { out += '<span class="tk-c">' + esc(line.slice(i, e + 2)) + "</span>"; i = e + 2; inC = false; }
      } else if (inT) {
        let j = i;
        while (j < line.length && !(line[j] === "`" && line[j - 1] !== "\\")) j++;
        const end = j < line.length ? j + 1 : line.length;
        out += '<span class="tk-s">' + esc(line.slice(i, end)) + "</span>";
        i = end;
        if (j < line.length) inT = false;
      } else {
        const m = line.slice(i).match(/\/\/|\/\*|["'`]/);
        if (!m) { out += plain(line.slice(i)); break; }
        const idx = i + (m.index as number);
        out += plain(line.slice(i, idx));
        const tok = m[0];
        if (tok === "//") { out += '<span class="tk-c">' + esc(line.slice(idx)) + "</span>"; i = line.length; }
        else if (tok === "/*") { inC = true; i = idx; }
        else if (tok === "`") { out += '<span class="tk-s">`</span>'; i = idx + 1; inT = true; }
        else {
          let j = idx + 1;
          while (j < line.length && !(line[j] === tok && line[j - 1] !== "\\")) j++;
          const end = j < line.length ? j + 1 : line.length;
          out += '<span class="tk-s">' + esc(line.slice(idx, end)) + "</span>";
          i = end;
        }
      }
    }
    return out;
  });
}

type FoldNode = { html: string } | { headRest: string; indent: number; tail: string; children: FoldNode[] };
function countLines(nodes: FoldNode[]): number {
  return nodes.reduce((n, x) => n + ("children" in x ? 1 + countLines(x.children) : 1), 0);
}
function buildFolds(src: string): FoldNode[] {
  const lines = src.split("\n");
  const htmls = highlightLines(src);
  const indentOf = (l: string) => (l.match(/^\s*/) as RegExpMatchArray)[0].length;
  let pos = 0;
  function parse(minIndent: number): FoldNode[] {
    const nodes: FoldNode[] = [];
    while (pos < lines.length) {
      const line = lines[pos];
      if (line.trim() === "") { nodes.push({ html: "&nbsp;" }); pos++; continue; }
      const ind = indentOf(line);
      if (ind < minIndent) break;
      let k = pos + 1;
      while (k < lines.length && lines[k].trim() === "") k++;
      if (k < lines.length && indentOf(lines[k]) > ind && lines[k].trim() !== "") {
        const headIdx = pos;
        pos++;
        const children = parse(ind + 1);
        let tail = "";
        if (pos < lines.length && lines[pos].trim() !== "" && indentOf(lines[pos]) === ind
          && /^[\s)\]};,>]*$/.test(lines[pos])) {
          tail = lines[pos].trim();
          children.push({ html: htmls[pos] });
          pos++;
        }
        // 삼각형은 들여쓰기 위치의 내용 바로 앞 — 선행 공백과 본문 html을 분리 보관
        if (countLines(children) >= 3) nodes.push({ headRest: htmls[headIdx].slice(ind), indent: ind, tail, children });
        else { nodes.push({ html: htmls[headIdx] }); nodes.push(...children); }
      } else {
        nodes.push({ html: htmls[pos] });
        pos++;
      }
    }
    return nodes;
  }
  return parse(0);
}

function FoldView({ nodes }: { nodes: FoldNode[] }) {
  return (
    <>
      {nodes.map((n, i) =>
        "children" in n ? (
          <details key={i} className="fold" open>
            <summary>
              {" ".repeat(n.indent)}
              <span className="tri" aria-hidden />
              <span dangerouslySetInnerHTML={{ __html: n.headRest }} />
              <span className="ell"> ⋯ {n.tail || "}"}</span>
            </summary>
            <FoldView nodes={n.children} />
          </details>
        ) : (
          <div key={i} className="cl" dangerouslySetInnerHTML={{ __html: n.html }} />
        )
      )}
    </>
  );
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
                {(() => {
                  // 다이어그램 = 베이스 + default 변형 클래스(h·px 등은 size default에 산다)
                  const f = files.find((x) => extractProps(x.src).base.length);
                  if (!f) return null;
                  const defs = [...f.src.matchAll(/default:\s*"([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
                  const box = parseBox([...extractProps(f.src).base, ...defs]);
                  return box ? <BoxDiagram box={box} /> : null;
                })()}
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
              {files.map((f, i) => (
                <details key={f.name} className="fdetail" open={i === 0}>
                  <summary>
                    <span className="mono">components/src/ui/{f.name}.tsx</span>
                    <span className="sp" onClick={(e) => e.preventDefault()}><CopyChip text={f.src} /></span>
                  </summary>
                  <div className="codepre">
                    <FoldView nodes={buildFolds(f.src)} />
                  </div>
                </details>
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
  // 딥링크 #code=<슬러그> — 코드 패널 직행(공유·캡처 검증용, 2026-09-03)
  React.useEffect(() => {
    const m = location.hash.match(/^#code=([\w-]+)$/);
    if (m) setCodeSlug(m[1]);
  }, []);

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
