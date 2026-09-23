// 스토리 번들 — components/src/ui/*.stories.tsx 전부 + 렌더 코어(playground/scripts/story-render-core.tsx)를 esbuild 로
// 한 파일(dist/stories.mjs)에 묶는다. /api/render 가 요청 시 여기서 스토리를 꺼내 렌더한다(2026-09-21 Phase 1).
// React 와 react-dom/server 도 같은 번들 안에 한 벌만 들어간다 — 두 벌이면 훅이 깨진다.
// 실행: pnpm --filter @ds/mcp bundle (Vercel buildCommand · 로컬 test:render 전). 산출물(dist/·.gen/)은 커밋하지 않는다.

import { build } from "esbuild";

import { collectProps } from "./build-props.mjs";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MCP = resolve(HERE, "..");
const ROOT = resolve(MCP, "..");

const registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
// 스토리가 있으면 DS — 정적 스니펫(render-stories.tsx)과 같은 필터
const keys = Object.keys(registry.components).filter((k) => registry.components[k].stories).sort();
const ident = (k) => "m_" + k.replace(/-/g, "_");

const GEN = join(MCP, ".gen");
mkdirSync(GEN, { recursive: true });
// ?args= 허용 목록 — 원문에 선언된 프롭 이름만(react-docgen-typescript). 번들에 같이 실어 요청 시 네트워크 없이 검사한다.
const t0 = Date.now();
const props = collectProps(keys);
const propNames = Object.fromEntries(keys.map((k) => [k, props[k]?.propNames ?? []]));
console.log(`[bundle] 프롭 목록 ${Object.values(propNames).reduce((n, a) => n + a.length, 0)}개 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

const entry = [
  "// 자동 생성(scripts/bundle-stories.mjs) — 편집 금지",
  'export { kebab, renderStory, resolveStoryName, storyArgsAware, storyNames } from "../../playground/scripts/story-render-core";',
  `export const propNames = ${JSON.stringify(propNames)};`,
  ...keys.map((k) => `import * as ${ident(k)} from "../../components/src/ui/${k}.stories";`),
  "export const modules = {",
  ...keys.map((k) => `  "${k}": ${ident(k)},`),
  "};",
  `export const generated = ${JSON.stringify(new Date().toISOString().slice(0, 10))};`,
  "",
].join("\n");
writeFileSync(join(GEN, "stories-entry.tsx"), entry);

const out = join(MCP, "dist/stories.mjs");
await build({
  entryPoints: [join(GEN, "stories-entry.tsx")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  jsx: "automatic",
  tsconfig: join(ROOT, "tsconfig.render.json"),
  // CJS 의존(react-dom/server 등)이 require("util") 같은 내장 모듈을 부른다 — ESM 번들에는 require 가 없어 상단에 만들어 준다.
  banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' },
  // React 를 production 분기로 고정 — 런타임 환경변수와 무관하게 결정적. 정적 스니펫(개발 모드 tsx)과 같은 HTML 인지는 test:render 가 확인한다.
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
  legalComments: "none",
});
console.log(`[bundle] 스토리 컴포넌트 ${keys.length} → mcp/dist/stories.mjs (${(statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
