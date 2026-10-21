#!/usr/bin/env node
// 로컬 디자인 수정 → Jira (2026-10-19 사용자 결정) — 맥 세션 시작 때 SessionStart 훅이 부른다.
// 디자이너가 프로토타입을 다듬으며 만든 디자인 수정은 playground/public/local-design.css 한 파일에만 둔다(커밋 안 함 — .gitignore).
// 세션 동안은 localhost:3000 의 모든 페이지에 적용되고, 새 세션이 시작되면 이 스크립트가:
//   1. 파일에 수정이 있으면 Jira DES 티켓 1장으로 보낸다(세션 1장 — 모든 수정과 CSS 를 본문에)
//   2. 발행에 성공했을 때만 파일을 비운다 → 화면은 Storybook 스타일로 돌아온다(페이지 자체는 그대로)
//   발행에 실패하면(환경변수 없음·네트워크) 비우지 않고 그대로 둔다 — 수정이 Jira 에 없는 채로 사라지는 일은 없다.
// 수정 하나 = 주석 머리 + CSS 규칙:  /* 디자인 수정: 무엇 · 왜 · 어느 페이지 */  [data-slot="radio-group-item"] { … }
//   node scripts/local-design-flush.mjs           (훅이 부른다)
//   node scripts/local-design-flush.mjs --dry     (보내지 않고 무엇을 보낼지만 출력)

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "playground/public/local-design.css");
const DRY = process.argv.includes("--dry");
const say = (s) => console.log(`[디자인 수정] ${s}`);
const TEMPLATE = `/* 로컬 디자인 수정 — 이 세션 동안만 localhost:3000 에 적용된다. 커밋하지 않는다(.gitignore).
   새 세션이 시작되면 아래 수정이 Jira DES 티켓 1장으로 발행되고 이 파일은 비워진다(scripts/local-design-flush.mjs).
   수정 하나 = 주석 머리 + 규칙:
   /* 디자인 수정: 무엇 · 왜 · 어느 페이지 *\\/
   [data-slot="radio-group-item"] { border-color: var(--foreground); }
*/
`;

if (!existsSync(FILE)) { writeFileSync(FILE, TEMPLATE); process.exit(0); }
const css = readFileSync(FILE, "utf8");
const body = css.replace(TEMPLATE, "").trim();
const rules = body.replace(/\/\*[\s\S]*?\*\//g, "").trim();
if (!rules) process.exit(0); // 수정 없음 — 조용히 끝

const heads = [...body.matchAll(/\/\*\s*디자인 수정:\s*([\s\S]*?)\*\//g)].map((m) => m[1].trim());
const n = Math.max(heads.length, (rules.match(/\{/g) || []).length);

// 이 맥의 관리자 저장소가 모으는 클론이면(2026-10-21) — Jira 로 보내지도 비우지도 않는다. 관리자 새 세션이 대기 장부로 가져간다.
const COLLECTED = join(ROOT, ".ds-collected-by");
if (existsSync(COLLECTED)) {
  const admin = readFileSync(COLLECTED, "utf8").trim();
  if (admin && existsSync(join(admin, ".ds-admin"))) { say(`${n}건 — 관리자 저장소(${admin})가 대기 장부로 가져갑니다. 파일은 그대로 둔다(미리보기 유지).`); process.exit(0); }
}
const date = new Date().toISOString().slice(0, 10);
const title = `[디자인 수정] ${date} 세션 — ${n}건`;
const text = [
  "프로토타입을 다듬으며 만든 로컬 디자인 수정(Storybook 대비). 세션이 끝나 로컬에서는 지워졌다 — FE 반영 여부 검토 요청.",
  "",
  ...(heads.length ? ["수정 목록:", ...heads.map((h, i) => `${i + 1}. ${h}`), ""] : []),
  "CSS 원문:",
  body,
].join("\n");

if (DRY) { say(`보낼 것 — ${title}`); console.log(text); process.exit(0); }

const r = spawnSync(process.execPath, ["--use-system-ca", join(ROOT, "scripts/ds-jira.mjs"), title, text, "--type", "수정"], { cwd: ROOT, encoding: "utf8", timeout: 30000 });
const out = `${r.stdout || ""}${r.stderr || ""}`;
const key = (out.match(/\b[A-Z]+-\d+\b/) || [])[0];
if (r.status === 0 && key) {
  writeFileSync(FILE, TEMPLATE);
  say(`${n}건 → Jira ${key} 발행 · 파일 비움 — 화면은 Storybook 스타일로 돌아왔다`);
} else {
  say(`⚠ ${n}건 Jira 발행 실패 — 파일을 비우지 않고 그대로 둔다. ${out.split("\n").find((l) => l.trim()) || ""}`.slice(0, 300));
}
