// DS CSS 번들(MCP 산출물, 2026-09-18) — claude.ai 가 만드는 단독 HTML 이 <link> 하나로 DS 를 입는다.
// globals.css(토큰 + @theme + 컴포넌트 소스 스캔)를 그대로 쓰되 ① 웹폰트 import ② 갤러리 라우트 스캔(레이아웃 유틸)
// ③ 생성 HTML 이 흔히 쓰는 유틸리티 안전 목록(.ds-safelist.html)을 더해 public/ds.css 로 컴파일한다.
// 컴파일러는 playground 가 이미 쓰는 @tailwindcss/postcss(pnpm 격리 경로라 createRequire 로 해석) — 새 의존성 없음.

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PG = resolve(HERE, "..");
const ROOT = resolve(PG, "..");
const req = createRequire(join(PG, "package.json"));
const twPostcssPath = req.resolve("@tailwindcss/postcss");
const inner = createRequire(twPostcssPath);
const postcss = inner("postcss");
const tailwind = req("@tailwindcss/postcss");

// ── 안전 목록 — 생성 HTML 의 레이아웃·타이포·색 유틸리티(스토리에 안 나와도 번들에 포함) ──
const SP = ["0", "0.5", "1", "1.5", "2", "2.5", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24"];
const SPACING = ["p", "px", "py", "pt", "pb", "pl", "pr", "m", "mx", "my", "mt", "mb", "ml", "mr", "gap", "gap-x", "gap-y", "space-x", "space-y"];
const TOKENS = ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground", "destructive", "destructive-foreground", "success", "border", "input", "ring", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "white", "black", "transparent"];
const cp = JSON.parse(readFileSync(join(ROOT, "dstk/contrast-pairs.json"), "utf8"));
const TINTS = (cp.tints?.allowed ?? []).map((t) => String(t.class));
const list = [];
for (const u of SPACING) for (const s of SP) list.push(`${u}-${s}`);
for (const n of [1, 2, 3, 4, 5, 6, 12]) { list.push(`grid-cols-${n}`, `col-span-${n}`, `md:grid-cols-${n}`, `lg:grid-cols-${n}`, `xl:grid-cols-${n}`); }
for (const s of ["auto", "px", "full", "fit", "screen", "1/2", "1/3", "2/3", "1/4", "3/4", ...SP, "28", "32", "36", "40", "44", "48", "56", "64", "72", "80", "96"]) list.push(`w-${s}`, `h-${s}`, `min-w-${s}`, `min-h-${s}`, `max-h-${s}`, `size-${s}`);
for (const s of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "full", "none", "prose"]) list.push(`max-w-${s}`);
list.push("flex", "inline-flex", "flex-1", "flex-none", "flex-col", "flex-row", "flex-wrap", "flex-nowrap", "grow", "shrink-0", "basis-0",
  "items-start", "items-center", "items-end", "items-stretch", "items-baseline", "justify-start", "justify-center", "justify-end", "justify-between", "self-start", "self-center", "self-end",
  "grid", "block", "inline-block", "inline", "hidden", "contents", "table", "table-cell", "table-row",
  "relative", "absolute", "fixed", "sticky", "inset-0", "inset-x-0", "inset-y-0", "top-0", "right-0", "bottom-0", "left-0", "top-4", "right-4", "bottom-4", "left-4", "top-1/2", "left-1/2", "-translate-x-1/2", "-translate-y-1/2", "z-0", "z-10", "z-20", "z-30", "z-40", "z-50",
  "overflow-hidden", "overflow-auto", "overflow-x-auto", "overflow-y-auto", "truncate", "whitespace-nowrap", "whitespace-pre-wrap", "break-words", "break-all",
  "text-left", "text-center", "text-right", "uppercase", "lowercase", "capitalize", "tabular-nums", "underline", "underline-offset-4", "line-through", "italic", "antialiased",
  "text-[10px]", "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold", "font-mono", "font-sans",
  "leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-4", "leading-5", "leading-6", "tracking-tight", "tracking-wide", "tracking-wider",
  "rounded-none", "rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-full", "rounded-t-lg", "rounded-b-lg", "border", "border-0", "border-2", "border-t", "border-b", "border-l", "border-r", "border-x", "border-y", "border-dashed", "border-solid", "divide-y", "divide-x",
  "shadow-none", "shadow-sm", "shadow-md", "shadow-card", "opacity-0", "opacity-40", "opacity-50", "opacity-60", "opacity-70", "opacity-80", "opacity-100",
  "cursor-pointer", "cursor-default", "cursor-not-allowed", "select-none", "pointer-events-none", "sr-only", "list-none", "list-disc", "list-inside", "list-decimal",
  "transition", "transition-colors", "transition-opacity", "duration-150", "duration-200", "duration-300", "animate-pulse", "animate-spin", "aspect-square", "aspect-video", "object-cover", "object-contain",
  "min-h-screen", "h-screen", "w-screen", "max-w-7xl", "mx-auto", "ml-auto", "mr-auto", "mt-auto", "mb-auto", "-mx-1", "-my-1.5", "outline-none", "ring-0", "ring-1", "ring-2", "ring-offset-2", "focus-visible:ring-2", "focus-visible:outline-none", "disabled:opacity-50", "disabled:pointer-events-none");
for (const t of TOKENS) list.push(`bg-${t}`, `text-${t}`, `border-${t}`, `ring-${t}`, `fill-${t}`, `stroke-${t}`, `hover:bg-${t}`, `hover:text-${t}`, `hover:border-${t}`, `divide-${t}`, `placeholder:text-${t}`, `outline-${t}`);
for (const t of TINTS) list.push(`bg-${t}`, `text-${t}`, `border-${t}`, `hover:bg-${t}`);
for (const t of ["muted-foreground/40", "border/50", "ring/50", "primary/90", "destructive/90", "black/20", "white/10"]) list.push(`bg-${t}`, `text-${t}`, `border-${t}`, `ring-${t}`, `outline-${t}`);
const safelist = join(HERE, ".ds-safelist.html");
writeFileSync(safelist, `<!-- 자동 생성(build-ds-css.mjs) — Tailwind 스캔용 클래스 안전 목록. 커밋하지 않는다 -->\n<div class="${[...new Set(list)].join(" ")}"></div>\n`);

// ── 입력 CSS — globals.css + 폰트 + 갤러리 스캔 + 안전 목록 ──
const globals = readFileSync(join(PG, "app/globals.css"), "utf8")
  .replace('@source "./generated";', '@source "./gallery";\n@source "../scripts/.ds-safelist.html";');
const input = [
  '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500&display=swap");',
  globals,
  // next/font 가 주던 변수의 단독 HTML 판
  ':root { --font-inter: "Inter"; --font-roboto-mono: "Roboto Mono"; }',
].join("\n");
const from = join(PG, "app/ds-bundle.css"); // 가상 경로 — 상대 @import·@source 가 globals.css 와 같은 기준으로 풀린다
const result = await postcss([tailwind({ base: join(PG, "app") })]).process(input, { from, map: false });
const out = join(PG, "public/ds.css");
const header = `/* DS CSS 번들 — 자동 생성(pnpm mcp:artifacts). 원천: dstk/*.json → dist/dstk.css + Tailwind(components/src · gallery · 안전 목록). 단독 HTML 은 <link rel="stylesheet" href="/ds.css"> 한 줄. */\n`;
writeFileSync(out, header + result.css);
const classes = new Set([...result.css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)(?=[\s,:{.>[~+])/g)].map((m) => m[1].replace(/\\/g, "")));
// 자가 검사용 허용 클래스 목록 — claude.ai 스킬이 읽어 대조한다(도구 없이 검사하는 경로)
writeFileSync(join(PG, "public/ds-classes.json"), JSON.stringify({
  $note: "ds.css 에 실제로 들어 있는 클래스 전부 + 허용 틴트. 생성 HTML 자가 검사용(pnpm mcp:artifacts).",
  css: "/ds.css",
  $tints: "틴트를 따로 세지 않는다 — ds.css 에 있으면 쓸 수 있고 없으면 못 쓴다(2026-09-18). 디자이너용 틴트 선언은 dstk/contrast-pairs.json 이고 그건 컴포넌트를 만들 때 쓰는 장부다.",
  count: classes.size,
  classes: [...classes].sort(),
}, null, 1));
console.log(`[ds.css] ${(result.css.length / 1024).toFixed(0)} KB · 클래스 ${classes.size} · 안전 목록 ${list.length} → playground/public/ds.css`);
