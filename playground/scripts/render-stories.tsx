// 스토리 → 정적 HTML 스니펫(MCP 산출물, 2026-09-18). 스토리가 있는 컴포넌트 전부를 react-dom/server 로 렌더해
// public/story-html/<key>/<Story>.html 로 쓰고, index.json 에 목록(설명 = 스토리 위 JSDoc)을 남긴다.
// claude.ai 생성이 이 스니펫을 조립한다 — 오버레이(Dialog·Sheet·Popover 등)는 포털이라 트리거만 렌더된다(index 에 표시).
// 실행: pnpm mcp:artifacts (빌드 전 단계). 산출물은 커밋하지 않는다(.gitignore) — 배포 사이트가 최신을 서빙한다.

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

/** 스니펫 HTML 안의 data-slot 집합 + 값이 채워진 입력이 있는지 — "이 사진에 무엇이 찍혀 있나"(2026-09-21 Phase 0).
 *  어제 사고: 필터바 사진만 보고 검색창 사진(Typing)은 안 봤다. 사진 안에 뭐가 있는지 목차에 있으면 부품 단위로 찾아간다. */
function slotsOf(html: string): { slots: string[]; filled: boolean } {
  const slots = [...new Set([...html.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]))].sort();
  const filled = [...html.matchAll(/<input\b[^>]*\bvalue="([^"]*)"/g)].some((m) => m[1] !== "");
  return { slots, filled };
}

/** 컴포넌트 원문에서 조건부 렌더 블록(`{값 && (` · `{값 ? (`) 안에 무엇이 그려지는지 뽑는다.
 *  사진(한 상태의 SSR)에 안 찍힐 수 있는 UI 의 목록 — 값이 있을 때만 나오는 ✕ 같은 것.
 *  원문에는 data-slot 이 직접 안 적히고 <InputGroupAddon> 같은 태그로 나오므로 세 가지를 같이 기록한다:
 *  data-slot(있으면) · aria-label(렌더 HTML 에 그대로 남는다) · JSX 태그 이름. 검사는 aria-label·slot 으로 대조한다. */
type Conditional = { when: string; slots: string[]; labels: string[]; tags: string[] };
function conditionalOf(src: string): Conditional[] {
  const out: Conditional[] = [];
  const re = /\{\s*([A-Za-z_][\w.]*(?:\s*(?:&&|\|\|)\s*[A-Za-z_!][\w.]*)*)\s*(?:&&|\?)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    // 블록 끝 = 여는 괄호에 맞는 닫는 괄호(대략) — 900자 상한
    const block = src.slice(m.index, m.index + 900);
    const slots = [...new Set([...block.matchAll(/data-slot="([^"]+)"/g)].map((x) => x[1]))];
    const labels = [...new Set([...block.matchAll(/aria-label="([^"]+)"/g)].map((x) => x[1]))];
    const tags = [...new Set([...block.matchAll(/<([A-Z][A-Za-z]+)/g)].map((x) => x[1]))].slice(0, 6);
    if (slots.length || labels.length || tags.length) out.push({ when: m[1].replace(/\s+/g, " "), slots, labels, tags });
  }
  return out.slice(0, 12);
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const index: Record<string, {
    name: { ko: string; en: string };
    stories: { name: string; file: string; description: string; portal: boolean; slots?: string[]; filled?: boolean; error?: string }[];
    conditional?: Conditional[];
  }> = {};
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
    const compFile = join(UI, `${key}.tsx`);
    const conditional = existsSync(compFile) ? conditionalOf(readFileSync(compFile, "utf8")) : [];
    const entry: (typeof index)[string] = { name: registry.components[key].name, stories: [], ...(conditional.length ? { conditional } : {}) };
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
        const { slots, filled } = slotsOf(html);
        entry.stories.push({ name, file: out, description: docs[name] ?? "", portal: PORTAL_HINT.test(key), slots, filled });
        ok++;
      } catch (e: any) {
        entry.stories.push({ name, file: out, description: docs[name] ?? "", portal: PORTAL_HINT.test(key), error: String(e?.message ?? e).slice(0, 200) });
        failed++;
      }
    }
    index[key] = entry;
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify({
    $note: "스토리 → 정적 HTML 스니펫(pnpm mcp:artifacts). 각 스니펫은 한 상태의 사진이다 — slots = 그 안에 찍힌 data-slot, filled = 값 채워진 입력이 있나. conditional = 원문에서 값이 있을 때만 나오는 슬롯(사진에 없을 수 있다 — 그 상태의 스토리를 고르거나 원문을 본다). portal=true 는 열린 오버레이가 SSR 에 안 나온다. 클래스는 /ds.css.",
    generated: new Date().toISOString().slice(0, 10),
    components: index,
  })); // 압축 출력 — 소비자는 기계(claude.ai 가 URL 로 읽는다). 들여쓰기만으로 58KB → 31KB(2026-09-21).
  console.log(`[story-html] 컴포넌트 ${keys.length} · 스니펫 ${ok} · 실패 ${failed} → playground/public/story-html/`);
  if (failed) for (const [k, e] of Object.entries(index)) for (const s of e.stories) if (s.error) console.log(`  실패: ${k}/${s.name} — ${s.error}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
