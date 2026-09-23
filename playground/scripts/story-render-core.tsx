// 스토리 한 편 → HTML 문자열. 정적 스니펫(render-stories.tsx, 빌드 시)과 라이브 /render(mcp/api/render.ts, 요청 시)가
// 이 한 함수를 같이 쓴다 — 두 경로의 결과가 바이트 단위로 같아야 감사(audit-published F · mcp test:render)가 통과한다(2026-09-21 Phase 1).
// Phase 2(2026-09-23): args 병합 — 스토리 args 위에 요청 args 를 덮어 "한 상태의 사진" 천장을 넘는다. render: () => … 스토리는 args 를 못 받는다.
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** 모듈의 스토리 이름 목록(정의 순서 — __namedExportsOrder 가 있으면 그 순서). default·순서 배열·객체 아닌 export 는 제외. */
export function storyNames(mod: any): string[] {
  const order: string[] = mod.__namedExportsOrder ?? Object.keys(mod).filter((k) => k !== "default");
  return order.filter((n) => n !== "default" && n !== "__namedExportsOrder" && mod[n] && typeof mod[n] === "object");
}

/** 스토리 이름은 원문(PascalCase)·kebab 둘 다 받는다 — /render/card/flat-panel 과 /render/card/FlatPanel 은 같은 사진. */
export function resolveStoryName(mod: any, name: string): string | null {
  const names = storyNames(mod);
  const lower = name.toLowerCase();
  return names.find((n) => n === name) ?? names.find((n) => kebab(n) === lower || n.toLowerCase() === lower) ?? null;
}

/** args 를 받는 스토리인가 — args 객체가 있거나 render 가 인자를 선언했거나(render: (args) => …), render 없이 component 로 그리거나. */
export function storyArgsAware(mod: any, name: string): boolean {
  const story = mod[name];
  if (!story || typeof story !== "object") return false;
  if (story.args && typeof story.args === "object") return true;
  if (typeof story.render === "function") return story.render.length >= 1;
  return !!mod.default?.component;
}

export function renderStory(mod: any, name: string, args?: Record<string, unknown>): string {
  const story = mod[name];
  if (!story || typeof story !== "object") throw new Error(`스토리 없음: ${name}`);
  const Comp = mod.default?.component;
  const merged = { ...(story.args ?? {}), ...(args ?? {}) };
  const el = story.render ? story.render(merged) : Comp ? React.createElement(Comp, merged) : null;
  if (!el) throw new Error("render 도 component 도 없음");
  return renderToStaticMarkup(el);
}
