#!/usr/bin/env node
// 아이콘 카탈로그 생성 (2026-10-07) — 생성 HTML 이 스니펫의 예시 아이콘(alert 의 터미널 등)을 의미에 맞게 바꿀 때
// 가져다 쓸 lucide SVG 를 playground/public/icons/<이름>.svg 로 쓴다(+ index.json 이름 목록).
// 원천 = lucide-react 의 아이콘 노드(dist/esm/icons/<이름>.js 의 __iconNode) — lucide-static 은 설치돼 있지 않다.
// 이름 목록 = FE 스냅샷·파일럿·갤러리·components 에서 실제로 쓰인 아이콘 + 자주 필요한 소수. 파일이 없는 이름은 건너뛰고 보고한다.
// 실행: pnpm icons:build  → 산출물은 커밋한다(정적 파일, 빌드 단계 없음).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = join(ROOT, "playground", "node_modules", "lucide-react");
const SRC = join(PKG, "dist", "esm", "icons");
const OUT = join(ROOT, "playground", "public", "icons");

const NAMES = [
  // FE 스냅샷·파일럿에 찍힌 것
  "bell", "bell-ring", "briefcase", "calculator", "calendar", "check", "check-check", "chevron-down", "chevron-left",
  "chevron-right", "chevrons-up-down", "circle", "circle-alert", "circle-fading-arrow-up", "circuit-board", "clock-3", "cloud",
  "code", "credit-card", "ellipsis", "file-text", "flask-conical", "git-compare", "github", "info", "key-round",
  "layout-dashboard", "layout-grid", "life-buoy", "loader-circle", "log-out", "plus", "refresh-cw", "rotate-ccw", "search",
  "settings", "ship", "smile", "tag", "terminal", "triangle-alert", "user", "user-plus", "x",
  // 갤러리(playground/app/gallery) import
  "activity", "anchor", "arrow-down", "arrow-right", "arrow-up", "arrow-up-right", "boxes", "building-2", "calendar-clock",
  "calendar-days", "chevrons-left", "chevrons-right", "clock", "container", "download", "external-link", "factory", "file-code",
  "hard-drive", "image-plus", "menu", "monitor", "package", "panel-left-close", "panel-left-open", "paperclip", "pencil", "send",
  "settings-2", "star", "trash-2", "upload", "user-round", "users", "zap",
  // components/src/ui import (별칭은 정식 이름으로: AlertTriangle→triangle-alert · CheckCircle2→circle-check · Loader2→loader-circle · MoreHorizontal→ellipsis)
  "arrow-up-down", "chevron-up", "circle-check", "copy", "database", "globe", "inbox", "layers", "maximize-2", "octagon-x", "panel-left",
  // 자주 필요한 소수(안내·확인·필터·보기)
  "circle-help", "circle-x", "circle-minus", "circle-plus", "eye", "eye-off", "filter", "lock", "mail", "minus", "history", "list",
];

const ATTR = 'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

function iconNode(name, depth = 0) {
  const file = join(SRC, name + ".js");
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const m = text.match(/const __iconNode = (\[[\s\S]*?\]);\s*\n/);
  if (m) return new Function("return " + m[1])();
  // 별칭 파일(circle-help → circle-question-mark 등)은 다른 아이콘을 재수출한다 — 따라간다
  const alias = text.match(/from ['"]\.\/([\w-]+)\.js['"]/);
  if (alias && alias[1] !== name && depth < 3) return iconNode(alias[1], depth + 1);
  throw new Error("iconNode 를 찾지 못함: " + name);
}

function toSvg(name, node) {
  const inner = node.map(([tag, attrs]) => {
    const a = Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => k + '="' + String(v).replace(/"/g, "&quot;") + '"').join(" ");
    return "<" + tag + " " + a + "/>";
  }).join("");
  return "<svg " + ATTR + ' class="lucide lucide-' + name + ' size-4" aria-hidden="true">' + inner + "</svg>\n";
}

if (!existsSync(SRC)) { console.error("lucide-react 를 찾지 못함: " + SRC); process.exit(1); }
const version = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")).version;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const names = [...new Set(NAMES)].sort();
const written = [], missing = [];
for (const name of names) {
  const node = iconNode(name);
  if (!node) { missing.push(name); continue; }
  writeFileSync(join(OUT, name + ".svg"), toSvg(name, node));
  written.push(name);
}
const index = {
  generated: new Date().toISOString().slice(0, 10),
  lucide: version,
  count: written.length,
  usage: "스니펫의 예시 아이콘을 의미에 맞게 바꿀 때 /icons/<이름>.svg 의 <svg> 를 통째로 복사해 교체한다. 크기 클래스(size-*)는 원래 것을 유지. 목록에 없는 아이콘은 쓰지 않는다(ds-skill 3(c)③).",
  names: written,
};
writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 1) + "\n");
console.log("icons: " + written.length + " written to " + OUT + " (lucide-react " + version + ")");
if (missing.length) console.log("missing in lucide-react (skipped): " + missing.join(", "));
console.log("files: " + readdirSync(OUT).length);
