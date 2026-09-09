import * as React from "react"

import { Checkbox } from "./checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./field"
import { Input } from "./input"

/* Field 스토리 — 레이블 · 설명 · 에러를 묶는 폼 행. cva orientation = vertical(기본) · horizontal · responsive.
 * 허브 카드는 없다(form-text 카드는 input.stories 를 읽는다) — Storybook · 피그마 변형용. @storybook import 0. */

export default {
  title: "DS/Field",
  component: Field,
  argTypes: {
    orientation: { control: "select", options: ["vertical", "horizontal", "responsive"] },
  },
}

export const Vertical = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="fv-name">호선명</FieldLabel>
      <Input id="fv-name" placeholder="예: Avikus Ship" />
      <FieldDescription>IMO 등록 선명과 같게 적는다.</FieldDescription>
    </Field>
  ),
}

export const Horizontal = {
  render: () => (
    <Field orientation="horizontal" className="w-80">
      <Checkbox id="fh-agree" defaultChecked />
      <FieldLabel htmlFor="fh-agree">Cloud 연동 동의</FieldLabel>
    </Field>
  ),
}

export const WithError = {
  render: () => (
    <Field data-invalid="true" className="w-80">
      <FieldLabel htmlFor="fe-imo">IMO</FieldLabel>
      <Input id="fe-imo" defaultValue="98006" aria-invalid />
      <FieldError>IMO는 7자리 숫자여야 합니다.</FieldError>
    </Field>
  ),
}

export const Group = {
  render: () => (
    <FieldGroup className="w-80">
      <Field>
        <FieldLabel htmlFor="fg-loa">LOA (m)</FieldLabel>
        <Input id="fg-loa" type="number" defaultValue={200} />
      </Field>
      <Field>
        <FieldLabel htmlFor="fg-lbp">LBP (m)</FieldLabel>
        <Input id="fg-lbp" type="number" defaultValue={180} />
      </Field>
    </FieldGroup>
  ),
}

export const __namedExportsOrder = ["Vertical", "Horizontal", "WithError", "Group"]
