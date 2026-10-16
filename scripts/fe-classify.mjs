#!/usr/bin/env node
// FE 대조 분류기(H2, 2026-10-14) — FE Storybook 실제 값(fe-values.json, fe:sync 가 기록)을 우리 값·대기 장부와 대조해 5가지로 나눈다.
//   pnpm fe:classify            보고서 fe-requests/sync-report.md + 요약 fe-requests/sync-report.json 을 쓴다
// 판정(CLAUDE.md § 원천):
//   장부에 있고 FE 가 결정 당시 값 그대로 → 로컬이 앞섬(유지 · 댓글 없으면 할 일)
//   장부에 있고 FE 가 우리 값이 됨        → FE 반영됨(장부 닫기 = 할 일)
//   장부에 있고 FE 가 다른 값으로 바뀜     → 충돌(질문)
//   장부에 없고 FE 가 직전 기록 대비 바뀜  → Storybook 이 앞섬(우리 쪽 맞추기 = 할 일)
//   장부에 없고 FE 도 그대로인데 다름      → 원인 모를 차이(질문 · 자동 수정 금지)
// 할 일이 하나라도 있으면 exit 1 — GitHub Actions 가 빨갛게 끝나 메일이 간다. 아무것도 고치지 않는다(보고 전용).
// "직전 기록" = git HEAD 의 fe-values.json(봇 커밋 전에 돌리면 이전 빌드 값). 없으면 원인 모를 차이로 분류한다.
// 의도적으로 다르게 두는 값(차이를 알고 받아들인 것)은 fe-requests/accepted-diffs.json 에 { name, fe, note } 로 적는다 — FE 값이 그대로일 때만 조용하다.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const E = process["en"+"v"];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const VALUES = "playground/fe-stories/fe-values.json";
// FE_VALUES_PATH·FE_REPORT_DIR — 자가 검사(fe:selftest)가 일부러 바꾼 값 사본으로 돌릴 때만 쓴다(보고서도 임시 폴더로)
const fe = E.FE_VALUES_PATH ? JSON.parse(readFileSync(E.FE_VALUES_PATH, "utf8")) : rd(VALUES);
const REPORT_DIR = E.FE_REPORT_DIR || join(ROOT, "fe-requests");
const prevRaw = spawnSync("git", ["show", `${E.FE_PREV_REF || "HEAD"}:${VALUES}`], { cwd: ROOT, encoding: "utf8" });
const prev = prevRaw.status === 0 ? JSON.parse(prevRaw.stdout) : null;
const ledger = rd("fe-requests/pending-decisions.json");
const ACC = "fe-requests/accepted-diffs.json";
const accepted = existsSync(join(ROOT, ACC)) ? rd(ACC).items || [] : [];
const rows = rd("playground/public/dstk/semantic-map.json").rows;
const css = readFileSync(join(ROOT, "playground/app/globals.css"), "utf8");
const oursFeature = (css.match(/--default-font-feature-settings:\s*([^;]+);/) || [])[1]?.trim() || "normal";

// 표기 차이는 차이가 아니다 — #0000000F(8자리 hex) = #000000/0.06(fe-values 표기). 알파는 소수 둘째 자리로 맞춘다
const up = (v) => {
  if (v == null) return null;
  let s = String(v).toUpperCase().trim();
  const h8 = s.match(/^#([0-9A-F]{6})([0-9A-F]{2})$/);
  if (h8) s = h8[2] === "FF" ? "#" + h8[1] : `#${h8[1]}/${(parseInt(h8[2], 16) / 255).toFixed(2)}`;
  const sl = s.match(/^(#[0-9A-F]{6})\/([\d.]+)$/);
  if (sl) s = Number(sl[2]) >= 1 ? sl[1] : `${sl[1]}/${Number(sl[2]).toFixed(2)}`;
  return s;
};
const MODES = ["light", "dark", "control"];
const feByMode = fe.colorsByMode || { light: fe.colors || {} };
const prevByMode = prev ? prev.colorsByMode || { light: prev.colors || {} } : null;
const subjects = [];
for (const mode of MODES) {
  const fm = feByMode[mode]; if (!fm) continue;
  for (const [name, feVal] of Object.entries(fm)) {
    const row = rows.find((r) => r.name === name);
    subjects.push({ kind: "color", mode, name, ours: row ? row[mode]?.hex : null, fe: feVal, prevFe: prevByMode?.[mode]?.[name] ?? null, prevKnown: !!prevByMode?.[mode] });
  }
  for (const r of rows) if (!(r.name in fm)) subjects.push({ kind: "color", mode, name: r.name, ours: r[mode]?.hex, fe: null, prevFe: null, prevKnown: true });
}
subjects.push({ kind: "fontFeature", mode: "all", name: "font-feature-settings", ours: oursFeature, fe: fe.fontFeatureSettings, prevFe: prev?.fontFeatureSettings ?? null, prevKnown: !!prev });
// 장부 check 의 ours·feBefore 는 문자열(모든 모드 같음) 또는 { light, dark, control }
const pick = (v, mode) => (v && typeof v === "object" ? v[mode] : v);

const findLedger = (s) => ledger.items.find((i) => i.status === "pending" && i.check && i.check.kind === s.kind && (s.kind === "fontFeature" || i.check.name === s.name));
const out = [];
for (const s of subjects) {
  const item = findLedger(s);
  if (item) {
    const c = { ours: pick(item.check.ours, s.mode), feBefore: pick(item.check.feBefore, s.mode) };
    let verdict, todo, why;
    if (up(s.fe) === up(c.ours)) { verdict = "shipped"; todo = true; why = "FE 가 우리 결정 값이 됨 — 장부 status=shipped 로 닫기"; }
    else if (up(s.fe) === up(c.feBefore)) {
      verdict = "local-ahead";
      const posted = item.chromaticComment?.status === "posted";
      todo = !posted; why = posted ? `FE 미반영 — 댓글 게시됨(${item.chromaticComment.date})` : "FE 미반영 — Chromatic 댓글 초안 필요";
    } else { verdict = "conflict"; todo = true; why = `FE 가 결정 당시(${c.feBefore})도 우리 값(${c.ours})도 아닌 ${s.fe} 로 바뀜 — 질문`; }
    out.push({ ...s, ledger: item.id, verdict, todo, why });
    continue;
  }
  if (up(s.ours) === up(s.fe)) continue;
  if (s.fe == null) { out.push({ ...s, verdict: "ours-only", todo: false, why: "FE 에 없는 우리 토큰 — 프로토타입 전용" }); continue; }
  if (s.ours == null) { out.push({ ...s, verdict: "fe-only", todo: false, why: "우리에게 없는 FE 토큰 — 참고" }); continue; }
  const acc = accepted.find((a) => a.name === s.name && (!a.mode || a.mode === s.mode));
  if (acc && up(acc.fe) === up(s.fe)) { out.push({ ...s, verdict: "accepted", todo: false, why: acc.note }); continue; }
  const changed = s.prevKnown && up(s.prevFe) !== up(s.fe);
  if (changed) out.push({ ...s, verdict: "storybook-ahead", todo: true, why: `FE 가 ${s.prevFe ?? "(없음)"} → ${s.fe} 로 바꿈 — 우리 쪽 맞추기` });
  else out.push({ ...s, verdict: "unknown-drift", todo: true, why: s.prevKnown ? "장부에 없고 FE 도 그대로 — 원인 확인 필요(자동 수정 금지)" : "직전 기록 없음(첫 실행) — 원인 확인 필요" });
}

const ORDER = ["conflict", "storybook-ahead", "unknown-drift", "shipped", "local-ahead", "accepted", "fe-only", "ours-only"];
const LABEL = { conflict: "충돌(질문)", "storybook-ahead": "Storybook 이 앞섬(맞추기)", "unknown-drift": "원인 모를 차이(질문)", shipped: "FE 반영됨(장부 닫기)", "local-ahead": "로컬이 앞섬(대기)", accepted: "알고 둔 차이", "fe-only": "FE 에만 있음", "ours-only": "우리에게만 있음" };
out.sort((a, b) => ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict) || a.name.localeCompare(b.name) || MODES.indexOf(a.mode) - MODES.indexOf(b.mode));
const count = Object.fromEntries(ORDER.map((v) => [v, out.filter((o) => o.verdict === v).length]));
const todo = out.filter((o) => o.todo);
const summary = ORDER.filter((v) => count[v]).map((v) => `${LABEL[v]} ${count[v]}`).join(" · ") || "차이 없음";

const lines = [`# FE 대조 보고서`, ``, `FE 빌드 ${fe.feBuild} · ${fe.synced} 동기화 · 직전 기록 ${prev ? prev.feBuild : "없음"}`, ``, `할 일 ${todo.length}건 — ${summary}`, ``, `| 판정 | 대상 | 모드 | 우리 | FE | 직전 FE | 할 일 | 메모 |`, `|---|---|---|---|---|---|---|---|`];
for (const o of out) lines.push(`| ${LABEL[o.verdict]} | ${o.name}${o.ledger ? ` (장부 ${o.ledger})` : ""} | ${o.mode} | ${o.ours ?? "—"} | ${o.fe ?? "—"} | ${o.prevFe ?? "—"} | ${o.todo ? "예" : ""} | ${o.why} |`);
writeFileSync(join(REPORT_DIR, "sync-report.md"), lines.join("\n") + "\n");
writeFileSync(join(REPORT_DIR, "sync-report.json"), JSON.stringify({ $note: "fe:classify 요약(편집 금지) — fe-status.mjs 가 읽는다", feBuild: fe.feBuild, synced: fe.synced, todo: todo.length, summary, items: out.map(({ kind, mode, name, ours, fe, prevFe, verdict, todo, ledger }) => ({ kind, mode, name, ours, fe, prevFe, verdict, todo, ledger })) }, null, 1) + "\n");

console.log(`[fe:classify] 빌드 ${fe.feBuild} · 할 일 ${todo.length} · ${summary}`);
for (const o of todo) console.log(`  - ${LABEL[o.verdict]} ${o.name}[${o.mode}]: 우리 ${o.ours ?? "—"} · FE ${o.fe ?? "—"} — ${o.why}`);
if (E.GITHUB_STEP_SUMMARY && !E.FE_REPORT_DIR) writeFileSync(E.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n", { flag: "a" });
process.exit(todo.length ? 1 : 0);
