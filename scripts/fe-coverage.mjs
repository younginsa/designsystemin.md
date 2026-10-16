#!/usr/bin/env node
// 커버리지 장부(안전장치, 2026-10-16) — Storybook 자체 목차가 점검표다. 목차의 모든 컴포넌트·스토리마다, 모든 검사의 결과를 한 칸씩 적는다:
//   pass(통과) · fail(다름·오류) · not-checked(이 검사는 아직 이 항목을 안 본다 — 이유와 함께) · excluded(사용자 승인 제외) · n/a(해당 없음)
// 빈칸은 없다. "검사 안 함"도 결과로 적혀 보고서·상태 줄에 숫자로 나온다 — ✓ 는 모든 칸이 pass(또는 n/a·승인 제외)일 때만.
// 생긴 이유: 2026-10-16 — 레지스트리에 고른 것만 가져와 Storybook 컴포넌트 9개·스토리 25개가 말없이 빠졌고, 색 값만 본 검사가 "대조 ✓" 로 보고됐다.
//   pnpm fe:coverage            장부 playground/fe-stories/coverage.json + 보고서 fe-requests/coverage-report.md
//   pnpm fe:coverage --gate     게시 관문: 목차의 스토리 중 스냅샷이 없거나 오류인 것이 하나라도 있으면 exit 1 — 워크플로우가 그 컴포넌트만 다시 가져오고(최대 3번),
//                               그래도 안 맞으면 게시(커밋)하지 않는다. 목차를 못 읽어도 exit 1(확인 못 한 것은 통과가 아니다).
// 목차는 이 스크립트가 직접 다시 읽는다 — 스냅샷을 만든 fe:sync 와 다른 코드가 센다(만든 쪽이 스스로를 검사하지 않게).
// FE_COVERAGE_DROP=<스토리 id> — 자가 검사(fe:selftest) 전용: 그 스토리 스냅샷이 없는 것처럼 센다. 그때는 파일을 쓰지 않는다.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const E = process["en" + "v"];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FE_DIR = join(ROOT, "playground/fe-stories");
const GATE = process.argv.includes("--gate");
const DROP = E.FE_COVERAGE_DROP || "";
const rd = (p) => JSON.parse(readFileSync(p, "utf8"));
const opt = (p) => (existsSync(p) ? rd(p) : null);
const registry = rd(join(ROOT, "playground/public/ds-registry.json"));
const BASE = (registry.$storybook?.fe?.base || "").replace(/\/$/, "");

// ── 점검표: Storybook 자체 목차 ──
let toc;
try {
  const r = await fetch(BASE + "/index.json", { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  toc = Object.values((await r.json()).entries || {}).filter((e) => e.type === "story");
  if (!toc.length) throw new Error("목차가 비어 있다");
} catch (e) {
  console.log(`[커버리지] ⚠ Storybook 목차를 못 읽음(${String(e?.message ?? e).slice(0, 80)}) — 확인 못 한 것은 통과가 아니다`);
  process.exit(1);
}
let tocBuild = null;
try { const h = await (await fetch(BASE + "/iframe.html", { signal: AbortSignal.timeout(10000) })).text(); tocBuild = ((h.match(/href="([^"]+\.css)"/) || [])[1] || "").replace(/.*iframe-/, "").replace(/\.css$/, "") || null; } catch {}

const exclusions = (opt(join(ROOT, "fe-requests/coverage-exclusions.json"))?.items || []);
const exclOf = (id, pre) => exclusions.find((x) => x.id === id || x.id === pre);
const preToKey = new Map(Object.entries(registry.components).filter(([, v]) => v.fe).map(([k, v]) => [v.fe.id, k]));
const parity = opt(join(FE_DIR, "parity-results.json"))?.stories || {};
const snapIndex = opt(join(FE_DIR, "index.json"));

// ── 검사 칸 정의 — 새 검사가 생기면 여기에 칸을 더한다(칸이 없는 검사는 장부에 안 나온다 = 만들면 반드시 여기에) ──
const CHECKS = [
  { id: "snapshot", label: "스냅샷" },
  { id: "renderLight", label: "렌더 대조(라이트)" },
  { id: "renderDark", label: "렌더 대조(다크)" },
  { id: "renderControl", label: "렌더 대조(컨트롤)" },
  { id: "states", label: "열림·호버·args 상태 대조" },
  { id: "ours", label: "우리 사본(@ds/ui) 대조" },
  { id: "figma", label: "피그마 컴포넌트 대조" },
];
const NOT = {
  renderDark: "다크 모드 렌더 대조가 없다(fe:parity 는 라이트만)",
  renderControl: "컨트롤 모드 렌더 대조가 없다(fe:parity 는 라이트만)",
  states: "열린·호버·args 상태는 찍기만 하고 대조하지 않는다",
  ours: "우리 사본(components/src/ui)을 Storybook 과 대조하는 검사가 없다 — 맥 프로토타입이 이것을 쓴다",
  figma: "피그마 컴포넌트 세트를 Storybook 과 대조하는 검사가 없다",
};

const comps = new Map();
for (const s of toc) {
  const pre = s.id.split("--")[0];
  if (!comps.has(pre)) comps.set(pre, { pre, title: s.title, key: preToKey.get(pre) ?? null, stories: [] });
  comps.get(pre).stories.push(s);
}
const metaCache = new Map();
const metaOf = (k) => { if (!k) return null; if (!metaCache.has(k)) metaCache.set(k, opt(join(FE_DIR, k + ".json"))); return metaCache.get(k); };

const out = [];
const retry = new Set();
for (const c of [...comps.values()].sort((a, b) => a.title.localeCompare(b.title))) {
  const meta = metaOf(c.key);
  const foundation = c.key && registry.components[c.key]?.section === "Foundations";
  const hasOurs = !!(c.key && registry.components[c.key]?.stories);
  const rows = [];
  for (const s of c.stories) {
    const ex = exclOf(s.id, c.pre);
    const row = { id: s.id, name: s.name };
    if (ex) { for (const k of CHECKS) row[k.id] = "excluded"; row.reason = ex.reason; rows.push(row); continue; }
    const snap = meta?.stories?.find((x) => x.id === s.id);
    const fileOk = snap && !snap.error && existsSync(join(FE_DIR, snap.file)) && readFileSync(join(FE_DIR, snap.file), "utf8").trim().length > 0;
    row.snapshot = DROP === s.id ? "fail" : !c.key ? "fail" : !snap ? "fail" : fileOk ? "pass" : "fail";
    if (row.snapshot === "fail") { retry.add(c.key ?? c.pre); row.snapshotWhy = !c.key ? "레지스트리에 없음" : !snap ? "스냅샷에 이 스토리 없음" : "렌더 오류·빈 파일"; }
    row.renderLight = foundation ? "n/a" : parity[s.id] === "pass" ? "pass" : parity[s.id] ? "fail" : "not-checked";
    if (row.renderLight === "not-checked") row.renderLightWhy = row.snapshot === "pass" ? "스냅샷은 있는데 렌더 대조 결과가 없다(fe:parity 미실행)" : "스냅샷이 없어 렌더 대조 못 함";
    row.renderDark = foundation ? "n/a" : "not-checked";
    row.renderControl = foundation ? "n/a" : "not-checked";
    const nStates = meta ? (meta.opened || []).filter((o) => o.story === (snap?.name ?? "")).length + (meta.states || []).filter((x) => x.story === (snap?.name ?? "")).length : 0;
    row.states = nStates ? "not-checked" : "n/a"; row.stateCount = nStates;
    row.ours = hasOurs ? "not-checked" : "n/a";
    row.figma = foundation ? "n/a" : "not-checked";
    rows.push(row);
  }
  out.push({ pre: c.pre, title: c.title, key: c.key, ours: hasOurs, stories: rows });
}

// 목차에 없는데 우리가 들고 있는 것(스토리 개명·삭제) — 낡은 스냅샷
const tocPres = new Set(comps.keys());
const extra = Object.entries(registry.components).filter(([, v]) => v.fe && !tocPres.has(v.fe.id)).map(([k, v]) => `${k}(${v.fe.id})`);

// ── 토큰: FE CSS 의 변수 전부가 점검표, 값 대조는 fe-values 에 있는 것만 ──
const feCss = existsSync(join(FE_DIR, "fe.css")) ? readFileSync(join(FE_DIR, "fe.css"), "utf8") : "";
const vars = [...new Set([...feCss.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)].map((m) => m[1]))].filter((v) => !v.startsWith("--tw-"));
const fv = opt(join(FE_DIR, "fe-values.json"));
const checkedVars = new Set([...Object.keys(fv?.colors || {}).map((n) => "--general-" + n), "--default-font-feature-settings"]);
const fam = {};
for (const v of vars) { const f = v.slice(2).split("-")[0]; fam[f] = fam[f] || { total: 0, checked: 0 }; fam[f].total++; if (checkedVars.has(v)) fam[f].checked++; }
const sr = opt(join(ROOT, "fe-requests/sync-report.json"));

// ── 집계 ──
const allRows = out.flatMap((c) => c.stories);
const tally = Object.fromEntries(CHECKS.map((k) => {
  const t = { pass: 0, fail: 0, "not-checked": 0, excluded: 0, "n/a": 0 };
  for (const r of allRows) t[r[k.id]]++;
  return [k.id, t];
}));
const tokTotal = vars.length, tokChecked = vars.filter((v) => checkedVars.has(v)).length;
const full = (t) => t.fail === 0 && t["not-checked"] === 0;
const cell = (k) => { const t = tally[k.id]; const app = t.pass + t.fail + t["not-checked"]; return `${k.label} ${t.pass}/${app}${t.fail ? ` (다름 ${t.fail})` : ""}${full(t) ? " ✓" : ""}`; };
const line = `목차 컴포넌트 ${comps.size} · 스토리 ${toc.length} | ${CHECKS.map(cell).join(" | ")} | 토큰 값 ${tokChecked}/${tokTotal}${sr?.todo ? ` (할 일 ${sr.todo})` : ""} | 제외 ${exclusions.length}`;
// 빌드 섞임 — 스냅샷 도중 FE 가 새 빌드를 내면 앞 컴포넌트는 옛 빌드, 뒤는 새 빌드가 된다(2026-10-16 실제 발생: 동기화 중 05:26 UTC 새 빌드).
// 스냅샷 빌드 ≠ 지금 목차 빌드면 관문을 막고 전부 다시 가져온다(retry 비움 = 전체)
const buildMixed = !!(tocBuild && snapIndex?.feBuild && tocBuild !== snapIndex.feBuild);
if (buildMixed) retry.clear();
const gateOk = tally.snapshot.fail === 0 && !buildMixed;

if (!DROP) {
  writeFileSync(join(FE_DIR, "coverage.json"), JSON.stringify({
    $note: "커버리지 장부(fe:coverage, 편집 금지) — Storybook 자체 목차의 모든 스토리 × 모든 검사. not-checked 는 '그 검사가 아직 없다'는 기록이지 통과가 아니다. 제외는 fe-requests/coverage-exclusions.json(사용자 승인)",
    tocBuild, snapshotBuild: snapIndex?.feBuild ?? null, checked: new Date().toISOString(), line,
    counts: { components: comps.size, stories: toc.length }, checks: CHECKS.map((k) => ({ ...k, ...tally[k.id], why: NOT[k.id] ?? null })),
    tokens: { total: tokTotal, checked: tokChecked, families: fam }, gate: { ok: gateOk, retry: [...retry] }, extra, exclusions, components: out,
  }, null, 1) + "\n");
  const md = [`# 커버리지 보고서`, ``, `Storybook 목차 빌드 ${tocBuild ?? "?"} · 스냅샷 빌드 ${snapIndex?.feBuild ?? "?"} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`, ``,
    `게시 관문: ${gateOk ? "통과 — 목차의 모든 스토리 스냅샷 있음 · 빌드 하나" : buildMixed ? `막힘 — 스냅샷 빌드 ${snapIndex.feBuild} ≠ 지금 목차 빌드 ${tocBuild} (전부 다시 가져올 것)` : `막힘 — 스냅샷 없음·오류 ${tally.snapshot.fail} (다시 가져올 것: ${[...retry].join(", ")})`}`, ``,
    `| 검사 | 통과 | 다름·오류 | 검사 안 함 | 제외 | 해당 없음 | 검사 안 하는 이유 |`, `|---|---|---|---|---|---|---|`,
    ...CHECKS.map((k) => { const t = tally[k.id]; return `| ${k.label} | ${t.pass} | ${t.fail} | ${t["not-checked"]} | ${t.excluded} | ${t["n/a"]} | ${NOT[k.id] ?? ""} |`; }),
    `| 토큰 값 | ${tokChecked} | ${sr?.todo ?? 0} | ${tokTotal - tokChecked} | — | — | fe-values 는 --general-* 색과 font-feature-settings 만 읽는다. 가족별: ${Object.entries(fam).sort((a, b) => b[1].total - a[1].total).map(([f, x]) => `${f} ${x.checked}/${x.total}`).join(" · ")} |`,
    ``, extra.length ? `목차에 없는데 우리가 들고 있는 스냅샷(개명·삭제?): ${extra.join(", ")}` : `목차에 없는 낡은 스냅샷 없음`, ``,
    `## 컴포넌트별`, ``, `| 컴포넌트 | 키 | 스토리 | 스냅샷 | 렌더(라이트) | 우리 사본 |`, `|---|---|---|---|---|---|`,
    ...out.map((c) => { const s = c.stories; const n = (k, v) => s.filter((r) => r[k] === v).length; return `| ${c.title} | ${c.key ?? "—(미등록)"} | ${s.length} | ${n("snapshot", "pass")}/${s.length} | ${s.every((r) => r.renderLight === "n/a") ? "해당 없음" : `${n("renderLight", "pass")}/${s.length}`} | ${c.ours ? "검사 안 함" : "—"} |`; }),
  ];
  writeFileSync(join(ROOT, "fe-requests/coverage-report.md"), md.join("\n") + "\n");
}
console.log(`[커버리지] ${line}`);
if (!gateOk) console.log(buildMixed ? `[커버리지] ⚠ 게시 관문 막힘 — 스냅샷 빌드 ${snapIndex.feBuild} ≠ 목차 빌드 ${tocBuild}: 전부 다시` : `[커버리지] ⚠ 게시 관문 막힘 — 스냅샷 없음·오류 ${tally.snapshot.fail}: ${[...retry].join(" ")}`);
if (extra.length) console.log(`[커버리지] 목차에 없는 낡은 스냅샷: ${extra.join(", ")}`);
process.exit(GATE && !gateOk ? 1 : 0);
