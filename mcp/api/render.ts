// GET /render/<컴포넌트>/<스토리> — 저장소 스토리를 요청 시 렌더한 HTML(2026-09-21 Phase 1).
// 정적 스니펫(/story-html/<키>/<스토리>.html)과 같은 함수(story-render-core)·같은 결과. 접근 값은 요구하지 않는다 —
// 정적 파일과 같은 내용이고, claude.ai 채팅은 헤더를 못 붙인다. Phase 2 에서 ?args= 로 프롭을 바꿔 "한 상태의 사진" 천장을 넘는다.
//   /render                         → 컴포넌트 키 목록
//   /render/<컴포넌트>               → 그 컴포넌트의 스토리 목록
//   /render/<컴포넌트>/<스토리>       → HTML (스토리 이름은 PascalCase·kebab 둘 다)
import type { IncomingMessage, ServerResponse } from "node:http";

import type { StoriesBundle } from "../src/stories-bundle.js";
// @ts-ignore — 번들은 빌드 산출물(pnpm --filter @ds/mcp bundle). 타입은 StoriesBundle 로 고정한다.
import * as raw from "../dist/stories.mjs";

const bundle = raw as unknown as StoriesBundle;
const { modules, generated, renderStory, resolveStoryName, storyNames, kebab } = bundle;

type Req = IncomingMessage & { query?: Record<string, string | string[]> };
const param = (req: Req, k: string): string => {
  const u = new URL(req.url ?? "/", "http://x");
  const v = u.searchParams.get(k) ?? req.query?.[k];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};
const send = (res: ServerResponse, code: number, body: string, type = "application/json; charset=utf-8") => {
  res.statusCode = code;
  res.setHeader("content-type", type);
  res.end(body);
};

export default async function handler(req: Req, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.setHeader("allow", "GET"); return send(res, 405, JSON.stringify({ error: "GET only" })); }
  const component = param(req, "component");
  const story = param(req, "story");
  const keys = Object.keys(modules).sort();
  if (!component) return send(res, 200, JSON.stringify({ generated, usage: "/render/<component>/<story>", components: keys }));
  const mod = modules[component];
  if (!mod) return send(res, 404, JSON.stringify({ error: `컴포넌트 없음: ${component} — 스토리가 있는 것만 렌더된다`, components: keys }));
  const names = storyNames(mod);
  if (!story) return send(res, 200, JSON.stringify({ component, stories: names.map((n) => ({ name: n, path: `/render/${component}/${kebab(n)}` })) }));
  const name = resolveStoryName(mod, story);
  if (!name) return send(res, 404, JSON.stringify({ error: `스토리 없음: ${component}/${story}`, stories: names.map(kebab) }));
  try {
    const html = renderStory(mod, name);
    res.setHeader("cache-control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("x-ds-story", `${component}/${name}`);
    res.setHeader("x-ds-generated", generated);
    return send(res, 200, html + "\n", "text/html; charset=utf-8");
  } catch (e: any) {
    return send(res, 500, JSON.stringify({ error: String(e?.message ?? e).slice(0, 300), story: `${component}/${name}` }));
  }
}
