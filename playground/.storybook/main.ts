import type { StorybookConfig } from "@storybook/nextjs-vite";

// Storybook — 스파이크(2026-09-08, 옵션 3 역할 분리).
// 역할: FE·디자이너의 컴포넌트 작업대. 어휘·템플릿·문서·갤러리는 365 허브가 계속 맡는다.
// 스토리 원천 = components/src/ui/*.stories.tsx — 365 카드(previews.tsx)가 읽는 바로 그 파일.
// 배포 대상 아님(로컬 전용). public/을 static으로 서빙해 approved.json 을 그대로 읽는다.
const config: StorybookConfig = {
  stories: ["../../components/src/ui/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
};

export default config;
