// MCP 산출물 — 문서 사본(public/docs) + contrast-pairs 사본. ds.css 와 story-html 은 package.json 의 mcp:artifacts 가 이어서 만든다.
// 배포 사이트가 이 정적 파일을 서빙하고, MCP 서버(mcp/)는 저장소 없이 여기서만 읽는다(2026-09-18). 산출물은 커밋하지 않는다.

import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DOCS = join(ROOT, "playground/public/docs");
rmSync(DOCS, { recursive: true, force: true });
mkdirSync(join(DOCS, "layout"), { recursive: true });
mkdirSync(join(DOCS, "regulations"), { recursive: true });
const copied = [];
for (const f of ["CLAUDE.md", "design.md"]) { copyFileSync(join(ROOT, f), join(DOCS, f)); copied.push(f); }
for (const dir of ["layout", "regulations"]) {
  for (const f of readdirSync(join(ROOT, dir)).filter((x) => x.endsWith(".md"))) { copyFileSync(join(ROOT, dir, f), join(DOCS, dir, f)); copied.push(`${dir}/${f}`); }
}
copyFileSync(join(ROOT, "dstk/contrast-pairs.json"), join(ROOT, "playground/public/dstk/contrast-pairs.json"));
writeFileSync(join(DOCS, "index.json"), JSON.stringify({ $note: "MCP 가 읽는 문서 사본(pnpm mcp:artifacts). 원본은 저장소 루트·layout/·regulations/.", files: copied }, null, 2));
console.log(`[docs] ${copied.length} 파일 → playground/public/docs/ · contrast-pairs.json → public/dstk/`);
