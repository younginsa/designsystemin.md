// /render 검증 — 번들의 렌더 결과가 정적 스니펫(story-html)과 바이트 단위로 같은지 전수 비교한다(2026-09-21 Phase 1).
// 우리 스토리는 같은 함수로 렌더하므로 하나라도 다르면 번들(React 두 벌·환경 차이)이 잘못된 것이고,
// FE 스토리북 스냅샷(2026-09-28 이관)은 번들에 실린 HTML 이 정적 사본과 같아야 한다(둘 다 playground/fe-stories 에서 왔다).
//   pnpm --filter @ds/mcp bundle && DS_BASE=http://localhost:3000 pnpm --filter @ds/mcp test:render
import { BASE, storyIndex } from "./src/ds.js";
import type { StoriesBundle } from "./src/stories-bundle.js";
// @ts-ignore — 빌드 산출물
import * as raw from "./dist/stories.mjs";

const bundle = raw as unknown as StoriesBundle;
const idx = await storyIndex();
let same = 0, diff = 0, missing = 0, feStates = 0;
const bad: string[] = [];
const fetchStatic = async (file: string) => { const r = await fetch(`${BASE}/story-html/${file}`); return r.ok ? await r.text() : null; };
for (const [key, e] of Object.entries(idx.components)) {
  const fe = bundle.feSnippets?.[key];
  if ((e as any).source === "fe") {
    if (!fe) { missing++; bad.push(`${key}: FE 스냅샷이 번들에 없음`); continue; }
    for (const s of e.stories) {
      if (s.error) continue;
      const stat = await fetchStatic(s.file);
      const live = fe.stories[bundle.kebab(s.name)]?.html;
      if (stat == null || live == null) { missing++; bad.push(`${key}/${s.name}: ${stat == null ? "정적 없음" : "번들 없음"}`); continue; }
      if (live === stat) same++; else { diff++; bad.push(`${key}/${s.name}: 다름(FE 스냅샷 — 정적 ${stat.length}자 · 번들 ${live.length}자)`); }
    }
    for (const st of (e as any).states ?? []) {
      const stat = await fetchStatic(st.file);
      const live = fe.states.find((x) => x.story === bundle.kebab(st.story) && JSON.stringify(x.args) === JSON.stringify(st.args))?.html;
      if (stat == null || live == null) { missing++; bad.push(`${key} 상태 ${JSON.stringify(st.args)}: ${stat == null ? "정적 없음" : "번들 없음"}`); continue; }
      if (live === stat) feStates++; else { diff++; bad.push(`${key} 상태 ${JSON.stringify(st.args)}: 다름`); }
    }
    for (const o of (e as any).opened ?? []) {
      const stat = await fetchStatic(o.file);
      const oi = o.index ?? Number((o.file.match(/--open-(\d+)\.html$/) || [])[1] || 0); // 트리거 번호 — index.json 에 없으면 파일명에서
      const live = (fe as any).opened?.find((x: any) => x.story === bundle.kebab(o.story) && (x.index ?? 0) === oi)?.html;
      if (stat == null || live == null) { missing++; bad.push(`${key} 열림 ${o.story}: ${stat == null ? "정적 없음" : "번들 없음"}`); continue; }
      if (live === stat) feStates++; else { diff++; bad.push(`${key} 열림 ${o.story}: 다름`); }
    }
    continue;
  }
  const mod = bundle.modules[key];
  if (!mod) { missing++; bad.push(`${key}: 번들에 없음`); continue; }
  for (const s of e.stories) {
    if (s.error) continue;
    const stat = await fetchStatic(s.file);
    if (stat == null) { missing++; bad.push(`${key}/${s.name}: 정적 스니펫 없음`); continue; }
    const name = bundle.resolveStoryName(mod, s.name);
    if (!name) { missing++; bad.push(`${key}/${s.name}: 번들에 스토리 없음`); continue; }
    let live: string;
    try { live = bundle.renderStory(mod, name) + "\n"; } catch (err: any) { diff++; bad.push(`${key}/${s.name}: 렌더 실패 — ${String(err?.message ?? err).slice(0, 120)}`); continue; }
    if (live === stat) same++;
    else { diff++; bad.push(`${key}/${s.name}: 다름(정적 ${stat.length}자 · 라이브 ${live.length}자)`); }
  }
}
console.log(`[test:render] 번들 ${bundle.generated} · 같음 ${same}(+FE 상태 ${feStates}) · 다름 ${diff} · 없음 ${missing}`);
if (bad.length) { console.error(bad.slice(0, 20).join("\n")); process.exit(1); }
