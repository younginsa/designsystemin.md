import * as React from "react"

import { Stepper, StepperItem } from "./stepper"

/* Stepper 스토리 — 위저드 상단 단계 표시(원본 재현 — HiNAS 365 업데이트 위저드, 2026-09-16 채택).
 * 완료 = primary 채움 + 체크 · 현재 = primary 테두리 + 굵은 라벨(aria-current=step) · 미래 = border + secondary-foreground.
 * 연결선 h-px(완료 구간 primary, 나머지 border), 마지막 단계는 연결선 없음. 3단계 미만이면 쓰지 않는다(body-patterns C). */

export default {
  title: "DS/Stepper",
  component: Stepper,
}

const STEPS = ["업데이트 옵션 설정", "업데이트 내용", "업데이트 항목 조회", "확인"]

function Demo({ current }: { current: number }) {
  return (
    <Stepper>
      {STEPS.map((label, i) => {
        const n = i + 1
        return (
          <StepperItem
            key={label}
            step={n}
            state={n < current ? "completed" : n === current ? "current" : "upcoming"}
          >
            {label}
          </StepperItem>
        )
      })}
    </Stepper>
  )
}

/** 2단계 진행 중 — 완료 1 · 현재 1 · 미래 2 */
export const Default = {
  parameters: { vocab: "stepper" },
  render: () => <Demo current={2} />,
}

/** 첫 단계 — 완료 없음 */
export const First = {
  parameters: { vocab: "stepper" },
  render: () => <Demo current={1} />,
}

/** 전부 완료 */
export const Done = {
  parameters: { vocab: "stepper" },
  render: () => <Demo current={STEPS.length + 1} />,
}

export const __namedExportsOrder = ["Default", "First", "Done"]
