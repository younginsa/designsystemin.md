// /props/<컴포넌트>.json — 컴포넌트 원문의 프롭(이름·타입·기본값·JSDoc)을 react-docgen-typescript 로 뽑는다(2026-09-23 Phase 2).
// 두 곳이 쓴다: ① 루트 `pnpm mcp:artifacts` 가 CLI 로 실행해 playground/public/props/ 에 쓴다(소비자가 읽는다)
//              ② mcp/scripts/bundle-stories.mjs 가 collectProps() 를 불러 ?args= 허용 목록(propNames)을 번들에 심는다.
// node_modules 에서 온 프롭(HTML 속성·Radix 프롭 수백 개)은 뺀다 — 이 파일에 선언된 것만이 DS 가 정한 조절점이다.
// 의존은 mcp/package.json 에만 있다(루트 스크립트도 이 파일 위치 기준으로 해석되므로 루트 설치 불필요).

import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const docgen = require("react-docgen-typescript");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const UI = join(ROOT, "components/src/ui");

const FORBIDDEN = /^(className|style|dangerouslySetInnerHTML|ref|key)$|^on[A-Z]/;

/** 레지스트리에서 스토리가 있는 키만 — 정적 스니펫·번들과 같은 필터 */
export function storyKeys() {
  const registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
  return Object.keys(registry.components).filter((k) => registry.components[k].stories).sort();
}

/** { key: { file, exports: { Name: { description, props } }, propNames } } — 한 번의 parse 로 전부(파일마다 프로그램을 만들면 10배 느리다) */
export function collectProps(keys = storyKeys()) {
  const parser = docgen.withCustomConfig(join(ROOT, "tsconfig.render.json"), {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop) => !(prop.parent && /node_modules/.test(prop.parent.fileName)),
  });
  const files = keys.map((k) => join(UI, `${k}.tsx`));
  const docs = parser.parse(files);
  const out = {};
  for (const key of keys) out[key] = { file: `components/src/ui/${key}.tsx`, exports: {}, propNames: [] };
  for (const d of docs) {
    const key = d.filePath.replace(/.*\//, "").replace(/\.tsx$/, "");
    if (!out[key]) continue;
    if (!/^[A-Z]/.test(d.displayName)) continue; // 소문자 export 는 유틸 함수
    const props = {};
    for (const [name, p] of Object.entries(d.props)) {
      if (FORBIDDEN.test(name)) continue;
      const entry = { type: p.type?.name ?? "", required: !!p.required };
      if (Array.isArray(p.type?.value) && p.type.value.length) entry.values = p.type.value.map((v) => String(v.value).replace(/^"|"$/g, ""));
      if (p.defaultValue && p.defaultValue.value != null) entry.default = String(p.defaultValue.value);
      if (p.description) entry.description = p.description;
      props[name] = entry;
    }
    out[key].exports[d.displayName] = { ...(d.description ? { description: d.description } : {}), props };
    for (const n of Object.keys(props)) if (!out[key].propNames.includes(n)) out[key].propNames.push(n);
  }
  for (const key of keys) out[key].propNames.sort();
  return out;
}

// CLI — playground/public/props/<key>.json + index.json
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const OUT = join(ROOT, "playground/public/props");
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const t0 = Date.now();
  const all = collectProps();
  const generated = new Date().toISOString().slice(0, 10);
  const index = {};
  let total = 0;
  for (const [key, v] of Object.entries(all)) {
    writeFileSync(join(OUT, `${key}.json`), JSON.stringify({
      $note: "컴포넌트 원문에 선언된 프롭만(HTML 속성·Radix 프롭 제외). /render/<키>/<스토리>?args={…} 의 허용 키 = 이 propNames ∪ 스토리 args 키 ∪ children(문자열). className·style·on* 은 항상 거부.",
      component: key, file: v.file, generated, propNames: v.propNames, exports: v.exports,
    }, null, 1));
    index[key] = { exports: Object.keys(v.exports), propNames: v.propNames };
    total += v.propNames.length;
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify({
    $note: "컴포넌트별 프롭 목록(pnpm mcp:artifacts, react-docgen-typescript). 상세는 /props/<키>.json. ?args= 는 여기 있는 이름만 받는다.",
    generated, components: index,
  }));
  console.log(`[props] 컴포넌트 ${Object.keys(all).length} · 프롭 ${total} → playground/public/props/ (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
