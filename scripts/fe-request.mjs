#!/usr/bin/env node
// FE 요청서 생성 — FE 스토리북에 없는 컴포넌트(= 아직 원천이 우리인 것)를 찾아 요청서를 만든다(2026-09-29).
// 컴포넌트의 원천은 FE 스토리북 하나다. 여기 없는 것은 "우리 것"이 아니라 "아직 FE 에 없는 것"이고, 전부 요청 대상이다.
// 우리 저장소의 구현(스토리·스니펫·프롭)은 그 요청의 사양서 역할을 한다 — FE 가 보고 그대로 만들면 된다.
//
//   pnpm fe:request              fe-requests/ 에 컴포넌트별 마크다운 + 목록 INDEX.md
//   pnpm fe:request --jira       추가로 Jira DES 티켓 발행(scripts/ds-jira.mjs · node --use-system-ca 필요)
//   pnpm fe:request timeline     지정 키만
//
// 자동 종료: 매시간 도는 fe:sync 가 FE 스토리북에서 그 컴포넌트를 발견하면 레지스트리에 fe 가 붙고,
// 다음 fe:request 실행에서 목록에서 빠진다(INDEX.md 의 "해결됨"에 기록).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "fe-requests");
const SITE = "https://designsystemin-md.vercel.app";
const argv = process.argv.slice(2);
const JIRA = argv.includes("--jira");
const only = argv.filter((a) => !a.startsWith("--"));

const registry = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
const storyIndexPath = join(ROOT, "playground/public/story-html/index.json");
const storyIndex = existsSync(storyIndexPath) ? JSON.parse(readFileSync(storyIndexPath, "utf8")) : { components: {} };
const propsDir = join(ROOT, "playground/public/props");

// 생성 화면에서 몇 면에 쓰이나 — 갤러리 라우트를 세면 실사용 근거가 된다
function usage(key) {
  const pascal = key.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
  const files = new Set();
  const walk = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.tsx$/.test(f.name)) { const s = readFileSync(p, "utf8"); if (new RegExp(`<${pascal}\\b`).test(s)) files.add(p.replace(ROOT + "/", "")); }
    }
  };
  try { walk(join(ROOT, "playground/app/gallery")); } catch {}
  return [...files].sort();
}

const targets = Object.entries(registry.components)
  .filter(([k, e]) => e.stories && !e.fe && !e.composition && (!only.length || only.includes(k)))
  .sort((a, b) => a[0].localeCompare(b[0]));
const resolved = Object.entries(registry.components).filter(([, e]) => e.stories && e.fe).map(([k]) => k);
const compositions = Object.entries(registry.components).filter(([, e]) => e.stories && !e.fe && e.composition).map(([k, e]) => `\`${k}\` — ${e.composition.replace(/^FE 판정 [\d-]+: /, "")}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const rows = [];
for (const [key, e] of targets) {
  const idx = storyIndex.components[key] ?? { stories: [] };
  const props = existsSync(join(propsDir, `${key}.json`)) ? JSON.parse(readFileSync(join(propsDir, `${key}.json`), "utf8")) : { propNames: [], exports: {} };
  const used = usage(key);
  const stories = idx.stories ?? [];
  const propLines = Object.entries(props.exports ?? {}).flatMap(([exp, v]) => Object.entries(v.props ?? {}).map(([n, p]) => `| \`${n}\` | ${p.type || "-"} | ${p.required ? "필수" : "선택"} | ${p.values ? p.values.map((x) => `\`${x}\``).join(" · ") : p.default != null ? `기본 \`${p.default}\`` : "-"} | ${(p.description || "").replace(/\n/g, " ").slice(0, 80)} |`));
  const md = [
    `# FE 요청 — ${e.name.ko} (${e.name.en})`,
    ``,
    `컴포넌트 키 \`${key}\` · 섹션 ${e.section ?? "-"} · 생성일 ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `## 무엇`,
    ``,
    `FE Storybook 에 \`${key}\` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).`,
    ``,
    `## 왜`,
    ``,
    used.length ? `현재 생성 화면 **${used.length}곳**에서 쓰고 있습니다.\n\n${used.map((u) => `- \`${u}\``).join("\n")}` : `아직 생성 화면에서 쓰지 않지만 DS 목록에 있어 언제든 쓰입니다.`,
    ``,
    e.note ? `## 설계 노트 (우리 기록)\n\n${e.note.split("\n").filter(Boolean).map((l) => `- ${l}`).join("\n")}\n` : ``,
    `## 사양 — 우리 구현이 사양서입니다`,
    ``,
    `| 무엇 | 주소 |`,
    `|---|---|`,
    `| 컴포넌트 원문 | ${SITE}/ui-src/${key}.tsx.txt |`,
    `| 스토리 원문 | ${SITE}/ui-src/${key}.stories.tsx.txt |`,
    `| 프롭 목록 | ${SITE}/props/${key}.json |`,
    `| Storybook | ${SITE}/storybook/?path=/docs/ds-${key.replace(/-/g, "")}--docs |`,
    ``,
    `### 스토리 ${stories.length}편 — 이만큼이 필요한 상태입니다`,
    ``,
    stories.length ? stories.map((s) => `- **${s.name}**${s.description ? ` — ${s.description.split("\n")[0].slice(0, 120)}` : ""}\n  렌더 HTML: ${SITE}/story-html/${s.file}`).join("\n") : "- (스토리 없음)",
    ``,
    propLines.length ? `### 프롭\n\n| 이름 | 타입 | 필수 | 값·기본 | 설명 |\n|---|---|---|---|---|\n${propLines.join("\n")}\n` : ``,
    `## 확인 방법`,
    ``,
    `만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,`,
    `우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).`,
    `색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: ${SITE}/dstk/semantic-map.json · ${SITE}/dstk/typography.json`,
    ``,
  ].filter((x) => x !== ``).join("\n");
  writeFileSync(join(OUT, `${key}.md`), md.replace(/\n{3,}/g, "\n\n") + "\n");
  rows.push({ key, ko: e.name.ko, en: e.name.en, stories: stories.length, used: used.length });
}

const index = [
  `# FE Storybook 요청 목록`,
  ``,
  `컴포넌트의 원천은 FE Storybook 하나입니다(2026-09-29 확정). 여기 있는 것은 **아직 FE 에 없어서 우리 저장소가 임시로 들고 있는 것**이고,`,
  `FE 가 만들면 원천이 FE 로 넘어갑니다. 자동 생성: \`pnpm fe:request\` — FE 에 생긴 항목은 다음 실행에서 이 목록에서 빠집니다.`,
  ``,
  `생성일 ${new Date().toISOString().slice(0, 10)} · 요청 ${rows.length}건 · 이관 완료 ${resolved.length}건`,
  ``,
  `| 컴포넌트 | 이름 | 스토리 | 쓰이는 화면 | 요청서 |`,
  `|---|---|---|---|---|`,
  ...rows.sort((a, b) => b.used - a.used).map((r) => `| \`${r.key}\` | ${r.ko} · ${r.en} | ${r.stories}편 | ${r.used}곳 | [${r.key}.md](./${r.key}.md) |`),
  ``,
  `## 이관 완료 ${resolved.length}건`,
  ``,
  resolved.map((k) => `\`${k}\``).join(" · "),
  ``,
  `## FE 판정: 공통 컴포넌트 아님 ${compositions.length}건 — 요청하지 않는다(우리 조합·레시피로 유지)`,
  ``,
  ...compositions.map((c) => `- ${c}`),
  ``,
].join("\n");
writeFileSync(join(OUT, "INDEX.md"), index);
console.log(`[fe:request] 요청 ${rows.length}건 · 이관 완료 ${resolved.length}건 → fe-requests/`);
for (const r of rows) console.log(`  ${r.key.padEnd(22)} 스토리 ${String(r.stories).padStart(2)}편 · 화면 ${String(r.used).padStart(2)}곳`);

if (JIRA) {
  const script = join(ROOT, "scripts/ds-jira.mjs");
  if (!existsSync(script)) { console.error("[fe:request] scripts/ds-jira.mjs 가 없다"); process.exit(1); }
  for (const r of rows) {
    const body = readFileSync(join(OUT, `${r.key}.md`), "utf8");
    try {
      const out = execFileSync("node", ["--use-system-ca", script, `[FE 요청] ${r.ko}(${r.key}) — Storybook 에 추가`, body, "--type", "추가"], { cwd: ROOT, encoding: "utf8" });
      console.log(`  발행 ${r.key}: ${out.trim().split("\n").pop()}`);
    } catch (e) { console.error(`  발행 실패 ${r.key}: ${String(e.message || e).slice(0, 160)}`); }
  }
}
