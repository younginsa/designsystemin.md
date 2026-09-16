import * as React from "react"

import { Progress } from "./progress"
import { Spinner } from "./spinner"

/* Progress 스토리 — 허브 카드 data-progress(진행률 바)의 원문: 바 + mono 퍼센트 + Spinner. h-2 rounded-full bg-primary/20 · 인디케이터 bg-primary. @storybook import 0. */

export default {
  title: "DS/Progress",
  component: Progress,
}

export const WithValue = {
  parameters: { vocab: "data-progress" },
  render: () => (
    <>
      <Progress value={62} className="flex-1" />
      <span className="font-mono text-sm text-muted-foreground">62%</span>
      <Spinner className="text-muted-foreground" />
    </>
  ),
}

export const Steps = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Progress value={0} />
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={100} />
    </div>
  ),
}

export const __namedExportsOrder = ["WithValue", "Steps"]
