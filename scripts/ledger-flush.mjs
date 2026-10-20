#!/usr/bin/env node
// 대기 장부 → Jira (2026-10-20 사용자 결정) — 관리자 저장소의 새 세션 시작 때 SessionStart 훅이 부른다.
// 새 관리자 세션 = 장부 묶음 1개 = Jira DES 티켓 1장. 클론(.ds-admin 없음)에서는 아무것도 하지 않는다.
//   1. fe-requests/pending-decisions.json 에서 status=pending 이고 아직 jira 도장이 없는 항목을 모은다
//   2. "[365 DS] N건 — FE 반영 요청" 티켓 1장으로 보낸다(담당 윤지윤) — 항목마다 무엇 · 우리 값 · 결정 당시 FE 값 · 적용 위치 · Storybook 대상
//   3. 발행에 성공했을 때만 각 항목에 jira: { key, date } 도장을 찍고 장부만 커밋·푸시한다
//      → 다음 세션·다른 클론은 도장을 보고 다시 보내지 않는다. 발행 실패면 도장 없음(다음 세션에 다시 시도)
//   장부 항목은 지우지 않는다 — FE 가 반영해야 shipped 로 닫는다(Storybook 대조는 그대로).
//   node scripts/ledger-flush.mjs           (훅이 부른다)
//   node scripts/ledger-flush.mjs --dry     (보내지 않고 무엇을 보낼지만 출력)

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER = "fe-requests/pending-decisions.json";
const ASSIGNEE = "712020:e12ad979-6c81-40f4-a13c-a14777757c6e"; // Jiyun Yun(윤지윤)
const DRY = process.argv.includes("--dry");
const say = (s) => console.log(`[365 DS 장부] ${s}`);

if (!existsSync(join(ROOT, ".ds-admin"))) process.exit(0); // 클론 — 발행은 관리자만

const git = (...a) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitLock() { for (let i = 0; i < 40 && existsSync(join(ROOT, ".git/index.lock")); i++) await sleep(500); }

// 같은 시각 다른 훅이 pull 중일 수 있다 — 잠금이 풀리면 한 번 더 받아 다른 곳에서 찍힌 도장을 본다
if (!DRY) { await waitLock(); git("pull", "--ff-only", "--quiet"); }

const ledger = JSON.parse(readFileSync(join(ROOT, LEDGER), "utf8"));
const items = ledger.items.filter((i) => i.status === "pending" && !i.jira);
if (!items.length) process.exit(0); // 새 항목 없음 — 조용히 끝

const fmt = (v) => typeof v === "string" ? v
  : Array.isArray(v) ? v.map(fmt).join(" / ")
  : v && typeof v === "object" ? Object.entries(v).map(([k, x]) => `${k}: ${fmt(x)}`).join(" · ")
  : String(v ?? "—");
const title = `[365 DS] ${items.length}건 — FE 반영 요청`;
const text = [
  "Storybook 보다 앞선 디자인 결정(대기 장부 fe-requests/pending-decisions.json). FE Storybook 반영 요청.",
  "반영되면 장부 항목은 shipped 로 닫힌다(Storybook 대조로 판정).",
  "",
  ...items.flatMap((i, n) => [
    `${n + 1}. ${i.what}  (장부 id: ${i.id})`,
    `   우리 값: ${fmt(i.value)}`,
    `   결정 당시 FE 값: ${fmt(i.feValueAtDecision)}`,
    `   Storybook 대상: ${i.storybookTarget || "—"}`,
    `   적용 위치: ${fmt(i.appliedIn || [])}`,
    `   결정: ${i.decided || "?"} · ${i.decidedBy || "?"}`,
    ...(i.chromaticComment?.url ? [`   Chromatic 댓글: ${i.chromaticComment.url}`] : []),
    "",
  ]),
].join("\n");

if (DRY) { say(`보낼 것 — ${title} (담당 윤지윤)`); console.log(text); process.exit(0); }

const r = spawnSync(process.execPath, ["--use-system-ca", join(ROOT, "scripts/ds-jira.mjs"), title, text, "--type", "수정", "--assignee", ASSIGNEE, "--no-prefix"], { cwd: ROOT, encoding: "utf8", timeout: 30000 });
const out = `${r.stdout || ""}${r.stderr || ""}`;
const key = (out.match(/티켓:\s*([A-Z]+-\d+)/) || [])[1];
if (r.status !== 0 || !key) {
  say(`⚠ ${items.length}건 Jira 발행 실패 — 도장 없이 둔다(다음 새 세션에 다시 시도). ${out.split("\n").find((l) => l.trim()) || ""}`.slice(0, 300));
  process.exit(0);
}

const date = new Date().toISOString().slice(0, 10);
for (const i of items) i.jira = { key, date };
writeFileSync(join(ROOT, LEDGER), JSON.stringify(ledger, null, 2) + "\n");
await waitLock();
git("add", LEDGER);
const c = git("commit", "-m", `chore(ledger): ${key} 발행 — ${items.map((i) => i.id).join(", ")} 도장`, "--", LEDGER);
const p = c.status === 0 ? git("push", "--quiet") : null;
say(`${items.length}건 → Jira ${key} 발행(담당 윤지윤) · 도장 ${c.status === 0 ? "커밋" : "커밋 실패"}${p ? (p.status === 0 ? "·푸시 ✓" : " · 푸시 실패 — git push 수동 실행") : ""}`);
