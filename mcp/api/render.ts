// GET /render/<컴포넌트>/<스토리>[?args={…}] — 저장소 스토리를 요청 시 렌더한 HTML(2026-09-21 Phase 1 · 2026-09-23 Phase 2 args).
// 정적 스니펫(/story-html/<키>/<스토리>.html)과 같은 함수(story-render-core)·같은 결과. 접근 값은 요구하지 않는다 —
// 정적 파일과 같은 내용이고, claude.ai 채팅은 헤더를 못 붙인다.
//   /render                                → 컴포넌트 키 목록
//   /render/<컴포넌트>                      → 그 컴포넌트의 스토리 목록(argsAware · args 키 · props 주소)
//   /render/<컴포넌트>/<스토리>              → HTML (스토리 이름은 PascalCase·kebab 둘 다)
//   /render/<컴포넌트>/<스토리>?args={"value":"HN-2031"}
//        → 스토리 args 위에 덮어 렌더. 허용 키 = 스토리 args 키 ∪ /props/<키>.json 의 propNames ∪ children(문자열).
//          className·style·on* 은 거부(생성물이 렌더 경로로 임의 클래스를 들여오지 못하게). 4KB 상한. args 를 안 받는 스토리는 400.
import type { IncomingMessage, ServerResponse } from "node:http";

import type { StoriesBundle } from "../src/stories-bundle.js";
// @ts-ignore — 번들은 빌드 산출물(pnpm --filter @ds/mcp bundle). 타입은 StoriesBundle 로 고정한다.
import * as raw from "../dist/stories.mjs";

const bundle = raw as unknown as StoriesBundle;
const { modules, propNames, generated, renderStory, resolveStoryName, storyNames, storyArgsAware, kebab } = bundle;
const DOCS_BASE = (process.env.DS_BASE || "https://designsystemin-md.vercel.app").replace(/\/$/, "");
const FORBIDDEN = /^(className|style|dangerouslySetInnerHTML|ref|key)$|^on[A-Z]/;
const ARGS_MAX = 4096;

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
const j = (o: unknown) => JSON.stringify(o);

export default async function handler(req: Req, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.setHeader("allow", "GET"); return send(res, 405, j({ error: "GET only" })); }
  const component = param(req, "component");
  const story = param(req, "story");
  const keys = Object.keys(modules).sort();
  if (!component) return send(res, 200, j({ generated, usage: "/render/<component>/<story>[?args={…}]", props: `${DOCS_BASE}/props/<component>.json`, components: keys }));
  const mod = modules[component];
  if (!mod) return send(res, 404, j({ error: `컴포넌트 없음: ${component} — 스토리가 있는 것만 렌더된다`, components: keys }));
  const names = storyNames(mod);
  const describe = (n: string) => ({ name: n, path: `/render/${component}/${kebab(n)}`, argsAware: storyArgsAware(mod, n), args: Object.keys(mod[n]?.args ?? {}) });
  if (!story) return send(res, 200, j({ component, props: `${DOCS_BASE}/props/${component}.json`, propNames: propNames[component] ?? [], stories: names.map(describe) }));
  const name = resolveStoryName(mod, story);
  if (!name) return send(res, 404, j({ error: `스토리 없음: ${component}/${story}`, stories: names.map(kebab) }));

  // ── ?args= ──
  const rawArgs = param(req, "args");
  let args: Record<string, unknown> | undefined;
  if (rawArgs) {
    if (rawArgs.length > ARGS_MAX) return send(res, 400, j({ error: `args ${ARGS_MAX}자 상한 초과` }));
    let parsed: unknown;
    try { parsed = JSON.parse(rawArgs); } catch { return send(res, 400, j({ error: "args 는 JSON 객체여야 한다", example: `?args=${encodeURIComponent('{"value":"HN-2031"}')}` })); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return send(res, 400, j({ error: "args 는 JSON 객체여야 한다" }));
    if (!storyArgsAware(mod, name)) return send(res, 400, j({ error: `${component}/${name} 은 args 를 받지 않는다(render: () => …). args 를 받는 스토리를 고른다`, argsAware: names.filter((n) => storyArgsAware(mod, n)).map(kebab) }));
    const allowed = new Set<string>([...Object.keys(mod[name].args ?? {}), ...(propNames[component] ?? []), "children"]);
    const bad = Object.keys(parsed).filter((k) => FORBIDDEN.test(k) || !allowed.has(k));
    if (bad.length) return send(res, 400, j({ error: `허용되지 않는 args: ${bad.join(", ")}`, allowed: [...allowed].sort(), props: `${DOCS_BASE}/props/${component}.json` }));
    const p = parsed as Record<string, unknown>;
    if ("children" in p && typeof p.children !== "string") return send(res, 400, j({ error: "children 은 문자열만" }));
    args = p;
  }

  try {
    const html = renderStory(mod, name, args);
    res.setHeader("cache-control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("x-ds-story", `${component}/${name}`);
    res.setHeader("x-ds-generated", generated);
    if (args) res.setHeader("x-ds-args", Object.keys(args).join(","));
    return send(res, 200, html + "\n", "text/html; charset=utf-8");
  } catch (e: any) {
    return send(res, 500, j({ error: String(e?.message ?? e).slice(0, 300), story: `${component}/${name}`, args: args ? Object.keys(args) : undefined }));
  }
}
