import * as React from "react"

import { ErrorState } from "./error-state"

/* ErrorState 스토리 — 에러 상태 배너(error-state 카드). Alert 위에 bg-destructive/5(허용 틴트) 표면 · border-0 · px-5 py-4,
 * CircleAlert 18(fill destructive · stroke card) + 제목 semibold foreground + 설명 secondary-foreground + [재시도] ghost sm(bg-destructive/10 · hover /20).
 * 모든 생성 화면의 에러 상태 표준(StatePreview 에러). @storybook import 0. */

export default {
  title: "DS/ErrorState",
  component: ErrorState,
}

export const WithRetry = {
  parameters: { vocab: "error-state" },
  render: () => (
    <ErrorState
      title="계약 목록을 불러오지 못했습니다"
      description="서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
      onRetry={() => {}}
    />
  ),
}

export const NoRetry = {
  render: () => (
    <div className="w-[560px]">
      <ErrorState title="권한이 없습니다" description="이 화면은 admin 역할만 볼 수 있습니다." />
    </div>
  ),
}

export const __namedExportsOrder = ["WithRetry", "NoRetry"]
