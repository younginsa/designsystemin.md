#!/usr/bin/env node
// DS 레지스트리 — 컴포넌트 단일 원천(2026-09-15 신설). 스토리 파일 1개 = 항목 1개.
//
//   pnpm registry            레지스트리 → 파생 파일 생성: approved.json · vocab-map.json (호환 뷰, 클론·허브가 계속 읽는다)
//   pnpm registry --check    레지스트리와 파생 파일이 일치하는지만 검사(exit 1 = 뒤처짐)
//   pnpm registry --figma-gap 피그마 갭(주간): 채택인데 세트 없음 · 스토리가 세트 제작일(figma[].built)보다 나중에 바뀜 — 저장소 → 피그마 한 방향, 오류 아님
//
// 규칙
//   - status: adopted(어휘 = 생성에 쓸 수 있다) · primitive(파일은 있으나 미채택) · retired(은퇴)
//   - aliases: 구 어휘 슬러그(한국어 패턴명). approved.json = adopted 항목의 alias 슬러그 전부(정렬), vocab-map = alias → {name, files}
//   - figma: 피그마 Component 페이지 세트 node id + built(제작일). 링크·갭 판정용, 필수 아님(피그마는 다운스트림). 한 항목이 여러 세트를 가질 수 있다(FilterBar 8세트)
//   - 관리자 저장소 전용(.ds-admin). 클론은 파생 파일만 읽는다.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = {
  registry: join(ROOT, "playground/public/ds-registry.json"),
  approved: join(ROOT, "playground/public/approved.json"),
  vocab: join(ROOT, "playground/public/vocab-map.json"),
  ui: join(ROOT, "components/src/ui"),
};
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const write = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
const fail = (m) => { console.error(`[registry] ${m}`); process.exit(1); };
if (!existsSync(join(ROOT, ".ds-admin"))) fail("관리자 저장소 표식(.ds-admin)이 없다 — 클론에서는 실행하지 않는다.");

function derive() {
  const reg = read(P.registry);
  const approved = [], vocab = {};
  for (const r of Object.values(reg.components)) for (const a of r.aliases) { vocab[a.slug] = { name: a.name, files: a.files }; if (r.status === "adopted" && a.approved !== false) approved.push(a.slug); }
  approved.sort();
  const vocabSorted = Object.fromEntries(Object.keys(vocab).sort().map((k) => [k, vocab[k]]));
  return { approved: { updated: reg.updated, approved }, vocab: vocabSorted };
}
// vocab-map 은 기존 헤더($description · $usage · updated)를 유지하고 항목은 한 줄씩(가독성 — 클론이 grep 으로 읽는다)
function writeVocab(vocab, updated, reg) {
  const cur = existsSync(P.vocab) ? read(P.vocab) : {};
  const head = {
    $description: cur.$description || "어휘 슬러그 → 실제 컴포넌트 파일 매핑. approved.json은 '무엇이 채택됐나'(게이트)이고, 이 파일은 '그 어휘가 어느 파일을 쓰나'를 답한다.",
    $usage: cur.$usage || "가용성 확인 = 이 파일에서 파일명을 찾는다(키 이름 추측 금지).",
    $note: (cur.$note || "files는 components/src/ui/<name>.tsx 기준. 여러 파일을 쓰는 조합 어휘는 전부 나열한다.") + " ds-registry.json 에서 생성(pnpm registry) — 직접 편집 금지.",
    updated: `${updated} — ds-registry.json 에서 생성(pnpm registry)`,
  };
  // ds:build 어휘 게이트가 읽는 두 배열 — components/src/ui 의 모든 파일은 vocab files ∪ infrastructure ∪ unadopted 안에 있어야 한다
  const infra = Object.entries(reg.components).filter(([, r]) => r.role === "infrastructure").map(([k]) => k).sort();
  const unadopted = Object.entries(reg.components).filter(([, r]) => r.role === "unadopted" || r.role === "retired").map(([k]) => k).sort();
  const lines = Object.entries(vocab).map(([k, v]) => `    ${JSON.stringify(k)}: { "name": ${JSON.stringify(v.name)}, "files": [${v.files.map((f) => JSON.stringify(f)).join(", ")}] }`);
  const text = "{\n" + Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n") +
    "\n  \"vocab\": {\n" + lines.join(",\n") + "\n  },\n" +
    `  "$infrastructure": "어휘가 직접 가리키지 않지만 컴포넌트들이 내부에서 쓰거나 조합 부품으로 쓰는 파일(레지스트리 role=infrastructure). ds:build 게이트가 이 배열을 읽는다.",\n` +
    `  "infrastructure": ${JSON.stringify(infra)},\n` +
    `  "$unadopted": "실물은 있으나 채택 어휘가 없는 것(role=unadopted) + 은퇴(retired). 쓰려면 채택 절차를 밟아야 한다.",\n` +
    `  "unadopted": ${JSON.stringify(unadopted)}\n}\n`;
  writeFileSync(P.vocab, text);
}
function generate() {
  const { approved, vocab } = derive();
  write(P.approved, approved); writeVocab(vocab, approved.updated, read(P.registry));
  console.log(`[registry] 생성 → approved.json(${approved.approved.length}) · vocab-map.json(${Object.keys(vocab).length})`);
}
function check() {
  const { approved, vocab } = derive();
  const curA = read(P.approved), curV = read(P.vocab);
  const a = JSON.stringify(curA.approved) === JSON.stringify(approved.approved);
  const v = JSON.stringify(curV.vocab || curV) === JSON.stringify(vocab);
  console.log(`[registry] approved ${a ? "일치" : "불일치"} · vocab-map ${v ? "일치" : "불일치"}`);
  process.exit(a && v ? 0 : 1);
}
// 피그마 갭 — 저장소 → 피그마 한 방향(2026-09-18). 채택인데 세트가 없거나(missing), 세트 제작일(figma[].built)보다 스토리가
// 나중에 바뀐(stale) 항목을 나열한다. 오류가 아니라 주간 동기화 할 일 — exit 0.
function figmaGap() {
  const reg = read(P.registry);
  const missing = [], stale = [];
  for (const [k, r] of Object.entries(reg.components)) {
    if (r.status !== "adopted") continue;
    if (!r.figma.length) { missing.push(k); continue; }
    const built = r.figma.map((f) => f.built || "").sort().pop() || "";
    const paths = [r.stories, r.file].filter(Boolean).map((p) => JSON.stringify(p)).join(" ");
    const changed = paths ? execSync(`git log -1 --format=%cs -- ${paths}`, { cwd: ROOT }).toString().trim() : "";
    if (changed && built && changed > built) stale.push(`${k} (스토리 ${changed} › 세트 ${built})`);
  }
  console.log(`[registry] 피그마 갭 — 세트 없음 ${missing.length} · 낡음 ${stale.length} (피그마는 다운스트림 — 오류 아님, 주간 동기화 할 일)`);
  missing.forEach((x) => console.log("  세트 없음: " + x)); stale.forEach((x) => console.log("  낡음: " + x));
}

if (has("--check")) check();
else if (has("--figma-gap")) figmaGap();
else generate();
