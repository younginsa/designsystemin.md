/**
 * dstk 3층 구조 빌드 — palette(조명 3모드 색 원천) → semantic(Theme 정렬 — 제품 3모드) → products(제품 오버라이드).
 *
 * 축 두 개:
 *  - 팔레트 조명 축: day / dusk / night (Colors 변수 컬렉션 래더)
 *  - 시맨틱 제품 축: light(Cloud) / dark(SVM·NAS) / control (라이브러리 "Theme" 컬렉션 29종 정렬)
 *    시맨틱 $value는 {light,dark,control} 객체(모드별 팔레트 핀 참조) 또는 단일 참조(조명 매핑으로 해석).
 *
 * 참조 문법: {palette.family.step} · 핀 {palette.family.step@day|dusk|night} · anchor {palette.red.anchor}
 * 게이트: 색 토큰은 palette 참조만 허용 — 직접 값·미존재 참조는 빌드 에러.
 *
 * 방출:
 *  - dist/dstk.css — :root=Light(+Day 팔레트) · .dark=Dark(+Dusk 팔레트) · .night=Night 팔레트만(조명 예비) · .theme-control=Control 시맨틱
 *  - dist/products/<제품>.css — .theme-<제품> 오버라이드
 *  - playground/app/dstk.css 복사 + playground/public/dstk/*.json 사본(허브용)
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
const LIGHTINGS = ["day", "dusk", "night"] as const;
type Lighting = (typeof LIGHTINGS)[number];
const THEME_MODES = ["light", "dark", "control"] as const;
type ThemeMode = (typeof THEME_MODES)[number];
/** 핀 없는 참조(anchor·상태 축)의 제품 모드 → 조명 매핑 */
const LIGHT_OF: Record<ThemeMode, Lighting> = { light: "day", dark: "dusk", control: "dusk" };

const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf-8"));
const palette: any = readJson("dstk/palette.json");
const core: any = readJson("dstk/core.json");

const FAMS = Object.keys(palette).filter((k) => !k.startsWith("$"));
const ANCHOR: Record<Lighting, string> = palette.$anchor;

/** palette 경로의 조명 모드별 원시 값. TODO·모드 없음이면 null. */
function paletteValue(path: string[], lighting: Lighting): string | null {
  let node: any = palette;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    if (seg === "anchor" && node !== palette && i === path.length - 1) {
      node = node[ANCHOR[lighting]];
      break;
    }
    node = node?.[seg];
    if (node === undefined) throw new Error(`팔레트에 없는 참조: palette.${path.join(".")}`);
  }
  const v = node?.$value;
  if (v === undefined) throw new Error(`팔레트에 없는 참조: palette.${path.join(".")}`);
  const raw = typeof v === "string" ? v : v[lighting];
  if (raw === undefined) return null;
  return raw === "TODO" ? null : raw;
}

/** 단일 참조 문자열 해석 — 핀(@모드) 우선, 없으면 조명 매핑. */
function resolveRef(name: string, refStr: string, themeMode: ThemeMode): string | null {
  const m = refStr.match(/^\{palette\.([^}@]+)(?:@(day|dusk|night))?\}$/);
  if (!m) throw new Error(`게이트 위반 — 색 토큰 "${name}"은 palette 참조만 허용: ${refStr}`);
  const lighting = (m[2] as Lighting) ?? LIGHT_OF[themeMode];
  return paletteValue(m[1].split("."), lighting);
}

/** 시맨틱/제품 토큰 해석 — $value가 제품 모드 객체면 해당 모드 키 사용. */
function resolveToken(name: string, token: any, themeMode: ThemeMode): string | null {
  const value = token.$value;
  if (token.$type === "color") {
    const refStr = typeof value === "string" ? value : value[themeMode];
    if (refStr === undefined) return null;
    return resolveRef(name, refStr, themeMode);
  }
  // 비색상(치수·그림자·폰트)은 core 참조 또는 직접 값 허용
  const s: string = typeof value === "string" ? value : value[themeMode];
  return s.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const found = path.split(".").reduce<any>((n, k) => (n ? n[k] : undefined), core);
    if (found?.$value === undefined) throw new Error(`해석할 수 없는 참조: {${path}} (토큰 "${name}")`);
    return found.$value;
  });
}

/** 조명 모드별 팔레트 평탄화(--gray-50 …) + anchor 별칭. 값 없는 모드는 생략. */
function paletteVars(lighting: Lighting): string[] {
  const lines: string[] = [];
  for (const fam of FAMS) {
    if (fam === "basic" || fam === "product") {
      for (const tone of Object.keys(palette[fam]).filter((k) => !k.startsWith("$"))) {
        const entry = palette[fam][tone];
        if (entry.$value !== undefined) {
          lines.push(`  --${fam}-${tone}: ${entry.$value};`);
          continue;
        }
        for (const step of Object.keys(entry).filter((k) => !k.startsWith("$"))) {
          lines.push(`  --${fam}-${tone}-${step}: ${entry[step].$value};`);
        }
      }
      continue;
    }
    for (const step of Object.keys(palette[fam]).filter((k) => !k.startsWith("$"))) {
      const v = paletteValue([fam, step], lighting);
      if (v !== null) lines.push(`  --${fam}-${step}: ${v};`);
    }
    if (fam !== "gray") {
      const v = paletteValue([fam, "anchor"], lighting);
      if (v !== null) lines.push(`  --${fam}-anchor: ${v};`);
    }
  }
  return lines;
}

/** 토큰 파일 → 제품 모드별 CSS 변수 줄. light에서 누락이면 에러, 그 외 모드는 생략. */
function tokenVars(tokens: Record<string, any>, themeMode: ThemeMode, label: string): string[] {
  const lines: string[] = [];
  for (const [name, token] of Object.entries<any>(tokens)) {
    if (name.startsWith("$")) continue;
    const v = resolveToken(name, token, themeMode);
    if (v === null) {
      if (themeMode === "light") throw new Error(`${label} "${name}": light 값 누락 — light는 필수`);
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
    if (v.lineHeight) lines.push(`  --type-${name}-line-height: ${v.lineHeight};`);
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
    "/* 자동 생성 — 손으로 편집 금지. 원천: dstk/palette.json + semantic.json (Theme 정렬) */",
    `/* commit ${commit} · 시맨틱: :root=Light(Cloud) · .dark=Dark(SVM·NAS) · .theme-control=Control · 팔레트 조명: :root=Day · .dark=Dusk · .night=Night */`,
    block(":root", [...paletteVars("day"), ...tokenVars(semantic, "light", "semantic"), ...typographyVars()]),
    block(".dark", [...paletteVars("dusk"), ...tokenVars(semantic, "dark", "semantic")]),
    block(".night", paletteVars("night")),
    block(".theme-control", tokenVars(semantic, "control", "semantic")),
  ].join("\n\n") + "\n";

mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist/dstk.css"), css);

// 제품 오버라이드 — dist/products/<name>.css (.theme-<name>)
mkdirSync(join(ROOT, "dist/products"), { recursive: true });
for (const f of readdirSync(join(ROOT, "dstk/products")).filter((f) => f.endsWith(".json"))) {
  const name = basename(f, ".json");
  const tokens = readJson(`dstk/products/${f}`);
  const parts: string[] = [`/* ${name} 제품 토큰 — build-dstk.ts 생성 */`];
  for (const mode of THEME_MODES) {
    const lines = tokenVars(tokens, mode, `products/${name}`);
    if (!lines.length) continue;
    const sel = mode === "light" ? `.theme-${name}` : mode === "dark" ? `.dark .theme-${name}` : `.theme-control .theme-${name}`;
    parts.push(block(sel, lines));
  }
  writeFileSync(join(ROOT, `dist/products/${name}.css`), parts.join("\n\n") + "\n");
}

// ── 피그마 스냅샷 대조 게이트 + THEME-MAP.md 자동 생성 ──
// 스냅샷(dstk/figma-theme-snapshot.json) = 피그마의 마지막 확인 상태. 해석값 불일치 = 빌드 실패.
const snapPath = join(ROOT, "dstk/figma-theme-snapshot.json");
if (existsSync(snapPath)) {
  const snap: any = readJson("dstk/figma-theme-snapshot.json");
  // 갈림 매핑: 토큰이 모드에 따라 다른 Theme 변수에 대응할 수 있다(예: primary-foreground)
  type TokenMap = { t: string; modes?: ThemeMode[]; note?: string };
  const one = (t: string): TokenMap[] => [{ t }];
  const T2D: Record<string, TokenMap[]> = {
    "General/background": [
      { t: "background" },
      { t: "card" },
      { t: "popover" },
      { t: "primary-foreground", modes: ["control"], note: "(Control만)" },
    ],
    "General/on-color": [
      { t: "primary-foreground", modes: ["light", "dark"], note: "(Light·Dark)" },
      { t: "destructive-foreground" },
    ],
    // 기본 글자 번들 — 2026-08-21 통합으로 General/accent-foreground 변수가 삭제되고
    // 이 변수 하나가 코드 토큰 4종을 덮는다(3모드 값 동일). sidebar-accent-foreground는 예정.
    "General/foreground": [
      { t: "foreground" },
      { t: "card-foreground" },
      { t: "popover-foreground" },
      { t: "accent-foreground" },
    ],
    "General/primary": one("primary"),
    "General/success": one("success"),
    "General/secondary": one("secondary"),
    "General/secondary-foreground": one("secondary-foreground"),
    "General/muted": one("muted"),
    "General/muted-foreground": one("muted-foreground"),
    "General/accent": one("accent"),
    "General/destructive": one("destructive"),
    "General/border": one("border"),
    "General/input": one("input"),
    "General/ring": one("ring"),
    "Chart/chart-1": one("chart-1"),
    "Chart/chart-2": one("chart-2"),
    "Chart/chart-3": one("chart-3"),
    "Chart/chart-4": one("chart-4"),
    "Chart/chart-5": one("chart-5"),
  };
  const errs: string[] = [];
  for (const entry of snap.theme) {
    const maps = T2D[entry.name];
    if (!maps) continue; // Product 2종 — 참조로만 사용
    for (const m of maps) {
      for (const mode of THEME_MODES) {
        if (m.modes && !m.modes.includes(mode)) continue;
        const want = String(entry[mode].hex).toUpperCase();
        const got = (resolveToken(m.t, semantic[m.t], mode) || "").toUpperCase();
        if (got !== want) errs.push(`${m.t}(${mode}): snapshot ${want} ≠ semantic ${got}`);
      }
    }
  }
  const CMODE: Record<string, Lighting> = { "Day mode": "day", "Dusk mode": "dusk", "Night mode": "night" };
  const CFAM: Record<string, string> = {
    Gray: "gray", SemanticRed: "red", SemanticOrange: "orange", SemanticYellow: "yellow",
    SemanticGreen: "green", SemanticBlue: "blue", Magenta: "magenta", Olive: "olive",
  };
  for (const [cname, hexv] of Object.entries<any>(snap.colors)) {
    const p = cname.split("/");
    if (p[0] === "Basic Foreground") {
      const got = palette.basic?.[p[1].toLowerCase()]?.[p[2]]?.$value?.toUpperCase();
      if (got !== String(hexv).toUpperCase()) errs.push(`basic.${p[1].toLowerCase()}.${p[2]}: snapshot ${hexv} ≠ palette ${got}`);
      continue;
    }
    if (!(p[0] in CMODE)) continue;
    const got = palette[CFAM[p[1]]]?.[p[2]]?.$value?.[CMODE[p[0]]]?.toUpperCase();
    if (got !== String(hexv).toUpperCase()) errs.push(`${CFAM[p[1]]}.${p[2]}.${CMODE[p[0]]}: snapshot ${hexv} ≠ palette ${got}`);
  }
  if (errs.length) {
    throw new Error(`피그마 스냅샷 대조 실패 ${errs.length}건:\n  ` + errs.slice(0, 20).join("\n  "));
  }

  // ── 가독성 게이트 — contrast-pairs.json의 글자×면 조합을 3모드 전수 WCAG 검사 ──
  const cpPath = join(ROOT, "dstk/contrast-pairs.json");
  if (existsSync(cpPath)) {
    const cp: any = readJson("dstk/contrast-pairs.json");
    const hexToRgba = (h: string): number[] => {
      const s = h.replace("#", "");
      return [0, 2, 4, 6].map((i) => (i < s.length ? parseInt(s.slice(i, i + 2), 16) : 255));
    };
    const over = (fg: number[], bg: number[]): number[] => {
      const a = fg[3] / 255;
      return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)));
    };
    const lum = (rgb: number[]): number => {
      const f = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    };
    const ratio = (a: number[], b: number[]): number => {
      const l1 = lum(a) + 0.05;
      const l2 = lum(b) + 0.05;
      return l1 > l2 ? l1 / l2 : l2 / l1;
    };
    const gateErrs: string[] = [];
    const gateWarns: string[] = [];
    for (const pair of cp.pairs) {
      const need = cp.$levels[pair.level];
      for (const mode of THEME_MODES) {
        if (pair.modes && !pair.modes.includes(mode)) continue;
        const bgHex = resolveToken(pair.bg, semantic[pair.bg], mode);
        const txHex = resolveToken(pair.text, semantic[pair.text], mode);
        if (!bgHex || !txHex) continue;
        // 알파 합성: 면은 그 모드의 background 위에, 글자는 면 위에
        const base = resolveToken("background", semantic.background, mode) || "#FFFFFF";
        const bg = over(hexToRgba(bgHex), over(hexToRgba(base), [255, 255, 255, 255]));
        const tx = over(hexToRgba(txHex), bg);
        const r = ratio(tx, bg);
        if (r < need) {
          const line = `${pair.text} × ${pair.bg} (${mode}): ${r.toFixed(2)}:1 < ${need}:1`;
          if (pair.waived) gateWarns.push(line + ` — 보류: ${pair.waived}`);
          else gateErrs.push(line);
        }
      }
    }
    if (gateWarns.length) console.warn(`⚠ 대비 게이트 보류 ${gateWarns.length}건:\n  ` + gateWarns.join("\n  "));
    if (gateErrs.length) {
      throw new Error(`대비 게이트 실패 ${gateErrs.length}건 (자동 치환 금지 — 팔레트에서 통과 토큰을 골라 교체):\n  ` + gateErrs.join("\n  "));
    }
  }

  // ── 어휘 게이트 — approved ↔ vocab-map ↔ components/src/ui 전수 대조 ──
  // 새 컴포넌트가 매핑 없이 추가되면 조회 경로(vocab-map)가 조용히 구멍 난다
  // (2026-08-26 search-box 승격 때 수작업 기억에 의존했던 것의 기계화).
  {
    const vmPath = join(ROOT, "playground/public/vocab-map.json");
    const apPath = join(ROOT, "playground/public/approved.json");
    if (existsSync(vmPath) && existsSync(apPath)) {
      const vm: any = JSON.parse(readFileSync(vmPath, "utf8"));
      const approved: string[] = JSON.parse(readFileSync(apPath, "utf8")).approved ?? [];
      const vocab: Record<string, { files: string[] }> = vm.vocab ?? {};
      const uiDir = join(ROOT, "components/src/ui");
      const files = new Set(readdirSync(uiDir).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)));
      const vocabErrs: string[] = [];

      const apSet = new Set(approved);
      const vkSet = new Set(Object.keys(vocab));
      for (const s of approved) if (!vkSet.has(s)) vocabErrs.push(`approved에만 있음(매핑 누락): ${s}`);
      for (const s of vkSet) if (!apSet.has(s)) vocabErrs.push(`vocab-map에만 있음(미채택 잔재): ${s}`);

      const referenced = new Set<string>([...(vm.infrastructure ?? []), ...(vm.unadopted ?? [])]);
      for (const [slug, e] of Object.entries(vocab)) {
        for (const f of e.files ?? []) {
          if (!files.has(f)) vocabErrs.push(`없는 파일 참조: ${slug} → ${f}`);
          referenced.add(f);
        }
      }
      for (const f of files) {
        if (!referenced.has(f)) vocabErrs.push(`components/src/ui/${f}.tsx 미등재 — vocab files 또는 infrastructure/unadopted에 넣을 것`);
      }
      if (vocabErrs.length) {
        throw new Error(`어휘 게이트 실패 ${vocabErrs.length}건 (vocab-map.json ↔ approved.json ↔ components/src/ui):\n  ` + vocabErrs.join("\n  "));
      }
    }
  }

  const md: string[] = [
    "# Theme × dstk 대조표",
    "",
    "자동 생성 — `pnpm ds:build`가 `dstk/figma-theme-snapshot.json`에서 만든다. 손 편집 금지.",
    "피그마 원본: 「Theme × dstk 대조표」 노드 2807:24 (fileKey i5IhnacRAjg6NJdmtctfn2).",
    `마지막 업데이트: ${snap.$meta?.updated ?? "미상"}`,
    "",
    "| Theme 변수 | Light (Cloud) | Dark (SVM·NAS) | Control | dstk 토큰 |",
    "|---|---|---|---|---|",
  ];
  const disp = (name: string) => (T2D[name] ?? []).map((m) => m.t + (m.note ? " " + m.note : ""));
  for (const entry of snap.theme) {
    const cell = (m: ThemeMode) => `${entry[m].alias ?? "(고유값)"} ${entry[m].hex}`;
    const tokens = disp(entry.name);
    const note = entry.note ? ` — ${entry.note}` : "";
    md.push(`| ${entry.name}${note} | ${cell("light")} | ${cell("dark")} | ${cell("control")} | ${tokens.length ? tokens.join(" · ") : "(참조 전용)"} |`);
  }
  md.push("", "## Theme 외 dstk 토큰 (상태 축·램프·비색상)", "", "| 토큰 | 참조 | 비고 |", "|---|---|---|");
  const covered = new Set(Object.values(T2D).flat().map((m) => m.t));
  for (const [name, tok] of Object.entries<any>(semantic)) {
    if (name.startsWith("$") || covered.has(name)) continue;
    const v = typeof tok.$value === "string" ? tok.$value : JSON.stringify(tok.$value);
    md.push(`| ${name} | \`${v}\` | ${tok.$note ?? ""} |`);
  }
  writeFileSync(join(ROOT, "dstk/THEME-MAP.md"), md.join("\n") + "\n");

  // 허브 게시용 대조 데이터(JSON) — 공통 DS > Theme × dstk 대조표가 렌더
  if (existsSync(join(ROOT, "playground", "public"))) {
    const mapRows = snap.theme.map((entry: any) => {
      const tokens = disp(entry.name);
      return {
        theme: entry.name,
        light: entry.light,
        dark: entry.dark,
        control: entry.control,
        tokens: tokens.length ? tokens : null,
        note: entry.note ?? null,
      };
    });
    const extras = Object.entries<any>(semantic)
      .filter(([name]) => !name.startsWith("$") && !covered.has(name))
      .map(([name, tok]) => ({
        name,
        ref: typeof tok.$value === "string" ? tok.$value : JSON.stringify(tok.$value),
        note: tok.$note ?? "",
      }));
    mkdirSync(join(ROOT, "playground", "public", "dstk"), { recursive: true });
    writeFileSync(
      join(ROOT, "playground", "public", "dstk", "theme-map.json"),
      JSON.stringify({ updated: snap.$meta?.updated ?? null, rows: mapRows, extras }, null, 2)
    );
  }
}

const pgCss = join(ROOT, "playground", "app", "dstk.css");
if (existsSync(dirname(pgCss))) copyFileSync(join(ROOT, "dist/dstk.css"), pgCss);

// 허브(문서 사이트)가 fetch로 읽는 사본 — playground/public/dstk/
const pubDstk = join(ROOT, "playground", "public", "dstk");
if (existsSync(join(ROOT, "playground", "public"))) {
  mkdirSync(join(pubDstk, "products"), { recursive: true });
  for (const f of ["palette.json", "semantic.json", "typography.json", "figma-theme-snapshot.json"]) {
    if (existsSync(join(ROOT, "dstk", f))) copyFileSync(join(ROOT, "dstk", f), join(pubDstk, f));
  }
  for (const f of readdirSync(join(ROOT, "dstk/products")).filter((x) => x.endsWith(".json"))) {
    copyFileSync(join(ROOT, "dstk/products", f), join(pubDstk, "products", f));
  }
}
// ── 프론트 핸드오프 세트 — dist/handoff/ 4파일 + zip (프론트 파일 구조 그대로의 정본) ──
// 2026-09-02 확정: 폰트 Inter · 3모드 포함 · shadcn text-* 축(sm=13/20=body · base=14/20).
// 앱 전용 규칙(point 컬러·keyframes·@custom-variant dark 등)은 프론트가 자기 index.css에
// 유지한다 — 이 세트는 DS 층만. 배포 URL: /dstk/handoff/ (push마다 자동 최신).
{
  const today = new Date().toISOString().slice(0, 10);
  const stamp = `/* 자동 생성 — 손 편집 금지 · commit ${commit} · ${today} · 원천: dstk/*.json (git이 source of truth) */`;
  const hoDir = join(ROOT, "dist/handoff");
  mkdirSync(hoDir, { recursive: true });

  // 1) primitives.css — 팔레트 3모드 평탄화(dstk.css와 동일 변수명)
  const primitivesCss = [
    stamp,
    "/* primitives — 컬러 팔레트 원천. :root=Day(Light 제품) · .dark=Dusk · .night=Night */",
    block(":root", paletteVars("day")),
    block(".dark", paletteVars("dusk")),
    block(".night", paletteVars("night")),
  ].join("\n\n") + "\n";

  // 2) semantic-token.css — --general-*(프론트 명명 호환) 모드별 해석값 + 팔레트 참조 주석
  const semLines = (mode: ThemeMode): string[] => {
    const lines: string[] = [];
    for (const [name, token] of Object.entries<any>(semantic)) {
      if (name.startsWith("$") || token.$type !== "color") continue;
      const v = resolveToken(name, token, mode);
      if (v === null) continue;
      const refStr = typeof token.$value === "string" ? token.$value : token.$value[mode];
      const cssName = name.startsWith("chart-") ? `--${name}` : `--general-${name}`;
      lines.push(`  ${cssName}: ${v}; /* ${refStr} */`);
    }
    lines.push(`  --general-on-color: #FFFFFF; /* {palette.basic.white.100} — 피그마 General/on-color, 전 모드 동일 */`);
    return lines;
  };
  const semanticCss = [
    stamp,
    "/* semantic-token — 팔레트→시맨틱 매칭(모드별 해석값 · 주석=팔레트 참조). card·popover는 background와 별도 토큰 */",
    block(":root", semLines("light")),
    block(".dark", semLines("dark")),
    block(".theme-control", semLines("control")),
  ].join("\n\n") + "\n";

  // 3) typography.css — Desktop 스케일(피그마 Desktop 텍스트 스타일 실측 · Inter)
  const wname: Record<string, string> = { "400": "regular", "500": "medium", "600": "semibold", "700": "bold" };
  const desktopEntries = Object.entries<any>(typography).filter(([n]) => n.startsWith("desktop-"));
  const typoLines: string[] = [];
  for (const [name, tok] of desktopEntries) {
    const short = name.slice("desktop-".length);
    typoLines.push(`  --text-${short}-size: ${tok.$value.size};`);
    typoLines.push(`  --text-${short}-line-height: ${tok.$value.lineHeight};`);
  }
  typoLines.push("", "  --font-weight-regular: 400;", "  --font-weight-medium: 500;",
    "  --font-weight-semibold: 600;", "  --font-weight-bold: 700;");
  const typographyCss = [
    stamp,
    "/* typography — 피그마 Desktop 텍스트 스타일 실측. 무게는 역할별 대표값(피그마는 사이즈당 Regular~Bold 4종 제공) */",
    block(":root", typoLines),
  ].join("\n\n") + "\n";

  // 4) index.css — DS 배선: @theme 매핑(shadcn 슬롯·sidebar 별칭·text-* 축) + 시맨틱 클래스
  const colorNames = Object.entries<any>(semantic)
    .filter(([n, t]) => !n.startsWith("$") && t.$type === "color").map(([n]) => n);
  const mapGeneral = colorNames.filter((n) => !n.startsWith("chart-"))
    .map((n) => `  --color-general-${n}: var(--general-${n});`);
  const mapChart = colorNames.filter((n) => n.startsWith("chart-"))
    .map((n) => `  --color-${n}: var(--${n});`);
  const SHADCN: Array<[string, string]> = [
    ["background", "general-background"], ["foreground", "general-foreground"],
    ["card", "general-card"], ["card-foreground", "general-card-foreground"],
    ["popover", "general-popover"], ["popover-foreground", "general-popover-foreground"],
    ["primary", "general-primary"], ["primary-foreground", "general-primary-foreground"],
    ["secondary", "general-secondary"], ["secondary-foreground", "general-secondary-foreground"],
    ["muted", "general-muted"], ["muted-foreground", "general-muted-foreground"],
    ["accent", "general-accent"], ["accent-foreground", "general-accent-foreground"],
    ["destructive", "general-destructive"], ["destructive-foreground", "general-destructive-foreground"],
    ["border", "general-border"], ["input", "general-input"], ["ring", "general-ring"],
    ["sidebar", "general-secondary"], ["sidebar-foreground", "general-foreground"],
    ["sidebar-primary", "general-primary"], ["sidebar-primary-foreground", "general-primary-foreground"],
    ["sidebar-accent", "general-accent"], ["sidebar-accent-foreground", "general-accent-foreground"],
    ["sidebar-border", "general-border"], ["sidebar-ring", "general-ring"],
  ];
  const mapShadcn = SHADCN.map(([slot, src]) => `  --color-${slot}: var(--${src});`);
  // shadcn text-* 축 — sm=body(13/20)이 핵심(shadcn 컴포넌트 기본 글자가 DS body로 정렬).
  // caption-s(11px)는 축에 안 태움 — .text-caption-s 시맨틱 클래스로만 제공.
  const TEXT_AXIS: Array<[string, string, string]> = [
    ["2xs", "10px", "16px"], ["xs", "12px", "16px"], ["sm", "13px", "20px"],
    ["base", "14px", "20px"], ["lg", "16px", "24px"], ["xl", "18px", "24px"],
    ["2xl", "20px", "24px"], ["3xl", "24px", "28px"], ["4xl", "28px", "32px"],
  ];
  const mapText = TEXT_AXIS.flatMap(([k, s, lh]) => [`  --text-${k}: ${s};`, `  --text-${k}--line-height: ${lh};`]);
  const semClasses = desktopEntries.map(([name, tok]) => {
    const short = name.slice("desktop-".length);
    return `.text-${short} {\n  font-size: var(--text-${short}-size);\n  line-height: var(--text-${short}-line-height);\n  font-weight: var(--font-weight-${wname[tok.$value.weight ?? "400"]});\n}`;
  });
  const radiusVal = resolveToken("radius", semantic.radius, "light");
  const shadowVal = semantic["shadow-card"] ? resolveToken("shadow-card", semantic["shadow-card"], "light") : null;
  const indexCss = [
    stamp,
    `/* index — DS 배선. 앱 index.css에서 tailwindcss import 뒤에 이 파일을 @import 하면 끝.
   앱 전용(point 컬러·keyframes·@custom-variant dark)은 앱 파일에 유지. 다크 전환 = 래퍼에 .dark */`,
    `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");`,
    `@import "./primitives.css";\n@import "./typography.css";\n@import "./semantic-token.css";`,
    block(":root", [
      `  font-family: "Inter", system-ui, sans-serif; /* 피그마 정본 — 한글은 시스템 폴백 */`,
      `  --radius: ${radiusVal};`,
      // 핸드오프 변수명은 --general-* 프리픽스 — dstk.css용 var(--border) 참조를 치환
      ...(shadowVal ? [`  --shadow-card: ${shadowVal.replace(/var\(--border\)/g, "var(--general-border)")};`] : []),
    ]),
    `body {\n  margin: 0;\n  background: var(--general-background);\n  color: var(--general-foreground);\n}`,
    block("@theme inline", [
      "  --font-sans: \"Inter\", system-ui, sans-serif;",
      "  --radius-sm: calc(var(--radius) - 4px);",
      "  --radius-md: calc(var(--radius) - 2px);",
      "  --radius-lg: var(--radius);",
      "  --radius-xl: calc(var(--radius) + 4px);",
      ...mapText, ...mapGeneral, ...mapChart,
      "  --color-product-hinas-brand: var(--product-hinas-brand);",
      "  --color-product-cyber-security: var(--product-cyber-security);",
      ...mapShadcn,
    ]),
    "/* 타이포 시맨틱 클래스 — 역할별 대표 무게 */",
    semClasses.join("\n\n"),
  ].join("\n\n") + "\n";

  const HO_FILES: Array<[string, string]> = [
    ["primitives.css", primitivesCss], ["semantic-token.css", semanticCss],
    ["typography.css", typographyCss], ["index.css", indexCss],
  ];
  for (const [f, content] of HO_FILES) writeFileSync(join(hoDir, f), content);
  try {
    execSync("zip -q -X -o handoff.zip primitives.css semantic-token.css typography.css index.css", { cwd: hoDir });
  } catch {
    console.warn("⚠ handoff.zip 생성 실패 — zip CLI 확인");
  }
  if (existsSync(join(ROOT, "playground", "public"))) {
    const pubHo = join(pubDstk, "handoff");
    mkdirSync(pubHo, { recursive: true });
    for (const [f] of HO_FILES) copyFileSync(join(hoDir, f), join(pubHo, f));
    if (existsSync(join(hoDir, "handoff.zip"))) copyFileSync(join(hoDir, "handoff.zip"), join(pubHo, "handoff.zip"));
  }
}

console.log("built → dist/dstk.css + dist/products/*.css + dist/handoff(4파일+zip) + public/dstk/*");
