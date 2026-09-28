#!/usr/bin/env node
// FE 스니펫 정합 실측 — 우리 ds.css 위에 올린 FE 스니펫과 FE 스토리북 iframe 의 계산 스타일을 요소 단위로 대조한다(2026-09-28 파일럿).
//   pnpm fe:parity [key ...] [--debug]     기본 http://localhost:3000/ds.css (DS_BASE 로 변경) — dev 서버 + pnpm mcp:artifacts 뒤에 실행
// 같은 순서의 요소끼리 색·크기·여백·글자·그림자를 비교한다. 다르면 그 클래스가 ds.css 에 없거나 값이 다른 것이다.
// 페이지 두 장을 쓴다 — 한 장에서 FE(https)를 연 뒤 setContent 하면 origin 이 그대로 남아 localhost 스타일시트가 차단된다(2026-09-29 진단).

import { chromium } from "playwright-core";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FE_DIR = join(ROOT, "playground/fe-stories");
const DS = (process.env.DS_BASE || "http://localhost:3000").replace(/\/$/, "");
const registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
const argv = process.argv.slice(2);
const DEBUG = argv.includes("--debug");
const only = argv.filter((a) => !a.startsWith("--"));
const keys = Object.keys(registry.components).filter((k) => registry.components[k].fe && existsSync(join(FE_DIR, k + ".json")) && (!only.length || only.includes(k))).sort();
const PROPS = ["backgroundColor", "color", "borderColor", "borderWidth", "borderRadius", "height", "paddingLeft", "paddingTop", "fontSize", "lineHeight", "fontWeight", "boxShadow", "opacity", "gap"];

function chromePath() {
  if (process.env.FE_CHROME) return process.env.FE_CHROME;
  const cands = [];
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) for (const d of readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell-")).sort().reverse()) cands.push(join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"));
  cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  return cands.find(existsSync);
}
const measure = (props) => `(function(){var r=document.getElementById("storybook-root")||document.body;var out=[];r.querySelectorAll("*").forEach(function(el){var s=getComputedStyle(el);var o={tag:el.tagName.toLowerCase()};${JSON.stringify(props)}.forEach(function(p){o[p]=s[p]});out.push(o)});return out})()`;
const sheetInfo = `(function(){return JSON.stringify({sheets:[].slice.call(document.styleSheets).map(function(s){var n=0;try{n=s.cssRules.length}catch(e){n=-1}return {href:s.href,rules:n}}),bodyBg:getComputedStyle(document.body).backgroundColor,fonts:document.fonts.status})})()`;

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const ours = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fe = await browser.newPage({ viewport: { width: 1280, height: 800 } });
if (DEBUG) for (const p of [ours, fe]) {
  p.on("console", (m) => { if (m.type() === "error") console.log("   [console]", m.text().slice(0, 160)); });
  p.on("requestfailed", (r) => console.log("   [request failed]", r.url().slice(0, 120), r.failure()?.errorText));
}
let totalDiff = 0, totalEl = 0, stories = 0;
const failures = [];
for (const key of keys) {
  const meta = JSON.parse(readFileSync(join(FE_DIR, key + ".json"), "utf8"));
  for (const s of meta.stories) {
    if (s.error) continue;
    const html = readFileSync(join(FE_DIR, s.file), "utf8");
    await ours.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${DS}/ds.css"></head><body class="bg-background text-foreground antialiased"><div id="storybook-root">${html}</div></body></html>`, { waitUntil: "load" });
    await ours.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 10000 }).catch(() => {});
    if (DEBUG) console.log("   우리:", await ours.evaluate(sheetInfo));
    const mine = await ours.evaluate(measure(PROPS));
    await fe.goto(`${meta.fe.base}/iframe.html?id=${s.id}&viewMode=story`, { waitUntil: "load" });
    await fe.waitForFunction(() => document.body.classList.contains("sb-show-main") && document.getElementById("storybook-root")?.childElementCount > 0, null, { timeout: 20000 });
    await fe.waitForTimeout(150);
    if (DEBUG) console.log("   FE:", await fe.evaluate(sheetInfo));
    const theirs = await fe.evaluate(measure(PROPS));
    const n = Math.min(mine.length, theirs.length);
    const diffs = [];
    for (let i = 0; i < n; i++) for (const p of PROPS) if (mine[i][p] !== theirs[i][p]) diffs.push(`${theirs[i].tag}[${i}].${p}: 우리 ${mine[i][p]} · FE ${theirs[i][p]}`);
    totalDiff += diffs.length; totalEl += n; stories++;
    if (diffs.length || mine.length !== theirs.length) failures.push(`${key}/${s.name}`);
    console.log(`  ${key}/${s.name}: 요소 ${n}${mine.length !== theirs.length ? `(우리 ${mine.length} · FE ${theirs.length})` : ""} · 차이 ${diffs.length}`);
    for (const d of diffs.slice(0, 8)) console.log("     " + d);
    if (diffs.length > 8) console.log(`     … 외 ${diffs.length - 8}`);
  }
}
await browser.close();
console.log(`[fe:parity] 컴포넌트 ${keys.length} · 스토리 ${stories} · 요소 ${totalEl} · 차이 ${totalDiff}${failures.length ? " · 불일치 스토리 " + failures.join(", ") : " · 전부 동일"}`);
process.exit(totalDiff ? 1 : 0);
