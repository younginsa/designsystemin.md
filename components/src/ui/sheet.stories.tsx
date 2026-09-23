import * as React from "react"

import { Badge } from "./badge"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "./item"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet"

/* Sheet 스토리 — 슬라이드오버 패널(ov-sheet). 허브 카드는 포털이라 /shadcn-preview/overlay?c=sheet 를 iframe 으로 담는다.
 * SheetContent side right(기본, w-3/4 sm:max-w-sm border-l) · left · top · bottom, bg-card shadow-lg gap-4, 닫기 ✕ top-4 right-4. detail-panel 카드가 이 파일을 쓴다(배치 6).
 * args 형(2026-09-23 Phase 2): side · showCloseButton — /render/sheet/right?args={"showCloseButton":false} 로 ✕ 없는 패널.
 * 조건부 커버: showCloseButton → Right·Left(true = ✕ 노출) */

export default {
  title: "DS/Sheet",
  component: Sheet,
  argTypes: {
    side: { control: "select", options: ["right", "left", "top", "bottom"] },
  },
}

type Args = { side: "right" | "left" | "top" | "bottom"; showCloseButton: boolean }

const QUICK_VIEW = (
  <div className="px-4">
    <ItemGroup>
      <Item size="sm"><ItemContent><ItemDescription>Common</ItemDescription><ItemTitle>v3.4.2</ItemTitle></ItemContent></Item>
      <Item size="sm"><ItemContent><ItemDescription>Product</ItemDescription><ItemTitle>v3.4.0-rc.5</ItemTitle></ItemContent></Item>
      <Item size="sm"><ItemContent><ItemDescription>Agent</ItemDescription><ItemTitle><Badge variant="outline">Ready</Badge></ItemTitle></ItemContent></Item>
    </ItemGroup>
  </div>
)

const render = (args: Args) => (
  <Sheet open>
    <SheetContent side={args.side} showCloseButton={args.showCloseButton} className="w-96">
      <SheetHeader>
        <SheetTitle>Quick View</SheetTitle>
        <SheetDescription>SVM_BUSAN_1</SheetDescription>
      </SheetHeader>
      {QUICK_VIEW}
    </SheetContent>
  </Sheet>
)

export const Right = {
  parameters: { vocab: "ov-sheet" },
  args: { side: "right", showCloseButton: true } as Args,
  render,
}

export const Left = {
  args: { side: "left", showCloseButton: true } as Args,
  render,
}

export const __namedExportsOrder = ["Right", "Left"]
