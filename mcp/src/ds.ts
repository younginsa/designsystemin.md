// DS 읽기 — 배포 사이트의 정적 파일만(저장소·DB 없음). 인스턴스 안 5분 캐시.
// 원천 파일: /ds-registry.json · /dstk/*.json · /docs/* · /ui-src/*.txt · /story-html/* · /ds.css (전부 pnpm build 산출물)

export const BASE = (process.env.DS_BASE || "https://designsystemin-md.vercel.app").replace(/\/$/, "");
const TTL = 5 * 60 * 1000;
const cache = new Map<string, { at: number; body: string }>();

export async function text(path: string): Promise<string> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.body;
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  const body = await r.text();
  cache.set(path, { at: Date.now(), body });
  return body;
}
export async function json<T = any>(path: string): Promise<T> { return JSON.parse(await text(path)) as T; }
export async function optional(path: string): Promise<string | null> { try { return await text(path); } catch { return null; } }

export type Entry = {
  name: { ko: string; en: string };
  section: string;
  stories: string | null;
  file: string | null;
  figma: { id: string; name: string; variants: number; built?: string }[];
  note: string | null;
};
export type Registry = { $note: string; fileKey: string; updated: string; components: Record<string, Entry> };
export type Conditional = { when: string; slots: string[]; labels: string[]; tags: string[] };
export type StoryIndex = { generated: string; components: Record<string, { name: { ko: string; en: string }; stories: { name: string; file: string; description: string; portal: boolean; slots: string[]; filled: boolean; error?: string }[]; conditional?: Conditional[] }> };

export const registry = () => json<Registry>("/ds-registry.json");
export const storyIndex = () => json<StoryIndex>("/story-html/index.json");
export const semanticMap = () => json<any>("/dstk/semantic-map.json");
export const typography = () => json<any>("/dstk/typography.json");
export const contrastPairs = () => json<any>("/dstk/contrast-pairs.json");
export const doc = (name: string) => text("/docs/" + name);
export const storybookDocsUrl = (key: string) => `${BASE}/storybook/?path=/docs/ds-${key.replace(/-/g, "")}--docs`;
