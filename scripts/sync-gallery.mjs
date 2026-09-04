#!/usr/bin/env node
// 클론 generated 앱 → gallery 사본 이식 (2026-09-04)
//
// 배경: 템플릿 카드의 hover 미리보기·클릭 팝업은 이 저장소의 /gallery/<slug>/ 실물 라우트를 본다.
//   그런데 고도화는 클론(designsystem)의 playground/app/generated/{hinas365,sales365,_detail}에서
//   이뤄지므로, 그 간격을 한 명령으로 닫는다 — 복사 + '/generated/' → '/gallery/' 치환(d675c12와 같은 규칙).
//
// 사용:
//   pnpm gallery:sync                 이식(추가·갱신). 원본에서 사라진 gallery 파일은 보고만
//   pnpm gallery:sync --check         변경 없이 대조 결과만 출력. 뒤처져 있으면 exit 1(세션 시작 점검용)
//   pnpm gallery:sync --prune         원본에 없는 gallery 파일도 삭제
//   pnpm gallery:sync --from <경로>   클론 저장소 경로 덮어쓰기(기본: ~/Documents/Claude/designsystem)
//
// 규칙:
//   - 관리자 저장소 전용(.ds-admin 없으면 중단). 클론은 본 저장소에 쓰지 않는다.
//   - update-image-download 등 APPS 밖 폴더는 건드리지 않는다(레거시·미이식).
//   - 복사한 텍스트 파일에 self-check(hex 리터럴·-[ 임의값) grep을 돌려 경고만 낸다 —
//     사본은 실물 스냅샷이라 차단하지 않는다. 적용 후에는 tsc 1회가 필요하다.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APPS = ["hinas365", "sales365", "_detail"];
const BINARY = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2"]);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "playground", "app", "gallery");
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const fromAt = args.indexOf("--from");
const SRC_ROOT = fromAt >= 0 && args[fromAt + 1] ? resolve(args[fromAt + 1]) : join(homedir(), "Documents", "Claude", "designsystem");
const SRC = join(SRC_ROOT, "playground", "app", "generated");
const CHECK = has("--check");
const PRUNE = has("--prune");

const fail = (msg) => { console.error(`[gallery:sync] ${msg}`); process.exit(1); };
if (!existsSync(join(ROOT, ".ds-admin"))) fail("관리자 저장소 표식(.ds-admin)이 없다 — 클론에서는 실행하지 않는다.");
if (!existsSync(SRC)) fail(`원본이 없다: ${SRC}  (--from <클론 경로>로 지정)`);

/** dir 아래 모든 파일의 상대 경로(정렬) */
function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, base));
    else out.push(p.slice(base.length + 1));
  }
  return out;
}
const ext = (p) => { const i = p.lastIndexOf("."); return i < 0 ? "" : p.slice(i).toLowerCase(); };
const port = (text) => text.split("/generated/").join("/gallery/");

const added = [], updated = [], same = [], gone = [], warns = [];

for (const app of APPS) {
  const srcDir = join(SRC, app);
  if (!existsSync(srcDir)) { console.warn(`[gallery:sync] 원본에 ${app} 없음 — 건너뜀`); continue; }
  for (const rel of walk(srcDir)) {
    const s = join(srcDir, rel), d = join(DEST, app, rel);
    const id = `${app}/${rel}`;
    const bin = BINARY.has(ext(rel));
    const next = bin ? readFileSync(s) : port(readFileSync(s, "utf8"));
    const cur = existsSync(d) ? (bin ? readFileSync(d) : readFileSync(d, "utf8")) : null;
    const equal = cur !== null && (bin ? cur.equals(next) : cur === next);
    if (equal) { same.push(id); continue; }
    (cur === null ? added : updated).push(id);
    if (!CHECK) { mkdirSync(dirname(d), { recursive: true }); writeFileSync(d, next); }
    if (!bin) {
      next.split("\n").forEach((line, i) => {
        if (/#[0-9a-fA-F]{3,6}\b|-\[/.test(line)) warns.push(`${id}:${i + 1}`);
      });
    }
  }
  const destDir = join(DEST, app);
  if (existsSync(destDir)) {
    for (const rel of walk(destDir)) {
      if (existsSync(join(srcDir, rel))) continue;
      gone.push(`${app}/${rel}`);
      if (PRUNE && !CHECK) unlinkSync(join(destDir, rel));
    }
  }
}

const list = (label, arr) => { if (arr.length) console.log(`  ${label} ${arr.length}\n` + arr.map((x) => `    ${x}`).join("\n")); };
console.log(`[gallery:sync] 원본 ${SRC}${CHECK ? "  (--check: 변경 없음)" : ""}`);
console.log(`  추가 ${added.length} · 갱신 ${updated.length} · 동일 ${same.length} · 원본에 없음 ${gone.length}${gone.length ? (PRUNE && !CHECK ? " (삭제됨)" : " (--prune 시 삭제)") : ""}`);
list("추가", added);
list("갱신", updated);
list("원본에 없음", gone);
if (warns.length) console.log(`  self-check 경고 ${warns.length}건(hex 리터럴·-[ 임의값, 차단 없음): ${warns.slice(0, 12).join(", ")}${warns.length > 12 ? " …" : ""}`);

const behind = added.length + updated.length + gone.length;
if (CHECK) {
  console.log(behind ? `  → gallery가 클론보다 ${behind}파일 뒤처짐. 적용: pnpm gallery:sync` : "  → 최신 상태");
  process.exit(behind ? 1 : 0);
}
if (added.length + updated.length) console.log("  → 적용됨. 다음: pnpm --filter playground exec tsc --noEmit");
else console.log("  → 변경 없음");
