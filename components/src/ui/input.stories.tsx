import * as React from "react"
import { X } from "lucide-react"

import { Badge } from "./badge"
import { Field, FieldLabel } from "./field"
import { Input } from "./input"

/* Input 스토리 — 허브 카드 4장(form-text · form-number · form-file · form-tags)의 원문.
 * 카드는 parameters.vocab 으로 이 파일에서 골라 읽는다(previews.tsx fromStories).
 * 상태 스토리(Disabled · Invalid)는 vocab 없음 — Storybook · 피그마 변형용. @storybook import 0. */

export default {
  title: "DS/Input",
  component: Input,
}

export const Text = {
  parameters: { vocab: "form-text" },
  render: () => (
    <Field>
      <FieldLabel htmlFor="f-name">호선명 <span className="text-destructive">*</span></FieldLabel>
      <Input id="f-name" placeholder="예: Avikus Ship" />
    </Field>
  ),
}

export const Number = {
  parameters: { vocab: "form-number" },
  render: () => (
    <>
      <Field>
        <FieldLabel htmlFor="f-loa">LOA (m)</FieldLabel>
        <Input id="f-loa" type="number" defaultValue={200} />
      </Field>
      <Field>
        <FieldLabel htmlFor="f-lbp">LBP (m)</FieldLabel>
        <Input id="f-lbp" type="number" defaultValue={180} />
      </Field>
    </>
  ),
}

export const File = {
  parameters: { vocab: "form-file" },
  render: () => (
    <Field>
      <FieldLabel htmlFor="f-file">첨부 파일</FieldLabel>
      <Input id="f-file" type="file" />
    </Field>
  ),
}

/** 태그 인풋 — Badge(secondary) + 입력 자리. 전용 컴포넌트 없이 조합하는 패턴(vocab-map: badge, input) */
export const Tags = {
  parameters: { vocab: "form-tags" },
  render: () => (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-input px-3 py-2 shadow-xs">
      <Badge variant="secondary">NAVIGATION <X className="size-3" /></Badge>
      <Badge variant="secondary">SVM <X className="size-3" /></Badge>
      <span className="text-sm text-muted-foreground">새 태그 입력…</span>
    </div>
  ),
}

export const Filled = {
  render: () => <Input defaultValue="Avikus Ship" aria-label="filled" className="w-64" />,
}

export const Disabled = {
  render: () => <Input placeholder="비활성" disabled aria-label="disabled" className="w-64" />,
}

export const Invalid = {
  render: () => <Input defaultValue="잘못된 값" aria-invalid aria-label="invalid" className="w-64" />,
}

export const __namedExportsOrder = ["Text", "Number", "File", "Tags", "Filled", "Disabled", "Invalid"]
