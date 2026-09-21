// dist/stories.mjs(scripts/bundle-stories.mjs 산출물, 커밋 안 함)의 모양. 번들이 없어도 tsc 가 통과하도록 타입만 둔다.
export type StoriesBundle = {
  /** 레지스트리 키 → 스토리 모듈(default = meta, 나머지 = 스토리) */
  modules: Record<string, any>;
  /** 번들 생성일(YYYY-MM-DD) */
  generated: string;
  kebab(s: string): string;
  storyNames(mod: any): string[];
  resolveStoryName(mod: any, name: string): string | null;
  renderStory(mod: any, name: string): string;
};
