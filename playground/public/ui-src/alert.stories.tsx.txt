import * as React from "react"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./alert"

/* Alert 스토리 — 허브 카드 fb-banner(배너 · 안내 노트: 결과 피드백 · 상시 안내)의 원문.
 * cva variant default(bg-card) · destructive(text-destructive, 설명 destructive/90). grid [0_1fr] + svg 16 → gap-x-3 · rounded-lg border px-4 py-3 text-sm.
 * 파괴 배너 표면 규칙(design.md): bg-destructive/5 는 ErrorState 가 담당. @storybook import 0. */

export default {
  title: "DS/Alert",
  component: Alert,
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
  },
}

export const Banners = {
  parameters: { vocab: "fb-banner" },
  render: () => (
    <>
      <Alert>
        <CheckCircle2 />
        <AlertTitle>업데이트 완료</AlertTitle>
        <AlertDescription>common v4.0.0 적용이 끝났습니다.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>업데이트 실패</AlertTitle>
        <AlertDescription>Agent 로그를 확인해 주세요.</AlertDescription>
      </Alert>
      {/* 사용방식 ② 상시 정적 안내(info) — 구 「안내 노트」 병합(2026-09-03) */}
      <Alert>
        <Info className="size-4" />
        <AlertTitle>안내</AlertTitle>
        <AlertDescription>별 아이콘을 눌러 권장 버전을 설정할 수 있습니다. 모든 변경사항은 즉시 반영됩니다.</AlertDescription>
      </Alert>
    </>
  ),
}

export const Default = {
  render: () => (
    <Alert className="w-96">
      <CheckCircle2 />
      <AlertTitle>업데이트 완료</AlertTitle>
      <AlertDescription>common v4.0.0 적용이 끝났습니다.</AlertDescription>
    </Alert>
  ),
}

export const Destructive = {
  render: () => (
    <Alert variant="destructive" className="w-96">
      <AlertTriangle />
      <AlertTitle>업데이트 실패</AlertTitle>
      <AlertDescription>Agent 로그를 확인해 주세요.</AlertDescription>
    </Alert>
  ),
}

export const __namedExportsOrder = ["Banners", "Default", "Destructive"]
