import * as React from "react"

import { Calendar } from "./calendar"

/* Calendar 스토리 — 허브 카드 form-daterange(날짜 범위 피커)의 원문. react-day-picker 래퍼: mode single · range,
 * numberOfMonths 1 · 2. 32px 셀 · 선택 primary · 구간 accent · 오늘 accent. FilterBar DatePanel 이 이 컴포넌트를 쓴다. @storybook import 0. */

export default {
  title: "DS/Calendar",
  component: Calendar,
}

export const Range = {
  parameters: { vocab: "form-daterange" },
  render: () => (
    <Calendar
      mode="range"
      numberOfMonths={1}
      defaultMonth={new Date(2026, 6, 1)}
      selected={{ from: new Date(2026, 6, 7), to: new Date(2026, 6, 21) }}
    />
  ),
}

export const Single = {
  render: () => <Calendar mode="single" defaultMonth={new Date(2026, 6, 1)} selected={new Date(2026, 6, 15)} />,
}

export const TwoMonths = {
  render: () => (
    <Calendar
      mode="range"
      numberOfMonths={2}
      defaultMonth={new Date(2026, 8, 1)}
      selected={{ from: new Date(2026, 8, 1), to: new Date(2026, 9, 15) }}
    />
  ),
}

export const __namedExportsOrder = ["Range", "Single", "TwoMonths"]
