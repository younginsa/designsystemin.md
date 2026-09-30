// GET /render/<컴포넌트>/<스토리>[?args={…}] — 스토리를 요청 시 렌더한 HTML(2026-09-21 Phase 1 · 2026-09-23 Phase 2 args · 2026-09-28 FE 이관).
// 원천 둘: ① 우리 스토리 = 번들 안의 React 컴포넌트를 같은 함수(story-render-core)로 렌더 — 정적 /story-html 과 바이트 동일
//          ② FE 스토리북 컴포넌트(레지스트리 fe) = pnpm fe:sync 가 가져온 스냅샷을 번들에 실어 그대로 돌려준다. ?args= 는 미리 렌더한 상태(states) 중
//             정확히 일치하는 것만 — 없으면 400 과 함께 가능한 목록을 준다(요청 시 브라우저를 못 띄우므로).
// 접근 값은 요구하지 않는다 — 정적 파일과 같은 내용이고, claude.ai 채팅은 헤더를 못 붙인다.
//   /render                                → 컴포넌트 키 목록
//   /render/<컴포넌트>                      → 스토리 목록(argsAware · args 키 · states · props 주소)
//   /render/<컴포넌트>/<스토리>              → HTML (스토리 이름은 PascalCase·kebab 둘 다)
//   /render/<컴포넌트>/<스토리>?args={"value":"HN-2031"}
//        → 스토리 args 위에 덮어 렌더. 허용 키 = 스토리 args 키 ∪ /props/<키>.json 의 propNames ∪ children(문자열).
//          className·style·on* 은 거부(생성물이 렌더 경로로 임의 클래스를 들여오지 못하게). 4KB 상한. args 를 안 받는 스토리는 400.
import type { IncomingMessage, ServerResponse } from "node:http";

import type { StoriesBundle } from "../src/stories-bundle.js";
// @ts-ignore — 번들은 빌드 산출물(pnpm --filter @ds/mcp bundle). 타입은 StoriesBundle 로 고정한다.
import * as raw from "../dist/stories.mjs";

const bundle = raw as unknown as StoriesBundle;
const { modules, feSnippets, propNames, generated, renderStory, resolveStoryName, storyNames, storyArgsAware, kebab } = bundle;
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
const sameArgs = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && String(a[k]) === String(b[k]));
};

function parseArgs(res: ServerResponse, rawArgs: string): Record<string, unknown> | null | undefined {
  if (!rawArgs) return undefined;
  if (rawArgs.length > ARGS_MAX) { send(res, 400, j({ error: `args ${ARGS_MAX}자 상한 초과` })); return null; }
  let parsed: unknown;
  try { parsed = JSON.parse(rawArgs); } catch { send(res, 400, j({ error: "args 는 JSON 객체여야 한다", example: `?args=${encodeURIComponent('{"value":"HN-2031"}')}` })); return null; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) { send(res, 400, j({ error: "args 는 JSON 객체여야 한다" })); return null; }
  return parsed as Record<string, unknown>;
}

function html(res: ServerResponse, body: string, story: string, extra?: Record<string, string>) {
  res.setHeader("cache-control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
  res.setHeader("x-ds-story", story);
  res.setHeader("x-ds-generated", generated);
  for (const [k, v] of Object.entries(extra ?? {})) res.setHeader(k, v);
  return send(res, 200, body.endsWith("\n") ? body : body + "\n", "text/html; charset=utf-8");
}

export default async function handler(req: Req, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.setHeader("allow", "GET"); return send(res, 405, j({ error: "GET only" })); }
  const component = param(req, "component");
  const story = param(req, "story");
  const keys = [...new Set([...Object.keys(modules), ...Object.keys(feSnippets ?? {})])].sort();
  if (!component) return send(res, 200, j({ generated, usage: "/render/<component>/<story>[?args={…}]", props: `${DOCS_BASE}/props/<component>.json`, components: keys }));

  // ── FE 스토리북 스냅샷 ──
  const fe = feSnippets?.[component];
  if (fe && !modules[component]) {
    const names = Object.keys(fe.stories);
    const list = names.map((k) => ({ name: fe.stories[k].name, path: `/render/${component}/${k}`, argsAware: false }));
    const states = fe.states.map((s) => ({ story: s.story, args: s.args, path: `/render/${component}/${s.story}?args=${encodeURIComponent(JSON.stringify(s.args))}` }));
    const opened = (fe.opened ?? []).map((o) => ({ story: o.story, trigger: o.trigger, path: `/render/${component}/${o.story}?open=1` }));
    if (!story) return send(res, 200, j({ component, source: "fe", docs: fe.docs, feBuild: fe.feBuild, props: `${DOCS_BASE}/props/${component}.json`, propNames: propNames[component] ?? [], stories: list, states, opened, note: "FE 스토리북 스냅샷 — ?args= 는 states 에 있는 조합만, ?open=1 은 opened 에 있는 스토리만(트리거를 클릭해 연 상태, 포털 포함) 돌려준다" }));
    const k = names.find((n) => n === story || n === kebab(story) || fe.stories[n].name === story || fe.stories[n].name.toLowerCase() === story.toLowerCase());
    if (!k) return send(res, 404, j({ error: `스토리 없음: ${component}/${story}`, stories: names }));
    if (param(req, "open")) {
      const o = (fe.opened ?? []).find((x) => x.story === k);
      if (!o) return send(res, 400, j({ error: `열린 상태가 없다 — 이 스토리에는 닫힌 트리거가 없거나 클릭해도 포털이 안 생겼다`, opened: opened.map((x) => x.story) }));
      return html(res, o.html, `${component}/${fe.stories[k].name} (open)`, { "x-ds-source": "fe", "x-ds-fe-build": fe.feBuild, "x-ds-open": encodeURIComponent(o.trigger) });
    }
    const args = parseArgs(res, param(req, "args"));
    if (args === null) return;
    if (!args) return html(res, fe.stories[k].html, `${component}/${fe.stories[k].name}`, { "x-ds-source": "fe", "x-ds-fe-build": fe.feBuild });
    const hit = fe.states.find((s) => s.story === k && sameArgs(s.args, args));
    if (!hit) return send(res, 400, j({ error: `이 조합은 미리 렌더돼 있지 않다(FE 스토리북 스냅샷은 요청 시 렌더가 안 된다)`, available: states.filter((s) => s.story === k).map((s) => s.args) }));
    return html(res, hit.html, `${component}/${fe.stories[k].name}`, { "x-ds-source": "fe", "x-ds-fe-build": fe.feBuild, "x-ds-args": Object.keys(args).join(",") });
  }

  // ── 우리 스토리(번들 안 React) ──
  const mod = modules[component];
  if (!mod) return send(res, 404, j({ error: `컴포넌트 없음: ${component} — 스토리가 있는 것만 렌더된다`, components: keys }));
  const names = storyNames(mod);
  const describe = (n: string) => ({ name: n, path: `/render/${component}/${kebab(n)}`, argsAware: storyArgsAware(mod, n), args: Object.keys(mod[n]?.args ?? {}) });
  if (!story) return send(res, 200, j({ component, source: "local", props: `${DOCS_BASE}/props/${component}.json`, propNames: propNames[component] ?? [], stories: names.map(describe) }));
  const name = resolveStoryName(mod, story);
  if (!name) return send(res, 404, j({ error: `스토리 없음: ${component}/${story}`, stories: names.map(kebab) }));

  const args = parseArgs(res, param(req, "args"));
  if (args === null) return;
  if (args) {
    if (!storyArgsAware(mod, name)) return send(res, 400, j({ error: `${component}/${name} 은 args 를 받지 않는다(render: () => …). args 를 받는 스토리를 고른다`, argsAware: names.filter((n) => storyArgsAware(mod, n)).map(kebab) }));
    const allowed = new Set<string>([...Object.keys(mod[name].args ?? {}), ...(propNames[component] ?? []), "children"]);
    const bad = Object.keys(args).filter((k) => FORBIDDEN.test(k) || !allowed.has(k));
    if (bad.length) return send(res, 400, j({ error: `허용되지 않는 args: ${bad.join(", ")}`, allowed: [...allowed].sort(), props: `${DOCS_BASE}/props/${component}.json` }));
    if ("children" in args && typeof args.children !== "string") return send(res, 400, j({ error: "children 은 문자열만" }));
  }
  try {
    return html(res, renderStory(mod, name, args), `${component}/${name}`, args ? { "x-ds-args": Object.keys(args).join(",") } : undefined);
  } catch (e: any) {
    return send(res, 500, j({ error: String(e?.message ?? e).slice(0, 300), story: `${component}/${name}`, args: args ? Object.keys(args) : undefined }));
  }
}
