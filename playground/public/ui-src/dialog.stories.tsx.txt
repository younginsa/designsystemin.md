import * as React from "react"

import { Button } from "./button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog"
import { Field, FieldLabel } from "./field"
import { Input } from "./input"

/* Dialog 스토리 — 모달(ov-dialog). 허브 카드는 포털이라 /shadcn-preview/overlay?c=dialog 를 iframe 으로 담는다(같은 내용).
 * DialogContent = max-w-lg rounded-lg border bg-card p-6 shadow-lg gap-4 · 오버레이 bg-black/50 · 닫기 ✕ top-4 right-4 opacity-70. @storybook import 0. */

export default {
  title: "DS/Dialog",
  component: Dialog,
}

export const Open = {
  parameters: { vocab: "ov-dialog" },
  render: () => (
    <Dialog open>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>신규 호선 생성</DialogTitle>
          <DialogDescription>기본 정보를 입력하세요.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="d-imo">IMO Number <span className="text-destructive">*</span></FieldLabel>
          <Input id="d-imo" placeholder="예: 1234567" />
        </Field>
        <DialogFooter>
          <Button variant="outline">취소</Button>
          <Button>다음</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const __namedExportsOrder = ["Open"]
