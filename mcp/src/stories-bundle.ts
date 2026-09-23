// dist/stories.mjs(scripts/bundle-stories.mjs 산출물, 커밋 안 함)의 모양. 번들이 없어도 tsc 가 통과하도록 타입만 둔다.
export type StoriesBundle = {
  /** 레지스트리 키 → 스토리 모듈(default = meta, 나머지 = 스토리) */
  modules: Record<string, any>;
  /** 레지스트리 키 → 원문에 선언된 프롭 이름(react-docgen-typescript, node_modules 프롭 제외) — ?args= 허용 목록 */
  propNames: Record<string, string[]>;
  /** 번들 생성일(YYYY-MM-DD) */
  generated: string;
  kebab(s: string): string;
  storyNames(mod: any): string[];
  resolveStoryName(mod: any, name: string): string | null;
  storyArgsAware(mod: any, name: string): boolean;
  renderStory(mod: any, name: string, args?: Record<string, unknown>): string;
};
