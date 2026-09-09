import * as React from "react"

import { Label } from "./label"
import { Switch } from "./switch"

/* Switch 스토리 — 허브 카드 form-controls 의 토글 부분. size default(32×18) · sm(24×14) × checked · unchecked · disabled. @storybook import 0. */

export default {
  title: "DS/Switch",
  component: Switch,
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
  },
}

export const On = {
  parameters: { vocab: "form-controls" },
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="s1" defaultChecked />
      <Label htmlFor="s1">활성화</Label>
    </div>
  ),
}

export const Off = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="s2" />
      <Label htmlFor="s2">비활성</Label>
    </div>
  ),
}

export const Small = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="s3" size="sm" defaultChecked />
      <Label htmlFor="s3">작은 토글</Label>
    </div>
  ),
}

export const Disabled = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="s4" disabled defaultChecked />
      <Label htmlFor="s4">잠김</Label>
    </div>
  ),
}

export const __namedExportsOrder = ["On", "Off", "Small", "Disabled"]
