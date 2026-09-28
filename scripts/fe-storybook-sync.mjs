#!/usr/bin/env node
// FE Storybook → 스니펫 동기화 (2026-09-28 이관 파일럿). 레지스트리에 fe 가 적힌 컴포넌트는 우리 스토리 대신
// FE 스토리북(Chromatic 브랜치 permalink)에서 렌더된 HTML 을 가져온다. 코드 저장소는 필요 없다 — 배포된 스토리북만 읽는다.
//
//   pnpm fe:sync            fe 가 있는 컴포넌트 전부
//   pnpm fe:sync button     지정 키만
//
// 산출물(커밋한다 — Vercel 빌드에는 브라우저가 없어서 여기서 만든 것을 그대로 쓴다):
//   playground/fe-stories/<key>/<story>.html               스토리 렌더 HTML(#storybook-root 안)
//   playground/fe-stories/<key>/states/<story>--<arg>-<v>.html  args 로 바꾼 상태별 렌더(select·boolean 컨트롤) — /render?args= 의 대체
//   playground/fe-stories/<key>.json                      스토리 목록·initialArgs·argTypes·states·클래스·FE 빌드 도장
//   playground/fe-stories/fe-utilities.css                FE 고유 유틸리티(text-title-xs 등) — ds.css 에 덧붙인다
//   playground/fe-stories/index.json                      동기화 요약
// 브라우저: FE_CHROME 경로 → Playwright 캐시의 headless shell → Google Chrome. Storybook 의 공식 URL 인자(&args=)만 쓴다.
// 죽은 클래스: FE 빌드 CSS 에 규칙이 없는 클래스(text-medium 처럼 이름만 남은 것)는 FE 화면에서도 아무 일도 안 하므로 스니펫에서 떼고
// json 에 strippedClasses 로 남긴다 — 생성물이 그대로 복사해 자가 검사에 걸리는 것을 막는다. 렌더 동일 여부는 pnpm fe:parity 가 실측한다.

import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "playground/fe-stories");
const registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
const FE = (process.env.FE_STORYBOOK || registry.$storybook?.fe?.base || "").replace(/\/$/, "");
const fail = (m) => { console.error(`[fe:sync] ${m}`); process.exit(1); };
if (!FE) fail("FE 스토리북 주소가 없다 — ds-registry.json $storybook.fe.base 또는 FE_STORYBOOK");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const keys = Object.keys(registry.components).filter((k) => registry.components[k].fe && (!only.length || only.includes(k))).sort();
if (!keys.length) fail("fe 가 적힌 컴포넌트가 없다" + (only.length ? ` (${only.join(", ")})` : ""));

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const pascal = (s) => s.replace(/\s+/g, "");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"');
const encode = (s) => s.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const STATE_MAX = 24;

function chromePath() {
  if (process.env.FE_CHROME) return process.env.FE_CHROME;
  const cands = [];
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) for (const d of readdirSync(cache).filter((x) => x.startsWith("chromium_headless_shell-")).sort().reverse()) cands.push(join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"));
  cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  const found = cands.find(existsSync);
  if (!found) fail("브라우저를 못 찾았다 — FE_CHROME=<chromium 경로> 로 지정");
  return found;
}

const idxRes = await fetch(FE + "/index.json");
if (!idxRes.ok) fail(`${FE}/index.json ${idxRes.status} — public 설정 확인`);
const feIndex = await idxRes.json();
const entries = feIndex.entries || feIndex.stories || {};
if (!Object.keys(entries).length) fail("목차가 비어 있다(로그인 벽?)");
const iframeHtml = await (await fetch(FE + "/iframe.html")).text();
const cssRel = (iframeHtml.match(/href="([^"]+\.css)"/) || [])[1] || "";
const feBuild = cssRel ? cssRel.replace(/.*iframe-/, "").replace(/\.css$/, "") : "unknown";
const feCss = cssRel ? await (await fetch(FE + "/" + cssRel.replace(/^\.\//, ""))).text() : "";
const synced = new Date().toISOString().slice(0, 10);

// FE CSS 에 규칙이 있는 클래스인가 — Tailwind v4 는 특수문자를 역슬래시로 이스케이프해 선택자를 만든다
const cssEscape = (c) => c.replace(/[^A-Za-z0-9_-]/g, (ch) => "\\" + ch);
const hasRule = (c) => !feCss || feCss.includes("." + cssEscape(c));
const NO_STYLE = (c) => /^(group|peer)(\/|$)/.test(c) || /^lucide(-|$)/.test(c) || c === "sr-only";

/** 죽은 클래스를 뗀 HTML + 뗀 목록 */
function strip(html, dead) {
  const removed = new Set();
  const out = html.replace(/class="([^"]*)"/g, (m, v) => {
    const kept = decode(v).split(/\s+/).filter((c) => { if (c && dead.has(c)) { removed.add(c); return false; } return !!c; });
    return `class="${encode(kept.join(" "))}"`;
  });
  return { html: out, removed: [...removed].sort() };
}

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function render(id, args) {
  const url = `${FE}/iframe.html?id=${id}&viewMode=story` + (args ? `&args=${args}` : "");
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => {
    const b = document.body.classList;
    const r = document.getElementById("storybook-root");
    return b.contains("sb-show-errordisplay") || (b.contains("sb-show-main") && r && r.childElementCount > 0);
  }, null, { timeout: 20000 });
  await page.waitForTimeout(120);
  return page.evaluate(() => {
    const r = document.getElementById("storybook-root");
    const err = document.body.classList.contains("sb-show-errordisplay") ? (document.querySelector("#error-message")?.textContent || "story error").slice(0, 300) : null;
    const s = window.__STORYBOOK_PREVIEW__?.currentRender?.story;
    const argTypes = s ? Object.fromEntries(Object.entries(s.argTypes || {}).map(([n, a]) => [n, {
      type: a.type?.name ?? (a.control?.type === "boolean" || a.control === "boolean" ? "boolean" : ""),
      required: !!a.type?.required,
      control: a.control?.type ?? (typeof a.control === "string" ? a.control : null),
      ...(Array.isArray(a.options) ? { options: a.options } : {}),
      ...(a.table?.defaultValue?.summary != null ? { default: String(a.table.defaultValue.summary) } : {}),
      ...(a.description ? { description: a.description } : {}),
    }])) : {};
    return { html: r ? r.innerHTML : "", initialArgs: s?.initialArgs ?? {}, argTypes, error: err };
  });
}
const collect = (html, set) => { for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of decode(m[1]).split(/\s+/)) if (c) set.add(c); };

const summary = [];
for (const key of keys) {
  const fe = registry.components[key].fe;
  const storyEntries = Object.values(entries).filter((e) => e.type === "story" && e.id.startsWith(fe.id + "--"));
  if (!storyEntries.length) { console.log(`  ${key}: FE 에 ${fe.id}--* 스토리 없음`); continue; }
  rmSync(join(OUT, key), { recursive: true, force: true });
  mkdirSync(join(OUT, key, "states"), { recursive: true });
  // 1차: 렌더 결과를 모아 두고 클래스 전수를 본 뒤 죽은 클래스를 정한다
  const raw = [];
  let argTypes = {}, first = null, errors = 0;
  for (const e of storyEntries) {
    const r = await render(e.id);
    const name = pascal(e.name);
    raw.push({ kind: "story", name, id: e.id, file: `${key}/${kebab(name)}.html`, html: r.html, initialArgs: r.initialArgs, error: r.error });
    if (r.error) errors++;
    if (!first && !r.error) { first = { id: e.id, name }; argTypes = r.argTypes; }
  }
  // 상태별 렌더 — 첫 스토리에 select 옵션·boolean 컨트롤을 하나씩 적용(Storybook 공식 &args=). 사진에 없는 상태를 미리 찍어 둔다.
  if (first) {
    const jobs = [];
    for (const [n, a] of Object.entries(argTypes)) {
      if (/^(children|className|style|asChild)$/.test(n)) continue;
      if (Array.isArray(a.options)) for (const v of a.options) jobs.push({ n, v, q: `${n}:${encodeURIComponent(String(v))}` });
      else if (a.control === "boolean" || a.type === "boolean") jobs.push({ n, v: true, q: `${n}:!true` });
    }
    for (const j of jobs.slice(0, STATE_MAX)) {
      const r = await render(first.id, j.q);
      if (r.error) continue;
      raw.push({ kind: "state", story: first.name, args: { [j.n]: j.v }, file: `${key}/states/${kebab(first.name)}--${j.n}-${kebab(String(j.v))}.html`, html: r.html });
    }
  }
  const all = new Set(); for (const r of raw) collect(r.html, all);
  const dead = new Set([...all].filter((c) => !NO_STYLE(c) && !hasRule(c)));
  const stripped = new Set();
  const classes = new Set();
  const stories = [], states = [];
  for (const r of raw) {
    const { html, removed } = strip(r.html, dead);
    removed.forEach((c) => stripped.add(c));
    writeFileSync(join(OUT, r.file), html + "\n");
    collect(html, classes);
    if (r.kind === "story") stories.push({ name: r.name, id: r.id, file: r.file, initialArgs: r.initialArgs, ...(r.error ? { error: r.error } : {}) });
    else states.push({ story: r.story, args: r.args, file: r.file });
  }
  writeFileSync(join(OUT, `${key}.json`), JSON.stringify({
    $note: "FE 스토리북 스냅샷(scripts/fe-storybook-sync.mjs). 편집하지 않는다 — pnpm fe:sync 로 다시 만든다. states = 첫 스토리에 args 를 하나씩 바꿔 렌더한 것(/render?args= 의 대체). strippedClasses = FE CSS 에 규칙이 없어 뗀 이름(FE 화면에서도 효과 0).",
    key, fe: { id: fe.id, docs: FE + fe.docs, base: FE }, feBuild, synced,
    stories, argTypes, states, classes: [...classes].sort(), strippedClasses: [...stripped].sort(),
  }, null, 1) + "\n");
  summary.push({ key, stories: stories.length, states: states.length, classes: classes.size, stripped: [...stripped], errors });
  console.log(`  ${key}: 스토리 ${stories.length} · 상태 ${states.length} · 클래스 ${classes.size}${stripped.size ? ` · 죽은 클래스 뗌 ${[...stripped].join(",")}` : ""}${errors ? ` · 렌더 오류 ${errors}` : ""}`);
}
await browser.close();

// FE 고유 유틸리티 — 우리 Tailwind 가 모르는 클래스(타이포 토큰 유틸)만 FE 빌드 CSS 에서 그대로 옮긴다. 표준 유틸리티는 스캔으로 컴파일된다.
const vars = [...new Set([...feCss.matchAll(/--text-[\w-]+:[^;]+;/g)].map((m) => m[0]))];
const rules = [...new Set([...feCss.matchAll(/\.text-(?:title|caption|body|label|display)(?:-[a-z0-9]+)*\{[^}]*\}/g)].map((m) => m[0]))];
writeFileSync(join(OUT, "fe-utilities.css"), `/* FE 스토리북 고유 유틸리티 — scripts/fe-storybook-sync.mjs 가 FE 빌드 CSS(${cssRel || "?"})에서 옮김. 편집 금지. ${synced} */\n:root{${vars.join("")}}\n${rules.join("\n")}\n`);
writeFileSync(join(OUT, "index.json"), JSON.stringify({ $note: "FE 스토리북 동기화 요약(pnpm fe:sync)", base: FE, feBuild, synced, components: summary }, null, 1) + "\n");
console.log(`[fe:sync] ${FE} · 빌드 ${feBuild} · 컴포넌트 ${summary.length} · 유틸리티 변수 ${vars.length} · 규칙 ${rules.length} → playground/fe-stories/`);
