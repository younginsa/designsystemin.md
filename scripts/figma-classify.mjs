#!/usr/bin/env node
// 피그마 대조 분류기(H3, 2026-10-14) — 주간. 피그마 라이브러리 Theme(fe-requests/figma-values.json, scripts/figma-theme-read.js 로 읽음)를
// FE Storybook 실제 값(playground/fe-stories/fe-values.json)·대기 장부와 대조한다. 규칙(CLAUDE.md § 피그마): 피그마는 Storybook 을 따른다 —
// 단 장부 항목은 디자이너 결정값을 둔다.
//   pnpm figma:classify   → fe-requests/figma-report.md(사람용) + fe-requests/figma-plan.json(적용 계획 — scripts/figma-theme-apply.js 가 읽는다)
// 판정: 맞음 · 피그마 뒤처짐(FE 값으로) · 장부 값 아님(디자이너 값으로) · 피그마에 없음(장부 항목 — 질문) · FE 에 없음(그대로) · 피그마에 없음(참고)
// 적용은 사람이 승인한 뒤 관리자 세션이 use_figma 로 한다. 이 스크립트는 아무것도 고치지 않는다. 할 일 있으면 exit 1.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const fe = rd("playground/fe-stories/fe-values.json");
const fg = rd("fe-requests/figma-values.json");
const ledger = rd("fe-requests/pending-decisions.json").items.filter((i) => i.status === "pending" && i.check);
const feCss = readFileSync(join(ROOT, "playground/fe-stories/fe.css"), "utf8");
const MODES = ["light", "dark", "control"];
const feBy = fe.colorsByMode || { light: fe.colors };

// 표기 맞춤 — #RRGGBBAA · #RRGGBB/0.2 · /0.20 를 같은 값으로
const norm = (v) => {
  if (v == null) return null;
  let s = String(v).toUpperCase().trim();
  const h8 = s.match(/^#([0-9A-F]{6})([0-9A-F]{2})$/);
  if (h8) s = h8[2] === "FF" ? "#" + h8[1] : `#${h8[1]}/${(parseInt(h8[2], 16) / 255).toFixed(2)}`;
  const sl = s.match(/^(#[0-9A-F]{6})\/([\d.]+)$/);
  if (sl) s = Number(sl[2]) >= 1 ? sl[1] : `${sl[1]}/${Number(sl[2]).toFixed(2)}`;
  return s;
};
const pick = (v, mode) => (v && typeof v === "object" ? v[mode] : v);

// FE 가 그 모드에서 가리키는 팔레트 변수 → 피그마 Colors 이름 추정(적용 때 별칭으로 묶으려고). 못 찾으면 null — 적용 스크립트가 같은 값의 변수를 찾는다
const SEL = { light: ":root", dark: ".dark", control: ".theme-control" };
const feRef = (name, mode) => {
  const blocks = [...feCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].trim().split(",").map((x) => x.trim()).includes(SEL[mode]));
  for (const b of blocks.reverse()) { const m = b[2].match(new RegExp(`--general-${name}:\\s*var\\(--([a-z0-9-]+)\\)`)); if (m) return m[1]; }
  if (mode !== "light") return feRef(name, "light");
  return null;
};
const HUE = { gray: "Gray", red: "SemanticRed", green: "SemanticGreen", blue: "SemanticBlue", yellow: "SemanticYellow", orange: "SemanticOrange" };
const figmaName = (ref) => {
  if (!ref) return null;
  let m = ref.match(/^(white|black)-(\d+)$/); if (m) return `Basic Foreground/${m[1] === "white" ? "White" : "Black"}/${m[2]}`;
  m = ref.match(/^(?:(day|dusk)-)?([a-z]+)-(\d+)$/); if (m && HUE[m[2]]) return `${m[1] === "dusk" ? "Dusk" : "Day"} mode/${HUE[m[2]]}/${m[3]}`;
  if (ref.startsWith("product-hinas-brand")) return "Product/HiNAS Brand";
  return null;
};

const rows = [];
const plan = [];
const short = (n) => n.replace(/^(General|Chart)\//, "");
const figmaByShort = Object.fromEntries(Object.entries(fg.vars).filter(([n]) => /^(General|Chart)\//.test(n)).map(([n, v]) => [short(n), { full: n, ...v }]));
const names = [...new Set([...Object.keys(figmaByShort), ...Object.keys(feBy.light || {})])].sort();
for (const name of names) for (const mode of MODES) {
  const f = figmaByShort[name]; const feVal = feBy[mode]?.[name] ?? null;
  const item = ledger.find((i) => i.check.kind === "color" && i.check.name === name);
  const figVal = f ? f[mode] : null;
  let verdict, todo = false, target = null, why;
  if (item) {
    target = pick(item.check.ours, mode);
    if (!f) { verdict = "ledger-missing"; todo = true; why = `장부 항목(${item.id}) — 피그마 Theme 에 변수가 없음. 추가 여부 결정`; }
    else if (norm(figVal) === norm(target)) { verdict = "ok-ledger"; why = `장부 항목(${item.id}) — 디자이너 값 유지 중`; }
    else { verdict = "ledger-off"; todo = true; why = `장부 항목(${item.id}) — 디자이너 값 ${target} 이 아님`; }
  } else if (!f) { verdict = "figma-missing"; why = "피그마 Theme 에 없음 — 참고(묶음 변수일 수 있음)"; }
  else if (feVal == null) { verdict = "fe-missing"; why = "FE 에 없는 피그마 변수 — 그대로 둠"; }
  else if (norm(figVal) === norm(feVal)) verdict = "ok";
  else { verdict = "figma-behind"; todo = true; target = feVal; why = `FE 는 ${feVal}${feRef(name, mode) ? ` (--${feRef(name, mode)})` : ""} — 피그마를 FE 값으로`; }
  if (verdict === "ok" || verdict === "ok-ledger") { rows.push({ name, mode, verdict }); continue; }
  rows.push({ name, mode, verdict, todo, figma: figVal, figmaAlias: f?.[mode + "Alias"] ?? null, fe: feVal, target, why });
  if (todo && f) plan.push({ variable: f.full, id: f.id, mode, from: figVal, to: target, alias: verdict === "figma-behind" ? figmaName(feRef(name, mode)) : null });
}
// 틴트 — Tint/<기준>/<n> 은 기준 변수 값 + 투명도 n% 여야 한다(피그마 안의 일관성)
for (const [n, v] of Object.entries(fg.vars)) {
  const m = n.match(/^Tint\/(.+)\/(\d+)$/); if (!m) continue;
  for (const mode of MODES) {
    const base = feBy[mode]?.[m[1]] ?? null; if (!base) continue;
    const want = `${norm(base).split("/")[0]}/${(Number(m[2]) / 100).toFixed(2)}`;
    if (norm(v[mode]) !== want) { rows.push({ name: n, mode, verdict: "figma-behind", todo: true, figma: v[mode], fe: base, target: want, why: `기준 ${m[1]} = ${base} → ${want}` }); plan.push({ variable: n, id: v.id, mode, from: v[mode], to: want, alias: null }); }
  }
}
// 글꼴 — 장부 fontFeature 항목(ss02): 피그마 Inter 스타일이 디자이너 값을 가져야 한다
const ff = ledger.find((i) => i.check.kind === "fontFeature");
const st = fg.interStyles;
if (ff && st) {
  if (st.noSs02.length) rows.push({ name: "Inter 글자 스타일 SS02", mode: "all", verdict: "ledger-off", todo: true, figma: `${st.ss02}/${st.sampled}`, fe: fe.fontFeatureSettings, target: "SS02", why: `장부 항목(${ff.id}) — SS02 없는 스타일 ${st.noSs02.length}: ${st.noSs02.join(", ")} (스타일마다 쓰는 레이어 1개 표본)` });
  else rows.push({ name: "Inter 글자 스타일 SS02", mode: "all", verdict: "ok-ledger" });
}

const LABEL = { "ledger-missing": "피그마에 없음(장부 — 질문)", "ledger-off": "장부 값 아님(디자이너 값으로)", "figma-behind": "피그마 뒤처짐(FE 값으로)", "figma-missing": "피그마에 없음(참고)", "fe-missing": "FE 에 없음(그대로)", ok: "맞음", "ok-ledger": "맞음(장부 값 유지)" };
const ORDER = Object.keys(LABEL);
const count = Object.fromEntries(ORDER.map((v) => [v, rows.filter((r) => r.verdict === v).length]));
const todo = rows.filter((r) => r.todo);
const summary = ORDER.filter((v) => count[v]).map((v) => `${LABEL[v]} ${count[v]}`).join(" · ");
const shown = rows.filter((r) => !r.verdict.startsWith("ok")).sort((a, b) => ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict) || a.name.localeCompare(b.name) || MODES.indexOf(a.mode) - MODES.indexOf(b.mode));
const lines = [`# 피그마 대조 보고서(주간)`, ``, `피그마 ${fg.collection} 읽음 ${fg.read} · FE 빌드 ${fe.feBuild}(${fe.synced})`, ``, `할 일 ${todo.length}건 — ${summary}`, ``, `| 판정 | 변수 | 모드 | 피그마 | FE | 목표 | 메모 |`, `|---|---|---|---|---|---|---|`];
for (const r of shown) lines.push(`| ${LABEL[r.verdict]} | ${r.name} | ${r.mode} | ${r.figma ?? "—"}${r.figmaAlias ? ` (${r.figmaAlias})` : ""} | ${r.fe ?? "—"} | ${r.target ?? "—"} | ${r.why} |`);
lines.push("", `적용 계획 ${plan.length}건 → fe-requests/figma-plan.json (승인 후 scripts/figma-theme-apply.js 로 적용 · 게시는 피그마에서 직접)`);
writeFileSync(join(ROOT, "fe-requests/figma-report.md"), lines.join("\n") + "\n");
writeFileSync(join(ROOT, "fe-requests/figma-plan.json"), JSON.stringify({ $note: "figma:classify 적용 계획(편집 금지) — scripts/figma-theme-apply.js 의 PLAN 에 넣어 use_figma 로 실행", file: fg.file, feBuild: fe.feBuild, read: fg.read, todo: todo.length, summary, ops: plan }, null, 1) + "\n");
console.log(`[figma:classify] 할 일 ${todo.length} · ${summary}`);
for (const r of todo) console.log(`  - ${LABEL[r.verdict]} ${r.name}[${r.mode}]: 피그마 ${r.figma ?? "—"} → ${r.target ?? "?"} — ${r.why}`);
process.exit(todo.length ? 1 : 0);
