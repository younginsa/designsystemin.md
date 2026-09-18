#!/usr/bin/env node
// DS 레지스트리 — 컴포넌트 단일 원천(2026-09-15 신설). 스토리 파일 1개 = 항목 1개.
//
//   pnpm registry --check      레지스트리 ↔ components/src/ui 대조(스토리 유무 = DS 여부)
//   pnpm registry --figma-gap 피그마 갭(주간): DS 인데 세트 없음 · 스토리가 세트 제작일(figma[].built)보다 나중에 바뀜 — 저장소 → 피그마 한 방향, 오류 아님
//
// 규칙
//   - 스토리가 있으면 DS 다. 사람이 켜고 끄는 채택 단계는 2026-09-18 폐기(status·role·aliases·approved.json·vocab-map.json 은퇴).
//   - 소비자가 읽는 목록은 /story-html/index.json 이다. 이 파일은 관리 기록(피그마 세트·설계 노트).
//   - figma: 피그마 Component 페이지 세트 node id + built(제작일). 링크·갭 판정용, 필수 아님(피그마는 다운스트림). 한 항목이 여러 세트를 가질 수 있다(FilterBar 8세트)
//   - 관리자 저장소 전용(.ds-admin).

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = {
  registry: join(ROOT, "playground/public/ds-registry.json"),
  ui: join(ROOT, "components/src/ui"),
};
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const fail = (m) => { console.error(`[registry] ${m}`); process.exit(1); };
if (!existsSync(join(ROOT, ".ds-admin"))) fail("관리자 저장소 표식(.ds-admin)이 없다 — 클론에서는 실행하지 않는다.");

// 레지스트리 ↔ components/src/ui 대조 — 스토리 유무가 곧 DS 여부다(2026-09-18).
function check() {
  const reg = read(P.registry).components;
  const files = readdirSync(P.ui).filter((f) => f.endsWith(".tsx"));
  const comps = new Set(files.filter((f) => !f.endsWith(".stories.tsx")).map((f) => f.slice(0, -4)));
  const stories = new Set(files.filter((f) => f.endsWith(".stories.tsx")).map((f) => f.slice(0, -12)));
  const errs = [];
  for (const c of comps) if (!reg[c]) errs.push(`components/src/ui/${c}.tsx 가 레지스트리에 없다`);
  for (const [k, e] of Object.entries(reg)) {
    if (e.file && !comps.has(k)) errs.push(`${k}: 레지스트리에 있는데 파일이 없다`);
    if (e.stories && !stories.has(k)) errs.push(`${k}: 스토리를 가리키는데 파일이 없다 — ${e.stories}`);
    if (!e.stories && stories.has(k)) errs.push(`${k}: 스토리 파일이 있는데 레지스트리가 비어 있다(= DS 인데 목록에서 빠진다)`);
  }
  console.log(`[registry] 항목 ${Object.keys(reg).length} · 컴포넌트 파일 ${comps.size} · 스토리 ${stories.size} · 불일치 ${errs.length}`);
  errs.forEach((e) => console.log("  " + e));
  process.exit(errs.length ? 1 : 0);
}

// 피그마 갭 — 저장소 → 피그마 한 방향(2026-09-18). 채택인데 세트가 없거나(missing), 세트 제작일(figma[].built)보다 스토리가
// 나중에 바뀐(stale) 항목을 나열한다. 오류가 아니라 주간 동기화 할 일 — exit 0.
function figmaGap() {
  const reg = read(P.registry);
  const missing = [], stale = [];
  for (const [k, r] of Object.entries(reg.components)) {
    if (!r.stories) continue; // 스토리가 없으면 DS 가 아니라 부품이다
    if (!r.figma.length) { missing.push(k); continue; }
    const built = r.figma.map((f) => f.built || "").sort().pop() || "";
    const paths = [r.stories, r.file].filter(Boolean).map((p) => JSON.stringify(p)).join(" ");
    const changed = paths ? execSync(`git log -1 --format=%cs -- ${paths}`, { cwd: ROOT }).toString().trim() : "";
    if (changed && built && changed > built) stale.push(`${k} (스토리 ${changed} › 세트 ${built})`);
  }
  console.log(`[registry] 피그마 갭 — 세트 없음 ${missing.length} · 낡음 ${stale.length} (피그마는 다운스트림 — 오류 아님, 주간 동기화 할 일)`);
  missing.forEach((x) => console.log("  세트 없음: " + x)); stale.forEach((x) => console.log("  낡음: " + x));
}

if (has("--figma-gap")) figmaGap();
else check();
