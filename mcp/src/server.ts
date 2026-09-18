// MCP 서버 정의 — 도구 7종 + 리소스. 요청마다 새 인스턴스(무상태). 원천은 전부 ds.ts(배포 사이트 정적 파일).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { BASE, contrastPairs, doc, json, optional, registry, semanticMap, storyIndex, storybookDocsUrl, text, typography } from "./ds.js";

const ok = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const slice = (md: string, from: string, to: string) => { const a = md.indexOf(from); if (a < 0) return ""; const b = md.indexOf(to, a + from.length); return md.slice(a, b < 0 ? undefined : b); };

/** claude.ai 단독 HTML 출력 규약 — CLAUDE.md 생성 계약(세션·tsx 기준)을 HTML 파일 한 장으로 옮긴 것 */
const HTML_RULES = `# 단독 HTML 출력 규약 (claude.ai · MCP 경로)

1. 산출물은 **HTML 파일 한 장**. <head> 에 \`<link rel="stylesheet" href="${BASE}/ds.css">\` 한 줄 — DS 토큰·유틸리티·컴포넌트 클래스 전부가 여기 있다. 다른 CSS·CDN·인라인 style 금지.
2. <body class="bg-background text-foreground antialiased"> 로 시작. 다크·Control 모드는 <html class="dark"> / <html class="theme-control">.
3. 컴포넌트는 반드시 \`get_component\` 가 준 스토리 HTML 스니펫을 복사해 내용만 바꾼다(클래스 조합을 새로 발명하지 않는다). 목록에 없는 요소는 shadcn 기본형 마크업을 쓰되 **눈에 보이는 마커**로 감싼다:
   \`<div data-ds="fallback" class="rounded-md border border-dashed border-muted-foreground/40 p-2"><span class="mb-1 block text-xs text-muted-foreground">미채택: <이름></span>…</div>\`
4. 모든 화면은 기본·빈·로딩·에러 4개 상태를 담는다 — \`<section data-state="default|empty|loading|error">\` 4개(기본만 표시, 나머지 hidden) + 상단 중앙 플로팅 필(StatePreview 대체):
   \`<div class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-card p-1 shadow-card"><button data-pick="default" class="rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground">기본</button><button data-pick="empty" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">빈</button><button data-pick="loading" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">로딩</button><button data-pick="error" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">에러</button></div>\`
   + 끝에 스크립트: \`<script>document.querySelectorAll("[data-pick]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-state]").forEach(s=>s.hidden=s.dataset.state!==b.dataset.pick);document.querySelectorAll("[data-pick]").forEach(x=>{const on=x===b;x.className=on?"rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground":"rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent"})}))</script>\`
5. 임의 값 금지 — hex 색(#…)·\`-[…]\` 임의 클래스·인라인 style 없음. 색은 토큰 클래스(bg-primary · text-secondary-foreground …)만, 틴트(/N)는 허용 목록만.
6. 생성 전 \`get_generation_contract\` → 프레임 질문(\`get_layout\`) → 컴포넌트 스니펫(\`get_component\`) → 작성 → \`check_html\` 로 자가 검사(위반 0 이 될 때까지 수정) → 보고 끝에 **미채택 목록**(컴포넌트 · 자리 · 이유).`;

export function createServer() {
  const server = new McpServer({ name: "hinas-365-ds", version: "0.1.0" });

  server.registerTool("list_components", {
    title: "DS 컴포넌트 목록",
    description: "Storybook 에 있는 DS 컴포넌트 전부(= 생성에 쓸 수 있는 어휘). status 로 필터. 각 항목: key(get_component 인자)·이름·스토리 목록·Storybook 문서 URL·노트 요약.",
    inputSchema: { status: z.enum(["adopted", "primitive", "retired", "all"]).optional().describe("기본 adopted — 채택분만") },
  }, async ({ status }) => {
    const reg = await registry();
    let idx: any = null; try { idx = await storyIndex(); } catch { idx = null; }
    const want = status && status !== "all" ? status : status === "all" ? null : "adopted";
    const rows = Object.entries(reg.components)
      .filter(([, e]) => !want || e.status === want)
      .map(([key, e]) => ({
        key, name: e.name, status: e.status, section: e.section,
        file: e.file, stories: idx?.components?.[key]?.stories?.map((s: any) => s.name) ?? [],
        storybook: e.stories ? storybookDocsUrl(key) : null,
        note: e.note ? e.note.slice(0, 240) : null,
      }));
    return ok(JSON.stringify({ base: BASE, updated: reg.updated, count: rows.length, components: rows }, null, 1));
  });

  server.registerTool("get_component", {
    title: "컴포넌트 상세(원문 + 렌더 HTML)",
    description: "한 컴포넌트의 레지스트리 노트 전문 · 컴포넌트 소스 · 스토리 소스 · 스토리별 렌더 HTML 스니펫(복사해서 쓴다). 오버레이 계열은 열린 패널이 스니펫에 없으니 스토리 소스를 본다.",
    inputSchema: { key: z.string().describe("list_components 의 key (예: filter-bar)"), include_source: z.boolean().optional().describe("컴포넌트·스토리 소스 포함(기본 true)") },
  }, async ({ key, include_source }) => {
    const reg = await registry();
    const e = reg.components[key];
    if (!e) return ok(`알 수 없는 key: ${key}. list_components 의 key 를 쓰세요.`);
    const idx = await storyIndex().catch(() => null);
    const stories = idx?.components?.[key]?.stories ?? [];
    const snippets = await Promise.all(stories.map(async (s: any) => ({ name: s.name, description: s.description, portal: s.portal, error: s.error ?? null, html: s.error ? null : await optional("/story-html/" + s.file) })));
    const out: any = { key, name: e.name, status: e.status, note: e.note, storybook: e.stories ? storybookDocsUrl(key) : null, figma: e.figma, snippets };
    if (include_source !== false) {
      out.componentSource = e.file ? await optional("/ui-src/" + key + ".tsx.txt") : null;
      out.storySource = e.stories ? await optional("/ui-src/" + key + ".stories.tsx.txt") : null;
    }
    return ok(JSON.stringify(out, null, 1));
  });

  server.registerTool("get_tokens", {
    title: "디자인 토큰(색·타이포)",
    description: "시맨틱 색 토큰(제품 모드별 해석 hex + 팔레트 참조), 허용 틴트(/N), 타이포 스케일. 클래스 이름 = 토큰 이름(bg-primary · text-secondary-foreground · border-border).",
    inputSchema: { mode: z.enum(["light", "dark", "control", "all"]).optional().describe("기본 light(Cloud·365)") },
  }, async ({ mode }) => {
    const map = await semanticMap();
    const typo = await typography().catch(() => null);
    const m = mode && mode !== "all" ? mode : mode === "all" ? null : "light";
    const colors = map.rows.map((r: any) => (m ? { name: r.name, ...(r[m] ?? {}), note: r.note } : r));
    const tints = map.tints.map((t: any) => (m ? { class: t.class, ...(t[m] ?? {}) } : t));
    return ok(JSON.stringify({ base: BASE, css: BASE + "/ds.css", mode: m ?? "all", updated: map.updated, colors, tints, typography: typo }, null, 1));
  });

  server.registerTool("get_layout", {
    title: "레이아웃 프레임 · 본문 패턴",
    description: "레이아웃 프레임(셸·영역 구조) 목록과 본문 패턴(A 리스트·B 상세·C 위저드·D 대시보드·E 프로그레시브 폼). 생성 전 '어느 프레임의 본문인가, 단독 화면인가'를 이 문서로 묻는다.",
    inputSchema: { frame: z.string().optional().describe("특정 프레임 파일명(예: admin-console). 생략 시 README + body-patterns") },
  }, async ({ frame }) => {
    const parts: string[] = [];
    if (frame) parts.push(`# layout/${frame}.md\n\n` + ((await optional(`/docs/layout/${frame}.md`)) ?? "(없음)"));
    else parts.push("# layout/README.md\n\n" + ((await optional("/docs/layout/README.md")) ?? "(없음)"));
    parts.push("# layout/body-patterns.md\n\n" + ((await optional("/docs/layout/body-patterns.md")) ?? "(없음)"));
    const reg = await optional("/docs/index.json");
    if (reg) parts.push("# 문서 목록\n\n" + reg);
    return ok(parts.join("\n\n---\n\n"));
  });

  server.registerTool("get_generation_contract", {
    title: "생성 계약(규칙)",
    description: "페이지 생성 시 지켜야 할 규칙 전부 — 단독 HTML 출력 규약 + CLAUDE.md 생성 절차 + design.md 규칙서. 생성 시작 전에 한 번 읽는다.",
    inputSchema: {},
  }, async () => {
    const claude = (await optional("/docs/CLAUDE.md")) ?? "";
    const design = (await optional("/docs/design.md")) ?? "";
    const contract = slice(claude, "## 페이지 생성 요청을 받으면", "## 질문 출력 형식");
    return ok([HTML_RULES, "# CLAUDE.md — 생성 절차(세션 계약, HTML 경로에도 같은 게이트)\n\n" + contract, "# design.md — 규칙서\n\n" + design].join("\n\n---\n\n"));
  });

  server.registerTool("get_css_bundle", {
    title: "DS CSS 번들",
    description: "단독 HTML 이 링크할 /ds.css 의 URL 과 <link> 태그. inline=true 면 CSS 본문도 반환(크다).",
    inputSchema: { inline: z.boolean().optional() },
  }, async ({ inline }) => {
    const css = await text("/ds.css");
    return ok(JSON.stringify({ url: BASE + "/ds.css", link: `<link rel="stylesheet" href="${BASE}/ds.css">`, bytes: css.length, css: inline ? css : undefined }, null, 1));
  });

  server.registerTool("check_html", {
    title: "HTML 자가 검사",
    description: "생성한 HTML 의 DS 위반을 찾는다 — 임의 hex·임의 값(-[…])·인라인 style·ds.css 에 없는 클래스·틴트 허용 목록 밖·4상태 섹션 누락·상태 필 누락. 미채택 마커(data-ds=fallback) 목록도 뽑는다. 위반 0 이 될 때까지 고친다.",
    inputSchema: { html: z.string().describe("검사할 HTML 전문") },
  }, async ({ html }) => {
    const css = await text("/ds.css");
    const cp = await contrastPairs().catch(() => ({}));
    const allowed = new Set([...css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)(?=[\s,:{.>[~+])/g)].map((m) => m[1].replace(/\\/g, "")));
    const tintsAllowed = new Set(((cp as any).tints?.allowed ?? []).map((t: any) => String(t.class)));
    const v: { rule: string; detail: string }[] = [];
    // 속성값의 HTML 엔티티([&amp;_svg] · has-[&gt;svg] · &#x27;)를 되돌린 뒤 비교 — SSR 스니펫이 그렇게 나온다
    const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
    const classAttrs = [...html.matchAll(/class="([^"]*)"/g)].map((m) => decode(m[1]));
    const classes = new Set(classAttrs.flatMap((c) => c.split(/\s+/).filter(Boolean)));
    for (const c of classes) {
      if (/^lucide(-|$)/.test(c)) continue; // 아이콘 마커 클래스 — 스타일 없음
      const known = allowed.has(c);
      // 컴포넌트가 쓰는 대괄호 변형([&_svg]:… · data-[state=open]:…)은 ds.css 에 있으니 통과 — 번들에 없는 임의 값(w-[300px] 등)만 위반
      if (!known && /-\[[^\]]+\]$/.test(c)) { v.push({ rule: "arbitrary-value", detail: c }); continue; }
      const tint = c.match(/^(?:hover:)?(?:bg|text|border|ring)-([a-z-]+\/\d+)$/);
      if (tint && !tintsAllowed.has(tint[1]) && !/^(muted-foreground\/40|border\/50|ring\/50|primary\/90|destructive\/90|black\/20|white\/10)$/.test(tint[1])) { v.push({ rule: "tint-not-allowed", detail: c }); continue; }
      if (!known) v.push({ rule: "unknown-class", detail: c });
    }
    for (const m of html.matchAll(/style="([^"]*)"/g)) v.push({ rule: "inline-style", detail: m[1].slice(0, 80) });
    // 임의 hex — 색이 들어갈 자리(style·fill·stroke·color 속성, <style> 블록)만 본다. href="#id" 같은 앵커는 제외
    const hexCtx = [...html.matchAll(/(?:style|fill|stroke|color|bgcolor)="([^"]*)"/g)].map((m) => m[1]).concat([...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]));
    for (const ctx of hexCtx) for (const m of ctx.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) v.push({ rule: "raw-hex", detail: m[0] });
    const states = new Set([...html.matchAll(/data-state="(default|empty|loading|error)"/g)].map((m) => m[1]));
    for (const s of ["default", "empty", "loading", "error"]) if (!states.has(s)) v.push({ rule: "missing-state", detail: s });
    if (!/data-pick="default"/.test(html)) v.push({ rule: "missing-state-pill", detail: "상단 중앙 플로팅 필(data-pick) 없음" });
    if (!html.includes("/ds.css")) v.push({ rule: "missing-css-link", detail: `<link rel="stylesheet" href="${BASE}/ds.css">` });
    const fallbacks = [...html.matchAll(/data-ds="fallback"[\s\S]*?미채택:\s*([^<]+)</g)].map((m) => m[1].trim());
    const unknown = v.filter((x) => x.rule === "unknown-class").length;
    return ok(JSON.stringify({ violations: v.length, byRule: v.reduce((a: any, x) => (a[x.rule] = (a[x.rule] || 0) + 1, a), {}), details: v.slice(0, 120), unknownClassNote: unknown ? "ds.css 에 없는 클래스는 스타일이 안 먹는다 — 스니펫의 클래스 조합으로 되돌리거나 토큰 클래스로 바꾼다" : undefined, fallbacks, fallbackNote: fallbacks.length ? "보고 끝에 미채택 목록(컴포넌트 · 자리 · 이유)을 적는다 — 디자이너가 Jira DES 로 판정" : undefined }, null, 1));
  });

  server.registerResource("registry", "ds://registry", { title: "DS 레지스트리", mimeType: "application/json" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: await text("/ds-registry.json") }] }));
  server.registerResource("semantic-map", "ds://tokens/semantic", { title: "시맨틱 토큰(모드별 해석)", mimeType: "application/json" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: await text("/dstk/semantic-map.json") }] }));
  server.registerResource("design-md", "ds://docs/design.md", { title: "design.md 규칙서", mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: await doc("design.md") }] }));
  return server;
}
