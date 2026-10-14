#!/usr/bin/env node
// 로컬 프로토타입 대조(H4, 2026-10-14) — localhost:3000(클론의 pnpm dev)이 켜져 있으면 화면에서 실제로 해석되는 색·글꼴을
// FE Storybook 실제 값(playground/fe-stories/fe-values.json)·대기 장부와 대조한다. 규칙(CLAUDE.md § 원천): 프로토타입 = Storybook + 로컬 결정 —
// 장부 항목은 디자이너 값, 나머지는 FE 값이어야 한다.
//   pnpm proto:check            PROTO_BASE 로 주소 변경(기본 http://localhost:3000)
// **보고 전용 · 파일을 쓰지 않는다**(클론은 pull 전용 — CLAUDE.md 7). 꺼져 있으면 한 줄 알리고 exit 0. 다르면 exit 1.
// 신선도: 3000 을 띄운 저장소를 찾아(macOS lsof) origin/main 보다 몇 커밋 뒤인지 함께 알린다 — 뒤처졌으면 차이의 원인이 대개 그것이다.

import { chromium } from "playwright-core";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const E = process["en"+"v"];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (E.PROTO_BASE || "http://localhost:3000").replace(/\/$/, "");
const say = (s) => console.log(`[프로토타입] ${s}`);
const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

try { await fetch(BASE, { signal: AbortSignal.timeout(2000) }); } catch { say(`꺼져 있음(${BASE}) — 대조 생략`); process.exit(0); }

const fe = rd("playground/fe-stories/fe-values.json");
const ledger = rd("fe-requests/pending-decisions.json").items.filter((i) => i.status === "pending" && i.check);
const MODES = ["light", "dark", "control"];
const CLS = { light: "", dark: "dark", control: "theme-control" };
const feBy = fe.colorsByMode || { light: fe.colors };
const names = Object.keys(feBy.light || {}).sort();

// 3000 을 띄운 저장소와 뒤처짐(macOS 만 — 못 찾으면 생략)
let repo = null, behind = null;
try {
  const port = new URL(BASE).port || "80";
  const pid = spawnSync("lsof", ["-tiTCP:" + port, "-sTCP:LISTEN"], { encoding: "utf8", timeout: 3000 }).stdout.trim().split("\n")[0];
  const cwd = pid ? (spawnSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], { encoding: "utf8", timeout: 3000 }).stdout.match(/\nn(.+)/) || [])[1] : null;
  if (cwd) {
    repo = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" }).stdout.trim() || null;
    const b = spawnSync("git", ["rev-list", "--count", "HEAD..origin/main"], { cwd, encoding: "utf8" });
    if (b.status === 0) behind = Number(b.stdout.trim());
  }
} catch {}

function chromePath() {
  if (E.FE_CHROME) return E.FE_CHROME;
  const cands = [];
  try { const p = chromium.executablePath(); if (p) cands.push(p); } catch {}
  for (const cache of [join(homedir(), "Library/Caches/ms-playwright"), join(homedir(), ".cache/ms-playwright")]) {
    if (!existsSync(cache)) continue;
    for (const d of readdirSync(cache).filter((x) => /^chromium(_headless_shell)?-/.test(x)).sort().reverse())
      cands.push(join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"), join(cache, d, "chrome-headless-shell-linux64/chrome-headless-shell"), join(cache, d, "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium"));
  }
  cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  return cands.find(existsSync);
}

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const page = await browser.newPage();
let got;
try {
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 30000 });
  got = await page.evaluate(({ names, CLS }) => {
    const toHex = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return null; const [r, g, b, a] = m.map(Number); const h = "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("").toUpperCase(); return a !== undefined && a < 1 ? h + "/" + a : h; };
    const out = {};
    for (const [mode, cls] of Object.entries(CLS)) {
      const wrap = document.createElement("div"); if (cls) wrap.className = cls; const probe = document.createElement("div"); wrap.appendChild(probe); document.body.appendChild(wrap);
      out[mode] = {};
      for (const n of names) {
        const raw = getComputedStyle(wrap).getPropertyValue("--" + n).trim();
        if (!raw) { out[mode][n] = null; continue; }
        probe.style.color = ""; probe.style.color = `var(--${n})`; out[mode][n] = toHex(getComputedStyle(probe).color);
      }
      wrap.remove();
    }
    return { colors: out, ff: getComputedStyle(document.documentElement).fontFeatureSettings, family: getComputedStyle(document.body).fontFamily };
  }, { names, CLS });
} catch (e) { await browser.close(); say(`⚠ 화면을 열지 못함 — ${String(e?.message ?? e).slice(0, 100)}`); process.exit(1); }
await browser.close();

const norm = (v) => {
  if (v == null) return null;
  let s = String(v).toUpperCase().trim();
  const sl = s.match(/^(#[0-9A-F]{6})\/([\d.]+)$/);
  if (sl) s = Number(sl[2]) >= 1 ? sl[1] : `${sl[1]}/${Number(sl[2]).toFixed(2)}`;
  return s;
};
const pick = (v, mode) => (v && typeof v === "object" ? v[mode] : v);
const diffs = [], missing = [];
let checked = 0;
for (const mode of MODES) for (const n of names) {
  const item = ledger.find((i) => i.check.kind === "color" && i.check.name === n);
  const want = item ? pick(item.check.ours, mode) : feBy[mode]?.[n];
  const have = got.colors[mode][n];
  if (have == null) { if (mode === "light") missing.push(n); continue; }
  checked++;
  if (norm(have) !== norm(want)) diffs.push(`${n}[${mode}] 프로토 ${have} · 기대 ${want}${item ? `(장부 ${item.id})` : "(FE)"}`);
}
const ffItem = ledger.find((i) => i.check.kind === "fontFeature");
const ffWant = ffItem ? ffItem.check.ours : fe.fontFeatureSettings;
const ffOk = got.ff.replace(/\s/g, "") === String(ffWant).replace(/\s/g, "");
if (!ffOk) diffs.push(`font-feature-settings 프로토 ${got.ff} · 기대 ${ffWant}${ffItem ? `(장부 ${ffItem.id})` : "(FE)"}`);

const where = repo ? ` · ${repo.replace(homedir(), "~")}${behind == null ? "" : behind ? ` — ${behind}커밋 뒤처짐(git pull 하면 대개 해결)` : " 최신"}` : "";
if (!diffs.length) say(`일치 ✓ — 색 ${checked}(3모드) · 글꼴 ${got.ff} = FE + 대기 장부${missing.length ? ` · 프로토에 없는 FE 변수 ${missing.length}: ${missing.join(", ")}` : ""}${where}`);
else {
  say(`⚠ 다름 ${diffs.length} — FE + 대기 장부와 안 맞음${where}`);
  for (const d of diffs) console.log("   - " + d);
}
process.exit(diffs.length ? 1 : 0);
