// 스토리 → 정적 HTML 스니펫(MCP 산출물, 2026-09-18). 스토리가 있는 컴포넌트 전부를 react-dom/server 로 렌더해
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

type Registry = { components: Record<string, { name: { ko: string; en: string }; stories: string | null; file: string | null; note: string | null }> };
const registry: Registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** 스토리 export **바로 위** 줄에 붙은 JSDoc 만 설명으로 수집.
 *  종전 정규식은 주석과 export 가 멀면 그 사이를 통째로 삼켰다 —
 *  filter-bar/Presets 설명이 9,118자(스토리 소스 전체)로 나온 원인(2026-09-18 교정). */
function docComments(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^export const (\w+)\s*=/);
    if (!m) continue;
    // 바로 위 줄부터 거슬러 올라가며 JSDoc 블록 하나만 모은다(빈 줄·다른 코드를 만나면 중단)
    const buf: string[] = [];
    let j = i - 1;
    if (j < 0 || !/\*\//.test(lines[j])) continue;
    for (; j >= 0; j--) {
      buf.unshift(lines[j]);
      if (/^\s*\/\*\*/.test(lines[j])) break;
      if (j < i - 40) { buf.length = 0; break; } // 40줄 넘으면 JSDoc 이 아니다
    }
    if (!buf.length) continue;
    const text = buf.join("\n").replace(/^\s*\/\*\*/, "").replace(/\*\/\s*$/, "").replace(/^\s*\*\s?/gm, "").trim();
    if (text) out[m[1]] = text;
  }
  return out;
}

const PORTAL_HINT = /(dialog|sheet|popover|dropdown-menu|tooltip|command|sonner|alert-dialog|detail-panel|notification-panel|select|icon-select|search-box|filter-bar|version-filter-chip)/;

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const index: Record<string, { name: { ko: string; en: string }; stories: { name: string; file: string; description: string; portal: boolean; error?: string }[] }> = {};
  let ok = 0, failed = 0;
  // 스토리가 있으면 DS — 사람이 켜는 채택 단계는 없다(2026-09-18)
  const keys = Object.keys(registry.components).filter((k) => registry.components[k].stories).sort();
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
