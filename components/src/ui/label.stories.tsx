import * as React from "react"

import { Label } from "./label"

/* Label 스토리 — 인프라 파일(어휘 없음 · vocab-map infrastructure). 폼 컨트롤 옆 레이블 14 medium. @storybook import 0. */

export default {
  title: "DS/Label",
  component: Label,
}

export const Default = {
  render: () => <Label htmlFor="lbl-1">호선명</Label>,
}

export const Required = {
  render: () => (
    <Label htmlFor="lbl-2">
      계약일 <span className="text-destructive">*</span>
    </Label>
  ),
}

export const __namedExportsOrder = ["Default", "Required"]
