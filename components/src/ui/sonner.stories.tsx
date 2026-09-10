import * as React from "react"
import { toast } from "sonner"

import { Toaster } from "./sonner"

/* Sonner(Toaster) 스토리 — 토스트(ov-toast). Toaster 는 뷰포트 고정(bottom-right)이라 카드 안 실물이 안 된다 —
 * Static = 허브 카드용 정적 조립(rounded-lg border bg-popover px-4 py-3 shadow-lg, 제목 text-sm medium + 설명 text-sm muted) · Live = Toaster + toast.success 발사. @storybook import 0. */

export default {
  title: "DS/Toaster",
  component: Toaster,
}

export const Static = {
  parameters: { vocab: "ov-toast" },
  render: () => (
    <div className="w-80 rounded-lg border border-border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
      <div className="text-sm font-medium">업데이트가 시작되었습니다</div>
      <div className="text-sm text-muted-foreground">SVM_BUSAN_1 · common v4.0.0</div>
    </div>
  ),
}

function LiveDemo() {
  React.useEffect(() => {
    toast.success("업데이트가 시작되었습니다", { description: "SVM_BUSAN_1 · common v4.0.0" })
  }, [])
  return <Toaster position="bottom-right" />
}

export const Live = {
  render: () => <LiveDemo />,
}

export const __namedExportsOrder = ["Static", "Live"]
