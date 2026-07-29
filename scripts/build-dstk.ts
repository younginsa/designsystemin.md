/**
 * dstk/*.json (W3C DTCG) → CSS 변수 산출.
 * 산출물은 dist/dstk.css, playground가 있으면 playground/app/dstk.css로 복사.
 */
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type Node = { $value?: string; $type?: string } | { [key: string]: Node };

/** `{color.zinc.950}` 참조를 원시 값으로 재귀 해석한다. */
function resolve(value: string, core: Node): string {
  return value.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const found = path
      .split(".")
      .reduce<any>((node, key) => (node ? node[key] : undefined), core);
    if (found?.$value === undefined) {
      throw new Error(`해석할 수 없는 참조: {${path}}`);
    }
    return resolve(found.$value, core);
  });
}

function readJson(name: string): Node {
  return JSON.parse(readFileSync(join(ROOT, "dstk", name), "utf-8"));
}

function toVars(semantic: Record<string, any>, core: Node): string {
  return Object.entries(semantic)
    .map(([name, token]) => `  --${name}: ${resolve(token.$value, core)};`)
    .join("\n");
}

export function buildDstk(outDir: string): string {
  const core = readJson("core.json");
  const light = toVars(readJson("semantic.json") as any, core);
  const dark = toVars(readJson("semantic.dark.json") as any, core);

  let commit = "unknown";
  try {
    commit = execSync("git rev-parse --short HEAD", { cwd: ROOT })
      .toString()
      .trim();
  } catch {
    // git 정보가 없어도 빌드는 진행한다.
  }

  const css = [
    `/* 자동 생성 — 손으로 편집 금지. 원천: dstk/*.json */`,
    `/* generated ${new Date().toISOString().slice(0, 10)} · commit ${commit} */`,
    `:root {`,
    light,
    `}`,
    ``,
    `.dark {`,
    dark,
    `}`,
    ``,
  ].join("\n");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "dstk.css"), css);
  return css;
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  const dist = join(ROOT, "dist");
  buildDstk(dist);
  const playgroundCss = join(ROOT, "playground", "app", "dstk.css");
  if (existsSync(dirname(playgroundCss))) {
    copyFileSync(join(dist, "dstk.css"), playgroundCss);
  }
  console.log("built → dist/dstk.css");
}
