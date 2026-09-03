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

/* 스펙 추출(2026-09-03 — 프론트 요청: 코드 대신 variant·size·state·토큰 표).
   cva 정의에서 클래스를 상태별로 갈라 배경/글자/테두리 토큰만 남긴다.
   우리 DS는 hover·disabled 전용 토큰이 없다 — 원 토큰의 불투명도 변형(primary/90)·opacity-50이 실물. */
type SpecRow = { name: string; states: Record<string, { bg?: string; text?: string; border?: string; ring?: string }> };
type Spec = { variants: SpecRow[]; sizes: { name: string; tokens: string[] }[]; base: string[] };

/* 값은 코드 원문 그대로 — 접두사(bg-·hover: 등)를 떼지 않는다(그대로 붙여넣기 가능해야 함) */
function classToSlots(cls: string) {
  const slot: { bg?: string; text?: string; border?: string; ring?: string } = {};
  for (const t of cls.split(/\s+/)) {
    const bare = t.replace(/^(hover|focus-visible|dark|disabled):/, "");
    if (/^bg-/.test(bare)) slot.bg = t;
    else if (/^text-(?!xs|sm|base|lg|xl|\dxl|left|right|center)/.test(bare)) slot.text = t;
    else if (/^ring-(?!\[)/.test(bare)) slot.ring = t;
    else if (/^border(-|$)/.test(bare) && !/^border-\d/.test(bare)) slot.border = t;
  }
  return slot;
}

function extractSpec(src: string): Spec | null {
  // 따옴표는 역참조로 짝을 맞춘다 — [&_svg:not([class*='size-'])]처럼 다른 따옴표가 값 안에 산다
  const baseM = src.match(/cva\(\s*(["'`])([\s\S]*?)\1/);
  if (!baseM) return null;
  const blockOf = (label: string) => src.match(new RegExp(label + ':\\s*{([\\s\\S]*?)\\n\\s*}'))?.[1] ?? "";
  const entries = (block: string) =>
    [...block.matchAll(/(?:^|\n)\s*"?([\w-]+)"?:\s*\n?\s*(["'`])(.*?)\2/g)].map((m) => [m[1], m[3]] as const);
  const variants: SpecRow[] = entries(blockOf("variant")).map(([name, cls]) => {
    const states: SpecRow["states"] = {};
    const toks = cls.split(/\s+/);
    // 값은 원문 클래스 그대로(hover:·focus-visible: 접두사 포함) — 상태별로 행만 나눈다
    // 상태 라벨도 코드 실물 — 무접두사=base, hover:, focus-visible: (발명어 금지)
    // 색 슬롯(bg·text·border·ring)이 하나도 없는 상태는 행을 만들지 않는다(빈 행 방지)
    const put = (label: string, list: string[]) => {
      const s = classToSlots(list.join(" "));
      if (s.bg || s.text || s.border || s.ring) states[label] = s;
    };
    put("base", toks.filter((t) => !/^(hover|focus-visible|dark|disabled|aria-invalid):/.test(t)));
    put("hover", toks.filter((t) => /^hover:/.test(t)));
    put("focus-visible", toks.filter((t) => /^focus-visible:/.test(t)));
    return { name, states };
  });
  // size 값도 원문 문자열 그대로(has-[>svg]:px-3 등 포함) — 필터·가공 금지
  const sizes = entries(blockOf("size")).map(([name, cls]) => ({ name, tokens: [cls] }));
  return { variants: variants.filter((v) => Object.keys(v.states).length), sizes, base: baseM[2].trim().split(/\s+/) };
}

function specToMarkdown(card: HubCard, spec: Spec, overrides: Record<string, string>): string {
  const L: string[] = ["# " + card.name + (card.shadcn ? " (" + card.shadcn + ")" : ""), ""];
  if (Object.keys(overrides).length) {
    L.push("365 overrides: " + Object.entries(overrides).map(([k, v]) => k + "=" + v).join(" · "), "");
  }
  L.push("## Base classes", "", "```", spec.base.join(" "), "```", "");
  L.push("## Variant × State — token mapping", "", "| variant | state | background | text | border | ring |", "|---|---|---|---|---|---|");
  for (const v of spec.variants) {
    for (const [st, s] of Object.entries(v.states)) {
      L.push(`| ${v.name} | ${st} | ${s.bg ?? ""} | ${s.text ?? ""} | ${s.border ?? ""} | ${s.ring ?? ""} |`);
    }
  }
  L.push("", "## Size", "", "| size | classes |", "|---|---|");
  for (const s of spec.sizes) L.push(`| ${s.name} | ${s.tokens.join(" ")} |`);
  L.push("", "Note: no dedicated hover/disabled tokens — opacity variants of the base token (e.g. primary/90) and disabled:opacity-50.");
  return L.join("\n");
}

/* 토큰 셀 — 빈 값은 공백(— 제거), 값 앞에 실제 색 스와치(불투명도 변형은 opacity로 근사) */
function Tok({ v }: { v?: string }) {
  if (!v) return null;
  // 표시는 원문 그대로. 칩 색만 접두사(bg-·hover: 등)를 벗겨 토큰명으로 판정
  const m = v.replace(/^(hover|focus-visible|dark|disabled):/, "")
    .replace(/^(bg|text|border|ring)-/, "")
    .match(/^([a-z-]+)(?:\/(\d+))?$/);
  const base = m?.[1];
  const alpha = m?.[2] ? Number(m[2]) / 100 : 1;
  const KNOWN = ["primary", "primary-foreground", "secondary", "secondary-foreground", "destructive",
    "destructive-foreground", "accent", "accent-foreground", "muted", "muted-foreground",
    "background", "foreground", "card", "card-foreground", "popover", "border", "input", "ring", "success", "white"];
  const swatch = base && KNOWN.includes(base)
    ? { background: base === "white" ? "#fff" : "var(--" + base + ")", opacity: alpha }
    : null;
  return (
    <>
      {swatch ? <span className="tsw" style={swatch} /> : null}
      {v}
    </>
  );
}

/* 행 hover 복사 — 스샷(Statsig 로그 뷰어) 문법: 행에 올리면 우측에 작은 아이콘 */
function RowCopy({ text }: { text: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button type="button" className="rcbtn" title="이 행 복사" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); } catch { /* noop */ }
    }}>{ok ? "✓" : "⧉"}</button>
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
  const [tab, setTab] = React.useState<"spec" | "code">("spec"); // 프론트 기본 뷰 = 스펙 표
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
        <div className="tabs">
          <button type="button" className={"tab" + (tab === "spec" ? " on" : "")} onClick={() => setTab("spec")}>스펙</button>
          <button type="button" className={"tab" + (tab === "code" ? " on" : "")} onClick={() => setTab("code")}>코드</button>
        </div>
        <div className="codescroll">
          {err ? <div className="props">소스를 불러오지 못했다 — vocab-map · ui-src 동기화 확인</div> : null}
          {files && tab === "spec" ? (() => {
            const withSpec = files.map((f) => ({ f, spec: extractSpec(f.src) })).filter((x) => x.spec);
            if (!withSpec.length) {
              return <div className="props">No cva variant definition — see the 코드 tab for source.</div>;
            }
            return withSpec.map(({ f, spec }) => (
              <div className="specwrap" key={f.name}>
                <div className="fhead">
                  <span className="mono">{f.name}</span>
                  <span style={{ marginLeft: "auto" }}>
                    <CopyChip text={specToMarkdown(card, spec!, overrides)} label="표 복사(마크다운)" />
                  </span>
                </div>
                {Object.keys(overrides).length ? (
                  <div className="specnote">365 overrides — {Object.entries(overrides).map(([k, v]) => k + ": " + v).join(" · ")}</div>
                ) : null}
                <div className="specbox specbase">
                  <div className="sbhead"><span>base classes</span><RowCopy text={spec!.base.join(" ")} /></div>
                  <div className="mono sbval">{spec!.base.join(" ")}</div>
                </div>
                <div className="specbox">
                  <table className="spec-t">
                    <thead><tr><th>variant</th><th>state</th><th>background</th><th>text</th><th>border</th><th>ring</th><th /></tr></thead>
                    <tbody>
                      {spec!.variants.map((v) =>
                        Object.entries(v.states).map(([st, s], i) => (
                          <tr key={v.name + st} className={i === 0 ? "vstart" : undefined}>
                            {i === 0 ? <td rowSpan={Object.keys(v.states).length} className="mono vn">{v.name}</td> : null}
                            <td className="mono st">{st}</td>
                            <td className="mono"><Tok v={s.bg} /></td>
                            <td className="mono"><Tok v={s.text} /></td>
                            <td className="mono"><Tok v={s.border} /></td>
                            <td className="mono"><Tok v={s.ring} /></td>
                            <td className="rowcopy">
                              <RowCopy text={[s.bg, s.text, s.border, s.ring].filter(Boolean).join(" ")} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {spec!.sizes.length ? (
                  <div className="specbox">
                    <table className="spec-t">
                      <thead><tr><th>size</th><th>classes</th><th /></tr></thead>
                      <tbody>
                        {spec!.sizes.map((s) => (
                          <tr key={s.name} className="vstart">
                            <td className="mono vn">{s.name}</td>
                            <td className="mono sz">{s.tokens.join(" ")}</td>
                            <td className="rowcopy"><RowCopy text={s.tokens.join(" ")} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <div className="specnote">No dedicated hover/disabled tokens — opacity variants of the base token (e.g. <span className="mono">primary/90</span>) and <span className="mono">disabled:opacity-50</span>.</div>
              </div>
            ));
          })() : null}
          {files && tab === "code" ? (
            <>
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
          ) : null}
          {!files && !err ? <div className="props">불러오는 중…</div> : null}
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
