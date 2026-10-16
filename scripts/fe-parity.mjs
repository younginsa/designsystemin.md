#!/usr/bin/env node
// FE 스니펫 정합 실측 — 우리 ds.css 위에 올린 FE 스니펫과 FE 스토리북 iframe 의 계산 스타일을 요소 단위로 대조한다(2026-09-28 파일럿).
//   pnpm fe:parity [key ...] [--debug]     기본 http://localhost:3000/ds.css (DS_BASE 로 변경) — dev 서버 + pnpm mcp:artifacts 뒤에 실행
// 같은 순서의 요소끼리 색·크기·여백·글자·그림자를 비교한다. 다르면 그 클래스가 ds.css 에 없거나 값이 다른 것이다.
// - 페이지 두 장을 쓴다 — 한 장에서 FE(https)를 연 뒤 setContent 하면 origin 이 그대로 남아 localhost 스타일시트가 차단된다(2026-09-29 진단).
// - 포털 스토리(Dialog 등)는 루트가 비고 오버레이가 body 에 있다 — 스니펫의 <!-- portal --> 뒤를 루트 밖에 붙이고, 페이지 전체를 스토리북 자체 요소만 빼고 비교한다.
// - 스토리 하나가 실패해도 멈추지 않는다(실패로 집계).

import { chromium } from "playwright-core";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// FE_PARITY_DIR — 자가 검사(fe:selftest)가 일부러 망가뜨린 사본으로 돌릴 때만 쓴다. 그때는 결과 파일을 쓰지 않는다
const FE_DIR = process.env.FE_PARITY_DIR || join(ROOT, "playground/fe-stories");
const WRITE_RESULTS = !process.env.FE_PARITY_DIR;
const DS = (process.env.DS_BASE || "http://localhost:3000").replace(/\/$/, "");
const registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
const argv = process.argv.slice(2);
const DEBUG = argv.includes("--debug");
const only = argv.filter((a) => !a.startsWith("--"));
// Foundations(FE Design Tokens 페이지)는 렌더 대조 대상이 아니다 — 견본이 FE 전용 변수(--general-*)로 칠해져 우리 ds.css 위에선 비고, 값 비교는 별도(2026-10-14)
const keys = Object.keys(registry.components).filter((k) => registry.components[k].fe && registry.components[k].section !== "Foundations" && existsSync(join(FE_DIR, k + ".json")) && (!only.length || only.includes(k))).sort();
const PROPS = ["backgroundColor", "color", "borderColor", "borderWidth", "borderRadius", "height", "paddingLeft", "paddingTop", "fontSize", "lineHeight", "fontWeight", "boxShadow", "opacity", "gap"];

function chromePath() {
  if (process.env.FE_CHROME) return process.env.FE_CHROME;
  const cands = [];
  try { const p = chromium.executablePath(); if (p) cands.push(p); } catch {}
  for (const cache of [join(homedir(), "Library/Caches/ms-playwright"), join(homedir(), ".cache/ms-playwright")]) {
    if (!existsSync(cache)) continue;
    for (const d of readdirSync(cache).filter((x) => /^chromium(_headless_shell)?-/.test(x)).sort().reverse()) {
      cands.push(join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"), join(cache, d, "chrome-headless-shell-linux64/chrome-headless-shell"), join(cache, d, "chrome-linux/chrome"), join(cache, d, "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium"));
    }
  }
  cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome");
  return cands.find(existsSync);
}
// 페이지 전체를 재되 스토리북 자체 요소(#storybook-docs · #storybook-highlights-root · sb-* 껍데기 · a11y svg)와 Radix 포커스 가드 span 은 뺀다
// 화면에 절대 안 보이는 요소는 비교하지 않는다(2026-10-16 사용자 결정) — 조건 둘 다: 페이지가 aria-hidden 으로 숨겼고 + 화면 바깥(위·왼쪽 밖)이거나
// 스토리 루트 바깥(body 에 따로 붙음)이다. 스냅샷은 포털의 위치 style 을 걷어내서 우리 쪽에선 화면 밖 조건이 안 맞기 때문에 둘째 조건이 필요하다.
// 예: 차트 라이브러리가 글자 폭을 재려고 화면 밖에 붙이는 측정용 span. 닫힌 드롭다운·툴팁은 제자리에 있거나 아예 없어서 해당하지 않는다
const measure = (props) => `(function(){var P=${JSON.stringify(props)};var out=[];document.body.querySelectorAll("*").forEach(function(el){if(el.closest("[id^=storybook-]:not(#storybook-root)"))return;var ah=el.closest("[aria-hidden=true]");if(ah){var rc=el.getBoundingClientRect();if(rc.bottom<0||rc.right<0||!ah.closest("#storybook-root"))return;}if(el.closest("div[class^=sb-],span[class^=sb-]"))return;if(/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(el.tagName))return;if(el.hasAttribute("data-radix-focus-guard"))return;var s=getComputedStyle(el);var o={tag:el.tagName.toLowerCase()};P.forEach(function(p){o[p]=s[p]});out.push(o)});return out})()`;
// 표기 차이는 차이가 아니다 — rgba(255,255,255,1) = rgb(255,255,255), 9.99998px = 10px(calc·rem 반올림), 167.969px = 168px(서브픽셀). 0.5px 단위로 비교
const norm = (v) => String(v ?? "")
  .replace(/rgba?\(([^)]+)\)/g, (m, inner) => { const a = inner.split(/[\s,\/]+/).filter(Boolean).map(Number); if (a.length === 4 && a[3] === 1) a.pop(); return "rgb(" + a.join(",") + ")"; })
  .replace(/-?\d+\.\d+px/g, (m) => (Math.round(parseFloat(m) * 2) / 2) + "px");
// 애니메이션·트랜지션을 멈춘 뒤 잰다 — dialog 의 fade-in, skeleton 의 pulse 가 양쪽에서 다른 순간에 잡혀 opacity 가 달라 보였다(2026-09-29)
const FREEZE = `(function(){var s=document.createElement("style");s.setAttribute("data-parity","freeze");s.textContent="*,*::before,*::after{animation:none!important;transition:none!important}";document.head.appendChild(s);return true})()`;
// 알려진 예외 — playground/fe-stories/parity-allow.json: [{ tag, prop, story?, note }] 에 맞는 차이는 세지 않고 "예외" 로 집계한다(FE 전역 규칙 등 컴포넌트 밖 원인)
// story(선택, 예 "sidebar/CustomBrand")가 있으면 그 스토리에서만 예외 — 태그 전체를 풀면 다른 곳의 진짜 차이를 놓친다(2026-10-08)
// story 는 접두어 일치("status-badge/" = 그 컴포넌트 전 스토리). fe(선택, 예 "rgb(245, 158, 11)")가 있으면 FE 쪽 값이 정확히 그것일 때만 예외 —
// 우리가 일부러 FE 와 다른 값을 정한 토큰(caution 대비 미달 → orange-700) 같은 경우에 쓴다
const ALLOW_PATH = join(FE_DIR, "parity-allow.json");
const ALLOW = existsSync(ALLOW_PATH) ? JSON.parse(readFileSync(ALLOW_PATH, "utf8")).filter((a) => a.tag && a.prop) : [];
const allowed = (tag, prop, story, feVal) => ALLOW.find((a) => a.prop === prop && (a.tag === "*" || a.tag === tag) && (!a.story || story === a.story || (a.story.endsWith("/") && story.startsWith(a.story))) && (!a.fe || a.fe === feVal));
const sheetInfo = `(function(){return JSON.stringify({sheets:[].slice.call(document.styleSheets).map(function(s){var n=0;try{n=s.cssRules.length}catch(e){n=-1}return {href:s.href,rules:n}}),bodyBg:getComputedStyle(document.body).backgroundColor,fonts:document.fonts.status})})()`;

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const ours = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fe = await browser.newPage({ viewport: { width: 1280, height: 800 } });
if (DEBUG) for (const p of [ours, fe]) {
  p.on("console", (m) => { if (m.type() === "error") console.log("   [console]", m.text().slice(0, 160)); });
  p.on("requestfailed", (r) => console.log("   [request failed]", r.url().slice(0, 120), r.failure()?.errorText));
}
// 우리 쪽 페이지를 DS 주소에서 연다(2026-10-16) — setContent 만 쓰면 페이지 주소가 about:blank(origin null)라 ds.css 의 Inter 글꼴이
// CORS 로 막혀 대체 글꼴로 쟀다. FE 가 Build 8 부터 Inter 를 실제로 불러오면서 높이 1px 차이 37건으로 드러났다(우리 쪽 측정 틀의 버그)
await ours.goto(DS + "/ds.css", { waitUntil: "load" });
let totalDiff = 0, totalEl = 0, stories = 0, failures = 0, totalAllowed = 0;
// 스토리마다 결과를 남긴다(안전장치 — fe:coverage 가 "렌더 대조" 칸을 채운다): pass · fail · error. 라이트 모드·폭 1280·기본 상태만 잰다
const results = {};
const bad = [];
const propCount = {};
for (const key of keys) {
  const meta = JSON.parse(readFileSync(join(FE_DIR, key + ".json"), "utf8"));
  for (const s of meta.stories) {
    if (s.error) continue;
    try {
      const raw = readFileSync(join(FE_DIR, s.file), "utf8");
      // 스니펫의 자산 주소는 배포 사이트 절대 주소 — 검사 중엔 DS_BASE(로컬 dev 서버)의 사본을 쓴다
      const local = raw.split("https://designsystemin-md.vercel.app/fe-assets/").join(`${DS}/fe-assets/`);
      const [rootHtml, portalHtml = ""] = local.split("\n<!-- portal -->\n");
      await fe.goto(`${meta.fe.base}/iframe.html?id=${s.id}&viewMode=story`, { waitUntil: "load" });
      await fe.waitForFunction(() => {
        const b = document.body.classList;
        if (b.contains("sb-show-errordisplay")) return true;
        if (!b.contains("sb-show-main")) return false;
        const r = document.getElementById("storybook-root");
        if (r && (r.childElementCount > 0 || (r.textContent || "").trim())) return true; // 글자만 렌더하는 스토리(ProductFilterHeader Default)
        return [...document.body.children].some((el) => !/^storybook-/.test(el.id) && !/(^|\s)sb-/.test(el.className || "") && !/^(SCRIPT|STYLE|LINK|NOSCRIPT|SPAN)$/.test(el.tagName));
      }, null, { timeout: 20000 });
      await fe.waitForTimeout(250);
      await fe.evaluate(FREEZE); await fe.waitForTimeout(60);
      if (DEBUG) console.log("   FE:", await fe.evaluate(sheetInfo));
      const theirs = await fe.evaluate(measure(PROPS));
      // 스토리북 레이아웃 여백을 우리 쪽에도 똑같이(2026-10-16) — FE 스토리가 padded 레이아웃이면 body·루트에 Storybook 자체 여백(16px)이 붙어
      // 폭이 줄고 글이 줄바꿈된다(PodResourceGroupRow ReplicaGroup: FE 카드 618px · 우리 634px → 높이 20px 차이). FE 쪽 계산값을 그대로 옮긴다
      const frame = await fe.evaluate(() => { const r = document.getElementById("storybook-root"); const p = (el) => { const c = getComputedStyle(el); return `padding:${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft};`; }; return { body: p(document.body), root: r ? p(r) : "" }; });
      await ours.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${DS}/ds.css"></head><body class="bg-background text-foreground antialiased" style="margin:0;${frame.body}"><div id="storybook-root" style="${frame.root}">${rootHtml}</div>${portalHtml}</body></html>`, { waitUntil: "load" });
      await ours.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 10000 }).catch(() => {});
      await ours.evaluate(FREEZE); await ours.waitForTimeout(60);
      if (DEBUG) console.log("   우리:", await ours.evaluate(sheetInfo));
      const mine = await ours.evaluate(measure(PROPS));
      const n = Math.min(mine.length, theirs.length);
      const diffs = [];
      for (let i = 0; i < n; i++) for (const p of PROPS) if (norm(mine[i][p]) !== norm(theirs[i][p])) {
        if (allowed(theirs[i].tag, p, `${key}/${s.name}`, theirs[i][p])) { totalAllowed++; continue; }
        diffs.push(`${theirs[i].tag}[${i}].${p}: 우리 ${mine[i][p]} · FE ${theirs[i][p]}`); propCount[p] = (propCount[p] || 0) + 1;
      }
      totalDiff += diffs.length; totalEl += n; stories++;
      if (diffs.length || mine.length !== theirs.length) bad.push(`${key}/${s.name}`);
      results[s.id] = diffs.length || mine.length !== theirs.length ? "fail" : "pass";
      console.log(`  ${key}/${s.name}: 요소 ${n}${mine.length !== theirs.length ? `(우리 ${mine.length} · FE ${theirs.length})` : ""} · 차이 ${diffs.length}`);
      for (const d of diffs.slice(0, 8)) console.log("     " + d);
      if (diffs.length > 8) console.log(`     … 외 ${diffs.length - 8}`);
    } catch (e) {
      failures++; bad.push(`${key}/${s.name}(실패)`); results[s.id] = "error";
      console.log(`  ${key}/${s.name}: 실패 — ${String(e?.message ?? e).slice(0, 120)}`);
    }
  }
}
await browser.close();
// 부분 실행(키 지정)이면 기존 결과에 합친다
if (WRITE_RESULTS) {
  const RP = join(FE_DIR, "parity-results.json");
  const prev = only.length && existsSync(RP) ? JSON.parse(readFileSync(RP, "utf8")).stories || {} : {};
  const feBuild = existsSync(join(FE_DIR, "index.json")) ? JSON.parse(readFileSync(join(FE_DIR, "index.json"), "utf8")).feBuild : null;
  writeFileSync(RP, JSON.stringify({ $note: "fe:parity 스토리별 결과(편집 금지) — fe:coverage 가 읽는다. 라이트 모드 · 폭 1280 · 기본 상태만", feBuild, ran: new Date().toISOString().slice(0, 10), stories: { ...prev, ...results } }, null, 1) + "\n");
}
const byProp = Object.entries(propCount).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p} ${n}`).join(" · ");
console.log(`[fe:parity] 컴포넌트 ${keys.length} · 스토리 ${stories} · 요소 ${totalEl} · 차이 ${totalDiff} · 실패 ${failures}${totalAllowed ? ` · 예외 ${totalAllowed}(parity-allow.json)` : ""}${byProp ? " · 속성별 " + byProp : ""}${bad.length ? " · 불일치 " + bad.join(", ") : " · 전부 동일"}`);
process.exit(totalDiff || failures ? 1 : 0);
