import * as React from "react"

import { Field, FieldLabel } from "./field"
import { Textarea } from "./textarea"

/* Textarea 스토리 — 허브 카드 form-textarea 의 원문(레이블 + 3행 + 글자수). @storybook import 0. */

export default {
  title: "DS/Textarea",
  component: Textarea,
}

export const WithCounter = {
  parameters: { vocab: "form-textarea" },
  render: () => (
    <Field>
      <FieldLabel htmlFor="f-desc">설명</FieldLabel>
      <Textarea id="f-desc" placeholder="변경 사항을 입력하세요" rows={3} />
      <div className="text-right text-xs text-muted-foreground">0 / 200</div>
    </Field>
  ),
}

export const Filled = {
  render: () => <Textarea defaultValue="Navigation 2.0.0 업데이트 — 레이더 오버레이 개선" aria-label="filled" className="w-80" />,
}

export const Disabled = {
  render: () => <Textarea placeholder="비활성" disabled aria-label="disabled" className="w-80" />,
}

export const Invalid = {
  render: () => <Textarea defaultValue="200자를 넘는 설명" aria-invalid aria-label="invalid" className="w-80" />,
}

export const __namedExportsOrder = ["WithCounter", "Filled", "Disabled", "Invalid"]
