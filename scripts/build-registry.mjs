#!/usr/bin/env node
// DS 레지스트리 — 컴포넌트 단일 원천(2026-09-15 신설). 스토리 파일 1개 = 항목 1개.
//
//   pnpm registry            레지스트리 → 파생 파일 생성: approved.json · vocab-map.json (호환 뷰, 클론·허브가 계속 읽는다)
//   pnpm registry --migrate  1회 이관: approved.json + vocab-map.json + cards-data.ts + ds365.json + figma-inventory.json → ds-registry.json
//   pnpm registry --check    레지스트리와 파생 파일이 일치하는지만 검사(exit 1 = 뒤처짐)
//   pnpm registry --audit    피그마 인벤토리(scripts/figma-inventory.json) ↔ 레지스트리 figma id 양방향 대조
//
// 규칙
//   - status: adopted(어휘 = 생성에 쓸 수 있다) · primitive(파일은 있으나 미채택) · retired(은퇴)
//   - aliases: 구 어휘 슬러그(한국어 패턴명). approved.json = adopted 항목의 alias 슬러그 전부(정렬), vocab-map = alias → {name, files}
//   - figma: Component 페이지 세트·컴포넌트 node id. 한 항목이 여러 세트를 가질 수 있다(FilterBar 8세트)
//   - 관리자 저장소 전용(.ds-admin). 클론은 파생 파일만 읽는다.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = {
  registry: join(ROOT, "playground/public/ds-registry.json"),
  approved: join(ROOT, "playground/public/approved.json"),
  vocab: join(ROOT, "playground/public/vocab-map.json"),
  ds365: join(ROOT, "playground/public/ds365.json"),
  cards: join(ROOT, "playground/app/hub/cards-data.ts"),
  inventory: join(ROOT, "scripts/figma-inventory.json"),
  ui: join(ROOT, "components/src/ui"),
};
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const write = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
const fail = (m) => { console.error(`[registry] ${m}`); process.exit(1); };
if (!existsSync(join(ROOT, ".ds-admin"))) fail("관리자 저장소 표식(.ds-admin)이 없다 — 클론에서는 실행하지 않는다.");

// ── 피그마 세트 이름 → 스토리 파일 키 ──────────────────────────────────────────
const FIGMA_MAP = {
  Button: "button",
  FilterBar: "filter-bar", FilterChip: "filter-bar", OptionPanel: "filter-bar", OptionRow: "filter-bar", RadioRow: "filter-bar", DatePanel: "filter-bar", AddFilterPopover: "filter-bar",
  Search: "search-box",
  Checkbox: "checkbox", RadioGroupItem: "radio-group", Switch: "switch",
  SelectTrigger: "select", SelectItem: "select", "Select / closed": "select", "Select / open": "select",
  Badge: "badge", StatusBadge: "status-badge", Alert: "alert",
  CommandItem: "command", "Command / palette": "command", Label: "label", Field: "field",
  InputGroup: "input-group", "InputGroup / clear": "input-group", "InputGroup / prefix suffix": "input-group",
  Calendar: "calendar", IconSelect: "icon-select", VersionFilterChip: "version-filter-chip", Input: "input", Textarea: "textarea",
  Progress: "progress", PaginationLink: "pagination", Pagination: "pagination",
  "Table / basic": "table", "Table / matrix": "table", "Table / permissions": "table", TableRow: "table",
  "Card / stat": "card", "Card / full": "card", "Card / flat": "card",
  PageHeader: "page-header", StepperItem: "stepper", Stepper: "stepper", HeatmapGrid: "heatmap-grid",
  Item: "item", "Item / key value": "item", "Item / list row": "item",
  AccordionItem: "accordion", Accordion: "accordion", "Collapsible / tree": "collapsible",
  TabsTrigger: "tabs", "Tabs / two kinds": "tabs", "Chart / donut": "chart", "Chart / line": "chart",
  DropdownMenuItem: "dropdown-menu", "DropdownMenu / open": "dropdown-menu", "Popover / open": "popover", Tooltip: "tooltip",
  "Toast / success": "sonner", "Dialog / open": "dialog", "AlertDialog / destructive": "alert-dialog", "Sheet / right": "sheet", NotificationPanel: "notification-panel",
  ErrorState: "error-state", Empty: "empty", "Empty / inline": "empty", Skeleton: "skeleton", TableSkeleton: "skeleton", Spinner: "spinner", ErrorConsole: "error-console",
  Breadcrumb: "breadcrumb", TimelineItem: "timeline", Timeline: "timeline", RowsPerPage: "rows-per-page", ButtonGroup: "button-group",
  SidebarMenuButton: "sidebar", "Sidebar / nav": "sidebar", "Sidebar / nav (하위 페이지)": "sidebar", "Sidebar / rail (접힘)": "sidebar",
  "DetailPanel / open": "detail-panel", ListFooter: "list-footer",
};
// 피그마 섹션이 ROOT(사용자 배치)인 세트의 논리 섹션
const ROOT_SECTION = { button: "Button", "filter-bar": "FilterBar", "search-box": "Form", checkbox: "Form", "radio-group": "Form", switch: "Form", select: "Form", badge: "Data", "status-badge": "Data", alert: "Feedback" };
// 어휘 파일 목록이 비어 있는 슬러그의 실제 파일
const SLUG_FILE_FIX = { "fb-console": ["error-console"] };
const pascal = (k) => k.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");

function loadCards() {
  const src = readFileSync(P.cards, "utf8");
  const json = src.slice(src.indexOf("= [") + 2, src.lastIndexOf("]") + 1);
  const groups = new Function("return " + json)();
  const out = {};
  for (const g of groups) for (const c of g.cards) if (c.slug) out[c.slug] = { group: g.title, name: c.name, shadcn: c.shadcn || null, prio: c.prio || null };
  return out;
}
function loadNotes() {
  const s = read(P.ds365); const out = {};
  const walk = (o, d) => { if (!o || d > 3 || typeof o !== "object") return; for (const k in o) { const v = o[k]; if (v && typeof v === "object" && typeof v.note === "string") out[k] = v.note; walk(v, d + 1); } };
  walk(s, 0); return out;
}

function migrate() {
  const approved = new Set(read(P.approved).approved);
  const vocabRaw = read(P.vocab); const vocab = vocabRaw.vocab || vocabRaw;
  const cards = loadCards(); const notes = loadNotes();
  const inv = read(P.inventory);
  const storyFiles = readdirSync(P.ui).filter((f) => f.endsWith(".stories.tsx")).map((f) => f.replace(".stories.tsx", "")).sort();
  const allFiles = readdirSync(P.ui).filter((f) => f.endsWith(".tsx") && !f.endsWith(".stories.tsx")).map((f) => f.replace(".tsx", ""));
  const keys = [...new Set([...storyFiles, ...allFiles])].sort();
  const reg = {};
  for (const key of keys) reg[key] = { name: { ko: null, en: pascal(key) }, status: "primitive", section: null, stories: storyFiles.includes(key) ? `components/src/ui/${key}.stories.tsx` : null, file: `components/src/ui/${key}.tsx`, aliases: [], coveredBy: [], hub: [], figma: [], note: null };
  // 어휘 슬러그 → 항목(첫 파일이 소유), 나머지 파일은 coveredBy
  for (const [slug, e] of Object.entries(vocab)) {
    const files = (e.files && e.files.length ? e.files : SLUG_FILE_FIX[slug]) || [];
    if (!files.length) { console.warn(`[registry] ${slug}: 파일 없음 — 건너뜀`); continue; }
    const owner = reg[files[0]]; if (!owner) { console.warn(`[registry] ${slug}: 소유 파일 ${files[0]} 없음`); continue; }
    owner.aliases.push({ slug, name: e.name, files, approved: approved.has(slug) });
    if (!owner.name.ko) owner.name.ko = e.name;
    if (cards[slug]) owner.hub.push({ slug, ...cards[slug] });
    if (notes[slug]) owner.note = owner.note ? owner.note + "\n\n" + notes[slug] : notes[slug];
    for (const f of files.slice(1)) if (reg[f] && !reg[f].coveredBy.includes(slug)) reg[f].coveredBy.push(slug);
  }
  for (const [key, r] of Object.entries(reg)) {
    const adoptedAlias = r.aliases.some((a) => a.approved) || r.coveredBy.some((s) => approved.has(s));
    r.status = adoptedAlias ? "adopted" : "primitive";
    if (key === "toggle-group") { r.status = "retired"; r.note = (r.note ? r.note + "\n\n" : "") + "2026-09-15 은퇴 — 선택 상태 혼동. 단일 선택 = Tabs line, 다중 = Checkbox."; }
    if (key === "state-preview") r.note = "생성 화면 4상태 전환 프리셋(StatePreview) — 어휘가 아니라 도구. 모든 생성 화면이 쓴다.";
  }
  for (const n of inv.nodes) {
    const key = FIGMA_MAP[n.name]; if (!key || !reg[key]) { console.warn(`[registry] 피그마 세트 매핑 없음: ${n.name} (${n.id})`); continue; }
    reg[key].figma.push({ id: n.id, name: n.name, variants: n.variants });
    if (!reg[key].section) reg[key].section = n.section === "ROOT" ? (ROOT_SECTION[key] || "ROOT") : n.section;
  }
  for (const r of Object.values(reg)) { if (!r.name.ko) r.name.ko = r.name.en; if (!r.section) r.section = "—"; }
  const out = { $note: "DS 컴포넌트 레지스트리 — 단일 원천(2026-09-15). 항목 키 = 스토리 파일. approved.json · vocab-map.json 은 `pnpm registry` 가 여기서 생성한다(직접 편집 금지). figma = Component 페이지 세트 id. status: adopted · primitive · retired.", fileKey: inv.fileKey, updated: new Date().toISOString().slice(0, 10), components: reg };
  write(P.registry, out);
  const counts = Object.values(reg).reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});
  console.log(`[registry] 이관 완료 → ${P.registry.replace(ROOT + "/", "")} · 항목 ${keys.length} · ${JSON.stringify(counts)} · 피그마 세트 ${inv.nodes.length}`);
}

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
function audit() {
  const reg = read(P.registry); const inv = read(P.inventory);
  const regIds = new Map(); for (const [k, r] of Object.entries(reg.components)) for (const f of r.figma) regIds.set(f.id, k);
  const invIds = new Set(inv.nodes.map((n) => n.id));
  const onlyFigma = inv.nodes.filter((n) => !regIds.has(n.id)).map((n) => `${n.name} (${n.id})`);
  const onlyReg = [...regIds.entries()].filter(([id]) => !invIds.has(id)).map(([id, k]) => `${k}: ${id}`);
  const noFigma = Object.entries(reg.components).filter(([, r]) => r.status === "adopted" && !r.figma.length).map(([k]) => k);
  console.log(`[registry] 피그마 대조 — 피그마에만 ${onlyFigma.length} · 레지스트리에만 ${onlyReg.length} · 채택인데 피그마 없음 ${noFigma.length}`);
  onlyFigma.forEach((x) => console.log("  피그마에만: " + x)); onlyReg.forEach((x) => console.log("  레지스트리에만: " + x)); noFigma.forEach((x) => console.log("  피그마 없음: " + x));
  process.exit(onlyFigma.length + onlyReg.length + noFigma.length ? 1 : 0);
}

if (has("--migrate")) migrate();
else if (has("--check")) check();
else if (has("--audit")) audit();
else generate();
