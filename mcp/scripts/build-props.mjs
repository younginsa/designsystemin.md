// /props/<컴포넌트>.json — 컴포넌트의 프롭(이름·타입·기본값·JSDoc)을 뽑는다(2026-09-23 Phase 2).
// 원천 둘: ① 우리 컴포넌트 = 원문을 react-docgen-typescript 로 ② FE 스토리북 컴포넌트(레지스트리 fe) = playground/fe-stories/<key>.json 의 argTypes(2026-09-28 이관).
// 두 곳이 쓴다: 루트 `pnpm mcp:artifacts` 가 CLI 로 실행해 playground/public/props/ 에 쓰고, mcp/scripts/bundle-stories.mjs 가 collectProps() 로 ?args= 허용 목록을 번들에 심는다.
// node_modules 에서 온 프롭(HTML 속성·Radix 프롭 수백 개)은 뺀다 — 이 파일에 선언된 것만이 DS 가 정한 조절점이다.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const docgen = require("react-docgen-typescript");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const UI = join(ROOT, "components/src/ui");
const FE_DIR = join(ROOT, "playground/fe-stories");

const FORBIDDEN = /^(className|style|dangerouslySetInnerHTML|ref|key)$|^on[A-Z]/;
const pascal = (k) => k.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
const components = () => JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8")).components;

/** DS 키 — 우리 스토리가 있거나 FE 스토리북에 있는 것(정적 스니펫·번들과 같은 필터) */
export function storyKeys() {
  const c = components();
  return Object.keys(c).filter((k) => c[k].stories || c[k].fe).sort();
}

/** { key: { file, source, exports: { Name: { description, props } }, propNames } } */
export function collectProps(keys = storyKeys()) {
  const comps = components();
  const out = {};
  const local = keys.filter((k) => !comps[k]?.fe);
  const fe = keys.filter((k) => !!comps[k]?.fe);
  for (const key of local) out[key] = { file: `components/src/ui/${key}.tsx`, source: "local", exports: {}, propNames: [] };
  if (local.length) {
    const parser = docgen.withCustomConfig(join(ROOT, "tsconfig.render.json"), {
      savePropValueAsString: true,
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !(prop.parent && /node_modules/.test(prop.parent.fileName)),
    });
    const docs = parser.parse(local.map((k) => join(UI, `${k}.tsx`)));
    for (const d of docs) {
      const key = d.filePath.replace(/.*\//, "").replace(/\.tsx$/, "");
      if (!out[key] || !/^[A-Z]/.test(d.displayName)) continue;
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
  }
  for (const key of fe) {
    const metaPath = join(FE_DIR, `${key}.json`);
    if (!existsSync(metaPath)) { out[key] = { file: null, source: "fe", exports: {}, propNames: [], error: `FE 스냅샷 없음 — pnpm fe:sync ${key}` }; continue; }
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const props = {};
    for (const [n, a] of Object.entries(meta.argTypes || {})) {
      if (FORBIDDEN.test(n)) continue;
      const e = { type: a.type || "", required: !!a.required };
      if (Array.isArray(a.options)) e.values = a.options.map(String);
      if (a.default != null) e.default = String(a.default);
      if (a.description) e.description = a.description;
      props[n] = e;
    }
    out[key] = { file: meta.fe.docs, source: "fe", feBuild: meta.feBuild, exports: { [pascal(key)]: { props } }, propNames: Object.keys(props).sort() };
  }
  for (const key of keys) if (out[key]) out[key].propNames.sort();
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
  let total = 0, feCount = 0;
  for (const [key, v] of Object.entries(all)) {
    writeFileSync(join(OUT, `${key}.json`), JSON.stringify({
      $note: "컴포넌트에 선언된 프롭만(HTML 속성·Radix 프롭 제외). source=local 은 원문 docgen, source=fe 는 FE 스토리북 argTypes. /render/<키>/<스토리>?args={…} 의 허용 키 = 이 propNames ∪ 스토리 args 키 ∪ children(문자열). className·style·on* 은 항상 거부.",
      component: key, source: v.source, file: v.file, generated, propNames: v.propNames, exports: v.exports, ...(v.error ? { error: v.error } : {}),
    }, null, 1));
    index[key] = { source: v.source, exports: Object.keys(v.exports), propNames: v.propNames };
    total += v.propNames.length;
    if (v.source === "fe") feCount++;
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify({
    $note: "컴포넌트별 프롭 목록(pnpm mcp:artifacts). 상세는 /props/<키>.json. ?args= 는 여기 있는 이름만 받는다.",
    generated, components: index,
  }));
  console.log(`[props] 컴포넌트 ${Object.keys(all).length}(FE ${feCount}) · 프롭 ${total} → playground/public/props/ (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
