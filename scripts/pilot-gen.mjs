#!/usr/bin/env node
// 갤러리 파일럿 — 두 화면(계약 호선 목록 A · 호선 상세 B)을 FE 스니펫으로 조립한 단독 HTML 로 만든다(2026-09-30).
// claude.ai 프로젝트가 화면을 만드는 방식(ds-skill.md)을 그대로 따른다: 스니펫 복사 → 글자만 교체 → 4상태 · 알약 · 스펙 섹션 · ds.js.
// 조립은 브라우저 DOM(playwright)으로 한다 — 표 행 복제·라벨 교체를 문자열 치환보다 안전하게.
//   DS_BASE=http://localhost:3000 node scripts/pilot-gen.mjs   → playground/public/pilot/vessels-list.html · vessel-detail.html
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SNIP = join(ROOT, "playground/public/story-html");
const OUT = join(ROOT, "playground/public/pilot");
const SITE = "https://designsystemin-md.vercel.app";
const idx = JSON.parse(readFileSync(join(SNIP, "index.json"), "utf8"));
const reg = JSON.parse(readFileSync(join(ROOT, "playground/public/ds-registry.json"), "utf8"));
const snip = (k) => readFileSync(join(SNIP, k + ".html"), "utf8");
const optSnip = (k) => (existsSync(join(SNIP, k + ".html")) ? snip(k) : null); // 열린 상태 스냅샷 — fe:sync 가 아직 못 찍었으면 없이 간다

function chromePath() {
  if (process.env.FE_CHROME) return process.env.FE_CHROME;
  const cands = [];
  try { const p = chromium.executablePath(); if (p) cands.push(p); } catch {}
  for (const cache of [join(homedir(), "Library/Caches/ms-playwright"), join(homedir(), ".cache/ms-playwright")]) {
    if (!existsSync(cache)) continue;
    for (const d of readdirSync(cache).filter((x) => /^chromium(_headless_shell)?-/.test(x)).sort().reverse()) cands.push(join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"), join(cache, d, "chrome-headless-shell-linux64/chrome-headless-shell"), join(cache, d, "chrome-linux/chrome"));
  }
  cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  return cands.find(existsSync);
}

// ── 공통 조각(ds-skill 3장·8장 그대로) ──
const PILLS = (states) => `<div class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-card p-1 shadow-card">${states.map((s, i) => `<button data-pick="${s.k}" class="${i === 0 ? "rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground" : "rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent"}">${s.ko}</button>`).join("")}</div><button data-view-pick="spec" class="fixed top-4 right-4 z-50 rounded-full border border-border bg-card px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">스펙</button>`;
// 머리말 5줄 — 임의 값(grid-cols-[12rem_1fr]) 대신 표준 클래스만: 행 = flex, 이름 폭 = w-48
const ROW = (k, v) => `<div class="flex gap-6"><dt class="w-48 shrink-0 text-secondary-foreground">${k}</dt><dd>${v}</dd></div>`;
const SPEC = (s) => `<section data-view="spec" hidden class="space-y-6 rounded-lg border bg-card p-6"><dl class="space-y-2 text-sm">
${ROW("DS 갱신일", `컴포넌트 목록 ${reg.updated} · 스니펫 ${idx.generated} · FE 빌드 ${s.feBuild}`)}
${ROW("DS 밖 요소", `${s.fallbacks.length}개${s.fallbacks.length ? " — " + s.fallbacks.join(", ") : ""}`)}
${ROW("원문까지 읽은 컴포넌트", "0개")}
${ROW("값 채운 컨트롤", s.filled)}
${ROW("프로그레스", `제외 — ${s.pattern} 화면, 진행률 없음`)}
${ROW("스니펫 출처", `정적 ${s.snippets.length}편(${s.snippets.join(", ")}) · 라이브 0편 — 빌드 시 조립`)}
</dl>
<div><h3 class="text-sm font-medium text-secondary-foreground">화면</h3><p class="mt-1 text-sm">${s.screen}</p></div>
<div><h3 class="text-sm font-medium text-secondary-foreground">필드</h3><table class="mt-2 w-full text-sm"><thead><tr class="text-left text-secondary-foreground"><th class="py-1 font-medium">이름</th><th class="py-1 font-medium">타입</th><th class="py-1 font-medium">필수</th><th class="py-1 font-medium">예시</th></tr></thead><tbody>${s.fields.map((f) => `<tr class="border-t"><td class="py-1 font-mono">${f[0]}</td><td class="py-1">${f[1]}</td><td class="py-1">${f[2]}</td><td class="py-1">${f[3]}</td></tr>`).join("")}</tbody></table></div>
<div><h3 class="text-sm font-medium text-secondary-foreground">상태</h3><ul class="mt-1 list-disc pl-5 text-sm">${s.states.map((x) => `<li>${x}</li>`).join("")}</ul></div>
<div><h3 class="text-sm font-medium text-secondary-foreground">액션</h3><ul class="mt-1 list-disc pl-5 text-sm">${s.actions.map((x) => `<li>${x}</li>`).join("")}</ul></div>
<div><h3 class="text-sm font-medium text-secondary-foreground">내가 정한 것</h3><ul class="mt-1 list-disc pl-5 text-sm">${s.decisions.map((x) => `<li>${x}</li>`).join("")}</ul></div>
<div><h3 class="text-sm font-medium text-secondary-foreground">원본 프롬프트</h3><p class="mt-1 text-sm text-secondary-foreground">${s.prompt}</p></div></section>`;
const DOC = (title, body) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="stylesheet" href="${SITE}/ds.css"><script src="${SITE}/ds.js" defer></script></head>
<body class="bg-secondary text-foreground antialiased">
${body}
</body></html>
`;

const NAV = ["계약", "계약 호선", "납품 제품", "구독", "계정", "제품", "유저"];
const ROWS = [
  ["1001", "MV EXAMPLE", "9876543", "대양해운", "Container", ["KR", "DNV"], "SER-2026-A", "한빛중공업", "2027-06-01"],
  ["1002", "MV PIONEER", "9876544", "대양해운", "Container", ["KR"], "SER-2026-A", "한빛중공업", "2027-09-01"],
  ["1003", "—", "–", "대양해운", "Container", ["KR"], "SER-2026-A", "한빛중공업", "2027-12-01"],
  ["2001", "BLUE HORIZON", "8123456", "청해선사", "Container", ["LR", "ABS"], "SER-2024-C", "금강중공업", "2025-11-01"],
  ["2002", "RED HORIZON", "8123457", "청해선사", "Container", ["LR"], "SER-2024-C", "금강중공업", "2026-01-01"],
  ["HN-2025-001", "OCEAN STAR", "9765432", "서해해운", "Bulk Carrier", ["BV"], "SER-2025-B", "대건조선", "2026-03-15"],
  ["HN-2025-002", "OCEAN MOON", "9765433", "서해해운", "Bulk Carrier", ["BV"], "SER-2025-B", "대건조선", "2026-06-15"],
  ["HN-2025-104", "MV EOS 5", "9500004", "대양해운", "RoRo", ["DNV", "KR"], "SER-2026-A", "한빛중공업", "2027-05-21"],
  ["HN-2025-108", "MV CIRRUS 9", "9500008", "대양해운", "LNG Carrier", ["BV"], "SER-2026-A", "한빛중공업", "2028-09-14"],
  ["HN-2025-112", "MV ARIA 13", "9500012", "대양해운", "Tanker", ["KR"], "SER-2026-A", "한빛중공업", "–"],
];

const snippets = {
  shell: snip("sidebar/default"), header: snip("page-header/with-action"), search: snip("search-box/default"), filter: snip("filter-bar/with-active-filters"),
  table: snip("table/default"), rows: snip("rows-per-page/default"), pagination: snip("pagination/default"), empty: snip("empty/default"),
  skeleton: snip("skeleton/default"), error: snip("error-state/with-retry"), badge: snip("badge/default"), status: snip("status-badge/with-dot"),
  card: snip("card/default"), tabs: snip("tabs/default"), textarea: snip("textarea/default"), buttonOutline: snip("button/states/default--variant-outline"),
  buttonDestructiveOutline: snip("button/states/default--variant-destructive-outline"), alert: snip("alert/default"),
  badgeOutline: snip("badge/states/default--variant-outline"), breadcrumb: snip("breadcrumb/two-levels"),
  // 열린 상태(트리거 클릭 후 포털 포함) — 필터 추가 패널 · 페이지당 셀렉트 · 상단바 시계 메뉴(사이드바 스토리의 5번째 트리거) · 삭제 확인 다이얼로그
  filterOpen: optSnip("filter-bar/states/empty--open"), rowsOpen: optSnip("rows-per-page/states/default--open"), clockOpen: optSnip("sidebar/states/default--open-4"),
  dialogOpen: optSnip("dialog/small"), buttonDestructive: optSnip("button/states/default--variant-destructive"),
};

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const page = await browser.newPage();
await page.setContent("<!doctype html><html><body></body></html>");

const build = (spec) => page.evaluate(({ S, spec, NAV, ROWS }) => {
  const parse = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content; };
  const node = (h, sel) => { const f = parse(h); return sel ? f.querySelector(sel) : f.firstElementChild; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  // Radix 런타임 흔적 제거 — 인라인 style(outline/pointer-events)·포커스 가드. 생성 규약(인라인 style 금지)과 충돌하는 FE 스냅샷 잔재
  const clean = (root) => { root.querySelectorAll("[data-radix-focus-guard]").forEach((x) => x.remove()); root.querySelectorAll("[style]").forEach((x) => { if (/^(\s*(outline|pointer-events|position|opacity)\s*:[^;]*;?\s*)+$/.test(x.getAttribute("style"))) x.removeAttribute("style"); }); return root; };
  const replaceText = (root, from, to) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.replace(from, to); };
  const replaceRe = (root, re, to) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, to); };
  // 상태 섹션 복제 — 복제본의 트리거는 패널을 잇지 않는다(패널은 기본 상태에만 한 벌)
  const clone = (x) => { const c = x.cloneNode(true); c.querySelectorAll("[aria-controls]").forEach((y) => y.removeAttribute("aria-controls")); return c; };
  // 열린 상태 스냅샷(states/<스토리>--open.html)의 트리거 속성 + 포털을 우리 트리거에 잇는다 — ds.js 가 열고 닫는다.
  // id 는 스냅샷마다 radix-«r0» 로 겹치므로 새로 매기고, 포털은 portals 상자(뷰 끝)에 hidden 으로 둔다
  const portals = el("div");
  let popN = 0;
  const wireOpen = (trigger, openHtml) => {
    if (!trigger || !openHtml) return null;
    const [rootHtml, portalHtml = ""] = openHtml.split("\n<!-- portal -->\n");
    const root = parse(rootHtml), portal = parse(portalHtml);
    // 트리거가 루트에 있으면(열린 상태 스냅샷) 그 속성을 베끼고, 없으면(dialog/small 처럼 열린 채로만 찍힌 스토리) 포털의 role 로 정한다
    const src = root.querySelector('[aria-controls][data-state="open"], [aria-controls][aria-expanded="true"]');
    const content = src ? portal.getElementById(src.getAttribute("aria-controls")) : portal.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]');
    if (!content) return null;
    const oldT = src ? src.getAttribute("id") : null;
    const n = ++popN, newC = `ds-pop-${n}`, newT = `ds-trig-${n}`;
    content.id = newC; trigger.setAttribute("aria-controls", newC);
    if (src && src.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", src.getAttribute("aria-haspopup"));
    else if (src && src.getAttribute("role") === "combobox") { if (!trigger.getAttribute("role")) trigger.setAttribute("role", "combobox"); }
    else trigger.setAttribute("aria-haspopup", ({ dialog: "dialog", alertdialog: "dialog", menu: "menu", listbox: "listbox" })[content.getAttribute("role")] || "dialog");
    trigger.setAttribute("aria-expanded", "false"); trigger.setAttribute("data-state", "closed");
    if (oldT) { portal.querySelectorAll(`[aria-labelledby="${oldT}"]`).forEach((x) => x.setAttribute("aria-labelledby", newT)); trigger.id = newT; }
    const box = content.closest("[data-radix-popper-content-wrapper]") || content;
    box.hidden = true; content.setAttribute("data-state", "closed");
    portal.querySelectorAll("[data-radix-focus-guard]").forEach((x) => x.remove());
    [...portal.children].forEach((x) => { if (/overlay/.test(x.getAttribute("data-slot") || "")) { x.hidden = true; x.setAttribute("data-state", "closed"); } portals.appendChild(x); });
    return content;
  };
  // 선급 칩(디자이너 확정 2026-09-08): outline 배지, 복수일 때 첫 항목(주선급)에만 진회색 점
  const classBadge = (text, primary) => { const s = node(S.badgeOutline, '[data-slot="badge"], span').cloneNode(true); s.classList.add("font-normal"); s.textContent = text; if (primary) s.prepend(el("span", "size-1.5 shrink-0 rounded-full bg-foreground")); return s; };

  // ── 셸(FE AppShell) — 내비 라벨·브랜드·사용자·시각만 바꾸고 본문 main 을 비운다 ──
  const shell = node(S.shell);
  const btns = [...shell.querySelectorAll('[data-slot="sidebar-menu-button"]')];
  shell.querySelectorAll('[data-slot="sidebar-group-label"]').forEach((g) => g.remove());
  btns.forEach((b, i) => {
    const li = b.closest("li") || b;
    if (i >= NAV.length) { li.remove(); return; }
    const span = b.querySelector("span:last-child"); if (span) span.textContent = NAV[i];
    b.setAttribute("data-active", NAV[i] === spec.navActive ? "true" : "false");
  });
  replaceText(shell, "HiNAS 365", spec.brand);
  replaceText(shell, "()", "(v1.4.0)"); // 스토리의 버전 자리가 비어 "()" 로 찍힌다 — FE 에 props 요청 중(Chromatic 빌드 6 코멘트)
  replaceText(shell, "지윤", spec.user); replaceText(shell, "jiyun@avikus.ai", spec.email);
  const av = shell.querySelector('[data-slot="avatar-fallback"]'); if (av) av.textContent = spec.user.slice(0, 1);
  // FE 사이드바 스토리는 접힌 상태(icon)로 찍혀 있다 — 화면은 펼친 상태가 기본이므로 상태 속성만 바꾼다(shadcn Sidebar 규약: expanded + collapsible="")
  const sb = shell.querySelector('[data-slot="sidebar"]'); if (sb) { sb.setAttribute("data-state", "expanded"); sb.setAttribute("data-collapsible", ""); }
  // 본문 = 셸의 안쪽 main(바깥 main[data-slot=sidebar-inset] 은 상단바를 품고 있다 — 첫 파일럿은 바깥을 잡아 상단바를 지웠다)
  const main = shell.querySelector('main[data-slot="sidebar-inset"] > main'); main.className = "flex-1 overflow-auto bg-secondary p-8"; main.innerHTML = "";
  // 상단바(FE 헤더 그대로): 좌측 빈 슬롯에 브레드크럼, 시계는 KST · 화면 시각, 시계 메뉴는 열린 상태 스냅샷을 잇는다
  const header = shell.querySelector("header");
  if (header) {
    const bc = node(S.breadcrumb); const items = [...bc.children];
    while (items.length < spec.crumbs.length) { const c = items[items.length - 1].cloneNode(true); bc.appendChild(c); items.push(c); }
    items.forEach((it, i) => { if (i < spec.crumbs.length) it.querySelector("span").textContent = spec.crumbs[i]; else it.remove(); });
    header.firstElementChild.appendChild(bc);
    replaceText(header, "UTC", "KST"); replaceRe(header, /\+0\b/, "+9"); replaceRe(header, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/, "2026-08-20 15:30");
    wireOpen(header.querySelector('[data-slot="dropdown-menu-trigger"]'), S.clockOpen);
  }

  // ── 페이지 제목 행(FE BoardBox 의 제목 행만 — 바깥 감싸개·본문 상자 제외) ──
  const titleRow = () => { const h = node(S.header, "h2").parentElement.cloneNode(true); h.querySelector("h2").textContent = spec.title; const b = h.querySelector("button"); if (spec.action) { b.textContent = spec.action.label; if (spec.action.variant === "destructive-outline") b.className = node(S.buttonDestructiveOutline, "button").className; } else b.parentElement.remove(); return h; };
  const badge = (text, tone) => { const s = node(S.status, '[data-slot="badge"]').cloneNode(true); s.querySelector("span:last-child").textContent = text; if (tone) s.className = s.className.replace(/\btext-success\b/, "text-" + tone); return s; };
  const plainBadge = (text) => { const s = node(S.badge, '[data-slot="badge"], span').cloneNode(true); s.textContent = text; return s; };
  const card = (title, bodyEl, desc) => { const c = node(S.card).cloneNode(true); c.className = "rounded-lg border bg-card text-card-foreground"; const head = c.children[0], body = c.children[1]; head.className = "p-6 pb-0"; head.children[0].className = "text-sm font-medium text-secondary-foreground"; head.children[0].textContent = title; if (desc) head.children[1].textContent = desc; else head.children[1].remove(); body.className = "p-6"; body.innerHTML = ""; body.appendChild(bodyEl); return c; };
  // 키-값 표 — 임의 값(grid-cols-[8rem_1fr]) 대신 표준 클래스만: 행 = flex, 키 폭 = w-32(8rem)
  const kv = (pairs, cols) => { const g = el("dl", "grid gap-x-6 gap-y-3 text-sm" + (cols === 2 ? " grid-cols-2" : "")); pairs.forEach(([k, v, mono]) => { const row = el("div", "flex gap-4"); row.appendChild(el("dt", "w-32 shrink-0 text-secondary-foreground", k)); row.appendChild(el("dd", mono ? "font-mono" : "", v)); g.appendChild(row); }); return g; };
  const emptyBlock = (title, desc, action) => { const e = node(S.empty); replaceText(e, "등록된 호선이 없습니다", title); replaceText(e, "새 호선을 추가하여 시작하세요.", desc); const b = e.querySelector("button"); if (b) b.textContent = action; return e; };
  const errorBlock = (title, desc) => { const e = node(S.error); replaceText(e, "계약 목록을 불러오지 못했습니다", title); replaceText(e, "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.", desc); return e; };
  const skeletonRows = (n) => { const box = el("div", "space-y-3 rounded-md border bg-card p-4"); for (let i = 0; i < n; i++) { const s = node(S.skeleton, '[data-slot="skeleton"]').cloneNode(true); s.className = "bg-accent animate-pulse rounded-md h-4 " + (i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-1/2" : "w-2/3"); box.appendChild(s); } return box; };

  let body;
  if (spec.pattern === "A") {
    // 필터 행: search-box + filter-bar(empty)
    // 스토리 장식 감싸개(p-8 w-[500px] · p-4)는 벗기고 컴포넌트 요소만 쓴다
    const filterRow = el("div", "flex flex-wrap items-center gap-2");
    const search = node(S.search, '[data-slot="input-group"]').parentElement; const inp = search.querySelector("input"); if (inp) inp.setAttribute("placeholder", "Hull No. · 선명 · IMO · 선주 · 조선소 · 시리즈 코드 검색"); filterRow.appendChild(search);
    // FE 필터 바(활성 필터 스토리): 칩은 하나만 남겨 '선주' 로, '필터 추가' 는 열린 상태 스냅샷의 패널(필드 목록)을 잇는다
    const fb = node(S.filter, ".flex.flex-wrap");
    const btns = [...fb.querySelectorAll("button")];
    const add = btns.find((b) => /필터 추가/.test(b.textContent));
    const chips = btns.filter((b) => b.getAttribute("data-slot") === "popover-trigger" && b !== add);
    chips.forEach((b, i) => {
      if (i === 0) { const sp = b.querySelector("span"); if (sp) sp.textContent = "선주 · 대양해운"; b.removeAttribute("aria-controls"); return; }
      const p = b.parentElement; b.remove(); if (p && p !== fb && !p.children.length) p.remove();
    });
    wireOpen(add, S.filterOpen);
    filterRow.appendChild(fb);
    // 표: FE DataTable 의 th·tr 을 템플릿으로 복제
    const table = node(S.table); const thead = table.querySelector("thead tr"); const th0 = thead.querySelector("th"); thead.innerHTML = "";
    spec.columns.forEach((c) => { const t = th0.cloneNode(true); t.textContent = c; thead.appendChild(t); });
    const tbody = table.querySelector("tbody"); const tr0 = tbody.querySelector("tr"); const td0 = tr0.querySelector("td"); tbody.innerHTML = "";
    ROWS.forEach((r) => { const tr = tr0.cloneNode(false); r.forEach((v, i) => { const td = td0.cloneNode(false); if (i === 0) { const a = el("a", "text-primary hover:underline", v); a.href = "#"; td.appendChild(a); } else if (i === 5) { const w = el("div", "flex items-center gap-1"); v.forEach((c, j) => w.appendChild(classBadge(c, v.length > 1 && j === 0))); td.appendChild(w); } else if (i === 2 || i === 6 || i === 8) { td.className += " font-mono"; td.textContent = v; } else td.textContent = v; tr.appendChild(td); }); tbody.appendChild(tr); });
    // 푸터 레시피(body-patterns A) = FE rows-per-page(라벨·셀렉트·전체 건수를 이미 포함) + pagination. 숫자만 바꾸고 셀렉트는 열린 상태 스냅샷을 잇는다
    const footer = el("div", "flex items-center justify-between gap-4");
    const rows = node(S.rows); replaceText(rows, "143", "247"); wireOpen(rows.querySelector('[role="combobox"]'), S.rowsOpen); footer.appendChild(rows);
    const pg = el("div", "shrink-0"); pg.appendChild(node(S.pagination)); footer.appendChild(pg);
    const sec = (state, ...children) => { const s = el("section", "space-y-6"); s.setAttribute("data-state", state); if (state !== "default") s.hidden = true; children.forEach((c) => s.appendChild(c)); return s; };
    body = [
      sec("default", titleRow(), filterRow, table, footer),
      sec("empty", titleRow(), clone(filterRow), emptyBlock("조건에 맞는 호선이 없습니다", "검색어나 필터를 바꿔 보세요.", "조건 초기화")),
      sec("loading", titleRow(), clone(filterRow), skeletonRows(8)),
      sec("error", titleRow(), errorBlock("호선 목록을 불러오지 못했습니다", "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.")),
    ];
  } else {
    // B 상세: 좌 본문(제원·전자장비·계약 이력·납품 제품·탭) + 우 레일(호선 정보·참여 계약)
    // alert 스니펫: 장식 감싸개(p-8 max-w-xl) 안의 role=alert 만 쓴다. 제목 h5 · 본문 div 의 글자만 교체
    const alert = node(S.alert, '[role="alert"]'); const at = alert.querySelector("h5"); if (at) at.textContent = "미입력 식별자 — IMO · Ship Name"; const ad = alert.querySelector(":scope > div"); if (ad) ad.textContent = "선박 명명·등록 후 호선 정보에서 채워주세요.";
    const specCard = card("선박 제원", kv([["GT", "50,000 t"], ["DWT", "65,000 t"], ["LOA", "230.0 m"], ["LBP", "220.0 m"], ["Beam", "32.2 m"], ["Depth", "18.5 m"], ["Scantling Draft", "13.5 m"], ["엔진 수", "2기"], ["엔진 타입", "MAN B&W"], ["UR E27 적용", "예"]], 2));
    const makerCard = card("전자장비·메이커", kv([["AMS Maker", "Raytheon"], ["BMS Maker", "Kongsberg"], ["ECDIS Maker", "JRC"], ["Auto Pilot Maker", "Furuno"]], 2));
    const table = (cols, rows) => { const t = node(S.table); const thead = t.querySelector("thead tr"); const th0 = thead.querySelector("th"); thead.innerHTML = ""; cols.forEach((c) => { const x = th0.cloneNode(true); x.textContent = c; thead.appendChild(x); }); const tb = t.querySelector("tbody"); const tr0 = tb.querySelector("tr"); const td0 = tr0.querySelector("td"); tb.innerHTML = ""; rows.forEach((r) => { const tr = tr0.cloneNode(false); r.forEach((v) => { const td = td0.cloneNode(false); if (typeof v === "string") td.textContent = v; else td.appendChild(v); tr.appendChild(td); }); tb.appendChild(tr); }); return t; };
    const link = (t) => { const a = el("a", "font-mono text-primary hover:underline", t); a.href = "#"; return a; };
    const contracts = table(["계약", "계약 항목", "상태"], [[link("C-2026-001 대양해운"), "Control 신규 납품·구독, SVM 신규 납품·구독, Cloud 구독 5척", badge("유효", "success")], [link("C-2026-017 서해해운"), "Navigation 신규 납품·구독, Cloud 구독 3척", badge("취소", "destructive")], [link("C-2025-003 대양해운"), "Control 신규 납품·구독, Cloud 구독 3척", badge("유효", "success")]]);
    const products = table(["제품", "이행 종류", "계약 · 계약 항목", "납품 예정일", "커미셔닝 예정일"], [["Control", plainBadge("제품 신규 납부"), link("C-2026-001"), "2027-03-01", "2027-05-01"], ["SVM", plainBadge("제품 신규 납부"), link("C-2026-001"), "2027-03-01", "미입력"], ["Cloud", plainBadge("구독 갱신·신규 전환"), link("C-2026-001"), "미입력", "미입력"], ["Navigation", plainBadge("제품 신규 납부"), link("C-2026-017"), "2026-05-01", "미입력"]]);
    const tabs = node(S.tabs); tabs.className = "w-full"; const tl = [...tabs.querySelectorAll('[role="tab"]')]; tl[0].textContent = "댓글 (1)"; tl[1].textContent = "변경 이력"; tl[2].remove(); const panels = [...tabs.querySelectorAll('[role="tabpanel"], [id$="-content-overview"], [id$="-content-analytics"], [id$="-content-settings"]')];
    const p0 = tabs.querySelector('[id$="-content-overview"]') || panels[0]; if (p0) { p0.innerHTML = ""; const c = el("div", "space-y-4"); c.appendChild(el("div", "text-sm", "<span class=\"font-medium\">박준혁</span> <span class=\"text-secondary-foreground\">2026-07-30 16:50</span><p class=\"mt-1\">@김민준 선명·인도 예정일 갱신했습니다. 주선급 DNV 전환 건도 확인 부탁드려요.</p>")); const ta = node(S.textarea, "textarea") || node(S.textarea); ta.setAttribute("placeholder", "댓글을 입력하세요 — @로 유저 태그"); c.appendChild(ta); const bt = node(S.header, "button").cloneNode(true); bt.textContent = "등록"; c.appendChild(bt); p0.appendChild(c); }
    const p1 = tabs.querySelector('[id$="-content-analytics"]') || panels[1]; if (p1) { p1.innerHTML = ""; p1.hidden = true; p1.appendChild(el("p", "text-sm text-secondary-foreground", "변경 이력이 없습니다.")); }
    const p2 = tabs.querySelector('[id$="-content-settings"]'); if (p2) p2.remove();
    const section = (title, ...els) => { const s = el("div", "space-y-3"); s.appendChild(el("h2", "text-sm font-medium text-secondary-foreground", title)); els.forEach((e) => s.appendChild(e)); return s; };
    const left = el("div", "min-w-0 flex-1 space-y-6"); [section("제원", specCard, makerCard), section("계약 이력 (3)", contracts), section("납품 제품 (4)", products), tabs].forEach((x) => left.appendChild(x));
    const rail = el("div", "w-80 shrink-0 space-y-4");
    const infoBody = kv([["Hull Number", "1001", true], ["IMO", "미입력"], ["Ship Name", "미입력"], ["선주", "대양해운"], ["조선소", "한빛중공업"], ["Call Sign", "—"], ["선종", "Container"], ["시리즈 코드", "SER-2026-A", true], ["인도 예정일", "2027-06-01", true]]); rail.appendChild(card("호선 정보", infoBody));
    const cl = el("ul", "space-y-2 text-sm"); ["C-2026-001 대양해운", "C-2026-017 서해해운", "C-2025-003 대양해운"].forEach((t) => { const li = el("li"); li.appendChild(link(t)); cl.appendChild(li); }); rail.appendChild(card("참여 계약 (3)", cl));
    const two = el("div", "flex items-start gap-6"); two.appendChild(left); two.appendChild(rail);
    const sec = (state, ...children) => { const s = el("section", "space-y-6"); s.setAttribute("data-state", state); if (state !== "default") s.hidden = true; children.forEach((c) => s.appendChild(c)); return s; };
    // 호선 삭제 → 확인 다이얼로그(FE dialog/small 스토리의 포털 그대로, 글자만 교체)
    const tr = titleRow();
    const dlg = wireOpen(tr.querySelector("button"), S.dialogOpen);
    if (dlg) {
      const t = dlg.querySelector('[data-slot="dialog-title"]'); if (t) t.textContent = "호선을 삭제할까요?";
      const d = dlg.querySelector('[data-slot="dialog-description"]'); if (d) d.textContent = "Hull 1001 · MV EXAMPLE 을 삭제합니다. 되돌릴 수 없고, 연결된 계약 이력은 유지됩니다.";
      const fb = [...dlg.querySelectorAll('[data-slot="dialog-footer"] button')];
      if (fb.length) { const last = fb[fb.length - 1]; last.textContent = "삭제"; if (S.buttonDestructive) last.className = node(S.buttonDestructive, "button").className; if (fb.length > 1) { fb[0].textContent = "취소"; fb[0].setAttribute("data-ds-close", ""); } }
    }
    body = [
      sec("default", tr, alert, two),
      sec("empty", titleRow(), emptyBlock("아직 등록된 정보가 없습니다", "호선 정보를 입력하면 여기에 표시됩니다.", "호선 정보 입력")),
      sec("loading", titleRow(), skeletonRows(10)),
      sec("error", titleRow(), errorBlock("호선 정보를 불러오지 못했습니다", "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.")),
    ];
  }
  const view = el("section"); view.setAttribute("data-view", "default"); body.forEach((b) => view.appendChild(b));
  view.appendChild(portals); // 열린 상태 패널들(hidden) — ds.js 가 트리거 아래로 띄운다
  main.appendChild(view);
  clean(shell);
  return shell.outerHTML;
}, { S: snippets, spec, NAV, ROWS });

mkdirSync(OUT, { recursive: true });
const feBuild = idx.components.button?.feBuild ?? "?";
const pages = [
  {
    file: "vessels-list.html", title: "계약 호선 — 파일럿(생성 HTML)", pattern: "A",
    spec: { pattern: "A", navActive: "계약 호선", brand: "세일즈포스 대체", crumbs: ["세일즈포스 대체", "계약 호선"], user: "김민준 · 영업", email: "mj.kim@company.com", title: "계약 호선", action: { label: "+ 호선 등록" }, columns: ["Hull Number", "호선명", "IMO", "선주", "선종", "선급", "시리즈 코드", "조선소", "인도 예정일"] },
    meta: { pattern: "A 리스트", screen: "① 메인 레이아웃 본문 · A 리스트 — 상단바(브레드크럼·시계) → 제목 행 → 검색·필터 행 → 표 → 푸터(페이지당·건수·페이지네이션)", snippets: ["sidebar/default", "sidebar/states/default--open-4(시계 메뉴)", "breadcrumb/two-levels", "page-header/with-action", "search-box/default", "filter-bar/with-active-filters", "filter-bar/states/empty--open(필터 추가 패널)", "table/default", "badge/states/default--variant-outline", "rows-per-page/default", "rows-per-page/states/default--open(페이지당 목록)", "pagination/default", "empty/default", "skeleton/default", "error-state/with-retry"], fallbacks: [], filled: "0개 · 검색창은 빈 상태(입력값 있는 상태는 search-box 의 typing 스토리로 대체 가능)",
      fields: [["hull", "string", "필수", "1001 · HN-2025-001"], ["shipName", "string | null", "선택", "MV EXAMPLE"], ["imo", "string | null", "선택", "9876543"], ["owner", "string", "필수", "대양해운"], ["shipType", "enum", "필수", "Container · Bulk Carrier · RoRo · LNG Carrier · Tanker"], ["classes", "string[]", "선택", "KR, DNV"], ["seriesCode", "string", "필수", "SER-2026-A"], ["yard", "string", "필수", "한빛중공업"], ["deliveryOn", "date | null", "선택", "2027-06-01"]],
      states: ["기본: 표 10행 + 푸터", "빈: 조건에 맞는 호선 없음(조건 초기화 버튼)", "로딩: 스켈레톤 8줄", "에러: 목록 불러오기 실패(재시도)"],
      actions: ["+ 호선 등록 → 호선 등록 폼", "Hull Number 링크 → 호선 상세", "필터 추가 → 필드 목록 패널(열린 상태 스냅샷, ds.js 가 열고 닫음)", "페이지당 → 20/40/60 목록(열린 상태 스냅샷)", "상단바 시계 → 시간대 메뉴(열린 상태 스냅샷)", "페이지네이션 → 목록 갱신(미리 그린 상태 없음)"],
      decisions: ["CTA 는 제목 행, 건수는 푸터가 소유(body-patterns A)", "선급은 outline Badge 나열, 복수일 때 첫 항목(주선급)에 진회색 점(2026-09-08 확정)", "IMO·시리즈 코드·날짜는 font-mono", "셸은 FE AppShell(HiNAS 로고 그대로 — 브랜드 props 는 FE 요청 중)"], prompt: "계약 호선 목록 화면 — 메인 레이아웃 본문, A 리스트. 갤러리 sales365/vessels 와 같은 구성." },
  },
  {
    file: "vessel-detail.html", title: "호선 상세 — 파일럿(생성 HTML)", pattern: "B",
    spec: { pattern: "B", navActive: "계약 호선", brand: "세일즈포스 대체", crumbs: ["세일즈포스 대체", "계약 호선", "Hull 1001"], user: "김민준 · 영업", email: "mj.kim@company.com", title: "Hull 1001 · MV EXAMPLE", action: { label: "호선 삭제", variant: "destructive-outline" } },
    meta: { pattern: "B 상세", screen: "① 메인 레이아웃 본문 · B 상세 — 상단바(브레드크럼·시계) → 제목 행 → 경고 배너 → 좌 본문(제원·전자장비·계약 이력·납품 제품·댓글/변경 이력 탭) + 우 레일(호선 정보·참여 계약)", snippets: ["sidebar/default", "sidebar/states/default--open-4(시계 메뉴)", "breadcrumb/two-levels", "page-header/with-action", "button/states/default--variant-destructive-outline", "dialog/small(삭제 확인)", "button/states/default--variant-destructive", "alert/default", "card/default", "table/default", "badge/default", "status-badge/with-dot", "tabs/default", "textarea/default", "empty/default", "skeleton/default", "error-state/with-retry"], fallbacks: [], filled: "0개 · 댓글 입력창은 빈 상태",
      fields: [["hull", "string", "필수", "1001"], ["imo", "string | null", "선택", "미입력"], ["shipName", "string | null", "선택", "MV EXAMPLE"], ["owner", "string", "필수", "대양해운"], ["yard", "string", "필수", "한빛중공업"], ["shipType", "enum", "필수", "Container"], ["seriesCode", "string", "필수", "SER-2026-A"], ["deliveryOn", "date", "선택", "2027-06-01"], ["spec.gt / dwt / loa / lbp / beam / depth / draft", "number", "선택", "50,000 t · 230.0 m"], ["makers.ams / bms / ecdis / autopilot", "string", "선택", "Raytheon"], ["contracts[]", "{ id, items, status }", "-", "C-2026-001 · 유효"], ["products[]", "{ product, kind, contractId, deliveryOn, commissioningOn }", "-", "Control · 제품 신규 납부"]],
      states: ["기본: 상세 전체", "빈: 등록 정보 없음(호선 정보 입력 버튼)", "로딩: 스켈레톤 10줄", "에러: 상세 불러오기 실패(재시도)"],
      actions: ["호선 삭제(destructive-outline) → 확인 다이얼로그(dialog/small 포털, ds.js 가 열고 닫음)", "계약 링크 → 계약 상세", "탭 댓글/변경 이력 전환(ds.js)", "상단바 시계 → 시간대 메뉴(열린 상태 스냅샷)", "댓글 등록"],
      decisions: ["카드는 보더 카드로 통일(FE Card 의 shadow 제거 — DS 규칙, FE 에 요청 중)", "우 레일 320px(w-80)", "미입력 식별자 배너는 alert 스니펫"], prompt: "호선 상세 화면 — 메인 레이아웃 본문, B 상세. 갤러리 sales365/vessels/detail 과 같은 구성." },
  },
];
for (const p of pages) {
  const shell = await build(p.spec);
  const states = [{ k: "default", ko: "기본" }, { k: "empty", ko: "빈" }, { k: "loading", ko: "로딩" }, { k: "error", ko: "에러" }];
  const html = DOC(p.title, PILLS(states) + "\n" + shell.replace("</main></main>", SPEC({ ...p.meta, feBuild }) + "</main></main>"));
  writeFileSync(join(OUT, p.file), html);
  console.log(`[pilot] ${p.file} — ${(html.length / 1024).toFixed(0)}KB`);
}
await browser.close();
