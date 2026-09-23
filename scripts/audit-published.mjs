#!/usr/bin/env node
// 배포면 감사 — 소비자(claude.ai 스킬·MCP·클론)가 실제로 받는 파일끼리 아귀가 맞는지 본다.
//
//   pnpm audit:published [주소] [--render=주소]   기본 https://designsystemin-md.vercel.app · 라이브 렌더는 index.json 의 renderBase
//   (주소가 localhost 면 F 는 건너뛴다 — 로컬 산출물과 배포 /render 는 다른 빌드일 수 있다. --render=http://localhost:8787 로 지정하면 본다)
//
// 이 스크립트는 배포된 URL 만 본다.
// 저장소 파일을 import 하지 않는다 — 소비자 시점을 잃으면 존재 이유가 없다.
// (저장소 쪽 대조는 audit-rules.mjs 가 맡는다. 둘을 합치면 같은 눈으로 두 번 보는 셈이 된다.)
//
// 왜 두 벌인가 — 2026-09-18 사이드바 사고. 갤러리 27면은 사이드바 컴포넌트를 안 써서
// 저장소를 아무리 봐도 깨끗했는데, 배포된 스니펫이 쓰는 클래스가 ds.css 에 0개였다.
// 복사하면 무색이 되는 버그를 잡을 수 있는 자리는 여기뿐이다.

const ARGS = process.argv.slice(2);
const BASE = (ARGS.find((a) => !a.startsWith("--")) || process.env.DS_BASE || "https://designsystemin-md.vercel.app").replace(/\/$/, "");
const RENDER_ARG = (ARGS.find((a) => a.startsWith("--render=")) || "").slice("--render=".length).replace(/\/$/, "");
const findings = [];
const add = (level, rule, detail) => findings.push({ level, rule, detail });

const cache = new Map();
async function get(path) {
  if (cache.has(path)) return cache.get(path);
  let out;
  try {
    const r = await fetch(BASE + path);
    out = { ok: r.ok, status: r.status, body: r.ok ? await r.text() : "" };
  } catch (e) {
    out = { ok: false, status: 0, body: "", error: String(e.message || e) };
  }
  cache.set(path, out);
  return out;
}
const json = async (path) => { const r = await get(path); if (!r.ok) return null; try { return JSON.parse(r.body); } catch { return null; } };

// 클래스 속성에서 낱개 클래스 뽑기 — SSR 스니펫은 엔티티로 나오고, Tailwind 는 특수문자를 역슬래시로 이스케이프한다.
// ds-classes.json 쪽도 CSS 선택자에서 역슬래시를 떼고 만들므로 양쪽 다 떼어 비교한다.
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
function classesOf(html) {
  const out = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of decode(m[1]).split(/\s+/)) if (c) out.add(c.replace(/\\/g, ""));
  return out;
}
// 스타일 규칙이 없어도 되는 클래스
//  - group/peer 이름표, lucide 아이콘 마커, sr-only
//  - 라이브러리가 자기 CSS 로 칠하는 클래스(react-day-picker rdp-*, recharts-*) — Tailwind 유틸리티가 아니다
const NO_STYLE = (c) => /^(group|peer)(\/|$)/.test(c) || /^lucide(-|$)/.test(c) || /^sr-only$/.test(c) || /^(rdp|recharts)-/.test(c);

async function main() {
  console.log(`[audit:published] ${BASE}`);

  // ── A. 참조 무결성 — 지침이 가리키는 주소가 다 살아 있나 ──
  const skill = await get("/ds-skill.md");
  if (!skill.ok) add("error", "지침 없음", `/ds-skill.md → ${skill.status}`);
  const referenced = new Set();
  if (skill.ok) {
    const paths = new Set();
    for (const m of skill.body.matchAll(/BASE(\/[A-Za-z0-9_\-./]+)/g)) paths.add(m[1]);
    for (const m of skill.body.matchAll(new RegExp(BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(/[A-Za-z0-9_\\-./]+)", "g"))) paths.add(m[1]);
    for (const p of [...paths].sort()) {
      if (/<|>/.test(p) || p.endsWith("/")) continue; // <키>·<제품> 같은 자리표시자(잘리면 디렉터리만 남는다)
      referenced.add(p);
      const r = await get(p);
      if (!r.ok) add("error", "깨진 참조", `지침이 가리키는 ${p} → ${r.status}`);
    }
  }
  // 배포됐는데 지침이 안 가리키는 파일 — 죽은 산출물
  for (const p of ["/approved.json", "/vocab-map.json", "/ds365.json", "/dstk/theme-map.json", "/dstk/figma-theme-snapshot.json"]) {
    const r = await get(p);
    if (r.ok && !referenced.has(p)) add("warn", "죽은 산출물", `${p} 는 배포되는데 지침이 가리키지 않는다`);
  }

  // ── B. 목록 간 숫자 일치 ──
  const reg = await json("/ds-registry.json");
  const idx = await json("/story-html/index.json");
  if (!reg) add("error", "레지스트리 없음", "/ds-registry.json");
  if (!idx) add("error", "스니펫 목록 없음", "/story-html/index.json");
  if (reg && idx) {
    const regKeys = new Set(Object.keys(reg.components).filter((k) => reg.components[k].stories));
    const idxKeys = new Set(Object.keys(idx.components));
    for (const k of regKeys) if (!idxKeys.has(k)) add("error", "스니펫 누락", `${k} 는 스토리가 있다고 적혀 있는데 스니펫이 없다`);
    for (const k of idxKeys) if (!regKeys.has(k)) add("error", "목록 밖 스니펫", `${k} 스니펫은 있는데 레지스트리에 스토리가 없다`);
    console.log(`  목록 대조 — 레지스트리 스토리 ${regKeys.size} · 스니펫 ${idxKeys.size}`);
  }

  // ── B2. 프롭 목록(/props) — ?args= 의 허용 목록이 스니펫 목록과 같은 빌드인가 (2026-09-23 Phase 2) ──
  const propsIdx = await json("/props/index.json");
  if (!propsIdx) add("error", "프롭 목록 없음", "/props/index.json — ?args= 허용 목록이 없다");
  else if (idx && Object.keys(propsIdx.components).length !== Object.keys(idx.components).length) add("warn", "프롭 목록 수 불일치", `/props ${Object.keys(propsIdx.components).length} · 스니펫 ${Object.keys(idx.components).length}`);
  else if (idx) console.log(`  프롭 목록 — 컴포넌트 ${Object.keys(propsIdx.components).length} · 프롭 ${Object.values(propsIdx.components).reduce((n, c) => n + c.propNames.length, 0)}`);

  // ── C. 스니펫 클래스 ↔ ds.css (제일 값어치 있는 검사) ──
  const classList = await json("/ds-classes.json");
  if (!classList) add("error", "클래스 목록 없음", "/ds-classes.json");
  if (classList && idx) {
    const allowed = new Set(classList.classes);
    const missing = new Map(); // 클래스 → 쓰는 스니펫들
    let snippets = 0;
    for (const [key, entry] of Object.entries(idx.components)) {
      for (const s of entry.stories) {
        if (s.error) continue;
        const r = await get("/story-html/" + s.file);
        if (!r.ok) { add("error", "스니펫 깨짐", `${s.file} → ${r.status}`); continue; }
        snippets++;
        for (const c of classesOf(r.body)) {
          if (allowed.has(c) || NO_STYLE(c)) continue;
          if (!missing.has(c)) missing.set(c, new Set());
          missing.get(c).add(key);
        }
      }
    }
    console.log(`  스니펫 ${snippets}편 클래스 대조 — 안 먹는 클래스 ${missing.size}`);
    for (const [c, users] of [...missing.entries()].sort()) {
      add("error", "안 먹는 클래스", `${c} — ${[...users].join(", ")} 스니펫이 쓰는데 ds.css 에 없다`);
    }
  }

  // ── D. 파이프 위생 — 산출 과정의 사고 흔적 ──
  if (idx) {
    for (const [key, entry] of Object.entries(idx.components)) {
      for (const s of entry.stories) {
        if (s.error) add("error", "렌더 실패", `${key}/${s.name} — ${s.error}`);
        if ((s.description || "").length > 300) add("warn", "설명 비대", `${key}/${s.name} 설명 ${s.description.length}자 — 추출이 원문을 삼켰을 가능성`);
      }
    }
  }
  for (const [p, kb] of [["/ds-registry.json", 40], ["/story-html/index.json", 40], ["/ds-skill.md", 20]]) {
    const r = await get(p);
    if (r.ok && r.body.length / 1024 > kb) add("warn", "크기 예산 초과", `${p} ${(r.body.length / 1024).toFixed(0)}KB (예산 ${kb}KB)`);
  }

  // ── E. 같은 개념이 두 곳에 ──
  const sem = await json("/dstk/semantic-map.json");
  if (sem && classList && Array.isArray(sem.tints) && Array.isArray(classList.tints)) {
    add("warn", "중복 개념", `틴트 목록이 semantic-map.json(${sem.tints.length}) 과 ds-classes.json(${classList.tints.length}) 양쪽에 있다`);
  }

  // ── F. 라이브 렌더 ↔ 정적 스니펫 (2026-09-21 Phase 1) ──
  // /render 는 같은 함수(story-render-core)로 요청 시 렌더한다. 한 편이라도 다르면 mcp 번들이 다른 빌드거나 깨진 것이다.
  const renderBase = RENDER_ARG || (/localhost|127\.0\.0\.1/.test(BASE) ? "" : (idx && idx.renderBase) || "https://mcp-one-fawn.vercel.app");
  if (!renderBase) {
    console.log("  라이브 렌더(F) 건너뜀 — 로컬 주소. --render=http://localhost:8787 로 지정하면 본다");
  } else if (idx) {
    const root = await (async () => { try { const r = await fetch(renderBase + "/render"); return r.ok ? await r.json() : null; } catch { return null; } })();
    const idxKeys = Object.keys(idx.components);
    if (!root) add("error", "라이브 렌더 불가", `${renderBase}/render 응답 없음`);
    else if ((root.components || []).length !== idxKeys.length) add("warn", "라이브 렌더 빌드 불일치", `/render 컴포넌트 ${(root.components || []).length} · idx.json ${idxKeys.length} — 다른 빌드`);
    const jobs = [];
    for (const [key, entry] of Object.entries(idx.components)) for (const s of entry.stories) if (!s.error) jobs.push({ key, s });
    let same = 0, diff = 0, fail = 0;
    const run = async ({ key, s }) => {
      const stat = await get("/story-html/" + s.file);
      let live;
      try { const r = await fetch(`${renderBase}/render/${s.file.replace(/\.html$/, "")}`); live = { ok: r.ok, status: r.status, body: r.ok ? await r.text() : "" }; }
      catch (e) { live = { ok: false, status: 0, body: "", error: String(e.message || e) }; }
      if (!stat.ok || !live.ok) { fail++; add("error", "라이브 렌더 실패", `${key}/${s.name} — 정적 ${stat.status} · 라이브 ${live.status}${live.error ? " " + live.error : ""}`); return; }
      if (stat.body === live.body) same++;
      else { diff++; add("error", "라이브≠정적", `${key}/${s.name} — 정적 ${stat.body.length}자 · 라이브 ${live.body.length}자`); }
    };
    if (root) for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map(run));
    if (root) console.log(`  라이브 렌더 ${jobs.length}편 대조(${renderBase}) — 같음 ${same} · 다름 ${diff} · 실패 ${fail}`);
  }

  // ── 보고 ──
  const errs = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");
  console.log(`\n[audit:published] 오류 ${errs.length} · 경고 ${warns.length}`);
  for (const f of errs) console.log(`  ✗ ${f.rule}: ${f.detail}`);
  for (const f of warns) console.log(`  · ${f.rule}: ${f.detail}`);
  if (!errs.length && !warns.length) console.log("  깨끗함");
  process.exit(errs.length ? 1 : 0);
}

main().catch((e) => { console.error("[audit:published] 실행 실패:", e); process.exit(2); });
