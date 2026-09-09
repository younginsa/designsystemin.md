import * as React from "react"

import { Label } from "./label"
import { RadioGroup, RadioGroupItem } from "./radio-group"

/* RadioGroup 스토리 — 허브 카드 form-controls 의 라디오 부분. 가로(카드) · 세로(기본 grid gap-3) · disabled. @storybook import 0. */

export default {
  title: "DS/RadioGroup",
  component: RadioGroup,
}

export const Horizontal = {
  parameters: { vocab: "form-controls" },
  render: () => (
    <RadioGroup defaultValue="a" className="flex gap-6">
      <div className="flex items-center gap-2"><RadioGroupItem value="a" id="r1" /><Label htmlFor="r1">신조</Label></div>
      <div className="flex items-center gap-2"><RadioGroupItem value="b" id="r2" /><Label htmlFor="r2">개조</Label></div>
    </RadioGroup>
  ),
}

export const Vertical = {
  render: () => (
    <RadioGroup defaultValue="nav">
      <div className="flex items-center gap-2"><RadioGroupItem value="nav" id="rv1" /><Label htmlFor="rv1">Navigation</Label></div>
      <div className="flex items-center gap-2"><RadioGroupItem value="svm" id="rv2" /><Label htmlFor="rv2">SVM</Label></div>
      <div className="flex items-center gap-2"><RadioGroupItem value="ctrl" id="rv3" /><Label htmlFor="rv3">Control</Label></div>
    </RadioGroup>
  ),
}

export const Disabled = {
  render: () => (
    <RadioGroup defaultValue="a" disabled className="flex gap-6">
      <div className="flex items-center gap-2"><RadioGroupItem value="a" id="rd1" /><Label htmlFor="rd1">신조</Label></div>
      <div className="flex items-center gap-2"><RadioGroupItem value="b" id="rd2" /><Label htmlFor="rd2">개조</Label></div>
    </RadioGroup>
  ),
}

export const __namedExportsOrder = ["Horizontal", "Vertical", "Disabled"]
