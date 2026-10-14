#!/usr/bin/env node
// FE 스토리북 상태 줄(2026-10-08) — 세션 시작 훅이 git pull 뒤에 부른다. **보고 전용**: 아무것도 고치거나 동기화하지 않는다.
// "[365 DS] 이미 최신 상태 ✓" 는 git 만 본다 — FE 가 새 빌드를 냈는데 Actions(fe-sync.yml)가 실패하면 스냅샷이 뒤처져도 초록이었다(10/8 3시간).
// 그래서 세 가지를 한 줄로 알린다:
//   ① 스냅샷 도장(playground/fe-stories/index.json feBuild) vs FE 배포 도장(iframe.html 의 iframe-<도장>.css) — 같으면 최신
//   ② index.json missing — FE 목차에 없어 이전 스냅샷을 둔 키(스토리 개명 → ds-registry.json fe.id 수정 필요)
//   ③ 마지막 Actions 실행 결과(gh 가 있고 로그인돼 있을 때만)
// 네트워크·gh 가 안 되면 그 칸만 "확인 불가"로 두고 끝낸다. 실패해도 exit 0(세션 시작을 막지 않는다).
//   node scripts/fe-status.mjs

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN = existsSync(join(ROOT, ".ds-admin"));
const say = (s) => console.log(`[FE 스토리북] ${s}`);
const read = (p) => { try { return JSON.parse(readFileSync(join(ROOT, p), "utf8")); } catch { return null; } };

const snap = read("playground/fe-stories/index.json");
const reg = read("playground/public/ds-registry.json");
const base = (reg?.$storybook?.fe?.base || "").replace(/\/$/, "");
if (!snap || !base) { say("스냅샷 또는 FE 주소 없음 — 확인 생략"); process.exit(0); }
const mine = snap.feBuild || "(없음)";
const missing = Array.isArray(snap.missing) ? snap.missing : (snap.components || []).filter((c) => c.missing).map((c) => c["key"]);

// ① FE 배포 도장 — 워크플로우와 같은 방식(iframe.html 의 CSS 파일 이름)
let fe = null;
try {
  const r = await fetch(base + "/iframe.html", { signal: AbortSignal.timeout(5000) });
  const css = ((await r.text()).match(/href="([^"]+\.css)"/) || [])[1] || "";
  fe = css ? css.replace(/.*iframe-/, "").replace(/\.css$/, "") : null;
} catch {}

// ③ 마지막 Actions 실행 — gh 가 없거나 로그인 안 됐으면 건너뛴다
let run = null;
try {
  const remote = spawnSync("git", ["remote", "get-url", "origin"], { cwd: ROOT, encoding: "utf8", timeout: 3000 }).stdout.trim();
  const repo = (remote.match(/github\.com[:/](.+?)(\.git)?$/) || [])[1];
  if (repo) {
    const g = spawnSync("gh", ["run", "list", "--repo", repo, "--workflow", "fe-sync.yml", "--limit", "1", "--json", "conclusion,status,createdAt,url"], { encoding: "utf8", timeout: 8000 });
    if (g.status === 0) run = JSON.parse(g.stdout)[0] ?? null;
  }
} catch {}

const when = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const runText = run ? (run.status !== "completed" ? `Actions 실행 중(${when(run.createdAt)})` : run.conclusion === "success" ? `Actions 마지막 성공(${when(run.createdAt)})` : `Actions 마지막 실행 실패(${when(run.createdAt)}) ${run.url}`) : null;
const failed = run && run.status === "completed" && run.conclusion !== "success";

const parts = [];
if (!fe) parts.push(`FE 확인 불가(네트워크) — 스냅샷 ${mine} · ${snap.synced}`);
else if (fe === mine) parts.push(`최신 ✓ (빌드 ${mine} · ${snap.synced} 동기화)`);
else parts.push(`⚠ FE 새 빌드 ${fe} — 스냅샷은 ${mine}(${snap.synced})`);
if (missing.length) parts.push(`⚠ 스토리 없음 ${missing.length}: ${missing.join(", ")} — 이전 스냅샷 유지 중, ds-registry.json fe.id 개명 확인`);
if (runText && (failed || (fe && fe !== mine))) parts.push(runText);
say(parts.join(" · "));

// ④ 대조 분류 요약(fe-requests/sync-report.json — fe:classify 가 FE 빌드마다 씀, H2 2026-10-14)
const rep = read("fe-requests/sync-report.json");
if (rep) {
  const todo = (rep.items || []).filter((i) => i.todo);
  const wait = [...new Set((rep.items || []).filter((i) => i.verdict === "local-ahead").map((i) => i.ledger || i.name))];
  say(todo.length
    ? `⚠ 대조 할 일 ${todo.length} (빌드 ${rep.feBuild}): ${todo.map((i) => `${i.name}${i.mode && i.mode !== "all" ? "[" + i.mode + "]" : ""} ${i.verdict}`).join(", ")} — fe-requests/sync-report.md`
    : `대조 ✓ 할 일 없음 (빌드 ${rep.feBuild})${wait.length ? ` · FE 반영 대기 ${wait.length}: ${wait.join(", ")}` : ""}`);
}

// ⑤ 피그마 주간 대조 요약(fe-requests/figma-plan.json — figma:classify 가 씀, H3 2026-10-14). 관리자 세션에서만 — 클론은 피그마를 다루지 않는다
const fplan = ADMIN ? read("fe-requests/figma-plan.json") : null;
if (fplan) {
  const age = Math.floor((Date.now() - new Date(fplan.read).getTime()) / 864e5);
  const fsay = (t) => console.log(`[피그마] ${t}`);
  fsay(`${fplan.todo ? `⚠ 할 일 ${fplan.todo}` : "할 일 없음 ✓"} · 마지막 대조 ${fplan.read}(${age}일 전, FE 빌드 ${fplan.feBuild}${snap.feBuild && fplan.feBuild !== snap.feBuild ? ` — 지금 FE 는 ${snap.feBuild}, 다시 대조 필요` : ""})${fplan.todo ? " — fe-requests/figma-report.md" : ""}`);
}

// 해야 할 일 한 줄 — 관리자/클론을 나눈다(클론은 pull 전용 — CLAUDE.md 6·7)
const behind = fe && fe !== mine;
if (behind || missing.length || failed) {
  if (ADMIN) say(failed ? "→ 관리자: Actions 로그 확인(gh run view --log-failed) 후 수정 — 수동 동기화는 pnpm fe:sync → fe:parity" : behind ? "→ 자동 동기화(매시 7분) 대기 중 — 급하면 Actions 에서 Run workflow" : "→ 관리자: FE index.json 에서 새 id 를 찾아 ds-registry.json fe.id 수정");
  else say("→ 클론은 그대로 진행 — 스냅샷은 관리자 저장소가 갱신한다. 화면 생성에 영향이 있으면 「DS 요청」으로 알린다");
}
