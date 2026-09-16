import type { Decorator, Preview } from "@storybook/nextjs-vite";
import * as React from "react";

// 365와 같은 토큰·유틸리티 — globals.css 가 dstk.css 까지 import 한다(한 줄로 전부).
import "../app/globals.css";
// next/font 가 만들어 주던 --font-inter 변수의 Storybook 판(로컬 Inter → 시스템 폴백).
import "./preview.css";

/* 3모드 — dstk.css 의 최상위 클래스 그대로(:root=Light · .dark=Dark · .theme-control=Control).
   래퍼 div 에 클래스를 얹으면 자손이 변수를 상속한다. 툴바에서 전환. */
const MODE_CLASS: Record<string, string> = { light: "", dark: "dark", control: "theme-control" };

const withMode: Decorator = (Story, ctx) => {
  const mode = (ctx.globals.mode as string) || "light";
  return (
    <div
      data-mode={mode}
      className={`${MODE_CLASS[mode]} min-h-40 bg-background p-8 text-foreground antialiased`}
    >
      <Story />
    </div>
  );
};

/* 채택 배지는 2026-09-16 은퇴 — Storybook 에 있는 것이 곧 DS 라 "채택됨/미채택" 표시가 무의미해졌다.
   parameters.vocab 은 365 허브 카드가 스토리를 고르는 키로만 남는다. */

const preview: Preview = {
  decorators: [withMode],
  globalTypes: {
    mode: {
      description: "365 테마 모드",
      toolbar: {
        title: "Mode",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light — Cloud · 365" },
          { value: "dark", title: "Dark — SVM · NAS" },
          { value: "control", title: "Control" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { mode: "light" },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "todo" },
    layout: "fullscreen",
    // 사이드바 순서 — Foundations(팔레트·시맨틱·타이포) → Templates(프레임·본문 패턴) → DS(컴포넌트, 피그마 섹션 순은 레지스트리)
    options: { storySort: { order: ["Foundations", "Templates", "DS"] } },
  },
  // 컴포넌트마다 Docs 페이지 자동 생성(타입에서 props 표).
  tags: ["autodocs"],
};

export default preview;
