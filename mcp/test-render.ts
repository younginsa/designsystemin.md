// /render 검증 — 번들의 renderStory 가 정적 스니펫(story-html)과 바이트 단위로 같은지 전수 비교한다(2026-09-21 Phase 1).
// 두 경로가 같은 함수를 쓰므로 하나라도 다르면 번들(React 두 벌·환경 차이)이 잘못된 것이다.
//   pnpm --filter @ds/mcp bundle && DS_BASE=http://localhost:3000 pnpm --filter @ds/mcp test:render
import { BASE, storyIndex } from "./src/ds.js";
import type { StoriesBundle } from "./src/stories-bundle.js";
// @ts-ignore — 빌드 산출물
import * as raw from "./dist/stories.mjs";

const bundle = raw as unknown as StoriesBundle;
const idx = await storyIndex();
let same = 0, diff = 0, missing = 0;
const bad: string[] = [];
for (const [key, e] of Object.entries(idx.components)) {
  const mod = bundle.modules[key];
  if (!mod) { missing++; bad.push(`${key}: 번들에 없음`); continue; }
  for (const s of e.stories) {
    if (s.error) continue;
    const r = await fetch(`${BASE}/story-html/${s.file}`);
    if (!r.ok) { missing++; bad.push(`${key}/${s.name}: 정적 스니펫 ${r.status}`); continue; }
    const stat = await r.text();
    const name = bundle.resolveStoryName(mod, s.name);
    if (!name) { missing++; bad.push(`${key}/${s.name}: 번들에 스토리 없음`); continue; }
    let live: string;
    try { live = bundle.renderStory(mod, name) + "\n"; } catch (err: any) { diff++; bad.push(`${key}/${s.name}: 렌더 실패 — ${String(err?.message ?? err).slice(0, 120)}`); continue; }
    if (live === stat) same++;
    else { diff++; bad.push(`${key}/${s.name}: 다름(정적 ${stat.length}자 · 라이브 ${live.length}자)`); }
  }
}
console.log(`[test:render] 번들 ${bundle.generated} · 같음 ${same} · 다름 ${diff} · 없음 ${missing}`);
if (bad.length) { console.error(bad.slice(0, 20).join("\n")); process.exit(1); }
