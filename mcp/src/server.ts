// MCP 서버 정의 — 도구 7종 + 리소스. 요청마다 새 인스턴스(무상태). 원천은 전부 ds.ts(배포 사이트 정적 파일).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { BASE, doc, optional, registry, semanticMap, storyIndex, storybookDocsUrl, text, typography } from "./ds.js";

const ok = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const slice = (md: string, from: string, to: string) => { const a = md.indexOf(from); if (a < 0) return ""; const b = md.indexOf(to, a + from.length); return md.slice(a, b < 0 ? undefined : b); };

// 단독 HTML 출력 규약 — 원문은 /ds-skill.md 한 곳(claude.ai 스킬과 같은 문서를 읽어 규칙이 갈라지지 않게 한다, 2026-09-18)
const htmlRules = () => text("/ds-skill.md");

export function createServer() {
  const server = new McpServer({ name: "hinas-365-ds", version: "0.1.0" });

  server.registerTool("list_components", {
    title: "DS 컴포넌트 목록",
    description: "DS 컴포넌트 전부. 스토리가 있으면 DS 이고 화면에 쓸 수 있다 — 스토리가 없는 항목은 다른 컴포넌트가 내부에서 쓰는 부품이라 기본 목록에서 빠진다(사람이 켜고 끄는 채택 단계는 2026-09-18 폐기).",
    inputSchema: { include_parts: z.boolean().optional().describe("스토리 없는 부품까지 포함(기본 false)") },
  }, async ({ include_parts }) => {
    const reg = await registry();
    let idx: any = null; try { idx = await storyIndex(); } catch { idx = null; }
    const rows = Object.entries(reg.components)
      .filter(([, e]) => include_parts || !!e.stories)
      .map(([key, e]) => ({
        key, name: e.name, kind: e.stories ? "ds" : "part", section: e.section,
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
    const out: any = { key, name: e.name, kind: e.stories ? "ds" : "part", note: e.note, storybook: e.stories ? storybookDocsUrl(key) : null, figma: e.figma, snippets };
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
    return ok([await htmlRules(), "# CLAUDE.md — 생성 절차(세션 계약, HTML 경로에도 같은 게이트)\n\n" + contract, "# design.md — 규칙서\n\n" + design].join("\n\n---\n\n"));
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
    description: "생성한 HTML 의 DS 위반을 찾는다 — 임의 hex·임의 값(-[…])·인라인 style·ds.css 에 없는 클래스(투명도 변형 포함)·4상태 섹션 누락·상태 필 누락·스토리 없는 컴포넌트 사용(data-slot 역산). 실제로 들어간 컴포넌트 목록과 조건부 UI(값이 있을 때만 나오는 ✕ 등) 존재 여부도 돌려준다 — 스펙 섹션에 그대로 적는다. 위반 0 이 될 때까지 고친다.",
    inputSchema: { html: z.string().describe("검사할 HTML 전문") },
  }, async ({ html }) => {
    const css = await text("/ds.css");
    const allowed = new Set([...css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)(?=[\s,:{.>[~+])/g)].map((m) => m[1].replace(/\\/g, "")));
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
      if (!known) v.push({ rule: "unknown-class", detail: c });
    }
    for (const m of html.matchAll(/style="([^"]*)"/g)) v.push({ rule: "inline-style", detail: m[1].slice(0, 80) });
    // 임의 hex — 색이 들어갈 자리(style·fill·stroke·color 속성, <style> 블록)만 본다. href="#id" 같은 앵커는 제외
    const hexCtx = [...html.matchAll(/(?:style|fill|stroke|color|bgcolor)="([^"]*)"/g)].map((m) => m[1]).concat([...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]));
    for (const ctx of hexCtx) for (const m of ctx.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) v.push({ rule: "raw-hex", detail: m[0] });
    const states = new Set([...html.matchAll(/data-state="(default|empty|loading|progress|error)"/g)].map((m) => m[1]));
    const picks = new Set([...html.matchAll(/data-pick="(default|empty|loading|progress|error)"/g)].map((m) => m[1]));
    for (const s of ["default", "empty", "loading", "error"]) if (!states.has(s)) v.push({ rule: "missing-state", detail: s });
    if (!picks.has("default")) v.push({ rule: "missing-state-pill", detail: "상단 중앙 플로팅 필(data-pick) 없음" });
    // 프로그레스는 진행률이 실재하는 화면만 — 넣었으면 섹션과 알약이 둘 다 있어야 한다(한쪽만 = 복사 흔적)
    if (states.has("progress") !== picks.has("progress")) v.push({ rule: "progress-mismatch", detail: states.has("progress") ? "progress 섹션은 있는데 알약 버튼이 없다" : "progress 알약은 있는데 섹션이 없다" });
    for (const s of ["empty", "loading", "error"]) if (states.has(s) && !picks.has(s)) v.push({ rule: "missing-state-pill", detail: s + " 알약 버튼 없음" });
    if (!html.includes("/ds.css")) v.push({ rule: "missing-css-link", detail: `<link rel="stylesheet" href="${BASE}/ds.css">` });
    const fallbacks = [...html.matchAll(/data-ds="fallback"[\s\S]*?(?:DS에 없음|미채택):\s*([^<]+)</g)].map((m) => m[1].trim());
    const unknown = v.filter((x) => x.rule === "unknown-class").length;

    // ── data-slot 역산 — 화면에 실제로 들어간 컴포넌트(2026-09-21 Phase 0) ──
    // Claude 가 "무엇을 썼다"고 인지했는지와 무관하게 HTML 에 박힌 슬롯으로 센다.
    // 어제 사고 둘 다 여기서 걸린다: 스토리 없는 Separator 를 손으로 조립한 것, 값 채운 검색창에 ✕ 가 빠진 것.
    const reg = await registry();
    const idx = await storyIndex().catch(() => null);
    const compKeys = Object.keys(reg.components).sort((a, b) => b.length - a.length); // 긴 이름 우선 — input-group 이 input 보다 먼저
    const usedSlots = [...new Set([...html.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]))];
    const used = new Map<string, string[]>();
    for (const s of usedSlots) {
      const k = compKeys.find((c) => s === c || s.startsWith(c + "-"));
      if (!k) continue;
      if (!used.has(k)) used.set(k, []);
      used.get(k)!.push(s);
    }
    for (const k of used.keys()) if (!reg.components[k].stories) v.push({ rule: "no-story-component", detail: `${k} — 스토리 없는 부품을 화면에 직접 썼다(DS 아님). DS 컴포넌트로 바꾸거나 data-ds="fallback" 마커로 감싼다` });
    const filledInputs = [...html.matchAll(/<input\b[^>]*\bvalue="([^"]+)"/g)].length;
    const conditional = [...used.keys()].map((k) => {
      const cond: any[] = idx?.components?.[k]?.conditional ?? [];
      if (!cond.length) return null;
      return { component: k, items: cond.map((c) => ({ when: c.when, present: [...(c.slots ?? []), ...(c.labels ?? [])].some((t: string) => html.includes(`data-slot="${t}"`) || html.includes(`aria-label="${t}"`)) })) };
    }).filter(Boolean);

    return ok(JSON.stringify({
      violations: v.length,
      byRule: v.reduce((a: any, x) => (a[x.rule] = (a[x.rule] || 0) + 1, a), {}),
      details: v.slice(0, 120),
      unknownClassNote: unknown ? "ds.css 에 없는 클래스는 스타일이 안 먹는다 — 스니펫의 클래스 조합으로 되돌리거나 토큰 클래스로 바꾼다" : undefined,
      fallbacks,
      fallbackNote: fallbacks.length ? "스펙 섹션 맨 위에 DS 밖 요소로 적고 배너를 띄운다 — 디자이너가 Jira DES 로 판정" : undefined,
      usedComponents: [...used.keys()].sort(),
      filledInputs,
      conditional,
      conditionalNote: conditional.length ? "값이 있을 때만 나오는 UI 다. 그 값을 채웠는데 present=false 면 빠진 것이다 — 그 상태의 스토리(index.json 의 slots·filled)를 고르거나 원문을 확인한다. 확인한 컴포넌트는 스펙 섹션 '값 채운 컨트롤' 줄에 적는다" : undefined,
    }, null, 1));
  });

  server.registerResource("registry", "ds://registry", { title: "DS 레지스트리", mimeType: "application/json" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: await text("/ds-registry.json") }] }));
  server.registerResource("semantic-map", "ds://tokens/semantic", { title: "시맨틱 토큰(모드별 해석)", mimeType: "application/json" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: await text("/dstk/semantic-map.json") }] }));
  server.registerResource("design-md", "ds://docs/design.md", { title: "design.md 규칙서", mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: await doc("design.md") }] }));
  return server;
}
