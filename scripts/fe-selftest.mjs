#!/usr/bin/env node
// 자가 검사(안전장치, 2026-10-16) — 각 검사에 "알고 있는 차이"를 일부러 심어 실제로 잡는지 확인한다. 조용히 멈춘 검사를 찾는 장치.
// 저장소 파일은 건드리지 않는다 — 임시 폴더의 사본을 망가뜨려 검사에 먹인다.
//   pnpm fe:selftest        (렌더 시험은 DS_BASE 의 /ds.css 가 필요 — 기본 http://localhost:3000. 없으면 그 시험은 "못 함"=실패)
// 시험:
//   ① 게시 관문 — 스토리 하나의 스냅샷이 없는 것처럼 세면 fe:coverage --gate 가 막아야 한다
//   ② 값 대조   — Storybook 값 사본의 primary 색을 바꾸면 fe:classify 가 할 일로 잡아야 한다
//   ③ 렌더 대조 — 스냅샷 사본의 클래스 하나를 바꾸면 fe:parity 가 차이로 잡아야 한다
// 하나라도 못 잡으면 exit 1(주간 워크플로우가 빨갛게 끝나 메일).

import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const E = process["en" + "v"];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FE_DIR = join(ROOT, "playground/fe-stories");
const DS = (E.DS_BASE || "http://localhost:3000").replace(/\/$/, "");
const run = (script, args = [], extra = {}) => spawnSync(process.execPath, [join(ROOT, "scripts", script), ...args], { cwd: ROOT, encoding: "utf8", env: { ...E, ...extra }, timeout: 300000 });
const results = [];
const tmp = mkdtempSync(join(tmpdir(), "fe-selftest-"));

// ① 게시 관문
{
  const cov = JSON.parse(readFileSync(join(FE_DIR, "coverage.json"), "utf8"));
  const victim = cov.components.flatMap((c) => c.stories).find((s) => s.snapshot === "pass")?.id;
  if (!victim) results.push({ name: "게시 관문", ok: false, why: "통과한 스냅샷이 하나도 없어 시험 못 함" });
  else {
    const r = run("fe-coverage.mjs", ["--gate"], { FE_COVERAGE_DROP: victim });
    const caught = r.status === 1 && /막힘/.test(r.stdout);
    results.push({ name: "게시 관문", ok: caught, why: caught ? `스냅샷 하나(${victim})를 빼자 막았다` : `빼도 통과했다(exit ${r.status})` });
  }
}

// ② 값 대조
{
  const fv = JSON.parse(readFileSync(join(FE_DIR, "fe-values.json"), "utf8"));
  if (fv.colors) fv.colors.primary = "#123456";
  if (fv.colorsByMode?.light) fv.colorsByMode.light.primary = "#123456";
  const p = join(tmp, "fe-values.json");
  writeFileSync(p, JSON.stringify(fv));
  const r = run("fe-classify.mjs", [], { FE_VALUES_PATH: p, FE_REPORT_DIR: tmp });
  const caught = r.status === 1 && /primary/.test(r.stdout);
  results.push({ name: "값 대조", ok: caught, why: caught ? "primary 색을 바꾸자 할 일로 잡았다" : `못 잡았다(exit ${r.status})` });
}

// ③ 렌더 대조
{
  let ok = false, why = "";
  try {
    await fetch(DS + "/ds.css", { signal: AbortSignal.timeout(3000) }).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); });
    const C = "button";
    const dir = join(tmp, "fe");
    cpSync(join(FE_DIR, C), join(dir, C), { recursive: true });
    cpSync(join(FE_DIR, C + ".json"), join(dir, C + ".json"));
    const meta = JSON.parse(readFileSync(join(dir, C + ".json"), "utf8"));
    const s = meta.stories.find((x) => !x.error);
    const f = join(dir, s.file);
    const html = readFileSync(f, "utf8");
    const broken = html.includes("bg-primary") ? html.replace("bg-primary", "bg-destructive") : html.replace(/class="/, 'class="p-8 ');
    writeFileSync(f, broken);
    meta.stories = [s];
    writeFileSync(join(dir, C + ".json"), JSON.stringify(meta));
    const r = run("fe-parity.mjs", [C], { FE_PARITY_DIR: dir, DS_BASE: DS });
    ok = r.status === 1 && /차이 [1-9]/.test(r.stdout);
    why = ok ? `${C}/${s.name} 의 클래스 하나를 바꾸자 차이로 잡았다` : `못 잡았다(exit ${r.status}) ${r.stdout.split("\n").slice(-2).join(" ").slice(0, 160)}`;
  } catch (e) { why = `시험 못 함 — ${DS}/ds.css 없음(${String(e?.message ?? e).slice(0, 60)})`; }
  results.push({ name: "렌더 대조", ok, why });
}

rmSync(tmp, { recursive: true, force: true });
for (const r of results) console.log(`[자가 검사] ${r.ok ? "잡음 ✓" : "못 잡음 ✗"} ${r.name} — ${r.why}`);
const bad = results.filter((r) => !r.ok).length;
console.log(`[자가 검사] ${results.length - bad}/${results.length} 검사가 심은 차이를 잡았다${bad ? " — 못 잡은 검사는 고장이다" : ""}`);
process.exit(bad ? 1 : 0);
