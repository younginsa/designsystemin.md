#!/usr/bin/env node
// 저장소 감사 — 문서에 문장으로만 있던 규칙을 기계 판정으로 바꾼다.
//
//   pnpm audit:rules           갤러리 전면 + 컴포넌트 전수
//   pnpm audit:rules --a       A 등급(막는 것)만
//
// 배경(2026-09-18): 하루에 드리프트 세 건이 나왔고, 원인이 전부 같았다 —
// "검사가 붙은 규칙은 안 깨졌고, 문장으로만 있는 규칙은 전부 흘렀다."
// 규칙은 셋 중 하나에 속해야 한다. 어디에도 못 넣으면 규칙이 아니라 희망사항이다.
//
//   A 막는다     위반이면 실패. 손으로 고칠 여지가 없는 것.
//   B 보고한다   목록으로 뽑아 사람이 정리한다. 프리셋 미사용 같은 것.
//   C 사람 판단  기계가 못 정한다. 보고서에 이유를 남기는 것으로 대신한다.
//
// 이 스크립트는 저장소를 본다. 배포면 대조는 audit-published.mjs 가 맡는다 — 합치지 않는다.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const onlyA = process.argv.includes("--a");
const findings = [];
const add = (grade, rule, file, line, detail) => findings.push({ grade, rule, file, line, detail });

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}
const rel = (p) => relative(ROOT, p);
function lines(p) { return readFileSync(p, "utf8").split("\n"); }
/** 파일에서 정규식에 맞는 줄을 찾는다(주석 줄 제외) */
function hits(p, re) {
  const out = [];
  lines(p).forEach((ln, i) => {
    const t = ln.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    if (re.test(ln)) out.push({ line: i + 1, text: ln.trim().slice(0, 100) });
  });
  return out;
}

const GALLERY = join(ROOT, "playground/app/gallery");
const UI = join(ROOT, "components/src/ui");
const pages = walk(GALLERY).filter((p) => /page\.tsx$/.test(p));
const uiFiles = walk(UI).filter((p) => !/\.stories\.tsx$/.test(p));
const storyFiles = walk(UI).filter((p) => /\.stories\.tsx$/.test(p));

console.log(`[audit:rules] 갤러리 ${pages.length}면 · 컴포넌트 ${uiFiles.length} · 스토리 ${storyFiles.length}`);

/* ── A 등급 — 막는다 ───────────────────────────────────────────── */

// A1. 임의 색값·임의 값 (design.md §1)
// 라이브러리 기본값을 덮어쓰는 속성 선택자([&_.recharts-…[stroke='#ccc']]:stroke-border) 안의 hex 는
// 우리가 정한 색이 아니라 '무엇을 덮어쓸지'를 가리키는 주소다 — 그 부분을 떼고 본다.
const stripSelectorHex = (t) => t.replace(/\[[^\]]*=['"]#[0-9a-fA-F]{3,8}['"]\]/g, "[]");
for (const p of [...pages, ...uiFiles]) {
  for (const h of hits(p, /#[0-9a-fA-F]{3,8}\b/)) {
    const t = stripSelectorHex(h.text);
    if (!/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/.test(t)) continue;
    if (/https?:\/\//.test(t)) continue;
    add("A", "임의 색값", rel(p), h.line, h.text);
  }
  // 컴포넌트는 내부 변형([&_svg]:… data-[state=open]:…)이 정상이라 페이지만 본다
  if (pages.includes(p)) for (const h of hits(p, /className="[^"]*\b(w|h|p|m|gap|text|rounded|top|left|size)-\[[^\]]+\]/)) add("A", "임의 값", rel(p), h.line, h.text);
}

// A2. 은퇴 컴포넌트 사용
for (const p of [...pages, ...uiFiles, ...storyFiles]) {
  if (/toggle-group\.stories/.test(p)) continue;
  for (const h of hits(p, /from ["'][^"']*ui\/toggle-group["']/)) add("A", "은퇴 컴포넌트", rel(p), h.line, h.text);
}

// A3. 플로팅 UI 직접 구현 (CLAUDE.md 금지)
for (const p of pages) {
  for (const h of hits(p, /className="[^"]*\babsolute\b[^"]*\bz-\d/)) {
    if (!/(menu|dropdown|popover|panel|suggest)/i.test(h.text)) continue;
    add("A", "플로팅 직접 구현", rel(p), h.line, h.text);
  }
}

/* ── B 등급 — 보고한다 ─────────────────────────────────────────── */

// B1. 타이틀 행 손 조합 (PageHeader 프리셋, 2026-09-16)
for (const p of pages) {
  for (const h of hits(p, /<h1\s+className="[^"]*text-lg font-bold/)) add("B", "타이틀 행 손 조합", rel(p), h.line, "PageHeader 프리셋으로 교체");
}

// B2. 목록 푸터 손 조합 (ListFooter 프리셋, 2026-09-10)
for (const p of pages) {
  const src = readFileSync(p, "utf8");
  const hasParts = /ui\/rows-per-page/.test(src) && /ui\/pagination/.test(src);
  if (hasParts && !/ui\/list-footer/.test(src)) add("B", "목록 푸터 손 조합", rel(p), 0, "RowsPerPage + Pagination 직접 나열 — ListFooter 로");
}

// B3. 패널 손 조합 (Card variant=flat, 2026-09-15)
for (const p of pages) {
  for (const h of hits(p, /className="[^"]*rounded-lg border[^"]*bg-card/)) add("B", "패널 손 조합", rel(p), h.line, 'Card variant="flat" 로');
}

// B4. 인라인 빈 상태 손 점선 (Empty size=sm)
// 점선 테두리 자체는 빈 상태 전용이 아니다 — 추가 버튼(size-6 rounded-full border-dashed)도 쓴다.
// 빈 상태는 '박스'라 안쪽 여백(p-*)이 있다. 그 조건을 같이 본다.
for (const p of pages) {
  for (const h of hits(p, /className="[^"]*border-dashed/)) {
    if (/data-ds="fallback"/.test(h.text)) continue; // DS 밖 마커는 점선이 정상
    if (!/\bp-\d|\bpy-\d|\bpx-\d/.test(h.text)) continue; // 여백 없는 점선 = 버튼·칩
    if (/rounded-full/.test(h.text)) continue;
    add("B", "빈 상태 손 점선", rel(p), h.line, "Empty 컴포넌트로");
  }
}

// B5. 상태 세트 — 진행률 없는 화면에 프로그레스 (2026-09-18 확정)
const PROGRESS_OK = /(update|diagnostic|delivery|upload|install|batch|업데이트|진단)/i;
for (const p of pages) {
  const src = readFileSync(p, "utf8");
  if (!/"progress"/.test(src)) continue;
  if (PROGRESS_OK.test(rel(p))) continue;
  add("C", "프로그레스 판단", rel(p), 0, "진행률이 실재하는 화면인지 확인 — 아니면 4상태로");
}

// B6. 스토리 커버리지 — 조건부 렌더가 있는데 그 상태 스토리가 없나
for (const f of uiFiles) {
  const key = f.replace(/.*\//, "").replace(/\.tsx$/, "");
  const storyPath = join(UI, key + ".stories.tsx");
  const src = readFileSync(f, "utf8");
  // {값 && <…>} 형태의 조건부 렌더 — 스니펫(한 상태의 사진)에 안 찍히는 UI
  const conds = [...src.matchAll(/\{(\w+)\s*&&\s*[(<]/g)].map((m) => m[1]);
  const uniq = [...new Set(conds)].filter((c) => !/^(children|asChild|className|props)$/.test(c));
  if (!uniq.length) continue;
  if (!existsSync(storyPath)) { add("B", "스토리 없음", rel(f), 0, `조건부 렌더 ${uniq.length}종(${uniq.slice(0, 4).join(", ")}) — 스토리가 아예 없다`); continue; }
  const story = readFileSync(storyPath, "utf8");
  const uncovered = uniq.filter((c) => !new RegExp("\\b" + c + "\\b").test(story));
  if (uncovered.length) add("B", "조건부 상태 스토리 없음", rel(f), 0, `${uncovered.slice(0, 5).join(", ")} — 값이 있을 때만 나오는 UI 라 스니펫에 안 찍힌다`);
}

/* ── C 등급 — 사람 판단(기록만) ───────────────────────────────── */

// C1. 문서 규칙이 최근에 바뀌었는데 갤러리가 안 따라온 경우를 날짜로 본다
try {
  const docDate = execSync("git log -1 --format=%cs -- design.md layout/body-patterns.md", { cwd: ROOT }).toString().trim();
  const galDate = execSync("git log -1 --format=%cs -- playground/app/gallery", { cwd: ROOT }).toString().trim();
  if (docDate && galDate && docDate > galDate) add("C", "문서가 더 최신", "-", 0, `규칙 ${docDate} · 갤러리 ${galDate} — 소급 적용 대상이 있는지 확인`);
} catch { /* git 없음 */ }

/* ── 보고 ─────────────────────────────────────────────────────── */
const shown = onlyA ? findings.filter((f) => f.grade === "A") : findings;
const byGrade = { A: [], B: [], C: [] };
for (const f of shown) byGrade[f.grade].push(f);
const LABEL = { A: "A 막는다", B: "B 보고한다", C: "C 사람 판단" };
for (const g of ["A", "B", "C"]) {
  const list = byGrade[g];
  console.log(`\n[${LABEL[g]}] ${list.length}건`);
  const byRule = {};
  for (const f of list) (byRule[f.rule] ||= []).push(f);
  for (const [rule, items] of Object.entries(byRule)) {
    console.log(`  ${rule} — ${items.length}건`);
    for (const f of items.slice(0, 12)) console.log(`    ${f.file}${f.line ? ":" + f.line : ""}  ${f.detail}`);
    if (items.length > 12) console.log(`    … 외 ${items.length - 12}건`);
  }
}
console.log(`\n[audit:rules] A ${byGrade.A.length} · B ${byGrade.B.length} · C ${byGrade.C.length}`);
process.exit(byGrade.A.length ? 1 : 0);
