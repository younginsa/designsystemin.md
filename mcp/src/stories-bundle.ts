// dist/stories.mjs(scripts/bundle-stories.mjs 산출물, 커밋 안 함)의 모양. 번들이 없어도 tsc 가 통과하도록 타입만 둔다.
export type FeState = { story: string; args: Record<string, unknown>; html: string };
export type FeSnippet = {
  /** FE 스토리북 docs 주소 */
  docs: string;
  /** Chromatic 빌드 도장(CSS 자산 해시) */
  feBuild: string;
  /** kebab 스토리 이름 → 렌더 HTML */
  stories: Record<string, { name: string; html: string }>;
  /** 미리 렌더한 상태(args 하나씩) — /render?args= 는 여기서 정확히 일치하는 것만 돌려준다 */
  states: FeState[];
};
export type StoriesBundle = {
  /** 레지스트리 키 → 스토리 모듈(default = meta, 나머지 = 스토리) — 우리 스토리 컴포넌트만 */
  modules: Record<string, any>;
  /** 레지스트리 키 → FE 스토리북에서 가져온 스니펫(2026-09-28 이관) */
  feSnippets: Record<string, FeSnippet>;
  /** 레지스트리 키 → 프롭 이름 — ?args= 허용 목록(우리 = docgen, FE = argTypes) */
  propNames: Record<string, string[]>;
  /** 번들 생성일(YYYY-MM-DD) */
  generated: string;
  kebab(s: string): string;
  storyNames(mod: any): string[];
  resolveStoryName(mod: any, name: string): string | null;
  storyArgsAware(mod: any, name: string): boolean;
  renderStory(mod: any, name: string, args?: Record<string, unknown>): string;
};
