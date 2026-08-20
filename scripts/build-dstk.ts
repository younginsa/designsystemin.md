/**
 * dstk 3층 구조 빌드 — palette(3조명모드 색 원천) → semantic(공통 이름표) → products(제품 오버라이드).
 *
 * 규칙(기계 강제):
 *  - 색 토큰($type: color)은 palette 참조({palette.family.step})만 허용 — 직접 값·미존재 참조는 빌드 에러.
 *  - anchor 별칭: palette.$anchor 규칙(day=600, dusk·night=500)으로 <family>-anchor 자동 생성.
 *  - TODO 값(gray-10 dusk/night 등)은 해당 모드에서 방출 생략(:root 값 상속) — day가 TODO면 에러.
 *
 * 방출:
 *  - dist/dstk.css — :root=Day, .dark=Dusk, .night=Night (팔레트 변수 + 시맨틱 변수)
 *  - dist/products/<제품>.css — .theme-<제품> 오버라이드(모드별 동일 구조)
 *  - playground/app/dstk.css 로 복사(있을 때)
 */
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODES = ["day", "dusk", "night"] as const;
type Mode = (typeof MODES)[number];

const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf-8"));
const palette: any = readJson("dstk/palette.json");
const core: any = readJson("dstk/core.json");

const FAMS = Object.keys(palette).filter((k) => !k.startsWith("$"));
const ANCHOR: Record<Mode, string> = palette.$anchor;

/** palette 경로(family.step 또는 basic.tone.step)의 모드별 원시 값. TODO면 null. */
function paletteValue(path: string[], mode: Mode): string | null {
  let node: any = palette;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (key === "anchor" && node !== palette && i === path.length - 1) {
      node = node[ANCHOR[mode]];
      break;
    }
    node = node?.[key];
    if (node === undefined) throw new Error(`팔레트에 없는 참조: palette.${path.join(".")}`);
  }
  const v = node?.$value;
  if (v === undefined) throw new Error(`팔레트에 없는 참조: palette.${path.join(".")}`);
  const raw = typeof v === "string" ? v : v[mode];
  if (raw === undefined) throw new Error(`palette.${path.join(".")}: ${mode} 모드 값 없음`);
  return raw === "TODO" ? null : raw;
}

/** 시맨틱/제품 토큰 해석 — 색은 palette 참조 강제(게이트). */
function resolveToken(name: string, token: any, mode: Mode): string | null {
  const value: string = token.$value;
  if (token.$type === "color") {
    const m = value.match(/^\{palette\.([^}]+)\}$/);
    if (!m) throw new Error(`게이트 위반 — 색 토큰 "${name}"은 palette 참조만 허용: ${value}`);
    return paletteValue(m[1].split("."), mode);
  }
  // 비색상(치수·폰트)은 core 참조 또는 직접 값 허용
  return value.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const found = path.split(".").reduce<any>((n, k) => (n ? n[k] : undefined), core);
    if (found?.$value === undefined) throw new Error(`해석할 수 없는 참조: {${path}} (토큰 "${name}")`);
    return found.$value;
  });
}

/** 모드별 팔레트 평탄화(--gray-50 …) + anchor 별칭(--red-anchor …). TODO는 생략. */
function paletteVars(mode: Mode): string[] {
  const lines: string[] = [];
  for (const fam of FAMS) {
    if (fam === "basic") {
      for (const tone of Object.keys(palette.basic).filter((k) => !k.startsWith("$"))) {
        for (const step of Object.keys(palette.basic[tone]).filter((k) => !k.startsWith("$"))) {
          lines.push(`  --basic-${tone}-${step}: ${palette.basic[tone][step].$value};`);
        }
      }
      continue;
    }
    for (const step of Object.keys(palette[fam]).filter((k) => !k.startsWith("$"))) {
      const v = paletteValue([fam, step], mode);
      if (v !== null) lines.push(`  --${fam}-${step}: ${v};`);
    }
    if (fam !== "gray") {
      const v = paletteValue([fam, "anchor"], mode);
      if (v !== null) lines.push(`  --${fam}-anchor: ${v};`);
    }
  }
  return lines;
}

/** 토큰 파일 → 모드별 CSS 변수 줄. day에서 null(TODO)이면 에러, 그 외 모드는 생략. */
function tokenVars(tokens: Record<string, any>, mode: Mode, label: string): string[] {
  const lines: string[] = [];
  for (const [name, token] of Object.entries<any>(tokens)) {
    if (name.startsWith("$")) continue;
    const v = resolveToken(name, token, mode);
    if (v === null) {
      if (mode === "day") throw new Error(`${label} "${name}": day 값이 TODO — day는 필수`);
      continue;
    }
    lines.push(`  --${name}: ${v};`);
  }
  return lines;
}

const semantic = readJson("dstk/semantic.json");
const typographyPath = join(ROOT, "dstk/typography.json");
const typography: any = existsSync(typographyPath) ? readJson("dstk/typography.json") : {};

/** 타이포 스케일 → --type-<이름>-size/weight/family (모드 무관, TODO 생략). */
function typographyVars(): string[] {
  const lines: string[] = [];
  for (const [name, tok] of Object.entries<any>(typography)) {
    if (name.startsWith("$")) continue;
    const v = tok.$value;
    if (v === "TODO" || v == null) continue;
    if (v.size) lines.push(`  --type-${name}-size: ${v.size};`);
    if (v.weight) lines.push(`  --type-${name}-weight: ${v.weight};`);
    if (v.family) lines.push(`  --type-${name}-family: ${v.family};`);
  }
  return lines;
}

const block = (sel: string, lines: string[]) => `${sel} {\n${lines.join("\n")}\n}`;

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
} catch {
  // git 정보가 없어도 빌드는 진행한다.
}

const css =
  [
    "/* 자동 생성 — 손으로 편집 금지. 원천: dstk/palette.json + semantic.json */",
    `/* commit ${commit} · 모드: :root=Day · .dark=Dusk · .night=Night */`,
    block(":root", [...paletteVars("day"), ...tokenVars(semantic, "day", "semantic"), ...typographyVars()]),
    block(".dark", [...paletteVars("dusk"), ...tokenVars(semantic, "dusk", "semantic")]),
    block(".night", [...paletteVars("night"), ...tokenVars(semantic, "night", "semantic")]),
  ].join("\n\n") + "\n";

mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist/dstk.css"), css);

// 제품 오버라이드 — dist/products/<name>.css (.theme-<name>)
mkdirSync(join(ROOT, "dist/products"), { recursive: true });
for (const f of readdirSync(join(ROOT, "dstk/products")).filter((f) => f.endsWith(".json"))) {
  const name = basename(f, ".json");
  const tokens = readJson(`dstk/products/${f}`);
  const parts: string[] = [`/* ${name} 제품 토큰 — build-dstk.ts 생성 */`];
  const day = tokenVars(tokens, "day", `products/${name}`);
  if (day.length) parts.push(block(`.theme-${name}`, day));
  const dusk = tokenVars(tokens, "dusk", `products/${name}`);
  if (dusk.length) parts.push(block(`.dark .theme-${name}`, dusk));
  const night = tokenVars(tokens, "night", `products/${name}`);
  if (night.length) parts.push(block(`.night .theme-${name}`, night));
  writeFileSync(join(ROOT, `dist/products/${name}.css`), parts.join("\n\n") + "\n");
}

const pgCss = join(ROOT, "playground", "app", "dstk.css");
if (existsSync(dirname(pgCss))) copyFileSync(join(ROOT, "dist/dstk.css"), pgCss);

// 허브(문서 사이트)가 fetch로 읽는 사본 — playground/public/dstk/
const pubDstk = join(ROOT, "playground", "public", "dstk");
if (existsSync(join(ROOT, "playground", "public"))) {
  mkdirSync(join(pubDstk, "products"), { recursive: true });
  for (const f of ["palette.json", "semantic.json", "typography.json"]) {
    if (existsSync(join(ROOT, "dstk", f))) copyFileSync(join(ROOT, "dstk", f), join(pubDstk, f));
  }
  for (const f of readdirSync(join(ROOT, "dstk/products")).filter((x) => x.endsWith(".json"))) {
    copyFileSync(join(ROOT, "dstk/products", f), join(pubDstk, "products", f));
  }
}
console.log("built → dist/dstk.css + dist/products/*.css + public/dstk/*.json");
