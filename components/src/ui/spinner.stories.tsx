import * as React from "react"

import { Spinner } from "./spinner"

/* Spinner 스토리 — Loader2 16 animate-spin. 버튼 로딩(btn-states 카드 = button.stories Loading) · 진행률 바 옆(data-progress) 에 조합. 인프라 파일. @storybook import 0. */

export default {
  title: "DS/Spinner",
  component: Spinner,
}

export const Default = {
  render: () => <Spinner />,
}

export const Muted = {
  render: () => <Spinner className="text-muted-foreground" />,
}

export const Large = {
  render: () => <Spinner className="size-8" />,
}

export const __namedExportsOrder = ["Default", "Muted", "Large"]
