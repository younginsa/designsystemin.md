// 스토리 → 정적 HTML 스니펫(MCP 산출물, 2026-09-18). 채택된 컴포넌트의 모든 스토리를 react-dom/server 로 렌더해
// public/story-html/<key>/<Story>.html 로 쓰고, index.json 에 목록(설명 = 스토리 위 JSDoc)을 남긴다.
// claude.ai 생성이 이 스니펫을 조립한다 — 오버레이(Dialog·Sheet·Popover 등)는 포털이라 트리거만 렌더된다(index 에 표시).
// 실행: pnpm mcp:artifacts (빌드 전 단계). 산출물은 커밋하지 않는다(.gitignore) — 배포 사이트가 최신을 서빙한다.

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const UI = join(ROOT, "components/src/ui");
const OUT = join(ROOT, "playground/public/story-html");

type Registry = { components: Record<string, { status: string; name: { ko: string; en: string }; stories: string | null; file: string | null; note: string | null }> };
const registry: Registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** 스토리 export 위 JSDoc(/** … *\/)을 설명으로 수집 */
function docComments(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /\/\*\*\s*([\s\S]*?)\*\/\s*export const (\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out[m[2]] = m[1].replace(/^\s*\*\s?/gm, "").trim();
  return out;
}

const PORTAL_HINT = /(dialog|sheet|popover|dropdown-menu|tooltip|command|sonner|alert-dialog|detail-panel|notification-panel|select|icon-select|search-box|filter-bar|version-filter-chip)/;

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const index: Record<string, { name: { ko: string; en: string }; stories: { name: string; file: string; description: string; portal: boolean; error?: string }[] }> = {};
  let ok = 0, failed = 0;
  const keys = Object.keys(registry.components).filter((k) => registry.components[k].status === "adopted" && registry.components[k].stories).sort();
  for (const key of keys) {
    const file = join(UI, `${key}.stories.tsx`);
    const src = readFileSync(file, "utf8");
    const docs = docComments(src);
    const mod: any = await import(pathToFileURL(file).href);
    const order: string[] = mod.__namedExportsOrder ?? Object.keys(mod).filter((k) => k !== "default");
    const Comp = mod.default?.component;
    const entry = { name: registry.components[key].name, stories: [] as any[] };
    mkdirSync(join(OUT, key), { recursive: true });
    for (const name of order) {
      if (name === "default" || name === "__namedExportsOrder") continue;
      const story = mod[name];
      if (!story || typeof story !== "object") continue;
      const out = `${key}/${kebab(name)}.html`;
      try {
        const el = story.render ? story.render(story.args ?? {}) : Comp ? React.createElement(Comp, story.args ?? {}) : null;
        if (!el) throw new Error("render 도 component 도 없음");
        const html = renderToStaticMarkup(el);
        writeFileSync(join(OUT, out), html + "\n");
        entry.stories.push({ name, file: out, description: docs[name] ?? "", portal: PORTAL_HINT.test(key) });
        ok++;
      } catch (e: any) {
        entry.stories.push({ name, file: out, description: docs[name] ?? "", portal: PORTAL_HINT.test(key), error: String(e?.message ?? e).slice(0, 200) });
        failed++;
      }
    }
    index[key] = entry;
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify({
    $note: "스토리 → 정적 HTML 스니펫(pnpm mcp:artifacts). portal=true 인 컴포넌트는 열린 오버레이가 SSR 에 안 나온다 — 스토리 원문(ui-src) 참고. 클래스는 /ds.css 로 스타일링.",
    generated: new Date().toISOString().slice(0, 10),
    components: index,
  }, null, 2));
  console.log(`[story-html] 컴포넌트 ${keys.length} · 스니펫 ${ok} · 실패 ${failed} → playground/public/story-html/`);
  if (failed) for (const [k, e] of Object.entries(index)) for (const s of e.stories) if (s.error) console.log(`  실패: ${k}/${s.name} — ${s.error}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
