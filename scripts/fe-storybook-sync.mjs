#!/usr/bin/env node
// FE Storybook → 스니펫 동기화 (2026-09-28 이관). 레지스트리에 fe 가 적힌 컴포넌트는 우리 스토리 대신
// FE 스토리북(Chromatic 브랜치 permalink)에서 렌더된 HTML 을 가져온다. 코드 저장소는 필요 없다 — 배포된 스토리북만 읽는다.
//
//   pnpm fe:sync                 fe 가 있는 컴포넌트 전부
//   pnpm fe:sync button card     지정 키만
//   pnpm fe:sync --if-changed    FE 빌드 도장이 index.json 과 같으면 아무것도 안 하고 끝(예약 실행용)
//
// 산출물(커밋한다 — Vercel 빌드에는 브라우저가 없어서 여기서 만든 것을 그대로 쓴다):
//   playground/fe-stories/<key>/<story>.html               스토리 렌더 HTML(#storybook-root 안 + 포털로 나간 오버레이는 <!-- portal --> 뒤에)
//   playground/fe-stories/<key>/states/<story>--<arg>-<v>.html  args 로 바꾼 상태별 렌더(select·boolean 컨트롤) — /render?args= 의 대체
//   playground/fe-stories/<key>.json                      스토리 목록·initialArgs·argTypes·states·클래스·FE 빌드 도장
//   playground/fe-stories/fe-utilities.css                FE 고유 유틸리티(text-title-xs 등) — ds.css 에 덧붙인다
//   playground/fe-stories/index.json                      동기화 요약(feBuild = 마지막으로 가져온 FE 빌드)
// 브라우저: FE_CHROME → playwright-core 가 아는 설치 위치 → Playwright 캐시(mac·linux) → Google Chrome. Storybook 의 공식 URL 인자(&args=)만 쓴다.
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
const argv = process.argv.slice(2);
const IF_CHANGED = argv.includes("--if-changed");
const only = argv.filter((a) => !a.startsWith("--"));
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
  try { const p = chromium.executablePath(); if (p) cands.push(p); } catch {}
  for (const cache of [join(homedir(), "Library/Caches/ms-playwright"), join(homedir(), ".cache/ms-playwright")]) {
    if (!existsSync(cache)) continue;
    for (const d of readdirSync(cache).filter((x) => /^chromium(_headless_shell)?-/.test(x)).sort().reverse()) {
      cands.push(join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"), join(cache, d, "chrome-headless-shell-linux64/chrome-headless-shell"), join(cache, d, "chrome-linux/chrome"), join(cache, d, "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium"));
    }
  }
  cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome");
  const found = cands.find(existsSync);
  if (!found) fail("브라우저를 못 찾았다 — FE_CHROME=<chromium 경로> 로 지정하거나 npx playwright-core install chromium");
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
if (IF_CHANGED) {
  const prev = existsSync(join(OUT, "index.json")) ? JSON.parse(readFileSync(join(OUT, "index.json"), "utf8")).feBuild : null;
  if (prev === feBuild) { console.log(`[fe:sync] FE 빌드 ${feBuild} — 이미 동기화됨, 건너뜀`); process.exit(0); }
  console.log(`[fe:sync] FE 빌드 ${prev ?? "(없음)"} → ${feBuild} — 다시 가져온다`);
}
const feCss = cssRel ? await (await fetch(FE + "/" + cssRel.replace(/^\.\//, ""))).text() : "";
const synced = new Date().toISOString().slice(0, 10);

// FE CSS 에 규칙이 있는 클래스인가 — Tailwind v4 는 특수문자를 역슬래시로 이스케이프해 선택자를 만든다
const cssEscape = (c) => c.replace(/[^A-Za-z0-9_-]/g, (ch) => "\\" + ch);
const hasRule = (c) => !feCss || feCss.includes("." + cssEscape(c));
const NO_STYLE = (c) => /^(group|peer)(\/|$)/.test(c) || /^lucide(-|$)/.test(c) || c === "sr-only" || /^(rdp|recharts)-/.test(c);
// 우리 빌드가 만들 수 없는 클래스 — RTL(오른쪽→왼쪽 쓰기) 전용. 우리는 RTL 화면을 만들지 않으므로 떼어도 보이는 것이 같다.
const UNSUPPORTED = (c) => /^rtl:/.test(c);

// Radix 런타임이 DOM 에 남기는 인라인 style — 열림/닫힘 애니메이션 억제(animation-duration: 0s)·포커스 가드(outline·pointer-events).
// 스토리북 화면에서만 의미가 있고 생성물에 복사되면 check_html 의 inline-style 위반이 된다(2026-09-30 파일럿 실측: tabs). CSS 변수 선언(--sidebar-width)은 남긴다.
const RUNTIME_STYLE = /^(animation-duration|animation-name|outline|pointer-events)$/;

/** 죽은 클래스·런타임 인라인 style 을 뗀 HTML + 뗀 목록 */
function strip(html, dead) {
  const removed = new Set();
  let out = html.replace(/class="([^"]*)"/g, (m, v) => {
    const kept = decode(v).split(/\s+/).filter((c) => { if (c && dead.has(c)) { removed.add(c); return false; } return !!c; });
    return `class="${encode(kept.join(" "))}"`;
  });
  out = out.replace(/ style="([^"]*)"/g, (m, v) => {
    const kept = v.split(";").map((d) => d.trim()).filter(Boolean).filter((d) => !RUNTIME_STYLE.test(d.split(":")[0].trim()));
    return kept.length ? ` style="${kept.join("; ")};"` : "";
  });
  return { html: out, removed: [...removed].sort() };
}

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function render(id, args) {
  const url = `${FE}/iframe.html?id=${id}&viewMode=story` + (args ? `&args=${args}` : "");
  await page.goto(url, { waitUntil: "load" });
  // 렌더 완료 판정 — 스토리 루트에 내용이 생겼거나, 포털로 body 에 나간 오버레이가 생겼거나(Dialog 처럼 루트가 비는 경우), 에러 표시.
  await page.waitForFunction(() => {
    const b = document.body.classList;
    if (b.contains("sb-show-errordisplay")) return true;
    if (!b.contains("sb-show-main")) return false;
    const r = document.getElementById("storybook-root");
    if (r && r.childElementCount > 0) return true;
    return [...document.body.children].some((el) => !/^storybook-/.test(el.id) && !/(^|\s)sb-/.test(el.className || "") && !/^(SCRIPT|STYLE|LINK|NOSCRIPT|SPAN)$/.test(el.tagName));
  }, null, { timeout: 20000 });
  await page.waitForTimeout(250); // play 함수·포털 마운트 여유
  return page.evaluate(() => {
    const r = document.getElementById("storybook-root");
    const err = document.body.classList.contains("sb-show-errordisplay") ? (document.querySelector("#error-message")?.textContent || "story error").slice(0, 300) : null;
    // 포털 — Radix Dialog·Sheet·Popover·DropdownMenu·Tooltip·Sonner 는 body 직속으로 나간다. 스토리북 자체 요소(sb-*)와 스크립트는 제외
    const portals = [...document.body.children]
      .filter((el) => !/^storybook-/.test(el.id) && !/(^|\s)sb-/.test(el.className || "") && !/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(el.tagName))
      .map((el) => el.outerHTML).join("\n");
    const s = window.__STORYBOOK_PREVIEW__?.currentRender?.story;
    const argTypes = s ? Object.fromEntries(Object.entries(s.argTypes || {}).map(([n, a]) => [n, {
      type: a.type?.name ?? (a.control?.type === "boolean" || a.control === "boolean" ? "boolean" : ""),
      required: !!a.type?.required,
      control: a.control?.type ?? (typeof a.control === "string" ? a.control : null),
      ...(Array.isArray(a.options) ? { options: a.options } : {}),
      ...(a.table?.defaultValue?.summary != null ? { default: String(a.table.defaultValue.summary) } : {}),
      ...(a.description ? { description: a.description } : {}),
    }])) : {};
    return { html: (r ? r.innerHTML : "") + (portals ? "\n<!-- portal -->\n" + portals : ""), portal: !!portals, initialArgs: s?.initialArgs ?? {}, argTypes, error: err };
  });
}
const collect = (html, set) => { for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of decode(m[1]).split(/\s+/)) if (c) set.add(c); };

// 스니펫이 참조하는 자산(로고 svg 등) — FE 서버의 상대 경로라 우리 쪽에선 깨진다. 내려받아 fe-stories/assets/ 에 두고
// src 를 우리 사이트의 절대 주소(/fe-assets/…)로 바꾼다(2026-09-29 — 사이드바 로고가 깨진 이미지 박스로 잡혀 정합 검사 1건).
const SITE = "https://designsystemin-md.vercel.app";
const ASSETS = join(OUT, "assets");
mkdirSync(ASSETS, { recursive: true });
const assetCache = new Map();
async function captureAssets(html) {
  const refs = [...new Set([...html.matchAll(/\b(src)="((?:\.?\/)[^"]+)"/g)].map((m) => m[2]))].filter((p) => !/^\/\//.test(p));
  let out = html;
  for (const p of refs) {
    const name = p.replace(/^\.?\//, "").replace(/[\/?#]+/g, "__");
    if (!assetCache.has(p)) {
      try {
        const r = await fetch(FE + "/" + p.replace(/^\.?\//, ""));
        if (r.ok) { writeFileSync(join(ASSETS, name), Buffer.from(await r.arrayBuffer())); assetCache.set(p, name); }
        else assetCache.set(p, null);
      } catch { assetCache.set(p, null); }
    }
    if (assetCache.get(p)) out = out.split(`src="${p}"`).join(`src="${SITE}/fe-assets/${name}"`);
  }
  return out;
}

const summary = [];
for (const key of keys) {
  const fe = registry.components[key].fe;
  const storyEntries = Object.values(entries).filter((e) => e.type === "story" && e.id.startsWith(fe.id + "--"));
  if (!storyEntries.length) { console.log(`  ${key}: FE 에 ${fe.id}--* 스토리 없음`); summary.push({ key, stories: 0, states: 0, classes: 0, stripped: [], errors: 1, missing: true }); continue; }
  rmSync(join(OUT, key), { recursive: true, force: true });
  mkdirSync(join(OUT, key, "states"), { recursive: true });
  const raw = [];
  let argTypes = {}, first = null, errors = 0;
  for (const e of storyEntries) {
    let r;
    try { r = await render(e.id); } catch (err) { r = { html: "", portal: false, initialArgs: {}, argTypes: {}, error: String(err?.message ?? err).slice(0, 200) }; }
    const name = pascal(e.name);
    raw.push({ kind: "story", name, id: e.id, file: `${key}/${kebab(name)}.html`, html: r.html, portal: r.portal, initialArgs: r.initialArgs, error: r.error });
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
      let r;
      try { r = await render(first.id, j.q); } catch { continue; }
      if (r.error) continue;
      raw.push({ kind: "state", story: first.name, args: { [j.n]: j.v }, file: `${key}/states/${kebab(first.name)}--${j.n}-${kebab(String(j.v))}.html`, html: r.html, portal: r.portal });
    }
  }
  const all = new Set(); for (const r of raw) collect(r.html, all);
  const dead = new Set([...all].filter((c) => UNSUPPORTED(c) || (!NO_STYLE(c) && !hasRule(c))));
  const stripped = new Set();
  const classes = new Set();
  const stories = [], states = [];
  for (const r of raw) {
    const { html: stripped0, removed } = strip(r.html, dead);
    const html = await captureAssets(stripped0);
    removed.forEach((c) => stripped.add(c));
    writeFileSync(join(OUT, r.file), html + "\n");
    collect(html, classes);
    if (r.kind === "story") stories.push({ name: r.name, id: r.id, file: r.file, portal: r.portal, initialArgs: r.initialArgs, ...(r.error ? { error: r.error } : {}) });
    else states.push({ story: r.story, args: r.args, file: r.file, portal: r.portal });
  }
  writeFileSync(join(OUT, `${key}.json`), JSON.stringify({
    $note: "FE 스토리북 스냅샷(scripts/fe-storybook-sync.mjs). 편집하지 않는다 — pnpm fe:sync 로 다시 만든다. states = 첫 스토리에 args 를 하나씩 바꿔 렌더한 것(/render?args= 의 대체). portal=true 는 오버레이가 <!-- portal --> 뒤에 붙어 있다. strippedClasses = FE CSS 에 규칙이 없어 뗀 이름(FE 화면에서도 효과 0).",
    key, fe: { id: fe.id, docs: FE + fe.docs, base: FE }, feBuild, synced,
    stories, argTypes, states, classes: [...classes].sort(), strippedClasses: [...stripped].sort(),
  }, null, 1) + "\n");
  summary.push({ key, stories: stories.length, states: states.length, classes: classes.size, stripped: [...stripped], errors });
  console.log(`  ${key}: 스토리 ${stories.length} · 상태 ${states.length} · 클래스 ${classes.size}${stories.some((s) => s.portal) ? " · 포털" : ""}${stripped.size ? ` · 죽은 클래스 뗌 ${[...stripped].join(",")}` : ""}${errors ? ` · 렌더 오류 ${errors}` : ""}`);
}
await browser.close();

// ── FE 빌드 CSS 보관 ──
// FE 고유 유틸리티(사이드바 색 등 우리 Tailwind 가 못 만드는 클래스)는 여기서 고르지 않는다 — "우리 ds.css 에 없는 클래스"는 ds.css 를 만들어 봐야 안다.
// 그래서 FE 빌드 CSS 를 그대로 저장해 두고, playground/scripts/build-ds-css.mjs 가 컴파일 뒤 빠진 클래스만 여기서 옮긴다(2026-09-29 — 변수 기준 추측은
// FE 가 우리 시맨틱 토큰을 --general-* 로 부르는 바람에 hover:bg-accent 같은 표준 유틸리티까지 35개 중복 복사했다).
writeFileSync(join(OUT, "fe.css"), `/* FE 빌드 CSS 원본 사본(${cssRel || "?"}, 빌드 ${feBuild}, ${synced}) — build-ds-css.mjs 가 우리 ds.css 에 없는 클래스의 규칙을 여기서 옮긴다. 편집 금지 */\n` + feCss);
try { rmSync(join(OUT, "fe-utilities.css"), { force: true }); } catch {}
// 요약 — 부분 실행(키 지정)이면 기존 요약과 합친다
const prevSummary = existsSync(join(OUT, "index.json")) ? JSON.parse(readFileSync(join(OUT, "index.json"), "utf8")).components ?? [] : [];
const merged = only.length ? [...prevSummary.filter((c) => !keys.includes(c.key)), ...summary].sort((a, b) => a.key.localeCompare(b.key)) : summary;
writeFileSync(join(OUT, "index.json"), JSON.stringify({ $note: "FE 스토리북 동기화 요약(pnpm fe:sync). feBuild = 마지막으로 가져온 FE 빌드 도장 — --if-changed 가 이것과 대조한다", base: FE, feBuild, synced, components: merged }, null, 1) + "\n");
const errs = summary.filter((s) => s.errors).length;
console.log(`[fe:sync] ${FE} · 빌드 ${feBuild} · 컴포넌트 ${summary.length}${errs ? ` · 오류 있는 컴포넌트 ${errs}` : ""} · FE CSS ${(feCss.length / 1024).toFixed(0)}KB 보관 → playground/fe-stories/`);
if (errs) process.exit(1);
