# Phase 1: 디자인 시스템 뼈대 구축 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설계서(docs/superpowers/specs/2026-07-29-ai-design-system-design.md)의 Phase 1 — 토큰 파이프라인 + design.md + regulations 구조 + 레퍼런스 컴포넌트 15개 + playground 미리보기 앱 — 을 개인 저장소에 구축한다.

**Architecture:** pnpm 워크스페이스 모노레포. `tokens/*.json`(W3C DTCG)이 원천이고, 빌드 스크립트가 CSS 변수를 산출한다. `components/`는 shadcn/ui 기반 `@ds/ui` 패키지, `playground/`는 이를 소비하는 Next.js 앱. 시맨틱 토큰 명명은 shadcn 어휘(background, foreground, primary…)를 채택해 AI 친숙도를 극대화한다.

**Tech Stack:** pnpm workspaces, TypeScript, Style Dictionary v5, Vitest, Next.js(App Router) + Tailwind v4, shadcn/ui

**이 계획의 범위 제외 (후속 계획):** Phase 0 자산 수확(회사 조직 이관 후), 레시피 4종, ESLint 임의값 검출 룰, 피그마 파이프라인, claude.ai standalone 빌드/CI

---

## File Structure

```
UX-DS/  (git root, origin: github.com/younginsa/designsystemin.md)
├── package.json                # 워크스페이스 루트: scripts(tokens:build, test)
├── pnpm-workspace.yaml         # packages: components, playground
├── .gitignore
├── design.md                   # AI 규칙서 (Task 8)
├── CLAUDE.md                   # Claude Code 절차 지침 (Task 10)
├── tokens/
│   ├── core.json               # 원시 값: zinc 팔레트, accent, radius, type scale
│   ├── semantic.json           # 라이트 모드 시맨틱 (shadcn 호환 명명)
│   └── semantic.dark.json      # 다크 모드 오버라이드
├── scripts/
│   ├── build-tokens.ts         # 토큰 → dist/tokens.css + playground/app/tokens.css
│   └── build-tokens.test.ts    # Vitest
├── dist/tokens.css             # 생성물 (커밋함 — 소비자가 빌드 없이 참조)
├── regulations/
│   ├── README.md               # 규정 우선 원칙과 작성법
│   └── _template.md            # 제품별 규정 템플릿
├── components/                 # @ds/ui 패키지
│   ├── package.json
│   ├── tsconfig.json
│   ├── components.json         # shadcn CLI 설정 (ui 패키지 측)
│   ├── src/ui/*.tsx            # shadcn 컴포넌트 15종
│   └── src/lib/utils.ts        # cn()
└── playground/                 # Next.js 앱
    ├── components.json         # shadcn CLI 설정 (앱 측, @ds/ui로 연결)
    ├── app/globals.css         # @theme inline 매핑 + tokens.css import
    ├── app/tokens.css          # 생성물 (build-tokens가 복사)
    ├── app/page.tsx            # 디자인 시스템 갤러리 (토큰+컴포넌트 미리보기)
    └── app/samples/admin-list/page.tsx  # 스모크 테스트용 샘플 페이지
```

---

### Task 1: 워크스페이스 스캐폴드

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `README.md`

- [ ] **Step 1: 루트 파일 4개 생성**

`package.json`:
```json
{
  "name": "designsystemin",
  "private": true,
  "scripts": {
    "tokens:build": "tsx scripts/build-tokens.ts",
    "test": "vitest run",
    "dev": "pnpm --filter playground dev",
    "build": "pnpm tokens:build && pnpm --filter playground build"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - components
  - playground
```

`.gitignore`:
```
node_modules/
.next/
*.log
.DS_Store
.env*
```

`README.md`:
```markdown
# designsystemin — AI 친화 디자인 시스템

자연어 → 목업 코드 → 승인 → 피그마 기록. 설계서: docs/superpowers/specs/2026-07-29-ai-design-system-design.md

- `design.md` — AI 규칙서 (진실의 원천)
- `tokens/` — W3C DTCG 토큰 원천. `pnpm tokens:build`로 CSS 산출
- `components/` — @ds/ui 레퍼런스 컴포넌트 (shadcn 기반)
- `playground/` — 목업 미리보기 Next.js 앱. `pnpm dev`
- `regulations/` — 제품별 우선 규정 (생성 전 필수 검토)
```

- [ ] **Step 2: 커밋**

```bash
git add -A && git commit -m "chore: pnpm 워크스페이스 스캐폴드"
```

---

### Task 2: 토큰 원천 파일 (DTCG)

주의: 아래 값은 **중립 기본값(shadcn zinc 계열)**이다. Phase 0 수확 후 회사 브랜드 값으로 교체된다.

**Files:**
- Create: `tokens/core.json`, `tokens/semantic.json`, `tokens/semantic.dark.json`

- [ ] **Step 1: `tokens/core.json` 생성**

```json
{
  "color": {
    "white": { "$type": "color", "$value": "#ffffff" },
    "zinc": {
      "50":  { "$type": "color", "$value": "#fafafa" },
      "100": { "$type": "color", "$value": "#f4f4f5" },
      "200": { "$type": "color", "$value": "#e4e4e7" },
      "300": { "$type": "color", "$value": "#d4d4d8" },
      "400": { "$type": "color", "$value": "#a1a1aa" },
      "500": { "$type": "color", "$value": "#71717a" },
      "600": { "$type": "color", "$value": "#52525b" },
      "700": { "$type": "color", "$value": "#3f3f46" },
      "800": { "$type": "color", "$value": "#27272a" },
      "900": { "$type": "color", "$value": "#18181b" },
      "950": { "$type": "color", "$value": "#09090b" }
    },
    "blue": {
      "500": { "$type": "color", "$value": "#3b82f6" },
      "600": { "$type": "color", "$value": "#2563eb" }
    },
    "red": {
      "500": { "$type": "color", "$value": "#ef4444" },
      "600": { "$type": "color", "$value": "#dc2626" }
    },
    "green": {
      "600": { "$type": "color", "$value": "#16a34a" }
    }
  },
  "radius": {
    "base": { "$type": "dimension", "$value": "0.625rem" }
  },
  "font": {
    "sans": { "$type": "fontFamily", "$value": "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', Pretendard, 'Noto Sans KR', sans-serif" },
    "mono": { "$type": "fontFamily", "$value": "'SF Mono', 'JetBrains Mono', Menlo, monospace" }
  }
}
```

- [ ] **Step 2: `tokens/semantic.json` 생성 (라이트, shadcn 호환 명명)**

```json
{
  "background":            { "$type": "color", "$value": "{color.white}" },
  "foreground":            { "$type": "color", "$value": "{color.zinc.950}" },
  "card":                  { "$type": "color", "$value": "{color.white}" },
  "card-foreground":       { "$type": "color", "$value": "{color.zinc.950}" },
  "popover":               { "$type": "color", "$value": "{color.white}" },
  "popover-foreground":    { "$type": "color", "$value": "{color.zinc.950}" },
  "primary":               { "$type": "color", "$value": "{color.zinc.900}" },
  "primary-foreground":    { "$type": "color", "$value": "{color.zinc.50}" },
  "secondary":             { "$type": "color", "$value": "{color.zinc.100}" },
  "secondary-foreground":  { "$type": "color", "$value": "{color.zinc.900}" },
  "muted":                 { "$type": "color", "$value": "{color.zinc.100}" },
  "muted-foreground":      { "$type": "color", "$value": "{color.zinc.500}" },
  "accent":                { "$type": "color", "$value": "{color.zinc.100}" },
  "accent-foreground":     { "$type": "color", "$value": "{color.zinc.900}" },
  "destructive":           { "$type": "color", "$value": "{color.red.600}" },
  "destructive-foreground":{ "$type": "color", "$value": "{color.white}" },
  "success":               { "$type": "color", "$value": "{color.green.600}" },
  "border":                { "$type": "color", "$value": "{color.zinc.200}" },
  "input":                 { "$type": "color", "$value": "{color.zinc.200}" },
  "ring":                  { "$type": "color", "$value": "{color.zinc.400}" },
  "radius":                { "$type": "dimension", "$value": "{radius.base}" }
}
```

- [ ] **Step 3: `tokens/semantic.dark.json` 생성**

```json
{
  "background":            { "$type": "color", "$value": "{color.zinc.950}" },
  "foreground":            { "$type": "color", "$value": "{color.zinc.50}" },
  "card":                  { "$type": "color", "$value": "{color.zinc.900}" },
  "card-foreground":       { "$type": "color", "$value": "{color.zinc.50}" },
  "popover":               { "$type": "color", "$value": "{color.zinc.900}" },
  "popover-foreground":    { "$type": "color", "$value": "{color.zinc.50}" },
  "primary":               { "$type": "color", "$value": "{color.zinc.50}" },
  "primary-foreground":    { "$type": "color", "$value": "{color.zinc.900}" },
  "secondary":             { "$type": "color", "$value": "{color.zinc.800}" },
  "secondary-foreground":  { "$type": "color", "$value": "{color.zinc.50}" },
  "muted":                 { "$type": "color", "$value": "{color.zinc.800}" },
  "muted-foreground":      { "$type": "color", "$value": "{color.zinc.400}" },
  "accent":                { "$type": "color", "$value": "{color.zinc.800}" },
  "accent-foreground":     { "$type": "color", "$value": "{color.zinc.50}" },
  "destructive":           { "$type": "color", "$value": "{color.red.500}" },
  "destructive-foreground":{ "$type": "color", "$value": "{color.white}" },
  "success":               { "$type": "color", "$value": "{color.green.600}" },
  "border":                { "$type": "color", "$value": "{color.zinc.800}" },
  "input":                 { "$type": "color", "$value": "{color.zinc.800}" },
  "ring":                  { "$type": "color", "$value": "{color.zinc.600}" }
}
```

- [ ] **Step 4: 커밋**

```bash
git add tokens/ && git commit -m "feat: DTCG 토큰 원천 (중립 기본값, Phase 0 수확 시 교체 예정)"
```

---

### Task 3: 토큰 빌드 스크립트 (TDD)

**Files:**
- Create: `scripts/build-tokens.test.ts`, `scripts/build-tokens.ts`
- Output: `dist/tokens.css` (+ `playground/app/tokens.css` 복사 — playground 생성 후 Task 6에서 활성화)

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add -D -w style-dictionary tsx vitest typescript @types/node
```

- [ ] **Step 2: 실패하는 테스트 작성 — `scripts/build-tokens.test.ts`**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { buildTokens } from "./build-tokens";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";

describe("buildTokens", () => {
  let css: string;
  beforeAll(async () => {
    const out = mkdtempSync(join(tmpdir(), "tokens-"));
    await buildTokens(out);
    css = readFileSync(join(out, "tokens.css"), "utf-8");
  });

  it("라이트 모드 시맨틱 변수를 :root에 산출한다 (core 참조 해석 포함)", () => {
    expect(css).toContain(":root {");
    expect(css).toContain("--background: #ffffff;");
    expect(css).toContain("--destructive: #dc2626;");
    expect(css).toContain("--radius: 0.625rem;");
  });

  it("다크 모드 오버라이드를 .dark 블록에 산출한다", () => {
    expect(css).toContain(".dark {");
    expect(css).toMatch(/\.dark \{[^}]*--background: #09090b;/s);
  });

  it("버전 스탬프 주석을 포함한다", () => {
    expect(css).toMatch(/\/\* generated .* commit [0-9a-f]{7}/);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm vitest run scripts/build-tokens.test.ts`
Expected: FAIL — "Cannot find module './build-tokens'" 또는 buildTokens undefined

- [ ] **Step 4: 구현 — `scripts/build-tokens.ts`**

```ts
import StyleDictionary from "style-dictionary";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function buildVars(sources: string[], filterFiles: string[]): Promise<string> {
  const sd = new StyleDictionary({
    source: sources.map((s) => join(ROOT, s)),
    platforms: {
      css: {
        transformGroup: "css",
        files: [
          {
            destination: "vars.css",
            format: "css/variables",
            filter: (token) => filterFiles.some((f) => token.filePath.endsWith(f)),
          },
        ],
      },
    },
  });
  const platform = await sd.getPlatformTokens("css");
  // css/variables 포맷의 본문만 추출하기 위해 formatFile 대신 직접 조립
  const lines = platform.allTokens
    .filter((t) => filterFiles.some((f) => t.filePath.endsWith(f)))
    .map((t) => `  --${t.name}: ${t.$value ?? t.value};`);
  return lines.join("\n");
}

export async function buildTokens(outDir: string): Promise<void> {
  const light = await buildVars(
    ["tokens/core.json", "tokens/semantic.json"],
    ["semantic.json"]
  );
  const dark = await buildVars(
    ["tokens/core.json", "tokens/semantic.dark.json"],
    ["semantic.dark.json"]
  );

  let commit = "0000000";
  try {
    commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {}
  const stamp = `/* generated ${new Date().toISOString().slice(0, 10)} commit ${commit} — 손으로 편집 금지. 원천: tokens/*.json */`;

  const css = `${stamp}\n:root {\n${light}\n}\n\n.dark {\n${dark}\n}\n`;
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "tokens.css"), css);
}

// CLI 실행: dist/에 쓰고, playground가 있으면 복사
const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  const dist = join(ROOT, "dist");
  await buildTokens(dist);
  const pgCss = join(ROOT, "playground", "app", "tokens.css");
  if (existsSync(dirname(pgCss))) copyFileSync(join(dist, "tokens.css"), pgCss);
  console.log("tokens built → dist/tokens.css");
}
```

구현 참고: Style Dictionary v5의 `getPlatformTokens` API가 다르면 `sd.exportPlatform("css")`(v4) 또는 `formatFile` 방식으로 대체한다. 핵심 계약은 테스트가 정의한다 — 테스트가 통과하는 구현이면 된다. 토큰 이름은 `css` transformGroup의 kebab 변환으로 `background` → `--background`가 된다 (최상위 키라 프리픽스 없음).

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm vitest run scripts/build-tokens.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: CLI로 dist 생성 + 커밋**

```bash
pnpm tokens:build
git add scripts/ dist/ package.json pnpm-lock.yaml
git commit -m "feat: 토큰 빌드 파이프라인 (Style Dictionary, 버전 스탬프 포함)"
```

---

### Task 4: playground Next.js 앱 생성

**Files:**
- Create: `playground/` (create-next-app 산출물)

- [ ] **Step 1: Next.js 앱 생성**

```bash
pnpm dlx create-next-app@latest playground --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --yes
```

Expected: `playground/` 생성, Tailwind v4 + App Router 구조 (`playground/app/`)

- [ ] **Step 2: 워크스페이스 편입 확인 + 루트에서 dev 동작 확인**

```bash
pnpm install
pnpm dev &   # playground dev 서버
curl -sf http://localhost:3000 > /dev/null && echo OK
kill %1
```
Expected: `OK`

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "feat: playground Next.js 앱 스캐폴드"
```

---

### Task 5: @ds/ui 컴포넌트 패키지 + shadcn 15종 설치

**Files:**
- Create: `components/package.json`, `components/tsconfig.json`, `components/components.json`, `components/src/ui/*.tsx`, `components/src/lib/utils.ts`
- Modify: `playground/components.json`, `playground/tsconfig.json`, `playground/next.config.ts`, `playground/package.json`

- [ ] **Step 1: `components/` 패키지 파일 생성**

`components/package.json`:
```json
{
  "name": "@ds/ui",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./ui/*": "./src/ui/*.tsx",
    "./lib/*": "./src/lib/*.ts",
    "./patterns/*": "./src/patterns/*.tsx"
  }
}
```

`components/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@ds/ui/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`components/components.json` (shadcn — ui 패키지 측):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "../playground/app/globals.css", "baseColor": "zinc", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@ds/ui",
    "ui": "@ds/ui/ui",
    "lib": "@ds/ui/lib",
    "utils": "@ds/ui/lib/utils",
    "hooks": "@ds/ui/hooks"
  }
}
```

- [ ] **Step 2: playground를 @ds/ui 소비자로 설정**

`playground/components.json` 생성 (앱 측):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "zinc", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@ds/ui/ui",
    "lib": "@/lib",
    "utils": "@ds/ui/lib/utils",
    "hooks": "@/hooks"
  }
}
```

`playground/package.json` dependencies에 추가: `"@ds/ui": "workspace:*"`
`playground/tsconfig.json` paths에 추가: `"@ds/ui/*": ["../components/src/*"]`
`playground/next.config.ts`에 추가: `transpilePackages: ["@ds/ui"]`

```bash
pnpm install
```

- [ ] **Step 3: shadcn 컴포넌트 15종 설치** (components.json을 수동 작성했으므로 init 불필요)

```bash
cd playground
pnpm dlx shadcn@latest add button input label select checkbox badge card table dialog dropdown-menu tabs avatar separator alert skeleton
cd ..
```

Expected: 컴포넌트 파일들이 `components/src/ui/`에 생성됨 (모노레포 감지). **만약 CLI가 `playground/components/ui/`에 생성하면**: 파일들을 `components/src/ui/`로 이동하고, 파일 내 `@/lib/utils` import를 `@ds/ui/lib/utils`로 일괄 치환한다:
```bash
mkdir -p components/src/ui components/src/lib
git mv playground/components/ui/* components/src/ui/ 2>/dev/null || mv playground/components/ui/* components/src/ui/
mv playground/lib/utils.ts components/src/lib/utils.ts
grep -rl '@/lib/utils' components/src/ui | xargs sed -i '' 's|@/lib/utils|@ds/ui/lib/utils|g'
```
peer 의존성(clsx, tailwind-merge, lucide-react, radix 계열)은 CLI가 playground에 설치한 것을 `components/package.json`의 dependencies로 옮기고 `pnpm install`.

- [ ] **Step 4: 빌드 검증**

```bash
pnpm --filter playground build
```
Expected: 빌드 성공 (import 에러 없음)

- [ ] **Step 5: 커밋**

```bash
git add -A && git commit -m "feat: @ds/ui 패키지 + shadcn 컴포넌트 15종"
```

---

### Task 6: 토큰 CSS 배선 (globals.css)

**Files:**
- Modify: `playground/app/globals.css`
- Create(생성물): `playground/app/tokens.css`

- [ ] **Step 1: 토큰 빌드로 tokens.css 복사 생성**

```bash
pnpm tokens:build
```
Expected: `playground/app/tokens.css` 생성됨

- [ ] **Step 2: `playground/app/globals.css` 전체 교체**

shadcn init이 넣은 `:root {...}` / `.dark {...}` 리터럴 블록을 **삭제**하고 생성된 tokens.css를 import한다:

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 3: 빌드 검증 + 커밋**

```bash
pnpm --filter playground build
git add -A && git commit -m "feat: 토큰 CSS를 playground에 배선 (globals.css @theme 매핑)"
```

---

### Task 7: 디자인 시스템 갤러리 페이지

**Files:**
- Modify: `playground/app/page.tsx` (전체 교체)

- [ ] **Step 1: `playground/app/page.tsx` 전체 교체**

```tsx
import { Button } from "@ds/ui/ui/button";
import { Input } from "@ds/ui/ui/input";
import { Badge } from "@ds/ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ds/ui/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ds/ui/ui/table";
import { Separator } from "@ds/ui/ui/separator";

const semanticColors = [
  "background", "foreground", "primary", "secondary", "muted",
  "accent", "destructive", "success", "border", "ring",
];

export default function Gallery() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-10">
      <header>
        <h1 className="text-3xl font-bold">디자인 시스템 갤러리</h1>
        <p className="text-muted-foreground">
          토큰과 컴포넌트 미리보기. 원천: tokens/*.json + design.md
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">시맨틱 컬러 토큰</h2>
        <div className="grid grid-cols-5 gap-3">
          {semanticColors.map((name) => (
            <div key={name} className="space-y-1">
              <div
                className="h-12 rounded-md border"
                style={{ background: `var(--${name})` }}
              />
              <p className="text-xs text-muted-foreground">--{name}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">타이포그래피</h2>
        <p className="text-3xl font-bold">페이지 제목 3xl/bold</p>
        <p className="text-xl font-semibold">섹션 제목 xl/semibold</p>
        <p className="text-base">본문 base</p>
        <p className="text-sm text-muted-foreground">보조 텍스트 sm/muted</p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">컴포넌트</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Input placeholder="입력 필드" className="max-w-48" />
        </div>
        <Card className="max-w-md">
          <CardHeader><CardTitle>카드 제목</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>홍길동</TableCell>
                  <TableCell><Badge>활성</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 시각 검증**

```bash
pnpm dev &
sleep 5 && curl -sf http://localhost:3000 > /dev/null && echo OK
```
브라우저(또는 스크린샷 도구)로 http://localhost:3000 확인: 컬러 스와치 10개, 타이포 4단계, 버튼 4종·배지·인풋·카드·테이블이 zinc 톤으로 렌더링되는지. 확인 후 `kill %1`.

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "feat: 디자인 시스템 갤러리 페이지"
```

---

### Task 8: design.md 작성

**Files:**
- Create: `design.md`

- [ ] **Step 1: `design.md` 생성** (아래 전문 그대로)

````markdown
# design.md — AI 디자인 규칙서

> 이 문서는 사람용 가이드가 아니라 **AI에게 내리는 명령문**이다. 페이지·컴포넌트를 생성하는 모든 AI는 이 규칙을 따른다.
> 원천: 이 저장소(git). 다른 곳에 복사된 사본은 신뢰하지 않는다.

## 0. 규정 우선

디자인 규칙보다 **제품별 규정이 우선**한다. 페이지 생성 요청을 받으면:
1. `regulations/`에서 해당 제품 파일을 찾는다.
2. 요청과 충돌하거나 주의가 필요한 규정을 발견하면 **생성 전에 사용자에게 알리고 확인받는다**.
3. 해당 제품 규정 파일이 없으면 그 사실을 한 줄로 알리고 진행한다.

## 1. 강제 규칙

- 색·라운드·그림자는 **시맨틱 토큰만** 사용한다. Tailwind 클래스로는 `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, `bg-destructive`, `ring-ring` 등.
- **임의 값 금지**: `#3B82F6`, `bg-[#f00]`, `p-[13px]`, `rounded-[7px]`, `shadow-[...]` 전부 금지.
- 간격·크기는 Tailwind 기본 스케일만 사용 (`p-4`, `gap-3`, `size-8`). arbitrary 값 금지.
- 컴포넌트는 `@ds/ui`에 있는 것만 사용한다. 없는 컴포넌트가 필요하면 **만들지 말고 사용자에게 보고**한다.
- 새 페이지는 `playground/app/<이름>/page.tsx`에 만든다.
- 다크 모드는 토큰이 처리한다. `dark:` 프리픽스를 색상에 붙이지 않는다.

## 2. 시맨틱 토큰 사전

| 토큰 | 용도 |
|---|---|
| `background` / `foreground` | 페이지 배경 / 기본 텍스트 |
| `card` / `card-foreground` | 카드·패널 표면 |
| `primary` / `primary-foreground` | 주요 액션 (페이지당 주요 버튼 1개 원칙) |
| `secondary`, `accent` | 보조 액션, hover 표면 |
| `muted` / `muted-foreground` | 비활성 표면 / 보조 텍스트 |
| `destructive` | 삭제·위험 액션 |
| `success` | 성공 상태 (배지·텍스트) |
| `border`, `input`, `ring` | 테두리, 입력 테두리, 포커스 링 |
| `radius` | 라운드 기준값 (`rounded-lg` = radius) |

원천은 `tokens/*.json`. 값 변경은 반드시 거기서 하고 `pnpm tokens:build` 실행.

## 3. 컴포넌트 카탈로그 (@ds/ui)

각 항목: 언제 쓴다 / 언제 안 쓴다.

- **Button** — 모든 클릭 액션. 페이지당 기본(primary) 버튼은 1개. 링크 이동엔 `variant="link"` 또는 `<Link>`.
- **Input, Label** — 폼 입력. Label 없는 Input 금지 (placeholder는 label 대체 불가).
- **Select** — 4개 이상 고정 선택지. 2~3개면 대신 Tabs나 라디오 성격의 버튼 그룹.
- **Checkbox** — 다중 선택, 동의.
- **Badge** — 상태 표시 (활성/비활성/에러). 클릭 액션엔 쓰지 않는다.
- **Card** — 정보 묶음 표면. **카드 안에 카드 금지.**
- **Table** — 정형 데이터 목록. 모바일 대응이 필요하면 카드 리스트로 전환.
- **Dialog** — 짧은 확인·입력. 긴 폼은 별도 페이지로.
- **DropdownMenu** — 행 단위 액션 묶음 (테이블 우측 ⋯ 버튼).
- **Tabs** — 같은 데이터의 뷰 전환. 페이지 네비게이션엔 쓰지 않는다.
- **Avatar** — 사용자 표시. 이미지 없으면 이니셜 폴백.
- **Separator** — 섹션 구분. 여백으로 충분하면 쓰지 않는다.
- **Alert** — 페이지 내 정적 안내·경고.
- **Skeleton** — 로딩 상태. 스피너보다 우선.

## 4. 레이아웃 규칙

- **어드민 셸**: 좌측 사이드바(w-64, `bg-card`, `border-r`) + 우측 콘텐츠 (`p-6`~`p-8`).
- **인증(로그인) 셸**: 중앙 정렬 단일 카드 (`max-w-sm`), 배경 `bg-muted`.
- 페이지 헤더: 제목(`text-2xl font-bold`) + 우측 주요 액션 버튼, 아래 `space-y-6`.
- 콘텐츠 최대폭: 데이터 테이블 페이지는 전체폭, 폼·문서형은 `max-w-2xl`.
- 수직 리듬: 섹션 간 `space-y-6` 또는 `space-y-8`, 폼 필드 간 `space-y-4`.

## 5. 금지 목록 (안티패턴)

- 그라데이션 배경, 임의 그림자, 유리효과(backdrop-blur) — 금지.
- 카드 안의 카드, 3중 이상 중첩 테두리 — 금지.
- 이모지를 아이콘 대용으로 사용 — 금지. 아이콘은 lucide-react만.
- 페이지당 primary 버튼 2개 이상 — 금지.
- 본문 텍스트에 `text-xs` — 금지 (보조 정보에만).
- placeholder를 label 대신 사용 — 금지.

## 6. 생성 절차 요약

요청 접수 → regulations 검토(§0) → 이 문서 + 해당 레시피(recipes/, 추후) 확인 → 페이지 생성 → 임의 값 self-check(§1) → dev 서버 미리보기 제공.
````

- [ ] **Step 2: 커밋**

```bash
git add design.md && git commit -m "feat: design.md AI 규칙서 v1"
```

---

### Task 9: regulations/ 구조

**Files:**
- Create: `regulations/README.md`, `regulations/_template.md`

- [ ] **Step 1: `regulations/README.md` 생성**

```markdown
# regulations/ — 제품별 우선 규정

**여기 있는 규정은 design.md의 모든 규칙보다 우선한다.**

페이지 생성 요청을 처리하는 AI는 생성 전에 이 폴더에서 해당 제품 파일을 확인하고,
충돌·주의사항이 있으면 생성 전에 사용자에게 알린다. (design.md §0 참조)

- 파일명: `<제품명>.md` (예: `hinas.md`)
- 새 규정 작성은 `_template.md`를 복사해서 시작한다.
- 규정 변경도 코드와 동일하게 PR/커밋으로 관리한다.
```

- [ ] **Step 2: `regulations/_template.md` 생성**

```markdown
# 규정: <제품명>

- 적용 대상: <제품/화면 범위>
- 근거: <규제 명칭, 사내 정책 문서 링크 등>
- 최종 검토일: YYYY-MM-DD

## 강제 사항 (MUST)

- <예: 항해 관련 수치는 소수점 1자리까지 표기하고 단위를 병기한다>

## 금지 사항 (MUST NOT)

- <예: 경보 색상(빨강)은 알람 외 용도로 사용 금지>

## 생성 시 AI가 확인할 것

- <예: 이 제품의 대시보드 요청이 오면 알람 표시 규정 충돌 여부를 먼저 보고>
```

- [ ] **Step 3: 커밋**

```bash
git add regulations/ && git commit -m "feat: regulations 구조 (규정 우선 원칙)"
```

---

### Task 10: CLAUDE.md 절차 지침

**Files:**
- Create: `CLAUDE.md` (저장소 루트)

- [ ] **Step 1: `CLAUDE.md` 생성**

```markdown
# CLAUDE.md — 이 저장소에서의 작업 절차

이 저장소는 AI 친화 디자인 시스템이다. 설계서: docs/superpowers/specs/2026-07-29-ai-design-system-design.md

## 페이지 생성 요청을 받으면 (필수 절차, 순서 고정)

1. **규정 검토**: `regulations/`에서 해당 제품 파일 확인. 충돌·주의사항 발견 시 생성 전에 알리고 확인받는다. 파일이 없으면 그 사실을 한 줄 보고 후 진행.
2. **규칙 로드**: `design.md` 전체를 읽는다. (추후 `recipes/`가 생기면 해당 레시피도)
3. **생성**: `playground/app/<이름>/page.tsx`에 페이지 작성. `@ds/ui` 컴포넌트와 시맨틱 토큰만 사용.
4. **self-check**: 생성 파일에 임의 값(`#`, `-[`)이 없는지 grep으로 확인:
   `grep -nE '#[0-9a-fA-F]{3,6}|-\[' playground/app/<이름>/page.tsx` → 결과 없어야 함.
5. **미리보기**: `pnpm dev` 후 URL 안내. 스크린샷으로 정렬·대비·오버플로 셀프 리뷰.
6. **승인 후**: 사용자가 승인하면 커밋. (피그마 기록은 Phase 3에서 추가)

## 금지

- `dist/tokens.css`, `playground/app/tokens.css` 직접 편집 금지 — `tokens/*.json` 수정 후 `pnpm tokens:build`.
- `@ds/ui`에 없는 컴포넌트 임의 생성 금지 — 필요하면 사용자에게 보고.
- design.md 규칙과 충돌하는 요청은 규칙을 우선하되, 사용자가 명시적으로 재정의하면 따르고 그 사실을 기록.

## 명령어

- `pnpm dev` — playground 미리보기
- `pnpm tokens:build` — 토큰 CSS 재생성
- `pnpm test` — 토큰 빌드 테스트
- `pnpm build` — 전체 빌드 검증
```

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md && git commit -m "feat: CLAUDE.md 생성 절차 지침"
```

---

### Task 11: 스모크 테스트 — 샘플 어드민 페이지 + 푸시

목적: "자연어 요청 → 규칙 준수 페이지" 루프가 실제로 도는지 끝까지 확인.

**Files:**
- Create: `playground/app/samples/admin-users/page.tsx`

- [ ] **Step 1: CLAUDE.md 절차대로 샘플 페이지 생성**

```tsx
import { Button } from "@ds/ui/ui/button";
import { Input } from "@ds/ui/ui/input";
import { Badge } from "@ds/ui/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ds/ui/ui/table";

const users = [
  { name: "김항해", email: "kim@avikus.ai", role: "Admin", active: true },
  { name: "이선장", email: "lee@avikus.ai", role: "Viewer", active: true },
  { name: "박기관", email: "park@avikus.ai", role: "Editor", active: false },
];

export default function AdminUsers() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card p-4">
        <p className="text-lg font-bold">Admin</p>
        <nav className="mt-6 space-y-1 text-sm">
          <p className="rounded-md bg-accent px-3 py-2 font-medium">회원 관리</p>
          <p className="px-3 py-2 text-muted-foreground">대시보드</p>
          <p className="px-3 py-2 text-muted-foreground">설정</p>
        </nav>
      </aside>
      <main className="flex-1 space-y-6 p-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <Button>유저 추가</Button>
        </header>
        <div className="flex gap-3">
          <Input placeholder="이름·이메일 검색" className="max-w-sm" />
          <Button variant="outline">필터</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.email}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <Badge variant={u.active ? "default" : "secondary"}>
                    {u.active ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: self-check (임의 값 검사)**

```bash
grep -nE '#[0-9a-fA-F]{3,6}|-\[' playground/app/samples/admin-users/page.tsx || echo CLEAN
```
Expected: `CLEAN`

- [ ] **Step 3: 전체 검증**

```bash
pnpm test && pnpm build
```
Expected: 테스트 PASS, 빌드 성공

- [ ] **Step 4: 시각 확인**

`pnpm dev` → http://localhost:3000/samples/admin-users 확인: 사이드바 + 헤더('유저 추가' primary 버튼 1개) + 검색 툴바 + 테이블 렌더링.

- [ ] **Step 5: 커밋 + 푸시**

```bash
git add -A
git commit -m "feat: 스모크 테스트 — 샘플 어드민 회원관리 페이지"
git push
```

---

## 완료 판정 (설계서 Phase 1 기준)

- [ ] `pnpm test` 통과 (토큰 파이프라인)
- [ ] `pnpm build` 성공
- [ ] 갤러리(/)와 샘플(/samples/admin-users)이 시맨틱 토큰만으로 렌더링
- [ ] design.md·CLAUDE.md·regulations/ 존재, 절차대로 페이지 생성이 재현됨
