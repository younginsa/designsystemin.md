import type { Decorator, Preview } from "@storybook/nextjs-vite";
import * as React from "react";

// 365와 같은 토큰·유틸리티 — globals.css 가 dstk.css 까지 import 한다(한 줄로 전부).
import "../app/globals.css";
// next/font 가 만들어 주던 --font-inter 변수의 Storybook 판(로컬 Inter → 시스템 폴백).
import "./preview.css";
// 어휘 게이트 — 365의 approved.json 을 그대로 읽어 스토리마다 채택 여부를 표시한다.
import approvedFile from "../public/approved.json";

const APPROVED = new Set<string>(approvedFile.approved as string[]);

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

/* 채택 배지 — 스토리의 parameters.vocab(365 어휘 슬러그)을 approved.json 과 대조.
   Storybook은 승인 개념이 없으므로, 365의 게이트를 여기서 "보이게만" 한다(권한은 365에 남는다). */
const withVocabBadge: Decorator = (Story, ctx) => {
  const vocab = ctx.parameters.vocab as string | undefined;
  const ok = !!vocab && APPROVED.has(vocab);
  const label = !vocab ? "어휘 미지정" : ok ? `채택됨 · ${vocab}` : `미채택 · ${vocab}`;
  const color = !vocab ? "#8a8f98" : ok ? "#1f7a3a" : "#b42318";
  return (
    <>
      <div
        data-vocab-badge={!vocab ? "none" : ok ? "approved" : "unapproved"}
        style={{
          display: "inline-block", marginBottom: 16, padding: "2px 8px", fontSize: 11,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: ".02em",
          color, border: `1px solid ${color}`, borderRadius: 4,
        }}
      >
        {label}
      </div>
      <div>
        <Story />
      </div>
    </>
  );
};

const preview: Preview = {
  // 데코레이터는 앞이 안쪽 — 배지가 모드 래퍼 안에 들어간다.
  decorators: [withVocabBadge, withMode],
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
  },
  // 컴포넌트마다 Docs 페이지 자동 생성(타입에서 props 표).
  tags: ["autodocs"],
};

export default preview;
