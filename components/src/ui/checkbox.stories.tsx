import * as React from "react"

import { Checkbox } from "./checkbox"
import { Label } from "./label"

/* Checkbox 스토리 — 허브 카드 form-controls 의 체크박스 부분(카드는 checkbox · radio-group · switch 세 파일을 합쳐 읽는다).
 * 상태: checked · unchecked · disabled · invalid. @storybook import 0. */

export default {
  title: "DS/Checkbox",
  component: Checkbox,
}

export const Checked = {
  parameters: { vocab: "form-controls" },
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="c1" defaultChecked />
      <Label htmlFor="c1">Cloud 연동</Label>
    </div>
  ),
}

export const Unchecked = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="c2" />
      <Label htmlFor="c2">Security 모듈</Label>
    </div>
  ),
}

export const Disabled = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="c3" disabled defaultChecked />
      <Label htmlFor="c3">데이터 수집 (잠김)</Label>
    </div>
  ),
}

export const Invalid = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="c4" aria-invalid />
      <Label htmlFor="c4">약관 동의 (필수)</Label>
    </div>
  ),
}

export const __namedExportsOrder = ["Checked", "Unchecked", "Disabled", "Invalid"]
